'use strict';
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { logEvent } = require('../../lib/auditLogger');

const prisma = new PrismaClient();

// BUG FIX: The Prisma schema uses enum Role { ADMIN MEMBER }
// The frontend was sending 'Admin'/'Member' (title-case) which Prisma rejects.
// This normalizer maps any casing → valid Prisma enum value.
function normalizeRole(role) {
  const upper = (role || '').toUpperCase();
  if (upper === 'ADMIN') return 'ADMIN';
  return 'MEMBER';
}

const SAFE_USER = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  oauthProvider: true,
};

/**
 * List all members of the requesting user's organisation.
 */
async function listMembers(orgId) {
  return prisma.user.findMany({
    where: { orgId },
    select: SAFE_USER,
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Invite (create) a user in the org by email.
 * Creates the user directly with a temp password.
 * In production, this would send an email invite link instead.
 */
async function inviteUser({ email, role, name }, actor) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw Object.assign(new Error('A user with that email already exists'), { status: 409 });
  }

  const tempPassword = Math.random().toString(36).slice(2, 10) + 'Aa1!';
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const user = await prisma.user.create({
    data: {
      orgId: actor.orgId,
      email,
      name: name || email.split('@')[0],
      passwordHash,
      // FIX: normalise role casing before storing
      role: normalizeRole(role),
    },
    select: SAFE_USER,
  });

  await logEvent({
    orgId: actor.orgId,
    userId: actor.id,
    action: 'org:user_invited',
    entityType: 'user',
    entityId: user.id,
    after: { email, role: normalizeRole(role) },
  });

  return { user, tempPassword };
}

/**
 * Change a member's role. Cannot change your own role.
 */
async function changeMemberRole(targetId, role, actor) {
  if (targetId === actor.id) {
    throw Object.assign(new Error('Cannot change your own role'), { status: 400 });
  }

  const target = await prisma.user.findFirst({
    where: { id: targetId, orgId: actor.orgId },
  });
  if (!target) throw Object.assign(new Error('Member not found'), { status: 404 });

  // FIX: normalise role casing
  const normalizedRole = normalizeRole(role);

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { role: normalizedRole },
    select: SAFE_USER,
  });

  await logEvent({
    orgId: actor.orgId,
    userId: actor.id,
    action: 'org:role_changed',
    entityType: 'user',
    entityId: targetId,
    before: { role: target.role },
    after: { role: normalizedRole },
  });

  return updated;
}

/**
 * Remove a member from the org. Cannot remove yourself.
 */
async function removeMember(targetId, actor) {
  if (targetId === actor.id) {
    throw Object.assign(new Error('Cannot remove yourself'), { status: 400 });
  }

  const target = await prisma.user.findFirst({
    where: { id: targetId, orgId: actor.orgId },
  });
  if (!target) throw Object.assign(new Error('Member not found'), { status: 404 });

  // Unassign tasks before deleting user (referential integrity)
  await prisma.task.updateMany({
    where: { assigneeId: targetId, orgId: actor.orgId },
    data: { assigneeId: null },
  });

  await prisma.user.delete({ where: { id: targetId } });

  await logEvent({
    orgId: actor.orgId,
    userId: actor.id,
    action: 'org:member_removed',
    entityType: 'user',
    entityId: targetId,
    before: { email: target.email, role: target.role },
  });
}

module.exports = { listMembers, inviteUser, changeMemberRole, removeMember };