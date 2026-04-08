import { useAuth } from '@clerk/clerk-react'
import { useCallback } from 'react'

/**
 * useApi — returns an authenticated fetch function that auto-attaches
 * the Clerk Bearer token to every request.
 *
 * Usage:
 *   const { apiFetch } = useApi()
 *   const user = await apiFetch('/api/user')
 *   const result = await apiFetch('/api/pull', { method: 'POST' })
 */
export function useApi() {
  const { getToken } = useAuth()

  const apiFetch = useCallback(async (path, options = {}) => {
    const token = await getToken()

    const response = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    const data = await response.json()

    if (!response.ok) {
      const err = new Error(data?.error || `API error ${response.status}`)
      err.status = response.status
      err.data = data
      throw err
    }

    return data
  }, [getToken])

  return { apiFetch }
}
