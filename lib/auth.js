import { verifyToken, createClerkClient } from '@clerk/backend'

export const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
})

export async function authenticate(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization
  const token = authHeader?.replace('Bearer ', '')?.trim()
  if (!token) { const e = new Error('No token provided'); e.status = 401; throw e }

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
      authorizedParties: [
        process.env.APP_URL,
        'https://cardclawco.vercel.app',
        'http://localhost:5173',
      ].filter(Boolean),
    })
    return { userId: payload.sub, sessionId: payload.sid, claims: payload }
  } catch {
    const e = new Error('Invalid or expired token'); e.status = 401; throw e
  }
}

export function withAuth(handler) {
  return async (req, res) => {
    if (req.method === 'OPTIONS') return res.status(200).end()
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    try {
      req.auth = await authenticate(req)
      return await handler(req, res)
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message })
    }
  }
}

export function withAdmin(handler) {
  return withAuth(async (req, res) => {
    const role = req.auth.claims?.metadata?.role
    if (role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
    return handler(req, res)
  })
}
