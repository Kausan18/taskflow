'use strict';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Append an immutable audit log entry.
 *
 * @param {object} opts
 * @param {string} opts.orgId
 * @param {string} opts.userId        - actor
 * @param {string} opts.action        - e.g. "task:created"
 * @param {string} opts.entityType    - e.g. "task"
 * @param {string} opts.entityId
 * @param {object} [opts.before]      - snapshot before mutation
 * @param {object} [opts.after]       - snapshot after mutation
 * @param {string} [opts.ipAddress]
 * @param {string} [opts.userAgent]
 */
async function logEvent({ orgId, userId, action, entityType, entityId, before, after, ipAddress, userAgent }) {
  try {
    await prisma.auditLog.create({
      data: {
        orgId,
        userId,
        action,
        entityType,
        entityId,
        beforeSnapshot: before ?? undefined,
        afterSnapshot:  after  ?? undefined,
        ipAddress:      ipAddress ?? null,
        userAgent:      userAgent ?? null,
      },
    });
  } catch (err) {
    // Audit log failure must never break the main request — log and swallow
    console.error('[AuditLogger] Failed to write audit entry:', err.message);
  }
}

/**
 * Helper to diff two objects and return only changed keys.
 * Used to build concise before/after snapshots.
 */
function diffObjects(before, after) {
  const changedKeys = Object.keys(after).filter(
    (k) => JSON.stringify(before[k]) !== JSON.stringify(after[k])
  );
  const beforeDiff = {};
  const afterDiff  = {};
  for (const k of changedKeys) {
    beforeDiff[k] = before[k];
    afterDiff[k]  = after[k];
  }
  return { beforeDiff, afterDiff };
}

module.exports = { logEvent, diffObjects };