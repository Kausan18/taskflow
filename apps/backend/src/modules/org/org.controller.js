'use strict';
const orgService = require('./org.service');

async function listMembers(req, res, next) {
  try {
    const members = await orgService.listMembers(req.user.orgId);
    res.json(members);
  } catch (err) { next(err); }
}

async function inviteUser(req, res, next) {
  try {
    const result = await orgService.inviteUser(req.body, req.user);
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function changeMemberRole(req, res, next) {
  try {
    const updated = await orgService.changeMemberRole(req.params.id, req.body.role, req.user);
    res.json(updated);
  } catch (err) { next(err); }
}

async function removeMember(req, res, next) {
  try {
    await orgService.removeMember(req.params.id, req.user);
    res.status(204).end();
  } catch (err) { next(err); }
}

module.exports = { listMembers, inviteUser, changeMemberRole, removeMember };