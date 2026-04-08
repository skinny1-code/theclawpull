import { withAdmin } from '../../lib/auth.js'
import { db } from '../../lib/db.js'

export default withAdmin(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const [
    { data: poolRows },
    { data: revenueRows },
    { data: pullRows },
    { data: vaultRows },
    { data: topCards },
    { data: rarityBreakdown },
    { data: recentPulls },
  ] = await Promise.all([
    db.rpc('get_pool_stats'),
    db.rpc('get_revenue_stats'),
    db.rpc('get_pull_stats'),
    db.rpc('get_vault_stats'),
    db.rpc('get_top_cards'),
    db.rpc('get_rarity_breakdown'),
    db.rpc('get_recent_pulls'),
  ])

  return res.status(200).json({
    pool:            poolRows?.[0]    || {},
    revenue:         revenueRows?.[0] || {},
    pulls:           pullRows?.[0]    || {},
    vault:           vaultRows?.[0]   || {},
    topCards:        topCards         || [],
    rarityBreakdown: rarityBreakdown  || [],
    recentPulls:     recentPulls      || [],
  })
})
