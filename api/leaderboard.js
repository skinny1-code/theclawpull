import { withAuth } from '../lib/auth.js'
import { rpc } from '../lib/db.js'

export default withAuth(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const rows = await rpc('get_leaderboard', {})
    return res.status(200).json({ leaderboard: rows || [] })
  } catch {
    return res.status(200).json({ leaderboard: [] })
  }
})
