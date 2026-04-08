import { useState, useCallback } from 'react'
import { useApi } from './useApi.js'

/**
 * usePull — wraps the /api/pull POST endpoint.
 * Replaces the local weightedPull() simulation from App.jsx.
 *
 * Returns: { pull, lastCard, pulling, error }
 */
export function usePull({ onSuccess } = {}) {
  const { apiFetch }  = useApi()
  const [pulling, setPulling]   = useState(false)
  const [lastCard, setLastCard] = useState(null)
  const [error, setError]       = useState(null)

  const pull = useCallback(async () => {
    if (pulling) return
    setPulling(true)
    setError(null)
    try {
      const result = await apiFetch('/api/pull', { method: 'POST' })
      // result: { card, vault, pull, creditsRemaining }
      setLastCard(result.vault) // vault entry has nft_token_id
      if (onSuccess) onSuccess(result)
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setPulling(false)
    }
  }, [pulling, apiFetch, onSuccess])

  return { pull, lastCard, pulling, error }
}
