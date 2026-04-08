import { withAuth } from '../lib/auth.js'
import { stripe, CREDIT_PACKS } from '../lib/stripe.js'
import { db } from '../lib/db.js'

export default withAuth(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { packId } = req.body || {}
  const pack = CREDIT_PACKS[packId]
  if (!pack) return res.status(400).json({ error: 'Invalid pack ID', valid: Object.keys(CREDIT_PACKS) })

  const { userId } = req.auth

  // Ensure user exists in DB
  const { data: user } = await db.from('users').select('id').eq('clerk_id', userId).single()
  if (!user) return res.status(404).json({ error: 'User not found — POST /api/user first' })

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price: pack.priceId,
      quantity: 1,
    }],
    metadata: {
      clerkUserId:  userId,
      dbUserId:     String(user.id),
      creditAmount: String(pack.credits),
      packId,
    },
    success_url: `${process.env.APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${process.env.APP_URL}/store`,
  })

  return res.status(200).json({ url: session.url, sessionId: session.id })
})
