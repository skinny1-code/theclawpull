import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
// Use service key (bypasses RLS) — NEVER expose to browser
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
}

export const db = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

export async function rpc(fn, params = {}) {
  const { data, error } = await db.rpc(fn, params)
  if (error) throw new Error(error.message)
  if (data?.error) throw Object.assign(new Error(data.error), { status: 400 })
  return data
}
