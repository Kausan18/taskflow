'use strict';
const { verifyAccessToken } = require('../lib/tokenFamily');

/**
 * Verifies the RS256 JWT from the Authorization: Bearer header.
 * Attaches decoded payload to req.user.
 */
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id:    payload.sub,
      orgId: payload.orgId,
      role:  payload.role,
      email: payload.email,
    };
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token';
    return res.status(401).json({ message: msg });
  }
}

module.exports = { verifyJWT };