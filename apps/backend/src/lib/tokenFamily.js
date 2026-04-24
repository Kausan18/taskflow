'use strict';
const crypto = require('crypto');
const jwt    = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 }  = require('uuid');

const prisma = new PrismaClient();

// ── Key loading with early-exit guard ───────────────────────────────────────
// BUG FIX: Original code called Buffer.from(undefined, 'base64') when
// JWT_PRIVATE_KEY / JWT_PUBLIC_KEY were not set, causing a silent crash
// (TypeError) that surfaces as "Registration failed" on the frontend.
// Now we validate keys at startup and fail fast with a helpful message.

function getPrivateKey() {
  const raw = process.env.JWT_PRIVATE_KEY;
  if (!raw || raw === 'base64_encoded_rsa_private_key_pem') {
    throw new Error(
      '[JWT] JWT_PRIVATE_KEY is not set in .env\n' +
      'Run the following to generate RS256 keys:\n' +
      '  openssl genrsa -out private.pem 2048\n' +
      '  openssl rsa -in private.pem -pubout -out public.pem\n' +
      '  # On Windows PowerShell:\n' +
      '  [Convert]::ToBase64String([IO.File]::ReadAllBytes("private.pem")) > private_b64.txt\n' +
      '  [Convert]::ToBase64String([IO.File]::ReadAllBytes("public.pem"))  > public_b64.txt\n' +
      'Then paste the content of those files into .env as JWT_PRIVATE_KEY and JWT_PUBLIC_KEY.'
    );
  }
  return Buffer.from(raw, 'base64').toString('utf8');
}

function getPublicKey() {
  const raw = process.env.JWT_PUBLIC_KEY;
  if (!raw || raw === 'base64_encoded_rsa_public_key_pem') {
    throw new Error('[JWT] JWT_PUBLIC_KEY is not set in .env — see JWT_PRIVATE_KEY instructions above.');
  }
  return Buffer.from(raw, 'base64').toString('utf8');
}

// Validate keys at module load time so the server refuses to start if misconfigured
try {
  getPrivateKey();
  getPublicKey();
  console.log('✅ JWT RS256 keys loaded');
} catch (err) {
  console.error('\n❌ JWT configuration error:\n', err.message, '\n');
  process.exit(1);
}

const ACCESS_TTL_SECONDS  = parseInt(process.env.ACCESS_TOKEN_TTL  || '900');
const REFRESH_TTL_SECONDS = parseInt(process.env.REFRESH_TOKEN_TTL || '604800');

/**
 * Sign a short-lived RS256 access token.
 */
function signAccessToken(user) {
  return jwt.sign(
    {
      sub:   user.id,
      orgId: user.orgId,
      role:  user.role,
      email: user.email,
    },
    getPrivateKey(),
    { algorithm: 'RS256', expiresIn: ACCESS_TTL_SECONDS }
  );
}

/**
 * Verify and decode an RS256 access token.
 * Throws if expired or invalid.
 */
function verifyAccessToken(token) {
  return jwt.verify(token, getPublicKey(), { algorithms: ['RS256'] });
}

/**
 * Create a refresh token, store its SHA-256 hash in the DB, return the raw token.
 * familyId groups tokens that share the same login session.
 */
async function createRefreshToken(userId, orgId, familyId = null) {
  const raw      = uuidv4();
  const hash     = hashToken(raw);
  const family   = familyId || uuidv4();
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);

  await prisma.refreshToken.create({
    data: { userId, orgId, tokenHash: hash, familyId: family, expiresAt },
  });

  return { raw, familyId: family };
}

/**
 * Rotate a refresh token (token family tracking):
 *  1. Look up stored record by hash.
 *  2. If already revoked → reuse detected → revoke entire family → throw 401.
 *  3. If expired → throw 401.
 *  4. Revoke old token, issue new one in same family.
 */
async function rotateRefreshToken(rawToken) {
  const hash   = hashToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hash } });

  if (!stored) {
    throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
  }

  if (stored.revoked) {
    // Token reuse detected — revoke entire family (all sessions for this user)
    await prisma.refreshToken.updateMany({
      where: { familyId: stored.familyId, revoked: false },
      data:  { revoked: true },
    });
    throw Object.assign(
      new Error('Refresh token reuse detected — all sessions revoked'),
      { status: 401 }
    );
  }

  if (stored.expiresAt < new Date()) {
    throw Object.assign(new Error('Refresh token expired'), { status: 401 });
  }

  // Revoke used token
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data:  { revoked: true },
  });

  // Issue new token in same family
  const { raw, familyId } = await createRefreshToken(
    stored.userId, stored.orgId, stored.familyId
  );

  return { raw, userId: stored.userId, orgId: stored.orgId, familyId };
}

/**
 * Revoke all refresh tokens for a user (on logout).
 */
async function revokeAllForUser(userId) {
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data:  { revoked: true },
  });
}

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeAllForUser,
};