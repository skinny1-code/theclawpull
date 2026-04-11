import { withAuth } from '../lib/auth.js'
import { db } from '../lib/db.js'
import { cacheGet, cacheSet, cacheDel, CACHE_KEYS } from '../lib/redis.js'

export default withAuth(async (req, res) => {
  const { userId } = req.auth

  if (req.method === 'GET') {
    const cached = await cacheGet(CACHE_KEYS.USER(userId))
    if (cached) return res.status(200).json(cached)
    const { data, error } = await db
      .from('users')
      .select('id,clerk_id,email,credits,wallet_cents,created_at,pull_streak,longest_streak,total_fmv_pulled,is_first_pull_done,coreclaw_pulls,premierclaw_pulls,ultraclaw_pulls,quantumclaw_pulls')
      .eq('clerk_id', userId).single()
    if (error || !data) return res.status(404).json({ error: 'User not found' })
    await cacheSet(CACHE_KEYS.USER(userId), data, 30)
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { email } = req.body || {}
    const { data, error } = await db
      .from('users')
      .upsert({ clerk_id: userId, email: email || null }, { onConflict: 'clerk_id' })
      .select('id,clerk_id,email,credits,wallet_cents,created_at,pull_streak,coreclaw_pulls,premierclaw_pulls,ultraclaw_pulls,quantumclaw_pulls,is_first_pull_done')
      .single()
    if (error) return res.status(500).json({ error: error.message })
    await cacheDel(CACHE_KEYS.USER(userId))
    return res.status(200).json(data)
  }

  // TEST MODE: grant a free pull without payment
  if (req.method === 'POST') {
    const { action, tier } = req.body || {}
    if (action === 'test_grant') {
      if (process.env.TEST_MODE !== 'true') {
        return res.status(403).json({ error: 'Not available in production' })
      }
      const TIER_COL = { CoreClaw:'coreclaw_pulls', PremierClaw:'premierclaw_pulls', UltraClaw:'ultraclaw_pulls', QuantumClaw:'quantumclaw_pulls' }
      const TIER_CREDITS = { CoreClaw:25, PremierClaw:50, UltraClaw:100, QuantumClaw:500 }
      const pullCol = TIER_COL[tier]
      if (!pullCol) return res.status(400).json({ error: 'Invalid tier' })
      const { data: user } = await db.from('users').select('id,credits,' + pullCol).eq('clerk_id', userId).single()
      if (!user) return res.status(404).json({ error: 'User not found' })
      await db.from('users').update({
        [pullCol]: (user[pullCol] || 0) + 1,
        credits: (user.credits || 0) + TIER_CREDITS[tier],
        updated_at: new Date().toISOString(),
      }).eq('clerk_id', userId)
      return res.status(200).json({ success: true, tier, message: `TEST: 1 ${tier} pull granted` })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
})
