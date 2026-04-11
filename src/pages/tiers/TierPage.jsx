import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignInButton, useAuth } from '@clerk/clerk-react'
import { useApi } from '../../hooks/useApi.js'
import { useUser } from '../../hooks/useUser.js'
import CasinoClawMachine from '../../components/CasinoClawMachine.jsx'
import CardReveal from '../../components/CardReveal.jsx'
import { resumeAudio } from '../../lib/casinoAudio.js'

const PULL_COL = {
  coreclaw:'coreclaw_pulls', premierclaw:'premierclaw_pulls',
  ultraclaw:'ultraclaw_pulls', quantumclaw:'quantumclaw_pulls',
}
const TIER_NAME = { coreclaw:'CoreClaw', premierclaw:'PremierClaw', ultraclaw:'UltraClaw', quantumclaw:'QuantumClaw' }

const OTHER_TIERS = [
  { id:'coreclaw',    name:'CoreClaw',    price:'$25',  icon:'⚙️', path:'/coreclaw',    color:'#60A5FA' },
  { id:'premierclaw', name:'PremierClaw', price:'$50',  icon:'⭐', path:'/premierclaw', color:'#34D399' },
  { id:'ultraclaw',   name:'UltraClaw',   price:'$100', icon:'💎', path:'/ultraclaw',   color:'#A78BFA' },
  { id:'quantumclaw', name:'QuantumClaw', price:'$500', icon:'⚡', path:'/quantumclaw', color:'#C9A84C' },
]

