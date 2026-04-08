// Upstash Redis — optional. App degrades gracefully if env vars are not set.
let redis = null
let pullRatelimit = null
let apiRatelimit = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const { Redis } = await import('@upstash/redis').catch(() => ({ Redis: null }))
  const { Ratelimit } = await import('@upstash/ratelimit').catch(() => ({ Ratelimit: null }))

  if (Redis && Ratelimit) {
    redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    pullRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '60 s'),
      prefix:  'ratelimit:pull',
    })
    apiRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '60 s'),
      prefix:  'ratelimit:api',
    })
  }
}

export { redis, pullRatelimit, apiRatelimit }

export const CACHE_KEYS = {
  POOL:  'pool:active_cards',
  USER:  (clerkId) => `user:${clerkId}`,
  VAULT: (userId)  => `vault:${userId}`,
}

// Safe cache helpers — no-ops when Redis is unavailable
export async function cacheGet(key) {
  if (!redis) return null
  try { return await redis.get(key) } catch { return null }
}

export async function cacheSet(key, value, exSeconds = 60) {
  if (!redis) return
  try { await redis.set(key, value, { ex: exSeconds }) } catch { /* silent */ }
}

export async function cacheDel(...keys) {
  if (!redis) return
  try { await Promise.all(keys.map(k => redis.del(k))) } catch { /* silent */ }
}

// Rate limit check — allows all if Redis is unavailable
export async function checkPullRateLimit(userId) {
  if (!pullRatelimit) return { success: true, remaining: 10, reset: Date.now() + 60000 }
  try { return await pullRatelimit.limit(userId) }
  catch { return { success: true, remaining: 10, reset: Date.now() + 60000 } }
}
