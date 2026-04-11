import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useApi } from '../hooks/useApi.js'
import { useUser } from '../hooks/useUser.js'

const TEST_MODE = import.meta.env.VITE_TEST_MODE === 'true'

const TIERS = [
  { id:'CoreClaw',    icon:'⚙️', color:'#60A5FA', path:'/coreclaw'    },
  { id:'PremierClaw', icon:'⭐', color:'#34D399', path:'/premierclaw' },
  { id:'UltraClaw',   icon:'💎', color:'#A78BFA', path:'/ultraclaw'   },
  { id:'QuantumClaw', icon:'⚡', color:'#C9A84C', path:'/quantumclaw' },
]

export function TestModeBanner() {
  if (!TEST_MODE) return null
  return (
    <div style={{
      background:'linear-gradient(90deg,#1a0a00,#2a1500,#1a0a00)',
      borderBottom:'2px solid #F59E0B',
      padding:'6px 16px',
      display:'flex', alignItems:'center', justifyContent:'center', gap:12,
      position:'sticky', top:0, zIndex:500,
    }}>
      <div style={{ width:8, height:8, borderRadius:'50%', background:'#F59E0B', boxShadow:'0 0 10px #F59E0B', animation:'pulse 1s ease-in-out infinite' }}/>
      <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, fontWeight:700, letterSpacing:3, color:'#FCD34D' }}>
        ⚠ TEST MODE — No real charges · Pulls are free for demo purposes
      </span>
      <div style={{ width:8, height:8, borderRadius:'50%', background:'#F59E0B', boxShadow:'0 0 10px #F59E0B', animation:'pulse 1s ease-in-out infinite' }}/>
      <style>{'@keyframes pulse{0%,100%{opacity:0.5}50%{opacity:1}}'}</style>
    </div>
  )
}

// Button shown instead of Buy when TEST_MODE is on
export function TestPullButton({ tier, onGranted, style }) {
  const { isSignedIn } = useAuth()
  const { apiFetch } = useApi()
  const { refresh } = useUser()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  if (!TEST_MODE) return null

  const tierCfg = TIERS.find(t => t.id === tier) || TIERS[0]

  const grant = async () => {
    if (!isSignedIn) return navigate('/sign-in')
    setLoading(true)
    try {
      await apiFetch('/api/user', { method:'POST', body:{ action:'test_grant', tier } })
      await refresh()
      if (onGranted) onGranted()
    } catch(err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={grant} disabled={loading} style={{
      width:'100%', padding:'14px',
      background:`linear-gradient(135deg,rgba(245,158,11,0.3),rgba(245,158,11,0.1))`,
      border:'2px solid rgba(245,158,11,0.7)',
      borderRadius:12, color:'#FCD34D',
      fontFamily:"'Oswald',sans-serif", fontSize:16, fontWeight:700, letterSpacing:2,
      cursor: loading ? 'not-allowed' : 'pointer',
      boxShadow:'0 0 20px rgba(245,158,11,0.3)',
      ...style,
    }}>
      {loading ? '⏳ GRANTING…' : `🎰 TEST PULL — FREE (${tier})`}
    </button>
  )
}

export { TEST_MODE }
