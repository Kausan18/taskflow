'use strict';

/**
 * Require a minimum role to access a route.
 * Usage: router.get('/admin-only', verifyJWT, requireRole('ADMIN'), handler)
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { requireRole };