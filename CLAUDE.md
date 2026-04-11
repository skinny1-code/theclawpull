# CardClawCo — AI Assistant Guide

CardClawCo is a graded card pull platform featuring an animated casino claw machine UI, Stripe-powered credit purchases, Supabase-backed vault ownership, and an admin dashboard. Built by RAWagon (v0.1.0).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite (SPA) |
| Backend | Vercel serverless functions (`/api`) |
| Auth | Clerk (`@clerk/clerk-react` + `@clerk/backend`) |
| Database | Supabase (PostgreSQL) |
| Payments | Stripe (Checkout Sessions + Webhooks) |
| Cache/Rate-limit | Upstash Redis (optional — degrades gracefully) |
| Routing | React Router v6 |

## Repository Structure

```
api/                    Vercel serverless functions (one file per route)
  webhook/stripe.js     Stripe webhook handler
lib/                    Shared server-side utilities
  auth.js               Clerk JWT verification; withAuth/withAdmin HOFs
  db.js                 Supabase client (service key) + rpc() helper
  redis.js              Upstash client, cacheGet/Set/Del, rate limiters
  stripe.js             Stripe client + CREDIT_PACKS config
  cors.js               CORS helpers (withCors, cors)
src/
  main.jsx              ClerkProvider + BrowserRouter + ErrorBoundary entry
  App.jsx               Route definitions
  pages/                Route-level React components
  components/           Reusable UI components
  hooks/                useApi, useUser, usePull
  lib/
    constants.js        RARITY_CFG, CREDIT_PACKS, CAT_COLOR, GS (global styles)
    casinoAudio.js      Audio utilities
scripts/
  migrate.js            Apply schema to Supabase (idempotent)
  seed.js               Seed 20 reference cards
  deploy.sh             One-command production deployment
  setup-vercel-env.sh   Sync .env to Vercel
public/                 PWA assets (manifest.json, favicon.svg)
```

## Development Commands

First-time setup (run in order):

```bash
npm install              # 1. Install dependencies
cp .env.example .env     # 2. Configure secrets (Clerk, Stripe, Supabase keys)
npm run db:migrate       # 3. Apply schema to Supabase (idempotent)
npm run db:seed          # 4. Seed 20 reference cards
npm run dev              # 5. Start dev server → http://localhost:5173
```

Vite automatically proxies `/api/*` to `http://localhost:3001` — no separate API server process needed.

Other commands:

```bash
npm run build            # Production build to dist/
npm run preview          # Preview production build locally
npm run lint             # ESLint on src/ (.js, .jsx)
```

## Common Tasks for AI Assistants

**Adding a new authenticated API route:**
1. Create `api/your-route.js`.
2. Wrap with `withAuth` (or `withAdmin` for admin routes) — CORS is included automatically.
3. Handle methods explicitly at the top.
4. Use `rpc()` for any writes that touch multiple tables.

**Adding a public API route (no auth):**
1. Create `api/your-route.js`.
2. Import and use `withCors` from `../lib/cors.js` instead of `withAuth`.

**Adding a new page:**
1. Create `src/pages/YourPage.jsx` as a functional component.
2. Add a `<Route path="/your-path" element={<YourPage />} />` in `App.jsx`.
3. Style with inline `style={{}}` objects; reference `RARITY_CFG`, `GS`, or color constants from `src/lib/constants.js`.

**Existing features to be aware of:** The codebase includes marketplace (`/api/marketplace`), wallet/Stripe Connect payouts (`/api/wallet`), trade offers (`/api/trade`), daily pulls and leaderboard (`/api/engage`), and user profiles (`/api/profile`). All use `withAuth` except the public feed/leaderboard endpoints in `engage.js`.

**Gotchas to avoid:**
- Never expose `SUPABASE_SERVICE_KEY`, `CLERK_SECRET_KEY`, or `STRIPE_SECRET_KEY` to the frontend.
- Never multi-step a pull/swap/credit — always use RPC for atomicity.
- Always `cacheDel()` relevant keys after a mutation.
- `withAuth` catches and formats all thrown errors — throw `Error` with a `.status` property rather than calling `res.status()` manually in error paths.
- `VITE_*` env vars are baked into the frontend bundle at build time; changing them requires a rebuild.
- No test framework is configured — verify changes manually in the browser at `http://localhost:5173`.

## Environment Variables

All secrets are in `.env` locally; Vercel manages production secrets.

| Variable | Scope | Notes |
|----------|-------|-------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Public (build-time) | Embedded in bundle by Vite |
| `CLERK_SECRET_KEY` | Server-only | Never expose to frontend |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Public (build-time) | Embedded in bundle by Vite |
| `STRIPE_SECRET_KEY` | Server-only | Never expose to frontend |
| `STRIPE_WEBHOOK_SECRET` | Server-only | `whsec_*` format |
| `SUPABASE_URL` | Both | Database endpoint |
| `SUPABASE_ANON_KEY` | Frontend | Public key (RLS protected) |
| `SUPABASE_SERVICE_KEY` | Server-only | Bypasses RLS — never expose |
| `APP_URL` | Both | `http://localhost:5173` (dev) or prod URL |

