'use strict';
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const prisma = new PrismaClient();

// Load RS256 keys from env (base64-encoded PEM)
const getPrivateKey = () => Buffer.from(process.env.JWT_PRIVATE_KEY, 'base64').toString();
const getPublicKey  = () => Buffer.from(process.env.JWT_PUBLIC_KEY,  'base64').toString();

const ACCESS_TTL_SECONDS  = parseInt(process.env.ACCESS_TOKEN_TTL  || '900');    // 15 min
const REFRESH_TTL_SECONDS = parseInt(process.env.REFRESH_TOKEN_TTL || '604800'); // 7 days

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
 * Verify and decode an access token.
 * Throws if expired or invalid.
 */
function verifyAccessToken(token) {
  return jwt.verify(token, getPublicKey(), { algorithms: ['RS256'] });
}

/**
 * Create a refresh token, store its hash in the DB, return the raw token.
 * familyId groups tokens that share the same login session.
 */
async function createRefreshToken(userId, orgId, familyId = null) {
  const raw      = uuidv4();           // opaque random token
  const hash     = hashToken(raw);
  const family   = familyId || uuidv4();
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);

  await prisma.refreshToken.create({
    data: { userId, orgId, tokenHash: hash, familyId: family, expiresAt },
  });

  return { raw, familyId: family };
}

/**
 * Rotate a refresh token:
 *  1. Find the stored record by hash.
 *  2. If already revoked → token reuse detected → revoke entire family → throw.
 *  3. If expired → throw.
 *  4. Revoke the old token, issue a new one in the same family.
 */
async function rotateRefreshToken(rawToken) {
  const hash = hashToken(rawToken);

  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hash } });

  if (!stored) {
    throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
  }

  if (stored.revoked) {
    // Token reuse detected — revoke the entire family (all sessions for this user)
    await prisma.refreshToken.updateMany({
      where: { familyId: stored.familyId, revoked: false },
      data:  { revoked: true },
    });
    throw Object.assign(new Error('Refresh token reuse detected — all sessions revoked'), { status: 401 });
  }

  if (stored.expiresAt < new Date()) {
    throw Object.assign(new Error('Refresh token expired'), { status: 401 });
  }

  // Revoke used token
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data:  { revoked: true },
  });

  // Issue new token in the same family
  const { raw, familyId } = await createRefreshToken(stored.userId, stored.orgId, stored.familyId);

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