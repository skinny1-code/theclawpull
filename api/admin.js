import { withAdmin, clerk } from '../lib/auth.js'
import { db, rpc } from '../lib/db.js'
import { cacheDel, CACHE_KEYS } from '../lib/redis.js'

export default withAdmin(async (req, res) => {
  const type = req.query?.type || req.url?.split('?type=')[1]?.split('&')[0]

  // ── STATS ──────────────────────────────────────────────────────
  if (type === 'stats') {
    const [r1,r2,r3,r4,r5,r6,r7] = await Promise.all([
      db.rpc('get_pool_stats'), db.rpc('get_revenue_stats'), db.rpc('get_pull_stats'),
      db.rpc('get_vault_stats'), db.rpc('get_top_cards'), db.rpc('get_rarity_breakdown'), db.rpc('get_recent_pulls'),
    ])
    return res.status(200).json({ pool:r1.data?.[0]||{}, revenue:r2.data?.[0]||{}, pulls:r3.data?.[0]||{}, vault:r4.data?.[0]||{}, topCards:r5.data||[], rarityBreakdown:r6.data||[], recentPulls:r7.data||[] })
  }

  // ── SET ROLE ───────────────────────────────────────────────────
  if (type === 'role') {
    const { targetUserId, role } = req.body || {}
    if (!targetUserId) return res.status(400).json({ error: 'targetUserId required' })
    if (!['admin','user'].includes(role)) return res.status(400).json({ error: 'role must be admin or user' })
    await clerk.users.updateUserMetadata(targetUserId, { publicMetadata: { role } })
    return res.status(200).json({ success: true })
  }

  // ── CARDS CRUD ─────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await db.from('cards').select('*').order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ cards: data })
  }
  if (req.method === 'POST') {
    const { name, image_url, grade, sport, year, set_name, player, rarity='Common', pull_cost=1, total_supply=1, fmv=0, claw_tier='CoreClaw' } = req.body||{}
    if (!name||!grade) return res.status(400).json({ error: 'name and grade required' })
    const { data, error } = await db.from('cards').insert({ name,image_url,grade,sport,year,set_name,player,rarity,pull_cost,total_supply,remaining:total_supply,fmv,claw_tier }).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await cacheDel(CACHE_KEYS.POOL)
    return res.status(201).json({ card: data })
  }
  if (req.method === 'PUT') {
    const { id, ...fields } = req.body||{}
    if (!id) return res.status(400).json({ error: 'id required' })
    const allowed = ['name','image_url','grade','sport','year','set_name','player','rarity','pull_cost','remaining','is_active','fmv','claw_tier']
    const updates = Object.fromEntries(Object.entries(fields).filter(([k])=>allowed.includes(k)))
    const { data, error } = await db.from('cards').update({...updates,updated_at:new Date().toISOString()}).eq('id',id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await cacheDel(CACHE_KEYS.POOL)
    return res.status(200).json({ card: data })
  }
  if (req.method === 'DELETE') {
    const { id } = req.body||{}
    if (!id) return res.status(400).json({ error: 'id required' })
    const { data, error } = await db.from('cards').update({ is_active: false }).eq('id',id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await cacheDel(CACHE_KEYS.POOL)
    return res.status(200).json({ card: data })
  }
  return res.status(405).json({ error: 'Method not allowed' })
})
