import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi.js'
import { useUser } from '../hooks/useUser.js'
import { Spinner } from '../components/UI.jsx'
import { CREDIT_PACKS } from '../lib/constants.js'

const TIER_STYLES = {
  coreclaw:    { bg:'rgba(96,165,250,0.06)',  border:'rgba(96,165,250,0.2)',  glow:'rgba(96,165,250,0.15)'  },
  premierclaw: { bg:'rgba(52,211,153,0.06)',  border:'rgba(52,211,153,0.2)',  glow:'rgba(52,211,153,0.15)'  },
  ultraclaw:   { bg:'rgba(167,139,250,0.07)', border:'rgba(167,139,250,0.25)',glow:'rgba(167,139,250,0.2)'  },
  quantumclaw: { bg:'rgba(201,168,76,0.07)',  border:'rgba(201,168,76,0.28)', glow:'rgba(201,168,76,0.25)'  },
}

export default function Store() {
  const navigate = useNavigate()
  const { apiFetch } = useApi()
  const { user } = useUser()
  const [loading, setLoading]   = useState(null)
  const [error, setError]       = useState(null)
  const [checkResult, setCheck] = useState({})

  // Pre-check discount eligibility for CoreClaw
  useEffect(() => {
    if (!user) return
    apiFetch('/api/create-checkout-session', {
      method: 'POST',
      body: { packId: 'coreclaw', _preview: true },
    }).then(r => setCheck({ discountApplied: r.discountApplied, originalPrice: r.originalPrice })).catch(() => {})
  }, [user])

  const handleBuy = async (packId) => {
    setLoading(packId); setError(null)
    try {
      const { url } = await apiFetch('/api/create-checkout-session', { method:'POST', body:{ packId } })
      if (url) window.location.href = url
    } catch (err) { setError(err.message); setLoading(null) }
  }

  const isNewUser = user && !user.is_first_pull_done

  return (
    <div style={{ minHeight:'100vh', paddingBottom:90, background:'linear-gradient(160deg,#0C0C10 0%,#0F0F16 55%,#0C0C10 100%)', color:'#F0EDE6' }}>
      <div style={{ position:'fixed',top:'10%',left:'50%',transform:'translateX(-50%)',width:700,height:350,background:'radial-gradient(ellipse,rgba(201,168,76,0.05) 0%,transparent 65%)',pointerEvents:'none',zIndex:0 }}/>

      {/* Header */}
      <div style={{ padding:'28px 24px 20px', borderBottom:'1px solid rgba(255,255,255,0.05)', position:'relative', zIndex:1 }}>
        <button onClick={() => navigate('/')} style={{ background:'none',border:'none',color:'rgba(240,237,230,0.35)',fontFamily:"'Lato',sans-serif",fontSize:11,letterSpacing:2,cursor:'pointer',display:'flex',alignItems:'center',gap:6,marginBottom:16,padding:0 }}>← BACK</button>
        <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:10,letterSpacing:6,color:'#C9A84C',marginBottom:5 }}>CARD CLAW CO</div>
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:600,color:'#F0EDE6',marginBottom:6 }}>Credit Store</h1>
        <div style={{ display:'flex',alignItems:'center',gap:16 }}>
          <p style={{ fontFamily:"'Lato',sans-serif",fontSize:11,color:'rgba(240,237,230,0.3)',letterSpacing:1 }}>1 Credit = 1 Pull = $1.00</p>
          {user && (
            <div style={{ fontFamily:"'DM Mono',monospace",fontSize:10,color:'#C9A84C',background:'rgba(201,168,76,0.08)',border:'1px solid rgba(201,168,76,0.2)',borderRadius:6,padding:'3px 10px' }}>
              Balance: {user.credits} credits
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth:520, margin:'0 auto', padding:'24px 20px 60px', position:'relative', zIndex:1 }}>
        {error && <div style={{ background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:10,padding:'12px 16px',marginBottom:20,fontFamily:"'Lato',sans-serif",fontSize:12,color:'#F87171' }}>{error}</div>}

        {/* First-pull welcome offer */}
        {isNewUser && (
          <div style={{ background:'linear-gradient(135deg,rgba(201,168,76,0.15),rgba(201,168,76,0.05))',border:'2px solid rgba(201,168,76,0.5)',borderRadius:14,padding:'18px 20px',marginBottom:20,animation:'goldGlow 2.5s ease-in-out infinite' }}>
            <div style={{ display:'flex',alignItems:'center',gap:12 }}>
              <div style={{ fontSize:32 }}>🎁</div>
              <div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:600,color:'#C9A84C',marginBottom:3 }}>Welcome Offer — First Pull</div>
                <div style={{ fontFamily:"'Lato',sans-serif",fontSize:12,color:'rgba(240,237,230,0.5)',lineHeight:1.5 }}>
                  Start with 25 CoreClaw credits for <b style={{ color:'#C9A84C' }}>$15</b> instead of $25. One-time offer, automatically applied.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rate callout */}
        <div style={{ background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:'14px 18px',marginBottom:20,display:'flex',alignItems:'center',gap:14 }}>
          <div style={{ fontSize:24 }}>🎯</div>
          <div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:'#F0EDE6',marginBottom:2 }}>Fixed Rate Pricing</div>
            <div style={{ fontFamily:"'Lato',sans-serif",fontSize:11,color:'rgba(240,237,230,0.35)',lineHeight:1.5 }}>Every credit costs $1.00. Pull any card. Swap unwanted cards for 65% FMV back in credits. No expiry.</div>
          </div>
        </div>

        {/* Swap value callout — prominently shown */}
        <div style={{ background:'rgba(56,189,248,0.06)',border:'1px solid rgba(56,189,248,0.2)',borderRadius:12,padding:'14px 18px',marginBottom:20,display:'flex',alignItems:'center',gap:14 }}>
          <div style={{ fontSize:24 }}>↔️</div>
          <div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:'#38BDF8',marginBottom:2 }}>Don't love a pull? Swap it.</div>
            <div style={{ fontFamily:"'Lato',sans-serif",fontSize:11,color:'rgba(240,237,230,0.35)',lineHeight:1.5 }}>Every card can be swapped for <b style={{ color:'#38BDF8' }}>65% of its Fair Market Value</b> back as credits. A $100 card = 65 credits back instantly.</div>
          </div>
        </div>

        {/* Pack cards */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {CREDIT_PACKS.map(pack => {
            const ts = TIER_STYLES[pack.id]
            const isLoading = loading === pack.id
            const showDiscount = isNewUser && pack.id === 'coreclaw'
            return (
              <div key={pack.id} style={{ background:ts.bg,border:`1px solid ${loading===pack.id?pack.accent:ts.border}`,borderRadius:16,padding:'20px 22px',boxShadow:pack.badge==='ULTIMATE'?`0 0 30px ${ts.glow}`:`0 4px 20px ${ts.glow}`,position:'relative',overflow:'hidden',transition:'all 0.2s ease' }}>

                {pack.badge && (
                  <div style={{ position:'absolute',top:16,right:16,background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.3)',borderRadius:4,padding:'2px 10px',fontFamily:"'DM Mono',monospace",fontSize:8,color:'#C9A84C',letterSpacing:2 }}>{pack.badge}</div>
                )}

                <div style={{ display:'flex',alignItems:'flex-start',gap:14,marginBottom:16 }}>
                  <div style={{ fontSize:32,width:50,height:50,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.25)',borderRadius:12,border:`1px solid ${ts.border}`,flexShrink:0 }}>{pack.icon}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:600,color:'#F0EDE6',lineHeight:1,marginBottom:4 }}>{pack.name}</div>
                    <div style={{ fontFamily:"'Lato',sans-serif",fontSize:11,color:'rgba(240,237,230,0.4)',letterSpacing:0.5 }}>{pack.desc}</div>
                  </div>
                </div>

                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:16 }}>
                  {[
                    ['CREDITS', `${pack.credits}`, '#F0EDE6'],
                    ['RATE',    '$1.00 / pull',    'rgba(240,237,230,0.4)'],
                    ['TOTAL',   showDiscount ? (
                      <span><s style={{ fontSize:13,color:'rgba(240,237,230,0.3)' }}>$25</s> <span style={{ color:'#34D399' }}>$15</span></span>
                    ) : pack.price, showDiscount ? '#34D399' : pack.accent],
                  ].map(([label, val, col]) => (
                    <div key={label} style={{ background:'rgba(0,0,0,0.2)',borderRadius:8,padding:'10px 12px' }}>
                      <div style={{ fontFamily:"'DM Mono',monospace",fontSize:8,letterSpacing:1.5,color:'rgba(240,237,230,0.25)',marginBottom:4 }}>{label}</div>
                      <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:col }}>{val}</div>
                    </div>
                  ))}
                </div>

                {showDiscount && (
                  <div style={{ background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.2)',borderRadius:8,padding:'8px 12px',marginBottom:12,fontFamily:"'Lato',sans-serif",fontSize:11,color:'#34D399',display:'flex',alignItems:'center',gap:6 }}>
                    🎁 <b>Welcome offer</b> — $15 instead of $25, applied automatically at checkout
                  </div>
                )}

                <button onClick={() => handleBuy(pack.id)} disabled={!!loading} style={{ width:'100%',padding:'13px',background:isLoading?'rgba(255,255,255,0.04)':`linear-gradient(135deg,${ts.bg},rgba(0,0,0,0.3))`,border:`1px solid ${isLoading?'rgba(255,255,255,0.08)':pack.accent}`,borderRadius:10,cursor:loading?'not-allowed':'pointer',fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,color:isLoading?'rgba(240,237,230,0.3)':pack.accent,letterSpacing:2,display:'flex',alignItems:'center',justifyContent:'center',gap:10,boxShadow:isLoading?'none':`0 0 16px ${ts.glow}`,transition:'all 0.2s' }}>
                  {isLoading ? <><Spinner size={14} color={pack.accent}/> Processing…</> : `Purchase ${pack.name} · ${showDiscount ? '$15' : pack.price}`}
                </button>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop:28,display:'flex',justifyContent:'center',gap:28 }}>
          {[['🔒','Secure Checkout'],['⚡','Instant Credits'],['↔️','65% Swap Back']].map(([icon,label]) => (
            <div key={label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:20,marginBottom:5 }}>{icon}</div>
              <div style={{ fontFamily:"'Lato',sans-serif",fontSize:10,color:'rgba(240,237,230,0.2)',letterSpacing:0.5 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign:'center',marginTop:20,fontFamily:"'Lato',sans-serif",fontSize:10,color:'rgba(240,237,230,0.15)',lineHeight:1.7 }}>
          Payments processed by Stripe. Credits are non-refundable once used.
        </div>
      </div>
    </div>
  )
}
