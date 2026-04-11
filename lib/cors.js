export function cors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') { res.status(200).end(); return true }
  return false
}

export function withCors(fn) {
  return async (req, res) => {
    if (cors(req, res)) return
    return fn(req, res)
  }
}
