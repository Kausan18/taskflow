'use strict';
const { PrismaClient } = require('@prisma/client');
const { logEvent } = require('../../lib/auditLogger');

const prisma = new PrismaClient();

const SAFE_USER = { id: true, name: true, email: true, role: true, createdAt: true, oauthProvider: true };

/**
 * List all members of the requesting user's organisation.
 */
async function listMembers(orgId) {
  return prisma.user.findMany({
    where:   { orgId },
    select:  SAFE_USER,
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Invite (create) a user in the org by email.
 * In a production system this would send an email and create a pending invite.
 * Here we create the user directly with a temp password and return it — the
 * frontend shows it once so the admin can share it manually.
 */
async function inviteUser({ email, role, name }, actor) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw Object.assign(new Error('A user with that email already exists'), { status: 409 });
  }

  // Generate a random temp password — in production, use a signed invite link instead
  const bcrypt = require('bcryptjs');
  const tempPassword = Math.random().toString(36).slice(2, 10) + 'Aa1!';
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const user = await prisma.user.create({
    data: { orgId: actor.orgId, email, name: name || email.split('@')[0], passwordHash, role: role || 'MEMBER' },
    select: SAFE_USER,
  });

  await logEvent({
    orgId: actor.orgId, userId: actor.id,
    action: 'org:user_invited',
    entityType: 'user', entityId: user.id,
    after: { email, role },
  });

  return { user, tempPassword };
}

/**
 * Change a member's role (Admin only).
 * Cannot demote yourself.
 */
async function changeMemberRole(targetId, role, actor) {
  if (targetId === actor.id) {
    throw Object.assign(new Error('Cannot change your own role'), { status: 400 });
  }

  const target = await prisma.user.findFirst({ where: { id: targetId, orgId: actor.orgId } });
  if (!target) throw Object.assign(new Error('Member not found'), { status: 404 });

  const updated = await prisma.user.update({
    where:  { id: targetId },
    data:   { role },
    select: SAFE_USER,
  });

  await logEvent({
    orgId: actor.orgId, userId: actor.id,
    action: 'org:role_changed',
    entityType: 'user', entityId: targetId,
    before: { role: target.role }, after: { role },
  });

  return updated;
}

/**
 * Remove a member from the org (Admin only).
 * Cannot remove yourself.
 */
async function removeMember(targetId, actor) {
  if (targetId === actor.id) {
    throw Object.assign(new Error('Cannot remove yourself'), { status: 400 });
  }

  const target = await prisma.user.findFirst({ where: { id: targetId, orgId: actor.orgId } });
  if (!target) throw Object.assign(new Error('Member not found'), { status: 404 });

  // Soft-delete: unassign their tasks and delete the user record
  await prisma.task.updateMany({
    where: { assigneeId: targetId, orgId: actor.orgId },
    data:  { assigneeId: null },
  });

  await prisma.user.delete({ where: { id: targetId } });

  await logEvent({
    orgId: actor.orgId, userId: actor.id,
    action: 'org:member_removed',
    entityType: 'user', entityId: targetId,
    before: { email: target.email, role: target.role },
  });
}

module.exports = { listMembers, inviteUser, changeMemberRole, removeMember };