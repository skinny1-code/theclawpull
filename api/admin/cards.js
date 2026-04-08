import { withAdmin } from '../../lib/auth.js'
import { db } from '../../lib/db.js'
import { cacheDel, CACHE_KEYS } from '../../lib/redis.js'

export default withAdmin(async (req, res) => {

  if (req.method === 'GET') {
    const { data, error } = await db.from('cards').select('*').order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ cards: data })
  }

  if (req.method === 'POST') {
    const {
      name, image_url, grade, sport, year, set_name, player,
      rarity = 'Common', pull_cost = 1, total_supply = 1, fmv = 0,
      claw_tier = 'CoreClaw',
    } = req.body || {}
    if (!name || !grade) return res.status(400).json({ error: 'name and grade are required' })

    const { data, error } = await db
      .from('cards')
      .insert({ name, image_url, grade, sport, year, set_name, player, rarity, pull_cost, total_supply, remaining: total_supply, fmv, claw_tier })
      .select().single()

    if (error) return res.status(500).json({ error: error.message })
    await cacheDel(CACHE_KEYS.POOL)
    return res.status(201).json({ card: data })
  }

  if (req.method === 'PUT') {
    const { id, ...fields } = req.body || {}
    if (!id) return res.status(400).json({ error: 'id is required' })
    const allowed = ['name','image_url','grade','sport','year','set_name','player','rarity','pull_cost','remaining','is_active','fmv','claw_tier']
    const updates = Object.fromEntries(Object.entries(fields).filter(([k]) => allowed.includes(k)))
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'No valid fields to update' })
    const { data, error } = await db.from('cards').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await cacheDel(CACHE_KEYS.POOL)
    return res.status(200).json({ card: data })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {}
    if (!id) return res.status(400).json({ error: 'id is required' })
    const { data, error } = await db.from('cards').update({ is_active: false }).eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await cacheDel(CACHE_KEYS.POOL)
    return res.status(200).json({ card: data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
})
