import { withAuth } from '../lib/auth.js'
import { rpc } from '../lib/db.js'

export default withAuth(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const data = await rpc('get_user_profile', { p_clerk_id: req.auth.userId })
    return res.status(200).json(data)
  } catch(err) {
    return res.status(500).json({ error: err.message })
  }
})
