import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.SUPABASE_URL
const serviceKey   = process.env.SUPABASE_SERVICE_KEY
const anonKey      = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !serviceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
}

// Server-side only — service key bypasses RLS safely
// Never exposed to client; Clerk auth is verified in API middleware before any DB call
export const db = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// Public read client — uses anon key, limited to RLS-allowed reads (cards, pull_feed)
export const dbPublic = createClient(supabaseUrl, anonKey || serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

export async function rpc(fn, params = {}) {
  const { data, error } = await db.rpc(fn, params)
  if (error) throw new Error(error.message)
  if (data?.error) throw Object.assign(new Error(data.error), { status: 400 })
  return data
}
