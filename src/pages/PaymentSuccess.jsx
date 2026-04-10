import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useUser } from '../hooks/useUser.js'

const PACK_PATH = {
  coreclaw: '/coreclaw', coreclaw_first: '/coreclaw',
  premierclaw: '/premierclaw', ultraclaw: '/ultraclaw', quantumclaw: '/quantumclaw',
}
const PACK_CFG = {
  coreclaw:    { name:'CoreClaw',    color:'#60A5FA', icon:'⚙️' },
  coreclaw_first: { name:'CoreClaw', color:'#60A5FA', icon:'⚙️' },
  premierclaw: { name:'PremierClaw', color:'#34D399', icon:'⭐' },
  ultraclaw:   { name:'UltraClaw',   color:'#A78BFA', icon:'💎' },
  quantumclaw: { name:'QuantumClaw', color:'#C9A84C', icon:'⚡' },
}

export default function PaymentSuccess() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { refresh } = useUser()
  const [phase, setPhase] = useState('loading') // loading → confirmed → redirecting

  const sessionId = params.get('session_id')
  const packId    = params.get('pack_id') || 'coreclaw' // fallback

  useEffect(() => {
    const run = async () => {
      // Wait for webhook to fire
      await new Promise(r => setTimeout(r, 2200))
      await refresh()
      setPhase('confirmed')
      await new Promise(r => setTimeout(r, 1800))
      setPhase('redirecting')
      await new Promise(r => setTimeout(r, 400))
      navigate(PACK_PATH[packId] || '/coreclaw')
    }
    run()
  }, [])

  const cfg = PACK_CFG[packId] || PACK_CFG.coreclaw

  return (
    <div style={{
      minHeight:'100vh', background:'#080b10',
      display:'flex', alignItems:'center', justifyContent:'center',
      flexDirection:'column', gap:0, padding:24,
    }}>
      <style>{'@import url(\'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Mono:wght@400;500&display=swap\'); @keyframes scaleIn{from{opacity:0;transform:scale(0.7)}to{opacity:1;transform:scale(1)}} @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}'}</style>

      {phase === 'loading' && (
        <div style={{ textAlign:'center' }}>
          <div style={{ width:64, height:64, borderRadius:'50%', border:`2px solid ${cfg.color}30`, borderTopColor:cfg.color, animation:'spin 0.8s linear infinite', margin:'0 auto 24px' }}/>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:3, color:'rgba(240,237,230,0.3)' }}>CONFIRMING PAYMENT…</div>
          <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
        </div>
      )}

      {phase === 'confirmed' && (
        <div style={{ textAlign:'center', animation:'scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <div style={{ fontSize:64, marginBottom:16, animation:'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>{cfg.icon}</div>
          <div style={{
            width:80, height:80, borderRadius:'50%',
            background:`${cfg.color}15`, border:`2px solid ${cfg.color}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 20px', fontSize:32,
            boxShadow:`0 0 40px ${cfg.color}40`,
          }}>✓</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:600, color:'#F0EDE6', marginBottom:8 }}>
            Pull confirmed!
          </div>
          <div style={{ fontFamily:"'Lato',sans-serif", fontSize:13, color:`${cfg.color}`, marginBottom:6 }}>
            1 {cfg.name} pull added to your account
          </div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:'rgba(240,237,230,0.25)', letterSpacing:1 }}>
            Taking you to the machine…
          </div>
        </div>
      )}

      {phase === 'redirecting' && (
        <div style={{ textAlign:'center' }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:3, color:'rgba(240,237,230,0.3)' }}>→ {cfg.name.toUpperCase()}</div>
        </div>
      )}
    </div>
  )
}
