import { db, rpc } from '../lib/db.js'
import { cors } from '../lib/cors.js'
import { cacheDel, CACHE_KEYS } from '../lib/redis.js'

export default async function handler(req, res) {
  if (cors(req, res)) return

  const type = req.query?.type

  // ── PUBLIC: feed + leaderboard ──────────────────────────────
  if (type === 'feed') {
    try { return res.status(200).json({ feed: await rpc('get_pull_feed', {}) || [] }) }
    catch { return res.status(200).json({ feed: [] }) }
  }
  if (type === 'leaderboard') {
    try { return res.status(200).json({ leaderboard: await rpc('get_leaderboard', {}) || [] }) }
    catch { return res.status(200).json({ leaderboard: [] }) }
  }

  // ── DAILY PULL (requires auth) ────────────────────────────────
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'No token provided' })

  let userId
  try {
    const { createClerkClient } = await import('@clerk/backend')
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
    const payload = await clerk.verifyToken(token)
    userId = payload.sub
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }

  if (req.method === 'GET') {
    const { data: user } = await db.from('users').select('last_daily_pull,pull_streak,longest_streak,credits').eq('clerk_id', userId).single()
    if (!user) return res.status(404).json({ error: 'User not found' })
    const now = new Date(), last = user.last_daily_pull ? new Date(user.last_daily_pull) : null
    const hoursSince = last ? (now - last) / 3600000 : 999
    const available = hoursSince >= 20
    return res.status(200).json({
      available, streak: user.pull_streak, longestStreak: user.longest_streak,
      nextAvailable: available ? null : new Date(last.getTime() + 20*3600000).toISOString(),
      hoursUntil: available ? 0 : Math.ceil(20 - hoursSince),
      nextMilestone: 7 - (user.pull_streak % 7),
    })
  }

  if (req.method === 'POST') {
    try {
      const result = await rpc('claim_daily_pull', { p_clerk_id: userId })
      if (result.streak_bonus > 0) await rpc('apply_streak_bonus', { p_clerk_id: userId, p_bonus: result.streak_bonus }).catch(() => {})
      await cacheDel(CACHE_KEYS.USER(userId))
      return res.status(200).json({
        success: true, creditsAdded: result.credits_added + (result.streak_bonus||0),
        streak: result.new_streak, streakBonus: result.streak_bonus||0,
        message: result.streak_bonus > 0
          ? `🔥 ${result.new_streak}-day streak! Bonus ${result.streak_bonus} credits!`
          : `Daily pull claimed! ${result.new_streak} day streak 🔥`,
      })
    } catch(err) { return res.status(400).json({ error: err.message }) }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
