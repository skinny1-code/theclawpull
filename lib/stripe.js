import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

// TheClawPull Stripe account (acct_1THMl1CBT2kzLxDg) — live mode
// 1 credit = 1 pull = $1
export const CREDIT_PACKS = {
  coreclaw:    { credits: 25,  price: 2500,  priceId: 'price_1TIM20CBT2kzLxDg4x2HYQLD', name: 'CoreClaw',    tier: 'Core',    desc: '25 pulls — entry level'       },
  premierclaw: { credits: 50,  price: 5000,  priceId: 'price_1TIM21CBT2kzLxDgHATDpDfS', name: 'PremierClaw', tier: 'Premier', desc: '50 pulls — most popular'      },
  ultraclaw:   { credits: 100, price: 10000, priceId: 'price_1TIM21CBT2kzLxDg6Xye5Zn6', name: 'UltraClaw',   tier: 'Ultra',   desc: '100 pulls — serious collector' },
  quantumclaw: { credits: 500, price: 50000, priceId: 'price_1TIM2ACBT2kzLxDgRkAKZ67X', name: 'QuantumClaw', tier: 'Quantum', desc: '500 pulls — ultimate vault'    },
  // First-pull discount: CoreClaw at $15 (vs normal $25) — only shown to new users
  coreclaw_first: { credits: 25, price: 1500, priceId: 'price_1TKTmXCBT2kzLxDgFf2JjcDz', name: 'CoreClaw', tier: 'Core', desc: 'Welcome offer — save $10' },
}
