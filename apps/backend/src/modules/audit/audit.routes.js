'use strict';
const { Router }       = require('express');
const { listAuditLogs } = require('./audit.service');
const { verifyJWT }    = require('../../middleware/verifyJWT');
const { tenantGuard }  = require('../../middleware/tenantGuard');
const { requireRole }  = require('../../middleware/rbac');
const { apiRateLimiter } = require('../../middleware/rateLimiter');

const router = Router();

router.use(verifyJWT, tenantGuard, requireRole('ADMIN'), apiRateLimiter);

// GET /api/audit-logs?page=1&limit=50&entityType=task&action=task:deleted
router.get('/', async (req, res, next) => {
  try {
    const { page, limit, entityType, action } = req.query;
    const result = await listAuditLogs(req.orgId, {
      page:  parseInt(page)  || 1,
      limit: parseInt(limit) || 50,
      entityType,
      action,
    });
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;