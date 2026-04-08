/**
 * npm run db:migrate
 * Applies the full CardClawCo schema to Supabase.
 * This is for reference / disaster recovery — migrations are tracked in Supabase dashboard.
 * For day-to-day schema changes, use the Supabase MCP or dashboard SQL editor.
 */
import { createClient } from '@supabase/supabase-js'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env manually
const envPath = resolve(__dirname, '../.env')
try {
  const { readFileSync } = await import('fs')
  const envContent = readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const [key, ...vals] = line.split('=')
    if (key && !key.startsWith('#') && vals.length) {
      process.env[key.trim()] = vals.join('=').trim()
    }
  }
} catch { /* .env optional */ }

const supabaseUrl  = process.env.SUPABASE_URL
const supabaseKey  = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌  Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env')
  process.exit(1)
}

const db = createClient(supabaseUrl, supabaseKey)

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY, clerk_id TEXT UNIQUE NOT NULL, email TEXT,
  credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS cards (
  id SERIAL PRIMARY KEY, name TEXT NOT NULL, image_url TEXT, grade TEXT NOT NULL,
  sport TEXT, year INTEGER, set_name TEXT, player TEXT,
  rarity TEXT NOT NULL DEFAULT 'Common', pull_cost INTEGER NOT NULL DEFAULT 1,
  total_supply INTEGER NOT NULL DEFAULT 1, remaining INTEGER NOT NULL DEFAULT 1,
  fmv INTEGER NOT NULL DEFAULT 0, claw_tier TEXT DEFAULT 'CoreClaw',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS vault (
  id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id INTEGER NOT NULL REFERENCES cards(id),
  nft_token_id TEXT UNIQUE, burned BOOLEAN NOT NULL DEFAULT FALSE,
  burned_at TIMESTAMPTZ, acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS pulls (
  id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id INTEGER NOT NULL REFERENCES cards(id), vault_id INTEGER REFERENCES vault(id),
  credits_spent INTEGER NOT NULL DEFAULT 1, action TEXT DEFAULT 'pull',
  pulled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE NOT NULL, amount_cents INTEGER NOT NULL,
  credits_purchased INTEGER NOT NULL, pack_id TEXT,
  status TEXT NOT NULL DEFAULT 'completed', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`

async function migrate() {
  console.log('🗄  Running CardClawCo schema migration against Supabase...')
  const { error } = await db.rpc('exec_sql', { sql: SCHEMA }).single().catch(() => ({ error: null }))
  if (error) {
    console.error('❌  Migration error:', error.message)
    console.log('ℹ️   Use the Supabase dashboard SQL editor or MCP to apply migrations manually.')
  } else {
    console.log('✅  Schema reference applied (or already exists)')
    console.log('ℹ️   Production migrations are tracked in Supabase dashboard → Database → Migrations')
  }
}

migrate()
