import { useState, useRef } from 'react'
import { Spinner } from './UI.jsx'

export default function AdminAuthGate({ admins, onSuccess }) {
  const [username, setUsername] = useState('')
  const [pin, setPin]           = useState('')
  const [shake, setShake]       = useState(false)
  const [loading, setLoading]   = useState(false)
  const [hint, setHint]         = useState(false)

  const handleSubmit = () => {
    if (!username || !pin) return
    setLoading(true)
    setTimeout(() => {
      const match = admins.find(u => u.user === username.toLowerCase() && u.pin === pin)
      if (match) {
        onSuccess(username)
      } else {
        setLoading(false)
        setPin('')
        setShake(true)
        setTimeout(() => setShake(false), 600)
      }
    }, 800)
  }

  const handleKey = (e) => { if (e.key === 'Enter') handleSubmit() }

  const fieldStyle = {
    width:'100%', padding:'12px 16px',
    background:'rgba(255,255,255,0.04)', borderRadius:9,
    color:'#F0EDE6', fontFamily:"'DM Mono',monospace", fontSize:13,
    outline:'none', letterSpacing:1,
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(160deg,#0A0A10 0%,#0D0D16 60%,#0A0A10 100%)', position:'relative', overflow:'hidden' }}>
      {/* bg orbs */}
      <div style={{ position:'absolute',top:'20%',left:'30%',width:500,height:300,background:'radial-gradient(ellipse,rgba(201,168,76,0.05) 0%,transparent 70%)',pointerEvents:'none' }}/>
      <div style={{ position:'absolute',bottom:'10%',right:'20%',width:400,height:300,background:'radial-gradient(ellipse,rgba(96,165,250,0.04) 0%,transparent 70%)',pointerEvents:'none' }}/>

      <div style={{
        width:'100%', maxWidth:380, padding:40,
        background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.08)',
        borderRadius:20, boxShadow:'0 40px 100px rgba(0,0,0,0.6)',
        backdropFilter:'blur(20px)', animation:'fadeUp 0.5s ease',
      }}>
        {/* Icon */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:52,height:52,borderRadius:16,background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.25)',display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:18,boxShadow:'0 0 24px rgba(201,168,76,0.1)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:11, letterSpacing:5, color:'#C9A84C', marginBottom:6 }}>CARD CLAW CO</div>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:600, color:'#F0EDE6', lineHeight:1.2 }}>Operator Access</h2>
          <p style={{ fontFamily:"'Lato',sans-serif", fontSize:11, color:'rgba(240,237,230,0.3)', marginTop:6, letterSpacing:1 }}>RESTRICTED — AUTHORISED PERSONNEL ONLY</p>
        </div>

        {/* Username */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:2, color:'rgba(240,237,230,0.35)', display:'block', marginBottom:7 }}>USERNAME</label>
          <input value={username} onChange={e=>setUsername(e.target.value)} onKeyDown={handleKey} placeholder="Enter username"
            style={{ ...fieldStyle, border:`1px solid rgba(255,255,255,0.1)` }}
          />
        </div>

        {/* PIN */}
        <div style={{ marginBottom:24, animation:shake?'pinShake 0.5s ease':'none' }}>
          <label style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:2, color:'rgba(240,237,230,0.35)', display:'block', marginBottom:7 }}>PIN</label>
          <input value={pin} onChange={e=>setPin(e.target.value.slice(0,8))} onKeyDown={handleKey} type="password" placeholder="••••"
            style={{ ...fieldStyle, border:`1px solid ${shake?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.1)'}`, letterSpacing:6, fontSize:18 }}
          />
          {shake && <div style={{ fontFamily:"'Lato',sans-serif", fontSize:11, color:'#F87171', marginTop:6 }}>Invalid credentials. Please try again.</div>}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!username || !pin || loading}
          style={{
            width:'100%', padding:'14px',
            background:(!username||!pin)?'rgba(255,255,255,0.04)':'linear-gradient(135deg,rgba(201,168,76,0.22),rgba(201,168,76,0.1))',
            border:`1px solid ${(!username||!pin)?'rgba(255,255,255,0.08)':'rgba(201,168,76,0.4)'}`,
            borderRadius:10, cursor:(!username||!pin||loading)?'not-allowed':'pointer',
            fontFamily:"'Lato',sans-serif", fontSize:12, fontWeight:700, letterSpacing:2.5,
            color:(!username||!pin)?'rgba(240,237,230,0.2)':'#C9A84C',
            textShadow:(!username||!pin)?'none':'0 0 16px rgba(201,168,76,0.4)',
            animation:(!username||!pin||loading)?'none':'goldGlow 2.5s ease-in-out infinite',
            display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          }}
        >
          {loading ? <><Spinner size={13}/> Authenticating…</> : 'UNLOCK DASHBOARD'}
        </button>

        {/* Demo hint */}
        <div style={{ textAlign:'center', marginTop:16 }}>
          <button onClick={() => setHint(h=>!h)} style={{ background:'none', border:'none', fontFamily:"'DM Mono',monospace", fontSize:9, color:'rgba(240,237,230,0.2)', cursor:'pointer', letterSpacing:1 }}>
            {hint ? 'hide hint' : 'demo credentials'}
          </button>
          {hint && (
            <div style={{ marginTop:8, background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:7, padding:'9px 14px', fontFamily:"'DM Mono',monospace", fontSize:10, color:'rgba(201,168,76,0.6)', lineHeight:1.8 }}>
              admin / 0000 &nbsp;·&nbsp; rawagon / 1234
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
