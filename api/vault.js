import { withAuth } from '../lib/auth.js'
import { db, rpc } from '../lib/db.js'
import { cacheDel, CACHE_KEYS } from '../lib/redis.js'

export default withAuth(async (req, res) => {
  const { userId } = req.auth

  if (req.method === 'GET') {
    // Get internal user id
    const { data: user } = await db.from('users').select('id').eq('clerk_id', userId).single()
    if (!user) return res.status(404).json({ error: 'User not found' })

    const { data: items, error } = await db
      .from('vault')
      .select(`
        id, nft_token_id, burned, acquired_at, burned_at,
        cards ( id, name, image_url, grade, rarity, sport, year, set_name, player, fmv )
      `)
      .eq('user_id', user.id)
      .order('acquired_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })

    // Flatten for frontend
    const flat = items.map(v => ({
      id:           v.id,
      nft_token_id: v.nft_token_id,
      burned:       v.burned,
      acquired_at:  v.acquired_at,
      burned_at:    v.burned_at,
      card_id:      v.cards?.id,
      card_name:    v.cards?.name,
      image_url:    v.cards?.image_url,
      grade:        v.cards?.grade,
      rarity:       v.cards?.rarity,
      sport:        v.cards?.sport,
      fmv:          v.cards?.fmv,
    }))

    return res.status(200).json({ items: flat })
  }

  if (req.method === 'POST') {
    const { action, vaultId } = req.body || {}
    if (!vaultId) return res.status(400).json({ error: 'vaultId is required' })

    try {
      if (action === 'swap') {
        const result = await rpc('do_swap', { p_clerk_id: userId, p_vault_id: vaultId })
        await cacheDel(CACHE_KEYS.USER(userId), CACHE_KEYS.POOL)
        return res.status(200).json({ success: true, action: 'swap', creditsEarned: result.credits_earned })
      }

      if (action === 'redeem') {
        const result = await rpc('do_redeem', { p_clerk_id: userId, p_vault_id: vaultId })
        // TODO: trigger fulfillment webhook here
        return res.status(200).json({ success: true, action: 'redeem', nftTokenId: result.nft_token_id })
      }
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }

    return res.status(400).json({ error: 'action must be "swap" or "redeem"' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
})
