import { withAuth } from '../lib/auth.js'
import { db, rpc } from '../lib/db.js'
import { stripe } from '../lib/stripe.js'

export default withAuth(async (req, res) => {
  const { userId } = req.auth

  // ── GET — wallet balance + connect status ─────────────────────
  if (req.method === 'GET') {
    const { data: user } = await db
      .from('users')
      .select('wallet_cents,stripe_connect_id,connect_onboarded,coreclaw_pulls,premierclaw_pulls,ultraclaw_pulls,quantumclaw_pulls')
      .eq('clerk_id', userId).single()
    if (!user) return res.status(404).json({ error: 'User not found' })
    return res.status(200).json({
      wallet_cents:    user.wallet_cents,
      wallet_dollars:  (user.wallet_cents / 100).toFixed(2),
      connect_id:      user.stripe_connect_id,
      onboarded:       user.connect_onboarded,
      pulls: {
        coreclaw:    user.coreclaw_pulls,
        premierclaw: user.premierclaw_pulls,
        ultraclaw:   user.ultraclaw_pulls,
        quantumclaw: user.quantumclaw_pulls,
      }
    })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { action } = req.body || {}

  // ── action: use_for_pulls — spend wallet balance on pulls ─────
  if (action === 'use_for_pulls') {
    const { tier } = req.body
    const TIER_COST_CENTS = { CoreClaw:2500, PremierClaw:5000, UltraClaw:10000, QuantumClaw:50000 }
    const PULL_COL        = { CoreClaw:'coreclaw_pulls', PremierClaw:'premierclaw_pulls', UltraClaw:'ultraclaw_pulls', QuantumClaw:'quantumclaw_pulls' }

    const cost = TIER_COST_CENTS[tier]
    if (!cost) return res.status(400).json({ error: 'Invalid tier', valid: Object.keys(TIER_COST_CENTS) })

    const { data: user } = await db.from('users')
      .select('id,wallet_cents,' + PULL_COL[tier])
      .eq('clerk_id', userId).single()
    if (!user) return res.status(404).json({ error: 'User not found' })

    if (user.wallet_cents < cost) {
      return res.status(400).json({
        error: `Need $${(cost/100).toFixed(2)} in wallet for a ${tier} pull`,
        have:  `$${(user.wallet_cents/100).toFixed(2)}`,
        need:  `$${(cost/100).toFixed(2)}`,
      })
    }

    const updates = {
      wallet_cents: user.wallet_cents - cost,
      updated_at: new Date().toISOString(),
    }
    updates[PULL_COL[tier]] = (user[PULL_COL[tier]] || 0) + 1

    await db.from('users').update(updates).eq('clerk_id', userId)
    return res.status(200).json({
      success: true,
      tier,
      pull_added: 1,
      wallet_cents_remaining: user.wallet_cents - cost,
      wallet_dollars_remaining: ((user.wallet_cents - cost) / 100).toFixed(2),
    })
  }

  // ── action: onboard — create Stripe Connect Express account ──
  if (action === 'onboard') {
    const { data: user } = await db.from('users')
      .select('id,stripe_connect_id').eq('clerk_id', userId).single()
    if (!user) return res.status(404).json({ error: 'User not found' })

    let connectId = user.stripe_connect_id
    if (!connectId) {
      const acct = await stripe.accounts.create({
        type: 'express', country: 'US',
        capabilities: { transfers: { requested: true } },
        metadata: { clerk_id: userId },
      })
      connectId = acct.id
      await db.from('users').update({ stripe_connect_id: connectId }).eq('clerk_id', userId)
    }

    const link = await stripe.accountLinks.create({
      account:     connectId,
      refresh_url: `${process.env.APP_URL}/wallet?onboard=refresh`,
      return_url:  `${process.env.APP_URL}/wallet?onboard=success`,
      type:        'account_onboarding',
    })
    return res.status(200).json({ url: link.url })
  }

  // ── action: cashout — transfer wallet balance to debit card ──
  if (action === 'cashout') {
    const { amount_cents } = req.body
    if (!amount_cents || amount_cents < 1000) {
      return res.status(400).json({ error: 'Minimum cashout is $10' })
    }

    const { data: user } = await db.from('users')
      .select('id,wallet_cents,stripe_connect_id,connect_onboarded')
      .eq('clerk_id', userId).single()
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (!user.stripe_connect_id || !user.connect_onboarded) {
      return res.status(400).json({ error: 'Set up your payout account first' })
    }
    if (user.wallet_cents < amount_cents) {
      return res.status(400).json({
        error: 'Insufficient wallet balance',
        have: user.wallet_cents, need: amount_cents
      })
    }

    // Deduct first (optimistic lock on wallet_cents)
    const { error: deductErr } = await db.from('users')
      .update({ wallet_cents: user.wallet_cents - amount_cents, updated_at: new Date().toISOString() })
      .eq('clerk_id', userId).eq('wallet_cents', user.wallet_cents)
    if (deductErr) return res.status(500).json({ error: 'Balance changed — try again' })

    // Log payout
    const { data: payout } = await db.from('payouts').insert({
      user_id: user.id, amount_cents, status: 'processing',
    }).select().single()

    try {
      const transfer = await stripe.transfers.create({
        amount: amount_cents, currency: 'usd',
        destination: user.stripe_connect_id,
        description: 'TheClawPull wallet cashout',
        metadata: { payout_id: String(payout.id), clerk_id: userId },
      })
      await db.from('payouts').update({ status: 'paid', stripe_payout_id: transfer.id }).eq('id', payout.id)
      return res.status(200).json({
        success: true,
        amount_dollars: (amount_cents / 100).toFixed(2),
        message: `$${(amount_cents/100).toFixed(2)} is on its way — arrives in 1–2 business days`,
      })
    } catch (err) {
      // Refund wallet on failure
      await db.from('users').update({ wallet_cents: user.wallet_cents }).eq('clerk_id', userId)
      await db.from('payouts').update({ status: 'failed' }).eq('id', payout.id)
      return res.status(500).json({ error: `Payout failed: ${err.message}` })
    }
  }

  return res.status(400).json({ error: 'Unknown action' })
})
