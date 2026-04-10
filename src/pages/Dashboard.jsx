import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignInButton, UserButton, useAuth } from '@clerk/clerk-react'
import { useUser } from '../hooks/useUser.js'
import { useApi } from '../hooks/useApi.js'
import DailyPull from '../components/DailyPull.jsx'
import LiveFeed from '../components/LiveFeed.jsx'
import { CardSkeleton } from '../components/Skeleton.jsx'

const TIER_CFG = {
  CoreClaw:    { price:'$25',  color:'#60A5FA', icon:'⚙️', pullKey:'coreclaw_pulls',    path:'/coreclaw',    tagline:'Entry Level',   bg:'rgba(96,165,250,0.08)'  },
  PremierClaw: { price:'$50',  color:'#34D399', icon:'⭐', pullKey:'premierclaw_pulls', path:'/premierclaw', tagline:'Most Popular',  bg:'rgba(52,211,153,0.08)'  },
  UltraClaw:   { price:'$100', color:'#A78BFA', icon:'💎', pullKey:'ultraclaw_pulls',   path:'/ultraclaw',   tagline:'Investment Grade', bg:'rgba(167,139,250,0.08)' },
  QuantumClaw: { price:'$500', color:'#C9A84C', icon:'⚡', pullKey:'quantumclaw_pulls', path:'/quantumclaw', tagline:'Ultra Exclusive', bg:'rgba(201,168,76,0.08)'  },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const { apiFetch } = useApi()
  const [recentPulls, setRecentPulls] = useState([])
  const [vaultCount, setVaultCount]   = useState(null)

  useEffect(() => {
    if (!isSignedIn) return
    apiFetch('/api/vault').then(d => setVaultCount(d.items?.length || 0)).catch(()=>{})
    apiFetch('/api/engage?type=feed').then(d => setRecentPulls((d.feed||[]).slice(0,5))).catch(()=>{})
  }, [isSignedIn])

  const totalPulls = user
    ? (user.coreclaw_pulls||0)+(user.premierclaw_pulls||0)+(user.ultraclaw_pulls||0)+(user.quantumclaw_pulls||0)
    : 0

  const walletDollars = user ? (user.wallet_cents/100).toFixed(2) : '0.00'

  return (
    <div style={{ minHeight:'100vh', background:'#080b10', color:'#F0EDE6', paddingBottom:90 }}>
      <style>{'@import url(\'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Mono:wght@400;500&family=Lato:wght@300;400;700&display=swap\'); @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}} @keyframes shimmer{0%{background-position:-200px 0}100%{background-position:200px 0}}'}</style>

      {/* Header */}
      <div style={{ padding:'48px 20px 20px', background:'linear-gradient(180deg,rgba(201,168,76,0.06) 0%,transparent 100%)' }}>
        <div style={{ maxWidth:500, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:4, color:'rgba(201,168,76,0.5)', marginBottom:4 }}>CARD CLAW CO</div>
              {isSignedIn && user ? (
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:600, color:'#F0EDE6', lineHeight:1 }}>
                  Welcome back
                </div>
              ) : (
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:600, color:'#F0EDE6', lineHeight:1 }}>
                  Pull. Collect. Trade.
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              {isSignedIn ? <UserButton afterSignOutUrl="/"/> : (
                <SignInButton mode="modal">
                  <button style={{ padding:'8px 18px', background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:10, color:'#C9A84C', fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:1, cursor:'pointer' }}>SIGN IN</button>
                </SignInButton>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:500, margin:'0 auto', padding:'0 20px' }}>

        {/* Stats row — only when signed in */}
        {isSignedIn && user && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:24, animation:'fadeUp 0.4s ease' }}>
            {[
              { label:'WALLET',    value:`$${walletDollars}`,          color:'#34D399', onClick:()=>navigate('/wallet')   },
              { label:'PULLS READY', value:totalPulls||'—',             color:'#C9A84C', onClick:()=>null                  },
              { label:'IN VAULT',  value:vaultCount===null?'…':vaultCount, color:'#A78BFA', onClick:()=>navigate('/profile') },
            ].map(s => (
              <button key={s.label} onClick={s.onClick} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'12px 10px', cursor:s.onClick?'pointer':'default', textAlign:'center', transition:'background 0.2s' }}>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, letterSpacing:2, color:'rgba(240,237,230,0.3)', marginBottom:6 }}>{s.label}</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:600, color:s.color, lineHeight:1 }}>{s.value}</div>
              </button>
            ))}
          </div>
        )}

        {/* Daily pull */}
        {isSignedIn && (
          <div style={{ marginBottom:24 }}>
            <DailyPull onClaimed={() => {}} />
          </div>
        )}

        {/* Pulls ready — prominent CTA if user has pending pulls */}
        {isSignedIn && user && totalPulls > 0 && (
          <div style={{ marginBottom:24, animation:'fadeUp 0.3s ease' }}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:2.5, color:'rgba(240,237,230,0.25)', marginBottom:12 }}>READY TO PULL</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {Object.entries(TIER_CFG).map(([tier, cfg]) => {
                const count = user[cfg.pullKey] || 0
                if (!count) return null
                return (
                  <button key={tier} onClick={() => navigate(cfg.path)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', background:cfg.bg, border:`1.5px solid ${cfg.color}40`, borderRadius:14, cursor:'pointer', transition:'all 0.2s' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <span style={{ fontSize:24 }}>{cfg.icon}</span>
                      <div style={{ textAlign:'left' }}>
                        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:600, color:'#F0EDE6' }}>{tier}</div>
                        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:`${cfg.color}90` }}>{cfg.price} per pull</div>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:600, color:cfg.color, lineHeight:1 }}>{count}</div>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:`${cfg.color}70` }}>PULL{count>1?'S':''}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Choose a machine */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:2.5, color:'rgba(240,237,230,0.25)', marginBottom:12 }}>
            {isSignedIn && totalPulls === 0 ? 'BUY A PULL' : 'MACHINES'}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {Object.entries(TIER_CFG).map(([tier, cfg]) => {
              const pulls = user?.[cfg.pullKey] || 0
              return (
                <button key={tier} onClick={() => navigate(cfg.path)} style={{ background:cfg.bg, border:`1px solid ${cfg.color}25`, borderRadius:14, padding:'16px 14px', cursor:'pointer', textAlign:'left', transition:'all 0.18s', position:'relative', overflow:'hidden' }}>
                  {pulls > 0 && (
                    <div style={{ position:'absolute', top:8, right:8, background:cfg.color, color:'#080b10', fontFamily:"'DM Mono',monospace", fontSize:8, fontWeight:700, padding:'2px 7px', borderRadius:8 }}>
                      {pulls} READY
                    </div>
                  )}
                  <div style={{ fontSize:28, marginBottom:8 }}>{cfg.icon}</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:600, color:'#F0EDE6', marginBottom:2 }}>{tier}</div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:cfg.color, marginBottom:4 }}>{cfg.price} / pull</div>
                  <div style={{ fontFamily:"'Lato',sans-serif", fontSize:10, color:'rgba(240,237,230,0.3)' }}>{cfg.tagline}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Wallet nudge — if they have balance but no pulls */}
        {isSignedIn && user && user.wallet_cents > 0 && totalPulls === 0 && (
          <button onClick={() => navigate('/wallet')} style={{ width:'100%', marginBottom:20, padding:'14px 18px', background:'rgba(52,211,153,0.06)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:14, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ textAlign:'left' }}>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'rgba(52,211,153,0.6)', marginBottom:3 }}>WALLET BALANCE</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:600, color:'#34D399' }}>${walletDollars}</div>
            </div>
            <div style={{ fontFamily:"'Lato',sans-serif", fontSize:11, color:'rgba(52,211,153,0.5)', letterSpacing:1 }}>Use for pulls →</div>
          </button>
        )}

        {/* Live feed */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:2.5, color:'rgba(240,237,230,0.25)', marginBottom:12 }}>LIVE PULLS</div>
          <LiveFeed compact/>
        </div>

        {/* Sign-in CTA for guests */}
        {!isSignedIn && (
          <div style={{ marginBottom:24, textAlign:'center', padding:'32px 20px', background:'rgba(201,168,76,0.04)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:16 }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:600, color:'#F0EDE6', marginBottom:8 }}>Start collecting</div>
            <div style={{ fontFamily:"'Lato',sans-serif", fontSize:12, color:'rgba(240,237,230,0.35)', marginBottom:20, lineHeight:1.6 }}>
              Pull PSA/BGS graded cards, swap for wallet credit, sell on the marketplace, or cash out to your debit card.
            </div>
            <SignInButton mode="modal">
              <button style={{ padding:'14px 32px', background:'linear-gradient(135deg,rgba(201,168,76,0.25),rgba(201,168,76,0.08))', border:'2px solid rgba(201,168,76,0.5)', borderRadius:12, color:'#C9A84C', fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:600, letterSpacing:2, cursor:'pointer' }}>
                Sign In Free →
              </button>
            </SignInButton>
          </div>
        )}
      </div>
    </div>
  )
}
