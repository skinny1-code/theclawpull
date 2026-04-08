import { withAuth } from '../lib/auth.js'
import { rpc } from '../lib/db.js'

export default withAuth(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const feed = await rpc('get_pull_feed', {})
    return res.status(200).json({ feed: feed || [] })
  } catch {
    return res.status(200).json({ feed: [] })
  }
})
