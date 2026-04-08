import { withAuth } from '../lib/auth.js'
import { db, rpc } from '../lib/db.js'

export default withAuth(async (req, res) => {
  const { userId } = req.auth

  // GET — browse all active listings
  if (req.method === 'GET') {
    const { data: listings, error } = await db
      .from('listings')
      .select(`
        id, ask_credits, trade_open, status, created_at,
        cards ( id, name, image_url, grade, rarity, sport, year, set_name, player, fmv, claw_tier ),
        vault ( id, nft_token_id ),
        seller:users!seller_id ( clerk_id )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) return res.status(500).json({ error: error.message })
    // Don't expose full clerk IDs
    const safe = (listings||[]).map(l => ({
      ...l,
      seller_id_short: l.seller?.clerk_id?.slice(-6),
      is_mine: l.seller?.clerk_id === userId,
      seller: undefined,
    }))
    return res.status(200).json({ listings: safe })
  }

  // POST — create listing
  if (req.method === 'POST') {
    const { vaultId, askCredits, tradeOpen = true } = req.body || {}
    if (!vaultId) return res.status(400).json({ error: 'vaultId required' })

    // Verify ownership
    const { data: user } = await db.from('users').select('id').eq('clerk_id', userId).single()
    if (!user) return res.status(404).json({ error: 'User not found' })

    const { data: vaultEntry } = await db.from('vault')
      .select('id, card_id, burned')
      .eq('id', vaultId)
      .eq('user_id', user.id)
      .single()
    if (!vaultEntry) return res.status(404).json({ error: 'Vault entry not found or not yours' })
    if (vaultEntry.burned) return res.status(400).json({ error: 'Cannot list a burned card' })

    // Check not already listed
    const { data: existing } = await db.from('listings')
      .select('id').eq('vault_id', vaultId).eq('status', 'active').single()
    if (existing) return res.status(400).json({ error: 'Card already listed' })

    const { data: listing, error } = await db.from('listings').insert({
      vault_id:   vaultId,
      seller_id:  user.id,
      card_id:    vaultEntry.card_id,
      ask_credits: askCredits || null,
      trade_open:  tradeOpen,
    }).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ listing })
  }

  // DELETE — cancel listing
  if (req.method === 'DELETE') {
    const { listingId } = req.body || {}
    if (!listingId) return res.status(400).json({ error: 'listingId required' })

    const { data: user } = await db.from('users').select('id').eq('clerk_id', userId).single()
    const { data: listing } = await db.from('listings').select('id, seller_id').eq('id', listingId).single()
    if (!listing || listing.seller_id !== user?.id) return res.status(403).json({ error: 'Not your listing' })

    await db.from('listings').update({ status: 'cancelled' }).eq('id', listingId)
    await db.from('trade_offers').update({ status: 'cancelled' }).eq('listing_id', listingId).eq('status', 'pending')
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
})
