import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignInButton, UserButton, useAuth } from '@clerk/clerk-react'
import { useUser } from '../hooks/useUser.js'
import { useApi } from '../hooks/useApi.js'
import DailyPull from '../components/DailyPull.jsx'
import LiveFeed from '../components/LiveFeed.jsx'
import { resumeAudio } from '../lib/casinoAudio.js'
import { TEST_MODE, TestPullButton } from '../components/TestModeBanner.jsx'

const TIER_CFG = {
  CoreClaw:    { price:'$25',  color:'#3B82F6', neon:'#60A5FA', icon:'⚙️', pullKey:'coreclaw_pulls',    path:'/coreclaw',    bg:'rgba(59,130,246,0.1)',    border:'rgba(59,130,246,0.3)'  },
  PremierClaw: { price:'$50',  color:'#10B981', neon:'#34D399', icon:'⭐', pullKey:'premierclaw_pulls', path:'/premierclaw', bg:'rgba(16,185,129,0.1)',    border:'rgba(16,185,129,0.3)'  },
  UltraClaw:   { price:'$100', color:'#7C3AED', neon:'#A78BFA', icon:'💎', pullKey:'ultraclaw_pulls',   path:'/ultraclaw',   bg:'rgba(124,58,237,0.1)',    border:'rgba(124,58,237,0.3)'  },
  QuantumClaw: { price:'$500', color:'#D97706', neon:'#FCD34D', icon:'⚡', pullKey:'quantumclaw_pulls', path:'/quantumclaw', bg:'rgba(217,119,6,0.12)',    border:'rgba(217,119,6,0.4)'   },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const { apiFetch } = useApi()
  const [vaultCount, setVaultCount] = useState(null)

  useEffect(() => {
    if (!isSignedIn) return
    apiFetch('/api/vault').then(d => setVaultCount(d.items?.length || 0)).catch(()=>{})
  }, [isSignedIn])

  const totalPulls = user
    ? (user.coreclaw_pulls||0)+(user.premierclaw_pulls||0)+(user.ultraclaw_pulls||0)+(user.quantumclaw_pulls||0)
    : 0
  const walletDollars = user ? (user.wallet_cents/100).toFixed(2) : '0.00'

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#0a0403 0%,#0f0800 50%,#080405 100%)', color:'#F0EDE6', paddingBottom:90 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Mono:wght@400;500&family=Lato:wght@300;400;700&display=swap');
        @keyframes marqueeScroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes neonPulse { 0%,100%{text-shadow:0 0 10px #F59E0B,0 0 20px #F59E0B} 50%{text-shadow:0 0 20px #F59E0B,0 0 40px #F59E0B,0 0 60px #F59E0B80} }
        @keyframes casinoGlow { 0%,100%{box-shadow:0 0 20px rgba(245,158,11,0.2)} 50%{box-shadow:0 0 40px rgba(245,158,11,0.4)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scanline { from{transform:translateY(-100%)} to{transform:translateY(100vh)} }
        @keyframes lightBurst { 0%{opacity:0;transform:scaleX(0)} 50%{opacity:1;transform:scaleX(1)} 100%{opacity:0;transform:scaleX(0)} }
      `}</style>

      {/* Casino scanlines overlay */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, backgroundImage:'repeating-linear-gradient(0deg,rgba(0,0,0,0.04) 0px,rgba(0,0,0,0.04) 1px,transparent 1px,transparent 3px)' }}/>

      {/* Ambient light blobs */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', top:'-10%', left:'30%', width:500, height:500, background:'radial-gradient(circle,rgba(245,158,11,0.06) 0%,transparent 60%)', animation:'casinoGlow 4s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', bottom:'20%', right:'10%', width:300, height:300, background:'radial-gradient(circle,rgba(139,92,246,0.06) 0%,transparent 60%)' }}/>
      </div>

      {/* TOP MARQUEE */}
      <div style={{ overflow:'hidden', background:'rgba(245,158,11,0.12)', borderBottom:'1px solid rgba(245,158,11,0.3)', padding:'6px 0', position:'relative', zIndex:2 }}>
        <div style={{ display:'flex', width:'200%', animation:'marqueeScroll 12s linear infinite' }}>
          {[0,1].map(k=>(
            <div key={k} style={{ flex:'0 0 50%', display:'flex', gap:60 }}>
              {['🎰 THE CLAW PULL','💎 PSA GRADED CARDS','🏆 NFT OWNERSHIP','💳 CASH OUT ANYTIME','🎯 65% SWAP VALUE','⚡ PULL NOW'].map((t,i)=>(
                <span key={i} style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, fontWeight:600, letterSpacing:2, color:'#FCD34D', whiteSpace:'nowrap' }}>{t}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* HEADER */}
      <div style={{ background:'linear-gradient(180deg,rgba(245,158,11,0.08) 0%,transparent 100%)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'24px 20px 20px', position:'relative', zIndex:2 }}>
        <div style={{ maxWidth:500, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, letterSpacing:6, color:'rgba(245,158,11,0.5)', marginBottom:2 }}>THE CLAW PULL</div>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:32, fontWeight:700, color:'#FCD34D', letterSpacing:1, lineHeight:1, animation:'neonPulse 3s ease-in-out infinite' }}>
                {isSignedIn ? 'WELCOME BACK' : 'PULL. WIN. COLLECT.'}
              </div>
            </div>
            {isSignedIn ? <UserButton afterSignOutUrl="/"/> : (
              <SignInButton mode="modal">
                <button onClick={() => resumeAudio()} style={{ padding:'10px 20px', background:'rgba(245,158,11,0.15)', border:'2px solid rgba(245,158,11,0.5)', borderRadius:8, color:'#FCD34D', fontFamily:"'Oswald',sans-serif", fontSize:13, fontWeight:600, letterSpacing:2, cursor:'pointer', boxShadow:'0 0 20px rgba(245,158,11,0.2)' }}>
                  SIGN IN
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:500, margin:'0 auto', padding:'16px 20px', position:'relative', zIndex:2 }}>

        {/* STATS ROW */}
        {isSignedIn && user && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:20, animation:'fadeUp 0.4s ease' }}>
            {[
              { label:'WALLET',    value:`$${walletDollars}`,             color:'#34D399', onClick:()=>navigate('/wallet')   },
              { label:'PULLS',     value:totalPulls||'0',                 color:'#FCD34D', onClick:null                       },
              { label:'VAULT',     value:vaultCount===null?'…':vaultCount, color:'#A78BFA', onClick:()=>navigate('/profile') },
            ].map(s => (
              <button key={s.label} onClick={s.onClick||undefined} style={{
                background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.08)',
                borderRadius:12, padding:'12px 8px',
                cursor:s.onClick?'pointer':'default', textAlign:'center',
              }}>
                <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:8, letterSpacing:2, color:'rgba(240,237,230,0.3)', marginBottom:6 }}>{s.label}</div>
                <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:26, fontWeight:700, color:s.color, lineHeight:1, textShadow:`0 0 15px ${s.color}50` }}>{s.value}</div>
              </button>
            ))}
          </div>
        )}

        {/* TEST MODE — quick grant panel */}
        {TEST_MODE && isSignedIn && (
          <div style={{ marginBottom:20, background:'rgba(245,158,11,0.06)', border:'2px solid rgba(245,158,11,0.25)', borderRadius:14, padding:'16px' }}>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:9, letterSpacing:3, color:'rgba(245,158,11,0.6)', marginBottom:12 }}>
              ⚠ TEST MODE — GET FREE PULLS
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[['CoreClaw','⚙️','/coreclaw'],['PremierClaw','⭐','/premierclaw'],['UltraClaw','💎','/ultraclaw'],['QuantumClaw','⚡','/quantumclaw']].map(([tier, icon, path]) => (
                <TestPullButton key={tier} tier={tier} style={{ padding:'10px', fontSize:11 }} onGranted={() => navigate(path)}/>
              ))}
            </div>
          </div>
        )}

        {/* DAILY PULL */}
        {isSignedIn && (
          <div style={{ marginBottom:20 }}>
            <DailyPull onClaimed={() => {}}/>
          </div>
        )}

        {/* PULLS READY — prominent section */}
        {isSignedIn && user && totalPulls > 0 && (
          <div style={{ marginBottom:20, animation:'fadeUp 0.3s ease' }}>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:9, letterSpacing:4, color:'rgba(245,158,11,0.5)', marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#F59E0B', boxShadow:'0 0 8px #F59E0B', animation:'neonPulse 1s infinite' }}/>
              READY TO PULL
            </div>
            {Object.entries(TIER_CFG).map(([tier, cfg]) => {
              const count = user[cfg.pullKey] || 0
              if (!count) return null
              return (
                <button key={tier} onClick={() => { resumeAudio(); navigate(cfg.path) }} style={{
                  width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'14px 18px', background:cfg.bg, border:`2px solid ${cfg.border}`,
                  borderRadius:14, cursor:'pointer', marginBottom:8,
                  boxShadow:`0 0 20px ${cfg.color}20`,
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontSize:28 }}>{cfg.icon}</span>
                    <div style={{ textAlign:'left' }}>
                      <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:20, fontWeight:700, color:'#F0EDE6', letterSpacing:1 }}>{tier}</div>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:cfg.neon }}>{cfg.price} per pull</div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:36, fontWeight:700, color:cfg.neon, lineHeight:1, textShadow:`0 0 15px ${cfg.neon}` }}>{count}</div>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:`${cfg.neon}80` }}>PULL{count>1?'S':''}</div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* MACHINES GRID */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:9, letterSpacing:4, color:'rgba(240,237,230,0.25)', marginBottom:12 }}>
            {isSignedIn && totalPulls === 0 ? 'CHOOSE YOUR MACHINE' : 'ALL MACHINES'}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {Object.entries(TIER_CFG).map(([tier, cfg]) => {
              const pullCount = user?.[cfg.pullKey] || 0
              return (
                <button key={tier} onClick={() => { resumeAudio(); navigate(cfg.path) }} style={{
                  background:cfg.bg, border:`1px solid ${cfg.border}`,
                  borderRadius:14, padding:'16px 14px', cursor:'pointer', textAlign:'left',
                  position:'relative', overflow:'hidden', transition:'all 0.2s',
                  boxShadow: pullCount > 0 ? `0 0 20px ${cfg.color}30` : 'none',
                }}>
                  {pullCount > 0 && (
                    <div style={{ position:'absolute', top:8, right:8, background:cfg.neon, color:'#0a0a0a', fontFamily:"'Oswald',sans-serif", fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:8, letterSpacing:1 }}>
                      {pullCount} READY
                    </div>
                  )}
                  <div style={{ fontSize:32, marginBottom:8 }}>{cfg.icon}</div>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:20, fontWeight:700, color:'#F0EDE6', letterSpacing:1, marginBottom:2 }}>{tier}</div>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:16, fontWeight:600, color:cfg.neon, textShadow:`0 0 10px ${cfg.neon}50` }}>{cfg.price}<span style={{ fontSize:10, opacity:0.6 }}> /pull</span></div>
                </button>
              )
            })}
          </div>
        </div>

        {/* WALLET NUDGE */}
        {isSignedIn && user && user.wallet_cents > 0 && totalPulls === 0 && (
          <button onClick={() => navigate('/wallet')} style={{
            width:'100%', marginBottom:20, padding:'14px 18px',
            background:'rgba(52,211,153,0.08)', border:'2px solid rgba(52,211,153,0.25)',
            borderRadius:14, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center',
          }}>
            <div>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, letterSpacing:2, color:'rgba(52,211,153,0.6)', marginBottom:2 }}>WALLET BALANCE</div>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:24, fontWeight:700, color:'#34D399', textShadow:'0 0 10px rgba(52,211,153,0.5)' }}>${walletDollars}</div>
            </div>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:12, color:'rgba(52,211,153,0.6)', letterSpacing:2 }}>USE FOR PULLS →</div>
          </button>
        )}

        {/* LIVE FEED */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:9, letterSpacing:4, color:'rgba(240,237,230,0.25)', marginBottom:12 }}>LIVE PULLS</div>
          <LiveFeed compact/>
        </div>

        {/* GUEST CTA */}
        {!isSignedIn && (
          <div style={{ textAlign:'center', padding:'32px 20px', background:'rgba(245,158,11,0.06)', border:'2px solid rgba(245,158,11,0.2)', borderRadius:16, boxShadow:'0 0 40px rgba(245,158,11,0.08)' }}>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:36, fontWeight:700, color:'#FCD34D', letterSpacing:2, marginBottom:8, animation:'neonPulse 2s ease-in-out infinite' }}>START COLLECTING</div>
            <div style={{ fontFamily:"'Lato',sans-serif", fontSize:12, color:'rgba(240,237,230,0.4)', marginBottom:24, lineHeight:1.7 }}>
              Pull PSA/BGS graded cards. Swap for real money. Sell on the marketplace. Cash out to your debit card.
            </div>
            <SignInButton mode="modal">
              <button onClick={() => resumeAudio()} style={{ padding:'16px 40px', background:'linear-gradient(135deg,rgba(245,158,11,0.3),rgba(245,158,11,0.1))', border:'2px solid rgba(245,158,11,0.6)', borderRadius:12, color:'#FCD34D', fontFamily:"'Oswald',sans-serif", fontSize:22, fontWeight:700, letterSpacing:3, cursor:'pointer', boxShadow:'0 0 30px rgba(245,158,11,0.3)' }}>
                SIGN IN FREE →
              </button>
            </SignInButton>
          </div>
        )}
      </div>
    </div>
  )
}
