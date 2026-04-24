'use strict';
const { rateLimit } = require('express-rate-limit');
const redis = require('../config/redis');

// Helper — returns a RedisStore only if Redis is actually connected.
// Falls back to the default in-memory store when Redis is unavailable.
// This prevents the "Stream isn't writeable" crash on startup.
function makeStore(prefix) {
  try {
    const { RedisStore } = require('rate-limit-redis');
    return new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix,
    });
  } catch {
    // Redis not available — use in-memory store (resets on restart, fine for dev)
    console.warn(`⚠️  Rate limiter [${prefix}] using in-memory store (Redis unavailable)`);
    return undefined; // express-rate-limit defaults to memory store when undefined
  }
}

/**
 * Auth route limiter: 100 requests per 15 minutes per IP.
 */
const authRateLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             100,
  standardHeaders: 'draft-7',
  legacyHeaders:   false,
  store:           makeStore('rl:auth:'),
  handler: (_req, res) => {
    res.status(429).json({
      message: 'Too many requests — please try again in 15 minutes',
    });
  },
  skip: () => {
    // Skip rate limiting entirely if Redis isn't ready (avoids crash)
    return redis.status !== 'ready';
  },
});

/**
 * General API limiter: 500 requests per 15 minutes per IP.
 */
const apiRateLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             500,
  standardHeaders: 'draft-7',
  legacyHeaders:   false,
  store:           makeStore('rl:api:'),
  handler: (_req, res) => {
    res.status(429).json({ message: 'Rate limit exceeded' });
  },
  skip: () => {
    return redis.status !== 'ready';
  },
});

module.exports = { authRateLimiter, apiRateLimiter };