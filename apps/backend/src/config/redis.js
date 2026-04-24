'use strict';
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) {
      // Stop retrying after 3 attempts — don't crash the process
      return null;
    }
    return Math.min(times * 200, 2000);
  },
  lazyConnect: true, // Don't connect immediately on require()
  enableOfflineQueue: false,
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => {
  // Log cleanly without crashing
  if (err.message?.includes('ECONNREFUSED')) {
    console.error('❌ Redis error: connection refused — is Redis running?');
    console.error('   Set REDIS_URL in .env or start Redis locally.');
  } else {
    console.error('❌ Redis error:', err.message);
  }
});

// Connect explicitly (lazyConnect means it won't throw on require)
redis.connect().catch(() => {
  console.warn('⚠️  Redis unavailable — rate limiting and SSE tickets disabled');
});

// Polyfill getdel for Redis < 6.2
if (typeof redis.getdel !== 'function') {
  redis.getdel = async function (key) {
    const pipeline = redis.pipeline();
    pipeline.get(key);
    pipeline.del(key);
    const results = await pipeline.exec();
    return results?.[0]?.[1] ?? null;
  };
}

module.exports = redis;