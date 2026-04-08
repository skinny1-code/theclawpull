import { stripe } from '../../lib/stripe.js'
import { rpc } from '../../lib/db.js'
import { cacheDel, CACHE_KEYS } from '../../lib/redis.js'

export const config = { api: { bodyParser: false } }

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  let event
  try {
    const rawBody = await getRawBody(req)
    const sig = req.headers['stripe-signature']
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[stripe webhook] signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const { clerkUserId, creditAmount, packId } = session.metadata || {}
    const credits = parseInt(creditAmount || '0', 10)

    if (!clerkUserId || !credits) {
      console.error('[stripe webhook] missing metadata', session.id)
      return res.status(200).json({ received: true })
    }

    try {
      await rpc('credit_user', {
        p_clerk_id:    clerkUserId,
        p_session_id:  session.id,
        p_amount_cents: session.amount_total,
        p_credits:     credits,
        p_pack_id:     packId || '',
      })
      await cacheDel(CACHE_KEYS.USER(clerkUserId))
      console.log(`[stripe webhook] +${credits} credits → ${clerkUserId}`)
    } catch (err) {
      console.error('[stripe webhook] DB error:', err.message)
      return res.status(500).json({ error: 'Database error' })
    }
  }

  return res.status(200).json({ received: true })
}
