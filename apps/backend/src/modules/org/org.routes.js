'use strict';
const { Router } = require('express');
const { z }      = require('zod');
const controller = require('./org.controller');
const { verifyJWT }    = require('../../middleware/verifyJWT');
const { tenantGuard }  = require('../../middleware/tenantGuard');
const { requireRole }  = require('../../middleware/rbac');
const { apiRateLimiter } = require('../../middleware/rateLimiter');

const router = Router();

// All org routes: authenticated + tenant + admin only
router.use(verifyJWT, tenantGuard, requireRole('ADMIN'), apiRateLimiter);

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: 'Validation failed', errors: result.error.flatten().fieldErrors });
  }
  req.body = result.data;
  next();
};

const inviteSchema = z.object({
  email: z.string().email(),
  role:  z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
  name:  z.string().optional(),
});

const roleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});

router.get('/members',              controller.listMembers);
router.post('/invite',              validate(inviteSchema), controller.inviteUser);
router.patch('/members/:id/role',   validate(roleSchema),   controller.changeMemberRole);
router.delete('/members/:id',       controller.removeMember);

module.exports = router;