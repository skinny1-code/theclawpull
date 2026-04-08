import { withAuth } from '../lib/auth.js'
import { db, rpc } from '../lib/db.js'

export default withAuth(async (req, res) => {
  const { userId } = req.auth

  // GET — my incoming + outgoing offers
  if (req.method === 'GET') {
    const { data: user } = await db.from('users').select('id').eq('clerk_id', userId).single()
    if (!user) return res.status(404).json({ error: 'User not found' })

    const [incoming, outgoing] = await Promise.all([
      db.from('trade_offers').select(`
        id, status, message, created_at,
        listings ( id, ask_credits, cards ( name, image_url, rarity, fmv, grade ) ),
        offered_vault:vault!offered_vault_id ( id, nft_token_id, cards ( name, image_url, rarity, fmv, grade ) ),
        from_user:users!from_user_id ( clerk_id )
      `).eq('listings.seller_id', user.id).eq('status', 'pending'),
      db.from('trade_offers').select(`
        id, status, message, created_at,
        listings ( id, cards ( name, image_url, rarity, fmv, grade ) ),
        offered_vault:vault!offered_vault_id ( id, nft_token_id, cards ( name, image_url, rarity, fmv, grade ) )
      `).eq('from_user_id', user.id).order('created_at', { ascending: false }).limit(20),
    ])

    return res.status(200).json({ incoming: incoming.data || [], outgoing: outgoing.data || [] })
  }

  // POST — send trade offer OR buy listing
  if (req.method === 'POST') {
    const { action, listingId, offeredVaultId, buyListingId, message } = req.body || {}

    // Buy
    if (action === 'buy' || buyListingId) {
      const id = buyListingId || listingId
      try {
        const result = await rpc('do_buy_listing', { p_buyer_clerk: userId, p_listing_id: id })
        return res.status(200).json({ success: true, ...result })
      } catch(err) {
        return res.status(err.status || 400).json({ error: err.message })
      }
    }

    // Trade offer
    if (!listingId || !offeredVaultId) return res.status(400).json({ error: 'listingId and offeredVaultId required' })

    // Verify offered card is ours
    const { data: user } = await db.from('users').select('id').eq('clerk_id', userId).single()
    if (!user) return res.status(404).json({ error: 'User not found' })
    const { data: vault } = await db.from('vault').select('id, burned').eq('id', offeredVaultId).eq('user_id', user.id).single()
    if (!vault || vault.burned) return res.status(400).json({ error: 'Invalid vault entry' })

    const { data: offer, error } = await db.from('trade_offers').insert({
      listing_id:       listingId,
      from_user_id:     user.id,
      offered_vault_id: offeredVaultId,
      message:          message || null,
    }).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ offer })
  }

  // PATCH — accept or decline offer
  if (req.method === 'PATCH') {
    const { offerId, action } = req.body || {}
    if (!offerId || !action) return res.status(400).json({ error: 'offerId and action required' })

    if (action === 'accept') {
      try {
        await rpc('do_accept_trade', { p_seller_clerk: userId, p_offer_id: offerId })
        return res.status(200).json({ success: true })
      } catch(err) {
        return res.status(400).json({ error: err.message })
      }
    }
    if (action === 'decline') {
      await db.from('trade_offers').update({ status: 'declined' }).eq('id', offerId)
      return res.status(200).json({ success: true })
    }
    return res.status(400).json({ error: 'action must be accept or decline' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
})
