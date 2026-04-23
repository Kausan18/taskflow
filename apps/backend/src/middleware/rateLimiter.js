'use strict';
const { rateLimit } = require('express-rate-limit');
const { RedisStore }  = require('rate-limit-redis');
const redis = require('../config/redis');

/**
 * Auth route limiter: 100 requests per 15 minutes per IP.
 * Backed by Redis so limits survive server restarts and work across replicas.
 */
const authRateLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,  // 15 minutes
  max:             100,
  standardHeaders: 'draft-7',
  legacyHeaders:   false,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'rl:auth:',
  }),
  handler: (_req, res) => {
    res.status(429).json({
      message: 'Too many requests — please try again in 15 minutes',
    });
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
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'rl:api:',
  }),
  handler: (_req, res) => {
    res.status(429).json({ message: 'Rate limit exceeded' });
  },
});

module.exports = { authRateLimiter, apiRateLimiter };