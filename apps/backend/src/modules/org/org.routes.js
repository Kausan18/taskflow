'use strict';
const { Router } = require('express');
const { z } = require('zod');
const controller = require('./org.controller');
const { verifyJWT } = require('../../middleware/verifyJWT');
const { tenantGuard } = require('../../middleware/tenantGuard');
const { requireRole } = require('../../middleware/rbac');
const { apiRateLimiter } = require('../../middleware/rateLimiter');

const router = Router();

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    });
  }
  req.body = result.data;
  next();
};

// FIX: Accept both uppercase ('ADMIN','MEMBER') and title-case ('Admin','Member')
// sent by the frontend, normalise to Prisma enum values in the service layer.
const inviteSchema = z.object({
  email: z.string().email(),
  // Accept either casing — service normalises to ADMIN/MEMBER
  role: z.string().optional().default('MEMBER'),
  name: z.string().optional(),
});

const roleSchema = z.object({
  role: z.string().min(1),
});

// GET /api/org/members — members can list, admins-only restricted routes below
router.get('/members', verifyJWT, tenantGuard, apiRateLimiter, controller.listMembers);

// Admin-only routes
router.post(
  '/invite',
  verifyJWT, tenantGuard, requireRole('ADMIN'), apiRateLimiter,
  validate(inviteSchema),
  controller.inviteUser
);

router.patch(
  '/members/:id/role',
  verifyJWT, tenantGuard, requireRole('ADMIN'), apiRateLimiter,
  validate(roleSchema),
  controller.changeMemberRole
);

router.delete(
  '/members/:id',
  verifyJWT, tenantGuard, requireRole('ADMIN'), apiRateLimiter,
  controller.removeMember
);

// FIX: The frontend MembersPage calls GET /api/org/invites which didn't exist.
// Since we create users directly (no real invite flow), return empty array.
router.get(
  '/invites',
  verifyJWT, tenantGuard, requireRole('ADMIN'), apiRateLimiter,
  (_req, res) => res.json([])
);

// FIX: The frontend also calls DELETE /api/org/invites/:id — return 204 stub
router.delete(
  '/invites/:id',
  verifyJWT, tenantGuard, requireRole('ADMIN'), apiRateLimiter,
  (_req, res) => res.status(204).end()
);

module.exports = router;