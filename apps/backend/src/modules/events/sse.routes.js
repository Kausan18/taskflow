'use strict';
const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const redis = require('../../config/redis');
const { verifyJWT } = require('../../middleware/verifyJWT');
const { subscribe } = require('./sse.service');

const router = Router();

const SSE_TICKET_TTL = 15; // seconds — one-time use, short-lived

/**
 * POST /api/events/sse-ticket
 * Authenticated endpoint. Issues a short-lived, single-use ticket
 * that the client can use to open an EventSource without exposing
 * the JWT in the URL (EventSource API does not support custom headers).
 */
router.post('/sse-ticket', verifyJWT, async (req, res, next) => {
  try {
    const ticket = uuidv4();
    // Store { userId, orgId } under the ticket key, expire in 15s
    await redis.setex(
      `sse:ticket:${ticket}`,
      SSE_TICKET_TTL,
      JSON.stringify({ userId: req.user.id, orgId: req.user.orgId })
    );
    res.json({ ticket });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/events/tasks?ticket=<uuid>
 * Opens the SSE stream. Validates the one-time ticket from Redis,
 * then subscribes the connection to that org's broadcast channel.
 */
router.get('/tasks', async (req, res) => {
  const { ticket, token } = req.query;

  let orgId, userId;

  if (ticket) {
    // Secure path: validate one-time ticket
    try {
      const raw = await redis.getdel(`sse:ticket:${ticket}`);
      if (!raw) {
        return res.status(401).json({ message: 'SSE ticket invalid or expired' });
      }
      ({ orgId, userId } = JSON.parse(raw));
    } catch {
      return res.status(500).json({ message: 'Ticket validation failed' });
    }
  } else if (token) {
    // Legacy fallback: validate JWT directly (dev convenience only)
    try {
      const { verifyAccessToken } = require('../../lib/tokenFamily');
      const payload = verifyAccessToken(token);
      orgId = payload.orgId;
      userId = payload.sub;
    } catch {
      return res.status(401).json({ message: 'Invalid token' });
    }
  } else {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable Nginx buffering
  res.flushHeaders();

  // Send a connected confirmation
  res.write(`event: connected\ndata: {"userId":"${userId}","orgId":"${orgId}"}\n\n`);

  // Keep-alive ping every 25 seconds (prevents proxy timeout)
  const keepAlive = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(keepAlive);
    }
  }, 25000);

  // Subscribe to org broadcast channel
  const unsubscribe = subscribe(orgId, res);

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(keepAlive);
    unsubscribe();
  });
});

module.exports = router;