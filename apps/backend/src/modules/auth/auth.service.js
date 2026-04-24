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

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function refreshCookieOptions() {
  const secure = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: secure ? 'strict' : 'lax',
    secure,
    maxAge: parseInt(process.env.REFRESH_TOKEN_TTL || '604800') * 1000,
    path: '/api/auth/refresh',
  };
}

/**
 * Register a new organisation + first admin user.
 */
async function register({ orgName, name, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw Object.assign(new Error('Email already registered'), { status: 409 });
  }

  const slug = slugify(orgName);
  const slugExists = await prisma.organisation.findUnique({ where: { slug } });
  const finalSlug = slugExists ? `${slug}-${Date.now()}` : slug;

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
    orgId: org.id,
    userId: user.id,
    action: 'auth:register',
    entityType: 'user',
    entityId: user.id,
    after: { email, orgName },
  });

  return { accessToken, refreshRaw, user: safeUser(user) };
}

/**
 * Email + password login with full security pipeline:
 * 1. IP lockout check (Redis)
 * 2. Failure count + CAPTCHA enforcement after 3 failures
 * 3. Constant-time bcrypt compare (timing attack prevention)
 * 4. Account lockout after 5 failures (30 min)
 * 5. RS256 JWT pair issuance
 * 6. Token family tracking
 * 7. Security event log
 */
async function login({ email, password, captchaToken }, ip) {
  const failKey = `login:failures:${ip}`;
  const lockKey = `login:locked:${ip}`;

  // Step 1: Check IP lockout
  const isLocked = await redis.get(lockKey);
  if (isLocked) {
    throw Object.assign(
      new Error('Too many failed attempts — try again in 30 minutes'),
      { status: 429 }
    );
  }

  const failures = parseInt((await redis.get(failKey)) || '0');

  // Step 2: CAPTCHA after 3 failures
  if (failures >= 3) {
    const captchaOk = await verifyCaptcha(captchaToken);
    if (!captchaOk) {
      throw Object.assign(new Error('CAPTCHA verification required'), { status: 403 });
    }
  }

  // Step 3: Constant-time user lookup + bcrypt compare
  const user = await prisma.user.findUnique({ where: { email } });

  // Always run bcrypt.compare to prevent timing attacks (even for unknown emails)
  const dummyHash = '$2a$12$dummyhashfortimingnormalizationXXXXXXXXXXXXXXXXXXXXX';
  const isValid = user?.passwordHash
    ? await bcrypt.compare(password, user.passwordHash)
    : await bcrypt.compare(password, dummyHash).then(() => false);

  if (!user || !isValid) {
    const newCount = failures + 1;
    await redis.setex(failKey, 15 * 60, String(newCount));

    // Step 4: Account lockout after 5 failures
    if (newCount >= 5) {
      await redis.setex(lockKey, 30 * 60, '1');
    }
    throw Object.assign(new Error('Invalid email or password'), { status: 401 });
  }

  // Clear failure counters on success
  await redis.del(failKey, lockKey);

  // Step 5 & 6: Issue RS256 JWT pair with token family tracking
  const accessToken = signAccessToken(user);
  const { raw: refreshRaw } = await createRefreshToken(user.id, user.orgId);

  // Step 7: Security event log
  await logEvent({
    orgId: user.orgId,
    userId: user.id,
    action: 'auth:login',
    entityType: 'user',
    entityId: user.id,
    ipAddress: ip,
  });

  return { accessToken, refreshRaw, user: safeUser(user) };
}

/**
 * Rotate refresh token → new access + refresh token pair.
 */
async function refresh(rawToken) {
  const { raw: newRefreshRaw, userId } = await rotateRefreshToken(rawToken);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('User not found'), { status: 401 });

  const accessToken = signAccessToken(user);
  return { accessToken, refreshRaw: newRefreshRaw, user: safeUser(user) };
}

/**
 * Logout — revoke all refresh tokens for this user.
 */
async function logout(userId) {
  await revokeAllForUser(userId);
}

/**
 * Return the currently authenticated user (for /auth/me).
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