Upstash Redis (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) are server-only and optional — all cache/rate-limit operations silently no-op when absent.

## API Layer Architecture

All routes in `api/` are Vercel serverless functions:

- **Authenticated routes:** Wrap with `withAuth` or `withAdmin` from `lib/auth.js`. These HOFs verify the Clerk JWT, inject `req.auth = { userId, sessionId, claims }`, set CORS headers, and handle `OPTIONS` preflight automatically.
- **Public routes (no auth):** Use `withCors` from `lib/cors.js` instead. Example: `api/pool.js` serves the card pool without requiring a token.
- **Method routing:** Use `if (req.method !== 'POST') return res.status(405).json(...)` at the top.
- **Rate limiting:** 10 pulls/min per user (`checkPullRateLimit`); 100 API calls/min globally. Returns `429` with `{ error: 'Too many pulls — slow down' }` on limit hit.
- **Atomic DB ops:** Use `rpc('function_name', { params })` for transactional operations (pull, swap, credit). Never do multi-step mutations without an RPC wrapper.
- **Error pattern:** Throw `Error` with a `.status` property; `withAuth` catches and responds automatically.

```javascript
// Template — authenticated route
import { withAuth } from '../lib/auth.js'
import { db, rpc } from '../lib/db.js'

export default withAuth(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { userId } = req.auth
  // ... logic
  return res.status(200).json({ result })
})

// Template — public route
import { withCors } from '../lib/cors.js'

export default withCors(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  // ... logic
})
```

### API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET/POST | `/api/user` | User | Get/upsert user + credit balance |
| GET | `/api/pool` | Public | Active card pool (Redis-cached 60s) |
| POST | `/api/pull` | User | Pull a card (rate-limited 10/min) |
| GET/POST | `/api/vault` | User | Get vault; swap (65% FMV) or redeem |
| POST | `/api/create-checkout-session` | User | Create Stripe Checkout Session |
| POST | `/api/webhook/stripe` | Stripe sig | Credit user after payment |
| GET | `/api/engage?type=feed\|leaderboard` | Public | Live pull feed / leaderboard |
| GET | `/api/engage?type=daily` | User (inline) | Claim daily pull + streak bonus |
| GET/POST | `/api/marketplace` | User | Marketplace listings; buy a listing |
| GET/POST | `/api/wallet` | User | Wallet balance; Stripe Connect payouts |
| GET | `/api/profile` | User | User profile stats via RPC |
| GET/POST/PATCH | `/api/trade` | User | Outgoing/incoming trade offers |
| GET/POST/PUT/DELETE | `/api/admin?type=stats\|role\|cards` | Admin | Card CRUD, platform stats, role management |

## Frontend Architecture

- **All functional components** (except `ErrorBoundary` which is a class component).
- **No CSS files.** All styling via inline `style={{}}` objects. Global CSS is defined in `src/lib/constants.js` as the `GS` export string and injected in `App.jsx` via `<style>{GS}</style>`.
- **No TypeScript.** JavaScript throughout. Hooks use JSDoc comments.
- **State management:** React hooks + Clerk for auth state. No Redux or Zustand.

### Key Hooks

**`useApi`** (`src/hooks/useApi.js`) — authenticated fetch wrapper:
```javascript
const { apiFetch } = useApi()
// Auto-attaches Clerk Bearer token, serializes body as JSON, throws on non-2xx
const user = await apiFetch('/api/user')
const result = await apiFetch('/api/pull', { method: 'POST', body: { tier: 'CoreClaw' } })
// Errors have .status and .data properties
```

**`useUser`** (`src/hooks/useUser.js`) — current user + credits:
```javascript
const { user, loading, error, refresh } = useUser()
// Auto-creates user on 404 (first sign-in)
```

**`usePull`** (`src/hooks/usePull.js`) — card pull wrapper:
```javascript
const { pull, pulling } = usePull({ onSuccess: async (result) => {}, onError: (err) => {} })
await pull('CoreClaw')
```

## Authentication

**Frontend:** `ClerkProvider` wraps the entire app. Use `useAuth()` for token access.

**Backend:** `lib/auth.js` verifies JWT via `verifyToken()`. Authorized parties: `APP_URL`, `https://cardclawco.vercel.app`, `http://localhost:5173`.

**Admin role:** Stored in Clerk `publicMetadata.role` as `{ "role": "admin" }`. The session token must include metadata — configure in Clerk Dashboard → Sessions → Edit session token: `{ "metadata": "{{user.public_metadata}}" }`.

```javascript
// Backend admin check (withAdmin does this automatically)
const role = req.auth.claims?.metadata?.role // 'admin' | undefined
```

**Frontend admin gate:** `<AdminAuthGate>` component wraps the operator dashboard route.

## Database Patterns

Supabase SDK — no ORM:

