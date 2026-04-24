'use strict';
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
  lazyConnect: false,
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err.message));

/**
 * Polyfill redis.getdel() for older Redis server versions (<6.2) or ioredis versions
 * that don't natively support GETDEL.
 * GETDEL atomically gets and deletes a key — exactly what we need for one-time SSE tickets.
 */
if (typeof redis.getdel !== 'function') {
  redis.getdel = async function (key) {
    const pipeline = redis.pipeline();
    pipeline.get(key);
    pipeline.del(key);
    const results = await pipeline.exec();
    // results[0] = [error, value of GET]
    return results[0][1];
  };
}

module.exports = redis;