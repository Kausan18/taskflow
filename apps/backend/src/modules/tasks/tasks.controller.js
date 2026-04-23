'use strict';
const tasksService = require('./tasks.service');
const { broadcastToOrg } = require('../events/sse.service');

function meta(req) {
  return { ip: req.ip, userAgent: req.headers['user-agent'] };
}

async function list(req, res, next) {
  try {
    const tasks = await tasksService.listTasks(req.user, req.query);
    res.json(tasks);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const task = await tasksService.getTask(req.params.id, req.user);
    res.json(task);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const task = await tasksService.createTask(req.body, req.user, meta(req));
    broadcastToOrg(req.user.orgId, 'task:created', task);
    res.status(201).json(task);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const task = await tasksService.updateTask(req.params.id, req.body, req.user, meta(req));
    broadcastToOrg(req.user.orgId, 'task:updated', task);
    res.json(task);
  } catch (err) { next(err); }
}

async function updateStatus(req, res, next) {
  try {
    const task = await tasksService.updateTaskStatus(req.params.id, req.body.status, req.user, meta(req));
    broadcastToOrg(req.user.orgId, 'task:updated', task);
    res.json(task);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await tasksService.deleteTask(req.params.id, req.user, meta(req));
    broadcastToOrg(req.user.orgId, 'task:deleted', { id: req.params.id });
    res.status(204).end();
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, updateStatus, remove };