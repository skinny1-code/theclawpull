import { withAuth } from '../lib/auth.js'
import { db, rpc } from '../lib/db.js'

export default withAuth(async (req, res) => {
  const { userId } = req.auth

  // ── GET — browse listings ─────────────────────────────────────
  if (req.method === 'GET') {
    const { data: listings, error } = await db
      .from('listings')
      .select(`
        id, price_cents, ask_credits, trade_open, status, created_at,
        cards ( id, name, image_url, grade, rarity, sport, year, set_name, player, fmv, claw_tier, total_pulls ),
        vault ( id, nft_token_id ),
        seller:users!seller_id ( clerk_id )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) return res.status(500).json({ error: error.message })

    const safe = (listings || []).map(l => ({
      ...l,
      price_cents: l.price_cents || (l.ask_credits ? l.ask_credits * 100 : null),
      is_mine: l.seller?.clerk_id === userId,
      seller: undefined,
    }))
    return res.status(200).json({ listings: safe })
  }

  const { data: user } = await db.from('users').select('id,wallet_cents').eq('clerk_id', userId).single()
  if (!user) return res.status(404).json({ error: 'User not found' })

  // ── POST action=list — list a card for sale ───────────────────
  if (req.method === 'POST') {
    const { action, vaultId, priceDollars, tradeOpen = true, listingId, offeredVaultId } = req.body || {}

    if (action === 'list' || !action) {
      if (!vaultId || !priceDollars) return res.status(400).json({ error: 'vaultId and priceDollars required' })
      const price_cents = Math.round(parseFloat(priceDollars) * 100)
      if (price_cents < 100) return res.status(400).json({ error: 'Minimum listing price is $1' })

      const { data: v } = await db.from('vault').select('id,card_id,burned').eq('id', vaultId).eq('user_id', user.id).single()
      if (!v) return res.status(404).json({ error: 'Vault entry not found or not yours' })
      if (v.burned) return res.status(400).json({ error: 'Cannot list a burned card' })

      const { data: existing } = await db.from('listings').select('id').eq('vault_id', vaultId).eq('status', 'active').single()
      if (existing) return res.status(400).json({ error: 'Card already listed' })

      const { data: listing, error: le } = await db.from('listings').insert({
        vault_id: vaultId, seller_id: user.id, card_id: v.card_id,
        price_cents, ask_credits: Math.round(price_cents / 100),
        trade_open: tradeOpen,
      }).select().single()
      if (le) return res.status(500).json({ error: le.message })
      return res.status(201).json({ listing })
    }

    // ── action=buy — purchase with wallet balance ────────────────
    if (action === 'buy') {
      if (!listingId) return res.status(400).json({ error: 'listingId required' })
      try {
        const result = await rpc('buy_listing', { p_buyer_clerk_id: userId, p_listing_id: listingId })
        return res.status(200).json(result)
      } catch (err) { return res.status(err.status || 400).json({ error: err.message }) }
    }

    // ── action=cancel — cancel your listing ──────────────────────
    if (action === 'cancel') {
      if (!listingId) return res.status(400).json({ error: 'listingId required' })
      const { data: l } = await db.from('listings').select('id,seller_id').eq('id', listingId).single()
      if (!l || l.seller_id !== user.id) return res.status(403).json({ error: 'Not your listing' })
      await db.from('listings').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', listingId)
      return res.status(200).json({ success: true })
    }

    // ── action=offer — send trade offer ──────────────────────────
    if (action === 'offer') {
      if (!listingId || !offeredVaultId) return res.status(400).json({ error: 'listingId and offeredVaultId required' })
      const { data: ov } = await db.from('vault').select('id,burned').eq('id', offeredVaultId).eq('user_id', user.id).single()
      if (!ov) return res.status(404).json({ error: 'Offered card not found or not yours' })
      if (ov.burned) return res.status(400).json({ error: 'Cannot offer a burned card' })
      const { data: offer, error: oe } = await db.from('trade_offers').insert({
        listing_id: listingId, offerer_id: user.id, vault_id: offeredVaultId,
      }).select().single()
      if (oe) return res.status(500).json({ error: oe.message })
      return res.status(201).json({ offer })
    }
  }

  // ── DELETE — cancel listing (REST style) ─────────────────────
  if (req.method === 'DELETE') {
    const { listingId } = req.body || {}
    if (!listingId) return res.status(400).json({ error: 'listingId required' })
    const { data: l } = await db.from('listings').select('id,seller_id').eq('id', listingId).single()
    if (!l || l.seller_id !== user.id) return res.status(403).json({ error: 'Not your listing' })
    await db.from('listings').update({ status: 'cancelled' }).eq('id', listingId)
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
})
