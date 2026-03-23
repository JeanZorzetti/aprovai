import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as { redis: Redis }

function getRedis() {
  if (globalForRedis.redis) return globalForRedis.redis
  const url = process.env.REDIS_URL || 'redis://localhost:6379'
  console.log('[redis] connecting to:', url)
  const client = new Redis(url, { maxRetriesPerRequest: null })
  globalForRedis.redis = client
  return client
}

export const redis = getRedis()
