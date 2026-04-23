'use strict';

/**
 * Tenant guard — ensures the orgId in the JWT matches resource ownership.
 *
 * This runs after verifyJWT. It sets req.orgId from the token payload
 * so every downstream service layer can use it without extracting it manually.
 *
 * The actual per-query enforcement is done inside each service by always
 * including `where: { orgId: req.orgId }` in Prisma queries — this
 * middleware just makes that value centrally available and auditable.
 */
function tenantGuard(req, res, next) {
  if (!req.user?.orgId) {
    return res.status(401).json({ message: 'Tenant context missing from token' });
  }
  req.orgId = req.user.orgId;
  next();
}

module.exports = { tenantGuard };