import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi.js'
import { useUser } from '../hooks/useUser.js'
import { Spinner } from '../components/UI.jsx'

const MEDALS = ['🥇','🥈','🥉']

export default function Leaderboard() {
  const navigate = useNavigate()
  const { apiFetch } = useApi()
  const { user } = useUser()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/engage?type=leaderboard')
      .then(d => setRows(d.leaderboard || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight:'100vh', paddingBottom:90, background:'linear-gradient(160deg,#0C0C10 0%,#0F0F16 55%,#0C0C10 100%)', color:'#F0EDE6' }}>
      <div style={{ position:'fixed',top:'10%',left:'50%',transform:'translateX(-50%)',width:600,height:300,background:'radial-gradient(ellipse,rgba(201,168,76,0.05) 0%,transparent 65%)',pointerEvents:'none',zIndex:0 }}/>

      <div style={{ padding:'28px 24px 20px', borderBottom:'1px solid rgba(255,255,255,0.05)', position:'relative', zIndex:1 }}>
        <button onClick={() => navigate('/')} style={{ background:'none', border:'none', color:'rgba(240,237,230,0.35)', fontFamily:"'Lato',sans-serif", fontSize:11, letterSpacing:2, cursor:'pointer', display:'flex', alignItems:'center', gap:6, marginBottom:16, padding:0 }}>← BACK</button>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:10, letterSpacing:6, color:'#C9A84C', marginBottom:5 }}>THE CLAW PULL</div>
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:600, color:'#F0EDE6', marginBottom:4 }}>Weekly Leaderboard</h1>
        <p style={{ fontFamily:"'Lato',sans-serif", fontSize:11, color:'rgba(240,237,230,0.3)', letterSpacing:1 }}>Top collectors by FMV pulled this week</p>
      </div>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'20px 20px 60px', position:'relative', zIndex:1 }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:'60px 0', display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
            <Spinner size={24}/><span style={{ fontFamily:"'Lato',sans-serif", fontSize:11, color:'rgba(240,237,230,0.25)', letterSpacing:2 }}>LOADING…</span>
          </div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0', color:'rgba(240,237,230,0.2)', fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontStyle:'italic' }}>
            No pulls yet this week.<br/><span style={{ fontSize:12, fontFamily:"'Lato',sans-serif", letterSpacing:2, fontStyle:'normal' }}>BE THE FIRST ON THE BOARD</span>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {rows.map((row, i) => {
              const isMe = row.clerk_id === user?.clerk_id
              return (
                <div key={row.clerk_id || i} style={{
                  display:'flex', alignItems:'center', gap:14, padding:'14px 16px',
                  background: isMe ? 'rgba(201,168,76,0.08)' : i < 3 ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.015)',
                  border: `1px solid ${isMe ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius:12,
                }}>
                  <div style={{ width:32, textAlign:'center', fontFamily:"'Cormorant Garamond',serif", fontSize:i < 3 ? 22 : 16, flexShrink:0 }}>
                    {i < 3 ? MEDALS[i] : <span style={{ color:'rgba(240,237,230,0.3)' }}>#{row.rank}</span>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:"'Lato',sans-serif", fontSize:12, color: isMe ? '#C9A84C' : '#F0EDE6', marginBottom:3 }}>
                      {isMe ? '⭐ You' : `Player ${row.clerk_id?.slice(-6) || i+1}`}
                    </div>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'rgba(240,237,230,0.3)' }}>
                      {row.pulls_this_week} pulls · {row.pull_streak > 0 ? `🔥 ${row.pull_streak} streak` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:600, color: i === 0 ? '#C9A84C' : i === 1 ? '#94A3B8' : i === 2 ? '#CD7F32' : '#F0EDE6' }}>
                      ${(row.fmv_this_week||0).toLocaleString()}
                    </div>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:'rgba(240,237,230,0.25)' }}>FMV pulled</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
