import { withAuth } from '../lib/auth.js'
import { stripe, CREDIT_PACKS } from '../lib/stripe.js'
import { db } from '../lib/db.js'

export default withAuth(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { packId } = req.body || {}
  const { userId } = req.auth

  // Check if user is eligible for first-pull discount
  const { data: user } = await db.from('users').select('id, is_first_pull_done').eq('clerk_id', userId).single()
  if (!user) return res.status(404).json({ error: 'User not found — POST /api/user first' })

  // Auto-apply first pull discount if eligible and buying CoreClaw
  let resolvedPackId = packId
  if (packId === 'coreclaw' && !user.is_first_pull_done) {
    resolvedPackId = 'coreclaw_first'
  }

  const pack = CREDIT_PACKS[resolvedPackId]
  if (!pack) return res.status(400).json({ error: 'Invalid pack ID', valid: Object.keys(CREDIT_PACKS).filter(k => !k.includes('_first')) })

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{ price: pack.priceId, quantity: 1 }],
    metadata: {
      clerkUserId:  userId,
      dbUserId:     String(user.id),
      creditAmount: String(pack.credits),
      packId:       resolvedPackId,
    },
    success_url: `${process.env.APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&pack_id=${resolvedPackId}`,
    cancel_url:  `${process.env.APP_URL}/store`,
  })

  return res.status(200).json({
    url:       session.url,
    sessionId: session.id,
    discountApplied: resolvedPackId !== packId,
    originalPrice: packId !== resolvedPackId ? CREDIT_PACKS[packId]?.price : null,
    finalPrice: pack.price,
  })
})
