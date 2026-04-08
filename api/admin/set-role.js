import { withAdmin, clerk } from '../../lib/auth.js'

export default withAdmin(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { targetUserId, role } = req.body || {}
  if (!targetUserId) return res.status(400).json({ error: 'targetUserId is required' })
  if (!['admin','user'].includes(role)) return res.status(400).json({ error: 'role must be admin or user' })

  await clerk.users.updateUserMetadata(targetUserId, { publicMetadata: { role } })
  return res.status(200).json({ success: true, targetUserId, role })
})