export default function TierPage({ config }) {
  const navigate = useNavigate()
  const { isSignedIn } = useAuth()
  const { apiFetch } = useApi()
  const { user, refresh } = useUser()
  const [buying, setBuying]   = useState(false)
  const [pulling, setPulling] = useState(false)
  const [revealCard, setReveal] = useState(null)
  const [error, setError]     = useState(null)

  const pullKey   = PULL_COL[config.packId]
  const tierName  = TIER_NAME[config.packId]
  const pulls     = user?.[pullKey] || 0
  const isNewUser = user && !user.is_first_pull_done
  const showDiscount = isNewUser && config.packId === 'coreclaw'

  const buy = async () => {
    resumeAudio()
    setBuying(true)
    try {
      const { url } = await apiFetch('/api/create-checkout-session', { method:'POST', body:{ packId: config.packId } })
      if (url) window.location.href = url
    } catch(err) { setError(err.message); setBuying(false) }
  }

  const doPull = async () => {
    resumeAudio()
    setPulling(true)
    setError(null)
    try {
      const result = await apiFetch('/api/pull', { method:'POST', body:{ tier: tierName } })
      await refresh()
      setReveal({ ...result.card, nft_token_id: result.vault?.nft_token_id, vault_id: result.vault?.id, total_pulls: result.card?.total_pulls })
    } catch(err) {
      setError(err.message)
      setPulling(false)
      throw err // re-throw so CasinoClawMachine can handle it
    }
    setPulling(false)
  }

  const { name, price, color, glow, badge, icon, packId, cards, bgTint, description, rarity } = config
  const bgStyle = {
    minHeight:'100vh',
    background:`linear-gradient(160deg,#0a0605 0%,${bgTint} 40%,#080500 100%)`,
    color:'#F0EDE6',
    paddingBottom:120,
    position:'relative',
    overflow:'hidden',
  }

  return (
    <div style={bgStyle}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Mono:wght@400;500&family=Lato:wght@300;400;700&display=swap');
        @keyframes casinoPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes neonFlicker { 0%,95%,100%{opacity:1} 96%,98%{opacity:0.6} 97%,99%{opacity:0.8} }
        @keyframes marqueeScroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes goldShimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
      `}</style>

      {/* Casino background effects */}
      <div style={{ position:'fixed',inset:0,pointerEvents:'none',zIndex:0 }}>
        <div style={{ position:'absolute',top:'10%',left:'50%',transform:'translateX(-50%)',width:600,height:400,background:`radial-gradient(ellipse,${glow} 0%,transparent 70%)`,opacity:0.15 }}/>
        {/* Scanlines */}
        <div style={{ position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(0deg,rgba(0,0,0,0.03) 0px,rgba(0,0,0,0.03) 1px,transparent 1px,transparent 4px)',pointerEvents:'none' }}/>
      </div>

      {/* Top marquee */}
      <div style={{ overflow:'hidden', background:`${color}20`, borderBottom:`1px solid ${color}40`, padding:'5px 0', position:'relative', zIndex:2 }}>
        <div style={{ display:'flex', width:'200%', animation:'marqueeScroll 10s linear infinite' }}>
          {[0,1].map(k=>(
            <div key={k} style={{ flex:'0 0 50%', display:'flex', gap:50, paddingRight:50 }}>
              {[`🎰 ${name.toUpperCase()}`,`💎 GRADED CARDS`,`🏆 NFT OWNERSHIP`,`✨ ${rarity}`,`🎰 ${name.toUpperCase()}`].map((t,i)=>(
                <span key={i} style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, fontWeight:600, letterSpacing:2, color, whiteSpace:'nowrap' }}>{t}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:420, margin:'0 auto', padding:'20px 20px 0', position:'relative', zIndex:2 }}>
        {/* Nav */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <button onClick={() => navigate('/')} style={{ background:'none', border:'none', color:'rgba(240,237,230,0.4)', fontFamily:"'Oswald',sans-serif", fontSize:12, letterSpacing:2, cursor:'pointer', padding:0 }}>← LOBBY</button>
          {isSignedIn && user && (
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:color, background:`${color}15`, border:`1px solid ${color}30`, borderRadius:8, padding:'4px 12px' }}>
              {pulls} PULL{pulls!==1?'S':''} READY
            </div>
          )}
        </div>

        {/* Title section */}
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:`${color}18`, border:`1px solid ${color}40`, borderRadius:20, padding:'5px 18px', marginBottom:14, boxShadow:`0 0 20px ${glow}30` }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:color, boxShadow:`0 0 10px ${color}`, animation:'casinoPulse 1.5s ease-in-out infinite' }}/>
            <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, fontWeight:600, letterSpacing:3, color, animation:'neonFlicker 4s ease-in-out infinite' }}>{badge}</span>
          </div>

          <div style={{ fontSize:52, marginBottom:8 }}>{icon}</div>
          <h1 style={{ fontFamily:"'Oswald',sans-serif", fontSize:52, fontWeight:700, color:'#F0EDE6', letterSpacing:2, margin:'0 0 6px', textShadow:`0 0 30px ${color}40` }}>{name}</h1>
          <p style={{ fontFamily:"'Lato',sans-serif", fontSize:12, color:'rgba(240,237,230,0.4)', margin:0, lineHeight:1.6, maxWidth:320, marginLeft:'auto', marginRight:'auto' }}>{description}</p>
        </div>

        {/* Price display */}
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ display:'inline-block', background:`${color}10`, border:`2px solid ${color}50`, borderRadius:16, padding:'14px 32px', boxShadow:`0 0 40px ${glow}30` }}>
            {showDiscount && <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:9, letterSpacing:3, color:'#34D399', marginBottom:6 }}>🎁 FIRST PULL OFFER</div>}
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'center', gap:10 }}>
              {showDiscount && <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:22, color:'rgba(240,237,230,0.3)', textDecoration:'line-through' }}>$25</span>}
              <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:56, fontWeight:700, color:showDiscount?'#34D399':color, lineHeight:1, textShadow:`0 0 20px ${showDiscount?'#34D399':color}` }}>
                {showDiscount?'$15':price}
              </span>
            </div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:'rgba(240,237,230,0.4)', letterSpacing:1, marginTop:4 }}>1 PULL · {rarity}</div>
          </div>
        </div>

        {/* Error */}
        {error && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, padding:'10px 14px', marginBottom:16, fontFamily:"'Lato',sans-serif", fontSize:12, color:'#F87171', textAlign:'center' }}>{error}</div>}

        {/* THE CLAW MACHINE */}
        <div style={{ marginBottom:20 }}>
          <CasinoClawMachine
            tier={tierName}
            pulls={pulls}
            disabled={!isSignedIn || !user}
            onPullComplete={doPull}
          />
        </div>

        {/* Buy button */}
        {isSignedIn ? (
          <button onClick={buy} disabled={buying} style={{
            width:'100%', padding:'14px',
            background: pulls>0 ? 'rgba(255,255,255,0.04)' : `linear-gradient(135deg,${color}30,${color}10)`,
            border:`1.5px solid ${pulls>0?'rgba(255,255,255,0.1)':color+'60'}`,
            borderRadius:12, color:pulls>0?'rgba(240,237,230,0.4)':color,
            fontFamily:"'Oswald',sans-serif", fontSize:16, fontWeight:600, letterSpacing:3,
            cursor:buying?'not-allowed':'pointer', marginBottom:10,
          }}>
            {buying ? '⏳ PROCESSING…' : `BUY ${pulls>0?'ANOTHER ':''} PULL · ${showDiscount?'$15':price}`}
          </button>
        ) : (
          <SignInButton mode="modal">
            <button style={{ width:'100%', padding:'16px', background:`linear-gradient(135deg,${color}30,${color}10)`, border:`2px solid ${color}`, borderRadius:12, color, fontFamily:"'Oswald',sans-serif", fontSize:18, fontWeight:700, letterSpacing:3, cursor:'pointer', boxShadow:`0 0 24px ${glow}` }}>
              SIGN IN · {showDiscount?'$15':price} PER PULL
            </button>
          </SignInButton>
        )}

        <div style={{ textAlign:'center', fontFamily:"'Lato',sans-serif", fontSize:11, color:'rgba(240,237,230,0.2)', marginBottom:28 }}>
          ↔ Swap any card for 65% FMV back to your wallet
        </div>

        {/* Cards in pool */}
        <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, letterSpacing:4, color:'rgba(240,237,230,0.25)', marginBottom:12, textAlign:'center' }}>CARDS IN THIS POOL</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:28 }}>
          {cards.map((c,i) => (
            <div key={i} style={{ background:`${color}06`, border:`1px solid ${color}15`, borderRadius:12, overflow:'hidden' }}>
              <div style={{ height:70, background:'rgba(0,0,0,0.4)', overflow:'hidden' }}>
                <img src={c.img} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" onError={e=>{e.target.style.display='none'}}/>
              </div>
              <div style={{ padding:'8px 10px' }}>
                <div style={{ fontFamily:"'Lato',sans-serif", fontSize:10, fontWeight:700, color:'#F0EDE6', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:2 }}>{c.name}</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:'rgba(240,237,230,0.3)' }}>{c.grade}</span>
                  <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:15, fontWeight:600, color }}>${c.fmv.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Other tiers */}
        <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, letterSpacing:4, color:'rgba(240,237,230,0.25)', marginBottom:12, textAlign:'center' }}>OTHER MACHINES</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {OTHER_TIERS.filter(t=>t.id!==packId).map(t=>(
            <button key={t.id} onClick={()=>navigate(t.path)} style={{ background:`${t.color}10`, border:`1px solid ${t.color}25`, borderRadius:10, padding:'12px 6px', cursor:'pointer', textAlign:'center' }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{t.icon}</div>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, fontWeight:600, color:'#F0EDE6', marginBottom:2 }}>{t.name}</div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:t.color }}>{t.price}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Card Reveal Modal */}
      {revealCard && (
        <CardReveal
          card={revealCard}
          tier={tierName}
          pullsLeft={(user?.[pullKey]||0)}
          onClose={() => setReveal(null)}
          onPullAgain={() => { setReveal(null); setTimeout(doPull, 300) }}
        />
      )}
    </div>
  )
}
