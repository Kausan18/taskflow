'use strict';
const { PrismaClient } = require('@prisma/client');
const { logEvent, diffObjects } = require('../../lib/auditLogger');

const prisma = new PrismaClient();

// Map frontend string values to Prisma enum keys
const STATUS_MAP = {
  'To do':       'TODO',
  'In progress': 'IN_PROGRESS',
  'In review':   'IN_REVIEW',
  'Done':        'DONE',
};
const PRIORITY_MAP = { High: 'HIGH', Med: 'MED', Low: 'LOW' };

// Map Prisma enum keys back to display strings for API responses
const STATUS_DISPLAY  = { TODO: 'To do', IN_PROGRESS: 'In progress', IN_REVIEW: 'In review', DONE: 'Done' };
const PRIORITY_DISPLAY = { HIGH: 'High', MED: 'Med', LOW: 'Low' };

// Assignee include shape reused across queries
const ASSIGNEE_INCLUDE = {
  assignee: { select: { id: true, name: true, email: true } },
  creator:  { select: { id: true, name: true } },
};

function formatTask(task) {
  return {
    ...task,
    status:   STATUS_DISPLAY[task.status]   ?? task.status,
    priority: PRIORITY_DISPLAY[task.priority] ?? task.priority,
    isOverdue: task.dueDate ? new Date(task.dueDate) < new Date() && task.status !== 'DONE' : false,
  };
}

/**
 * List tasks.
 * Admins see all org tasks. Members see only tasks they created or are assigned to.
 */
async function listTasks({ orgId, userId, role }, { status, priority, assigneeId, page = 1, limit = 100 }) {
  const where = {
    orgId,
    deletedAt: null,
    ...(status   && { status:   STATUS_MAP[status]   ?? status }),
    ...(priority && { priority: PRIORITY_MAP[priority] ?? priority }),
    ...(assigneeId && { assigneeId }),
  };

  // Members can only see tasks they own or are assigned to
  if (role === 'MEMBER') {
    where.OR = [{ creatorId: userId }, { assigneeId: userId }];
  }

  const tasks = await prisma.task.findMany({
    where,
    include: ASSIGNEE_INCLUDE,
    orderBy: [{ createdAt: 'desc' }],
    skip: (page - 1) * limit,
    take:  limit,
  });

  return tasks.map(formatTask);
}

/**
 * Get a single task. Members can only get tasks they own/are assigned to.
 */
async function getTask(id, { orgId, userId, role }) {
  const task = await prisma.task.findFirst({
    where: { id, orgId, deletedAt: null },
    include: ASSIGNEE_INCLUDE,
  });

  if (!task) throw Object.assign(new Error('Task not found'), { status: 404 });

  if (role === 'MEMBER' && task.creatorId !== userId && task.assigneeId !== userId) {
    throw Object.assign(new Error('Access denied'), { status: 403 });
  }

  return formatTask(task);
}

/**
 * Create a task. Auto-links to creator's org.
 */
async function createTask(data, { orgId, userId }, { ip, userAgent } = {}) {
  const { title, description, status, priority, category, assigneeId, dueDate } = data;

  const task = await prisma.task.create({
    data: {
      orgId,
      creatorId:   userId,
      title,
      description: description || null,
      status:      STATUS_MAP[status]   ?? 'TODO',
      priority:    PRIORITY_MAP[priority] ?? 'LOW',
      category:    category || null,
      assigneeId:  assigneeId || null,
      dueDate:     dueDate ? new Date(dueDate) : null,
    },
    include: ASSIGNEE_INCLUDE,
  });

  await logEvent({
    orgId, userId,
    action: 'task:created',
    entityType: 'task',
    entityId: task.id,
    after: formatTask(task),
    ipAddress: ip, userAgent,
  });

  return formatTask(task);
}

/**
 * Full update (PUT). Admins can update any org task. Members only their own.
 */
async function updateTask(id, data, actor, { ip, userAgent } = {}) {
  const existing = await getTask(id, actor); // throws 403/404 if not allowed

  const { title, description, status, priority, category, assigneeId, dueDate } = data;
  const updateData = {
    title,
    description: description ?? null,
    status:      STATUS_MAP[status]   ?? existing.status,
    priority:    PRIORITY_MAP[priority] ?? existing.priority,
    category:    category ?? null,
    assigneeId:  assigneeId || null,
    dueDate:     dueDate ? new Date(dueDate) : null,
  };

  const updated = await prisma.task.update({
    where: { id },
    data:  updateData,
    include: ASSIGNEE_INCLUDE,
  });

  const { beforeDiff, afterDiff } = diffObjects(existing, formatTask(updated));

  await logEvent({
    orgId: actor.orgId, userId: actor.userId ?? actor.id,
    action: 'task:updated',
    entityType: 'task', entityId: id,
    before: beforeDiff, after: afterDiff,
    ipAddress: ip, userAgent,
  });

  return formatTask(updated);
}

/**
 * Quick status-only PATCH — used by Kanban drag-and-drop.
 */
async function updateTaskStatus(id, status, actor, { ip, userAgent } = {}) {
  const existing = await getTask(id, actor);
  const prismaStatus = STATUS_MAP[status];
  if (!prismaStatus) throw Object.assign(new Error('Invalid status value'), { status: 400 });

  const updated = await prisma.task.update({
    where: { id },
    data:  { status: prismaStatus },
    include: ASSIGNEE_INCLUDE,
  });

  await logEvent({
    orgId: actor.orgId, userId: actor.userId ?? actor.id,
    action: 'task:status_changed',
    entityType: 'task', entityId: id,
    before: { status: existing.status },
    after:  { status },
    ipAddress: ip, userAgent,
  });

  return formatTask(updated);
}

/**
 * Soft delete. Admins can delete any. Members only their own.
 */
async function deleteTask(id, actor, { ip, userAgent } = {}) {
  const existing = await getTask(id, actor);

  await prisma.task.update({
    where: { id },
    data:  { deletedAt: new Date() },
  });

  await logEvent({
    orgId: actor.orgId, userId: actor.userId ?? actor.id,
    action: 'task:deleted',
    entityType: 'task', entityId: id,
    before: existing,
    ipAddress: ip, userAgent,
  });
}

module.exports = { listTasks, getTask, createTask, updateTask, updateTaskStatus, deleteTask };