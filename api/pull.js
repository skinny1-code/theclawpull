import { withAuth } from '../lib/auth.js'
import { db, rpc } from '../lib/db.js'
import { checkPullRateLimit, cacheDel, cacheGet, cacheSet, CACHE_KEYS } from '../lib/redis.js'

function weightedPick(cards) {
  const roll = Math.random() * 100
  const legendary  = cards.filter(c => c.rarity === 'Legendary')
  const ultraRare  = cards.filter(c => c.rarity === 'Ultra Rare')
  const rare       = cards.filter(c => c.rarity === 'Rare')
  let pool = cards
  if (roll < 5  && legendary.length)  pool = legendary
  else if (roll < 20 && ultraRare.length) pool = ultraRare
  else if (roll < 50 && rare.length)  pool = rare
  return pool[Math.floor(Math.random() * pool.length)]
}

export default withAuth(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { userId } = req.auth

  // Rate limit
  const { success, remaining, reset } = await checkPullRateLimit(userId)
  if (!success) return res.status(429).json({ error: 'Too many pulls — max 10/min', remaining, resetAt: new Date(reset).toISOString() })

  // Get user
  const { data: user } = await db.from('users').select('id, credits, is_first_pull_done').eq('clerk_id', userId).single()
  if (!user) return res.status(404).json({ error: 'User not found' })

  // First pull discount: check if eligible (first pull is 1 credit regardless)
  const isFirstPull = !user.is_first_pull_done
  if (user.credits < 1) return res.status(400).json({ error: 'Insufficient credits' })

  // Get pool
  let cards = await cacheGet(CACHE_KEYS.POOL)
  if (!cards || !Array.isArray(cards) || !cards.length) {
    const { data } = await db.from('cards').select('*').eq('is_active', true).gt('remaining', 0)
    cards = data || []
  }
  if (!cards.length) return res.status(400).json({ error: 'No cards available in pool' })

  const card = weightedPick(cards)

  // Atomic pull
  let result
  try {
    result = await rpc('do_pull', { p_clerk_id: userId, p_card_id: card.id })
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message })
  }

  // Update first pull flag + total FMV
  await db.from('users').update({
    is_first_pull_done: true,
    total_fmv_pulled: db.raw ? undefined : undefined, // handled below
    updated_at: new Date().toISOString()
  }).eq('clerk_id', userId)

  // Increment total FMV (separate update)
  await db.rpc('exec_sql', {
    sql: `UPDATE users SET total_fmv_pulled = total_fmv_pulled + ${card.fmv}, is_first_pull_done = TRUE WHERE clerk_id = '${userId}'`
  }).catch(() => {})

  // Log to pull feed
  await rpc('log_pull_feed', {
    p_card_name: card.name,
    p_rarity:    card.rarity,
    p_fmv:       card.fmv,
    p_emoji:     card.image_url || '🃏',
    p_tier:      card.claw_tier || 'CoreClaw',
    p_nft:       result.nft_token_id,
  }).catch(() => {})

  // Bust caches
  await cacheDel(CACHE_KEYS.POOL, CACHE_KEYS.USER(userId))

  return res.status(200).json({
    card,
    vault: { id: result.vault_id, card_id: card.id, nft_token_id: result.nft_token_id, burned: false, card },
    creditsRemaining: result.credits_remaining,
    isFirstPull,
  })
})