```javascript
// Query
const { data, error } = await db.from('users')
  .select('id, credits, clerk_id')
  .eq('clerk_id', userId)
  .single()

// Insert
await db.from('users').insert({ clerk_id: userId, email })

// RPC (use for transactions / atomic ops)
const result = await rpc('do_pull', { p_clerk_id: userId, p_card_id: card.id })
```

Server always uses the service key (`SUPABASE_SERVICE_KEY`), which bypasses Row-Level Security. Never use the service key on the frontend.

### RPC Functions

| Function | Purpose |
|----------|---------|
| `do_pull(p_clerk_id, p_card_id)` | Deduct credits, create vault entry, record pull |
| `do_swap(p_clerk_id, p_vault_id)` | Swap card for 65% FMV in credits |
| `do_redeem(p_clerk_id, p_vault_id)` | Mark burned, prepare NFT fulfillment |
| `credit_user(p_clerk_id, p_session_id, ...)` | Add credits + log transaction (webhook) |
| `log_pull_feed(...)` | Append to live pull feed |
| `get_pull_feed()` | Fetch live pull feed (public) |
| `get_leaderboard()` | Fetch leaderboard (public) |
| `claim_daily_pull(p_clerk_id)` | Claim daily free pull + update streak |
| `apply_streak_bonus(p_clerk_id, p_bonus)` | Apply streak bonus credits |
| `get_user_profile(p_clerk_id)` | Full profile stats |
| `do_buy_listing(p_buyer_clerk_id, p_listing_id)` | Buy card from marketplace |
| `do_accept_trade(p_seller_clerk, p_offer_id)` | Accept incoming trade offer |
| `get_pool_stats()`, `get_revenue_stats()`, `get_pull_stats()`, `get_vault_stats()`, `get_top_cards()`, `get_rarity_breakdown()`, `get_recent_pulls()` | Admin dashboard analytics (called in parallel in `api/admin.js`) |

## Caching Pattern

```javascript
import { cacheGet, cacheSet, cacheDel, CACHE_KEYS } from '../lib/redis.js'

// Read-through cache
let data = await cacheGet(CACHE_KEYS.USER(userId)) // null if miss or Redis unavailable
if (!data) {
  data = await fetchFromDb()
  await cacheSet(CACHE_KEYS.USER(userId), data, 30) // TTL in seconds
}

// Invalidate after mutation
await cacheDel(CACHE_KEYS.POOL, CACHE_KEYS.USER(userId))
```

Cache keys: `pool:active_cards` (60s TTL), `` `user:${clerkId}` `` (30s), `` `vault:${userId}` `` (30s).

## Credit & Rarity System

**1 credit = 1 pull = $1.**

| Pack | ID | Credits | Price |
|------|----|---------|-------|
| CoreClaw | `coreclaw` | 25 | $25 |
| PremierClaw | `premierclaw` | 50 | $50 |
| UltraClaw | `ultraclaw` | 100 | $100 |
| QuantumClaw | `quantumclaw` | 500 | $500 |
| CoreClaw (first pull) | `coreclaw_first` | 25 | $15 |

**Rarity weights:**

| Rarity | Roll | Color |
|--------|------|-------|
| Legendary | < 5% | `#C9A84C` (gold) |
| Ultra Rare | < 20% | `#A78BFA` (purple) |
| Rare | < 50% | `#60A5FA` (blue) |
| Common | else | `#94A3B8` (slate) |

## Stripe Integration

1. **Checkout:** POST `/api/create-checkout-session` returns a Stripe session URL; client redirects to it. Auto-applies `coreclaw_first` discount on first CoreClaw purchase.
2. **Webhook:** POST `/api/webhook/stripe` verifies signature with `STRIPE_WEBHOOK_SECRET`, then calls `credit_user()` RPC on `checkout.session.completed`.
3. **Success page:** `src/pages/PaymentSuccess.jsx` confirms credits added.

**Local webhook testing:**
```bash
stripe login
stripe listen --forward-to localhost:3001/api/webhook/stripe
# Copy the signing secret printed to STRIPE_WEBHOOK_SECRET in .env
# Use test card: 4242 4242 4242 4242
```

## Deployment

**CI/CD:** `.github/workflows/deploy.yml` triggers on push to `main` (production) or PR (preview). Runs `npm ci && npm run build`, then deploys via Vercel CLI.

**Vercel config** (`vercel.json`):
- Rewrites all non-`/api` paths to `/index.html` (SPA fallback).
- Sets CORS headers on `/api/*` routes.

**Manual deploy:**
```bash
bash scripts/deploy.sh          # Full deploy to production
bash scripts/setup-vercel-env.sh  # Sync .env secrets to Vercel
```

## Code Conventions

- **ES modules** throughout — `"type": "module"` in `package.json`. Always include `.js` extension in relative imports (e.g., `import { db } from '../lib/db.js'`).
- **Naming:** PascalCase components, `useX` hooks, SCREAMING_SNAKE_CASE constants, kebab-case API route files.
- **No barrel files** — each file has a single default or named export.
- **No TypeScript** — plain JavaScript throughout.
- **Inline styles only** — no CSS modules, Tailwind, or styled-components.
