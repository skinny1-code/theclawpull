import { withAuth } from '../lib/auth.js'
import { rpc, db } from '../lib/db.js'
import { cacheDel, CACHE_KEYS } from '../lib/redis.js'

export default withAuth(async (req, res) => {
  const { userId } = req.auth

  if (req.method === 'GET') {
    // Check daily pull status
    const { data: user } = await db
      .from('users')
      .select('last_daily_pull, pull_streak, longest_streak, credits')
      .eq('clerk_id', userId)
      .single()
    if (!user) return res.status(404).json({ error: 'User not found' })

    const now = new Date()
    const last = user.last_daily_pull ? new Date(user.last_daily_pull) : null
    const hoursSince = last ? (now - last) / 3600000 : 999
    const available = hoursSince >= 20
    const nextAvailable = last ? new Date(last.getTime() + 20 * 3600000) : now

    return res.status(200).json({
      available,
      nextAvailable:  available ? null : nextAvailable.toISOString(),
      hoursUntil:     available ? 0 : Math.ceil(20 - hoursSince),
      streak:         user.pull_streak,
      longestStreak:  user.longest_streak,
      nextMilestone:  7 - (user.pull_streak % 7),
    })
  }

  if (req.method === 'POST') {
    let result
    try {
      result = await rpc('claim_daily_pull', { p_clerk_id: userId })
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }

    // Apply streak bonus if on 7-day milestone
    if (result.streak_bonus > 0) {
      await rpc('apply_streak_bonus', { p_clerk_id: userId, p_bonus: result.streak_bonus }).catch(() => {})
    }

    await cacheDel(CACHE_KEYS.USER(userId))

    return res.status(200).json({
      success:      true,
      creditsAdded: result.credits_added + (result.streak_bonus || 0),
      streak:       result.new_streak,
      streakBonus:  result.streak_bonus || 0,
      message:      result.streak_bonus > 0
        ? `🔥 ${result.new_streak}-day streak! Bonus ${result.streak_bonus} credits!`
        : `Daily pull claimed! ${result.new_streak} day streak 🔥`,
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
})
