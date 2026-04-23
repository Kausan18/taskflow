'use strict';
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * List audit logs for the org — admin only, paginated.
 */
async function listAuditLogs(orgId, { page = 1, limit = 50, entityType, action } = {}) {
  const where = {
    orgId,
    ...(entityType && { entityType }),
    ...(action     && { action }),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data:  logs,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

module.exports = { listAuditLogs };