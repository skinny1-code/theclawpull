import { withAuth } from '../lib/auth.js'
import { db } from '../lib/db.js'
import { cacheGet, cacheSet, CACHE_KEYS } from '../lib/redis.js'

export default withAuth(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const cached = await cacheGet(CACHE_KEYS.POOL)
  if (cached) return res.status(200).json({ cards: cached, cached: true })

  const { data: cards, error } = await db
    .from('cards')
    .select('id, name, image_url, grade, sport, year, set_name, player, rarity, pull_cost, total_supply, remaining, fmv, is_active, claw_tier')
    .eq('is_active', true)
    .gt('remaining', 0)
    .order('fmv', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  await cacheSet(CACHE_KEYS.POOL, cards, 60)
  return res.status(200).json({ cards, cached: false })
})
