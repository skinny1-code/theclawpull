# CardClawCo™

> Graded Card Pull Platform — animated casino claw machine, Stripe credit purchases, Clerk auth, NFT-backed ownership, Neon Postgres, Upstash Redis.

A RAWagon™ product.

---

## Stack

| Layer       | Tech                                          |
|-------------|-----------------------------------------------|
| Frontend    | React 18 + Vite                               |
| Auth        | Clerk (`@clerk/clerk-react` + `@clerk/backend`)|
| Payments    | Stripe Checkout Sessions + Webhooks           |
| Database    | Neon Postgres (`@neondatabase/serverless`)    |
| Cache / RL  | Upstash Redis (`@upstash/redis` + ratelimit)  |
| Hosting     | Vercel (frontend SPA + serverless `api/`)     |

---

## Project Structure

```
cardclawco/
├── api/                              # Vercel serverless functions
│   ├── user.js                       # GET/POST current user
│   ├── pool.js                       # GET active card pool
│   ├── pull.js                       # POST pull a card (rate-limited, atomic)
│   ├── vault.js                      # GET vault, POST swap/redeem
│   ├── create-checkout-session.js    # POST Stripe checkout
│   ├── admin/
│   │   ├── cards.js                  # CRUD card pool (admin only)
│   │   ├── stats.js                  # Platform analytics (admin only)
│   │   └── set-role.js               # Set Clerk user role (admin only)
│   └── webhook/
│       └── stripe.js                 # Stripe payment webhook
├── lib/                              # Shared server utilities
│   ├── auth.js                       # Clerk JWT verify + withAuth/withAdmin
│   ├── cors.js                       # CORS helper
│   ├── db.js                         # Neon SQL client
│   ├── redis.js                      # Upstash Redis + rate limiters
│   └── stripe.js                     # Stripe client + credit packs
├── src/                              # Vite React frontend
│   ├── main.jsx                      # ClerkProvider entry
│   ├── App.jsx                       # Full UI (claw machine + operator dash)
│   ├── hooks/
│   │   ├── useApi.js                 # Authenticated fetch hook
│   │   ├── useUser.js                # Current user + credits
│   │   └── usePull.js                # Pull card via API
│   └── pages/
│       └── PaymentSuccess.jsx        # Post-Stripe redirect
├── scripts/
│   ├── migrate.js                    # npm run db:migrate
│   └── seed.js                       # npm run db:seed
├── .env.example                      # Required environment variables
├── vercel.json                       # SPA rewrites + CORS headers
├── vite.config.js
└── package.json
```

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/skinny1-code/cardclawco.git
cd cardclawco
npm install

# 2. Set up environment variables
cp .env.example .env
# Fill in all values in .env (Clerk, Stripe, Neon, Upstash)

# 3. Run database migration
npm run db:migrate

# 4. Seed initial card pool
npm run db:seed

# 5. Start dev server
npm run dev
```

---

## API Routes

| Method | Route                           | Auth     | Description                          |
|--------|---------------------------------|----------|--------------------------------------|
| GET    | `/api/user`                     | User     | Get current user + credit balance    |
| POST   | `/api/user`                     | User     | Create/upsert user on first sign-in  |
| GET    | `/api/pool`                     | User     | Get active card pool (cached 60s)    |
| POST   | `/api/pull`                     | User     | Pull a card (10/min rate limit)      |
| GET    | `/api/vault`                    | User     | Get user's vault                     |
| POST   | `/api/vault`                    | User     | Swap (65% FMV) or redeem (burn NFT)  |
| POST   | `/api/create-checkout-session`  | User     | Create Stripe Checkout Session       |
| POST   | `/api/webhook/stripe`           | Stripe   | Credit user on payment completion    |
| GET    | `/api/admin/stats`              | Admin    | Platform analytics                   |
| GET    | `/api/admin/cards`              | Admin    | Full card pool with inactive         |
| POST   | `/api/admin/cards`              | Admin    | Add card to pool                     |
| PUT    | `/api/admin/cards`              | Admin    | Update card                          |
| DELETE | `/api/admin/cards`              | Admin    | Deactivate card (soft delete)        |
| POST   | `/api/admin/set-role`           | Admin    | Set Clerk user role                  |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable                    | Where to get it                                    |
|-----------------------------|----------------------------------------------------|
| `VITE_CLERK_PUBLISHABLE_KEY`| Clerk Dashboard → API Keys                        |
| `CLERK_SECRET_KEY`          | Clerk Dashboard → API Keys                        |
| `VITE_STRIPE_PUBLISHABLE_KEY`| Stripe Dashboard → API Keys                      |
| `STRIPE_SECRET_KEY`         | Stripe Dashboard → API Keys                       |
| `STRIPE_WEBHOOK_SECRET`     | Stripe Dashboard → Webhooks                       |
| `DATABASE_URL`              | Neon Console → Connection Details (pooled string) |
| `UPSTASH_REDIS_REST_URL`    | Upstash Console → Redis → REST API                |
| `UPSTASH_REDIS_REST_TOKEN`  | Upstash Console → Redis → REST API                |
| `APP_URL`                   | `http://localhost:5173` locally                   |

---

## Clerk Setup

1. Create app at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Set `VITE_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
3. **Customize session token** — Clerk Dashboard → Sessions → Edit:
   ```json
   { "metadata": "{{user.public_metadata}}" }
   ```
4. **Set admin role** on your user — Users → select user → Public Metadata:
   ```json
   { "role": "admin" }
   ```

---

## Stripe Webhook (Local Dev)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhook events to local dev server
stripe listen --forward-to localhost:3001/api/webhook/stripe
# Copy the webhook signing secret → STRIPE_WEBHOOK_SECRET in .env
```

---

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (first time — links project)
vercel --team rawagon-projects

# Set env vars in Vercel dashboard or via CLI:
vercel env add CLERK_SECRET_KEY
vercel env add STRIPE_SECRET_KEY
# ... repeat for all vars

# Production deploy
vercel --prod
```

Add Stripe webhook endpoint in Stripe Dashboard:
`https://cardclawco.vercel.app/api/webhook/stripe`

---

## Roadmap

- [ ] On-chain NFT mint/burn (Solana)
- [ ] Real-time pull feed (Pusher / Ably)
- [ ] Physical vault QR management
- [ ] Seller portal for card submissions
- [ ] React Native mobile app
- [ ] PSA/BGS live FMV pricing API
- [ ] Multi-currency support

---

**CardClawCo™** · RAWagon™ © 2026 · All rights reserved
