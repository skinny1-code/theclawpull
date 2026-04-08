import { useState, useEffect } from 'react'
import { Spinner } from './UI.jsx'

export default function DailyPull({ apiFetch, onClaimed }) {
  const [status, setStatus] = useState(null)
  const [claiming, setClaiming] = useState(false)
  const [result, setResult] = useState(null)

  const load = async () => {
    try {
      const data = await apiFetch('/api/daily')
      setStatus(data)
    } catch {}
  }

  useEffect(() => { load() }, [])

  const claim = async () => {
    setClaiming(true)
    try {
      const data = await apiFetch('/api/daily', { method: 'POST' })
      setResult(data)
      setStatus(s => ({ ...s, available: false, streak: data.streak }))
      if (onClaimed) onClaimed(data)
      setTimeout(() => setResult(null), 4000)
    } catch (err) {
      setResult({ error: err.message })
      setTimeout(() => setResult(null), 3000)
    } finally {
      setClaiming(false)
    }
  }

  if (!status) return null

  return (
    <div style={{
      background: status.available
        ? 'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.04))'
        : 'rgba(255,255,255,0.02)',
      border: `1px solid ${status.available ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius:12, padding:'14px 16px',
      animation: status.available ? 'goldGlow 2.5s ease-in-out infinite' : 'none',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <span style={{ fontSize:18 }}>🎁</span>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, fontWeight:600, color: status.available ? '#C9A84C' : 'rgba(240,237,230,0.5)' }}>
              Daily Free Pull
            </span>
          </div>
          <div style={{ fontFamily:"'Lato',sans-serif", fontSize:11, color:'rgba(240,237,230,0.35)' }}>
            {status.available
              ? '1 free credit waiting for you'
              : `Next pull in ${status.hoursUntil}h · ${status.streak} day streak 🔥`}
          </div>
          {status.streak > 0 && (
            <div style={{ display:'flex', gap:4, marginTop:6 }}>
              {Array.from({length:7}).map((_,i) => (
                <div key={i} style={{ width:8, height:8, borderRadius:2, background: i < (status.streak % 7 || (status.streak % 7 === 0 && status.streak > 0 ? 7 : 0)) ? '#C9A84C' : 'rgba(255,255,255,0.08)', boxShadow: i < (status.streak % 7) ? '0 0 4px #C9A84C' : 'none' }}/>
              ))}
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:'rgba(240,237,230,0.25)', marginLeft:4 }}>{status.nextMilestone}d to bonus</span>
            </div>
          )}
        </div>

        <button
          onClick={claim}
          disabled={!status.available || claiming}
          style={{
            padding:'9px 18px', flexShrink:0,
            background: status.available ? 'linear-gradient(135deg,rgba(201,168,76,0.25),rgba(201,168,76,0.1))' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${status.available ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius:8, cursor: status.available && !claiming ? 'pointer' : 'not-allowed',
            fontFamily:"'Lato',sans-serif", fontSize:11, fontWeight:700, letterSpacing:1,
            color: status.available ? '#C9A84C' : 'rgba(240,237,230,0.2)',
            display:'flex', alignItems:'center', gap:8,
          }}
        >
          {claiming ? <Spinner size={12}/> : null}
          {claiming ? 'Claiming…' : status.available ? 'CLAIM' : 'CLAIMED'}
        </button>
      </div>

      {/* Result flash */}
      {result && (
        <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.06)', fontFamily:"'Lato',sans-serif", fontSize:12, color: result.error ? '#F87171' : '#34D399', animation:'fadeIn 0.3s ease' }}>
          {result.error ? `❌ ${result.error}` : `✓ ${result.message}`}
        </div>
      )}
    </div>
  )
}
