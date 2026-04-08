import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useApi } from './useApi.js'

/**
 * useUser — fetches the current user from /api/user on mount,
 * auto-creates them if they don't exist, and exposes a refresh function.
 *
 * Returns: { user, loading, error, refresh }
 */
export function useUser() {
  const { isSignedIn, userId } = useAuth()
  const { apiFetch } = useApi()
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const refresh = useCallback(async () => {
    if (!isSignedIn) return
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch('/api/user')
      setUser(data)
    } catch (err) {
      if (err.status === 404) {
        // First sign-in — create the user record
        try {
          const created = await apiFetch('/api/user', { method: 'POST', body: {} })
          setUser(created)
        } catch (createErr) {
          setError(createErr.message)
        }
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }, [isSignedIn, apiFetch])

  useEffect(() => {
    refresh()
  }, [userId, isSignedIn])

  return { user, loading, error, refresh }
}
