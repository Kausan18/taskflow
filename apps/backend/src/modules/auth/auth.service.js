'use strict';
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const {
  signAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeAllForUser,
} = require('../../lib/tokenFamily');
const { verifyCaptcha } = require('../../lib/captcha');
const { logEvent } = require('../../lib/auditLogger');
const redis = require('../../config/redis');

const prisma = new PrismaClient();

// Helper to generate a URL-friendly slug from an org name
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Refresh token cookie options — HTTP-only, SameSite=Strict, Secure in prod
function refreshCookieOptions() {
  const secure = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: secure ? 'strict' : 'lax',
    secure,
    maxAge: parseInt(process.env.REFRESH_TOKEN_TTL || '604800') * 1000, // ms
    path:   '/api/auth/refresh',
  };
}

/**
 * Register a new organisation + first admin user.
 */
async function register({ orgName, name, email, password }) {
  // Check for duplicate email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw Object.assign(new Error('Email already registered'), { status: 409 });
  }

  const slug = slugify(orgName);
  // Ensure slug uniqueness
  const slugExists = await prisma.organisation.findUnique({ where: { slug } });
  const finalSlug  = slugExists ? `${slug}-${Date.now()}` : slug;

  const org = await prisma.organisation.create({
    data: { name: orgName, slug: finalSlug },
  });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { orgId: org.id, email, name, passwordHash, role: 'ADMIN' },
  });

  const accessToken = signAccessToken(user);
  const { raw: refreshRaw } = await createRefreshToken(user.id, org.id);

  await logEvent({
    orgId:      org.id,
    userId:     user.id,
    action:     'auth:register',
    entityType: 'user',
    entityId:   user.id,
    after:      { email, orgName },
  });

  return { accessToken, refreshRaw, user: safeUser(user) };
}

/**
 * Email + password login with:
 *  - failure counting in Redis
 *  - CAPTCHA enforcement after 3 failures
 *  - account lockout after 5 failures (30 min)
 */
async function login({ email, password, captchaToken }, ip) {
  const failKey  = `login:failures:${ip}`;
  const lockKey  = `login:locked:${ip}`;

  // Check lockout
  const isLocked = await redis.get(lockKey);
  if (isLocked) {
    throw Object.assign(new Error('Account temporarily locked — try again in 30 minutes'), { status: 429 });
  }

  const failures = parseInt((await redis.get(failKey)) || '0');

  // Require CAPTCHA after 3 failures
  if (failures >= 3) {
    const captchaOk = await verifyCaptcha(captchaToken);
    if (!captchaOk) {
      throw Object.assign(new Error('CAPTCHA verification required'), { status: 403 });
    }
  }

  // Constant-time user lookup + bcrypt compare (prevents timing attacks)
  const user = await prisma.user.findUnique({ where: { email } });

  // bcrypt.compare runs even if user not found (dummy hash) to prevent timing attacks
  const dummyHash = '$2a$12$dummyhashfortimingnormalizationXXXXXXXXXXXXXXXXXXXXX';
  const isValid   = user?.passwordHash
    ? await bcrypt.compare(password, user.passwordHash)
    : await bcrypt.compare(password, dummyHash).then(() => false);

  if (!user || !isValid) {
    const newCount = failures + 1;
    await redis.setex(failKey, 15 * 60, String(newCount)); // 15-min window

    if (newCount >= 5) {
      await redis.setex(lockKey, 30 * 60, '1'); // 30-min lockout
    }
    throw Object.assign(new Error('Invalid email or password'), { status: 401 });
  }

  // Clear failure counters on success
  await redis.del(failKey, lockKey);

  const accessToken = signAccessToken(user);
  const { raw: refreshRaw } = await createRefreshToken(user.id, user.orgId);

  await logEvent({
    orgId:      user.orgId,
    userId:     user.id,
    action:     'auth:login',
    entityType: 'user',
    entityId:   user.id,
    ipAddress:  ip,
  });

  return { accessToken, refreshRaw, user: safeUser(user) };
}

/**
 * Rotate refresh token → new access token + new refresh token.
 */
async function refresh(rawToken) {
  const { raw: newRefreshRaw, userId, orgId } = await rotateRefreshToken(rawToken);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('User not found'), { status: 401 });

  const accessToken = signAccessToken(user);
  return { accessToken, refreshRaw: newRefreshRaw, user: safeUser(user) };
}

/**
 * Logout — revoke all refresh tokens for the user.
 */
async function logout(userId) {
  await revokeAllForUser(userId);
}

/**
 * Get the current authenticated user (for /auth/me).
 */
async function getMe(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return safeUser(user);
}

/**
 * Issue JWT pair for a Google OAuth user (called after Passport callback).
 */
async function issueTokensForOAuthUser(user) {
  const accessToken = signAccessToken(user);
  const { raw: refreshRaw } = await createRefreshToken(user.id, user.orgId);
  return { accessToken, refreshRaw };
}

// Strip sensitive fields before sending to client
function safeUser(user) {
  const { passwordHash, oauthId, ...safe } = user;
  return safe;
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  issueTokensForOAuthUser,
  refreshCookieOptions,
};