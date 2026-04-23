'use strict';
const { Router } = require('express');
const { z }      = require('zod');
const controller = require('./tasks.controller');
const { verifyJWT }    = require('../../middleware/verifyJWT');
const { tenantGuard }  = require('../../middleware/tenantGuard');
const { apiRateLimiter } = require('../../middleware/rateLimiter');

const router = Router();

// All task routes require authentication + tenant context
router.use(verifyJWT, tenantGuard, apiRateLimiter);

// ── Validation schemas ───────────────────────────────────────────────────────

const STATUSES   = ['To do', 'In progress', 'In review', 'Done'];
const PRIORITIES = ['High', 'Med', 'Low'];

const createSchema = z.object({
  title:       z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  status:      z.enum(STATUSES).default('To do'),
  priority:    z.enum(PRIORITIES).default('Low'),
  category:    z.string().max(50).optional(),
  assigneeId:  z.string().uuid().optional().or(z.literal('')).transform(v => v || undefined),
  dueDate:     z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
});

const updateSchema = createSchema;

const statusSchema = z.object({
  status: z.enum(STATUSES),
});

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: 'Validation failed', errors: result.error.flatten().fieldErrors });
  }
  req.body = result.data;
  next();
};

// ── Routes ───────────────────────────────────────────────────────────────────

router.get('/',           controller.list);
router.post('/',          validate(createSchema), controller.create);
router.get('/:id',        controller.getOne);
router.put('/:id',        validate(updateSchema), controller.update);
router.patch('/:id/status', validate(statusSchema), controller.updateStatus);
router.delete('/:id',     controller.remove);

module.exports = router;