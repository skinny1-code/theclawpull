import { useState, useEffect, useRef } from 'react'
import { playClawDescend, playClawGrab, playCoinInsert } from '../lib/casinoAudio.js'

const TIER_MACHINE = {
  CoreClaw: {
    cabinetGrad: 'linear-gradient(180deg,#1e3a5f 0%,#0a1628 40%,#061020 100%)',
    accentColor: '#3B82F6', neonColor: '#60A5FA', clawColor: '#94A3B8',
    glowColor: 'rgba(59,130,246,0.6)', lightColor: '#3B82F6',
    label: 'CORE CLAW', stars: '★', machineIcon: '⚙️',
  },
  PremierClaw: {
    cabinetGrad: 'linear-gradient(180deg,#065f46 0%,#0a2010 40%,#031208 100%)',
    accentColor: '#10B981', neonColor: '#34D399', clawColor: '#A7F3D0',
    glowColor: 'rgba(16,185,129,0.6)', lightColor: '#10B981',
    label: 'PREMIER CLAW', stars: '★★', machineIcon: '⭐',
  },
  UltraClaw: {
    cabinetGrad: 'linear-gradient(180deg,#2e1065 0%,#120a28 40%,#080412 100%)',
    accentColor: '#8B5CF6', neonColor: '#A78BFA', clawColor: '#DDD6FE',
    glowColor: 'rgba(139,92,246,0.7)', lightColor: '#8B5CF6',
    label: 'ULTRA CLAW', stars: '★★★', machineIcon: '💎',
  },
  QuantumClaw: {
    cabinetGrad: 'linear-gradient(180deg,#78350f 0%,#1a1000 40%,#0c0800 100%)',
    accentColor: '#F59E0B', neonColor: '#FCD34D', clawColor: '#FDE68A',
    glowColor: 'rgba(245,158,11,0.8)', lightColor: '#F59E0B',
    label: 'QUANTUM CLAW', stars: '★★★★', machineIcon: '⚡',
  },
}

function ClawSVG({ tier, phase, color }) {
  const fingers = { CoreClaw:2, PremierClaw:3, UltraClaw:4, QuantumClaw:5 }[tier] || 2
  const grabbing = phase === 'grabbing' || phase === 'rising' || phase === 'delivering'
  const spreadAngle = grabbing ? 8 : 28
  return (
    <svg width="60" height="50" viewBox="0 0 60 50" style={{ overflow:'visible', filter:`drop-shadow(0 0 8px ${color})` }}>
      <line x1="30" y1="0" x2="30" y2="12" stroke={color} strokeWidth="4" strokeLinecap="round"/>
      <circle cx="30" cy="12" r="6" fill={color} opacity="0.9"/>
      {Array.from({length: fingers}).map((_, i) => {
        const step = (spreadAngle * 2) / (fingers - 1 || 1)
        const angle = -spreadAngle + i * step
        const rad = (angle - 90) * Math.PI / 180
        const len = 22 + (tier === 'QuantumClaw' ? 6 : tier === 'UltraClaw' ? 4 : 0)
        const x2 = 30 + Math.cos(rad) * len
        const y2 = 12 + Math.sin(rad) * len
        const cx = 30 + Math.cos(rad) * len * 0.7
        const cy = 12 + Math.sin(rad) * len * 0.7
        return <path key={i} d={`M30,12 Q${cx},${cy} ${x2},${y2}`} stroke={color} strokeWidth={tier==='QuantumClaw'?3.5:3} fill="none" strokeLinecap="round" style={{transition:'all 0.3s ease'}}/>
      })}
    </svg>
  )
}

function MarqueeLights({ color, active, count = 14 }) {
  return (
    <div style={{ position:'absolute',inset:0,pointerEvents:'none',borderRadius:16 }}>
      {Array.from({length:count}).map((_,i) => (
        <div key={i} style={{
          position:'absolute', width:8, height:8, borderRadius:'50%',
          background: active ? color : 'rgba(255,255,255,0.15)',
          boxShadow: active ? `0 0 8px ${color},0 0 16px ${color}` : 'none',
          top: i<4 ? 8 : i<8 ? `${(i-4)*22+8}%` : i<11 ? 'calc(100% - 12px)' : `${(14-i)*22+8}%`,
          left: i<4 ? `${i*25+4}%` : i<8 ? 'calc(100% - 12px)' : i<11 ? `${(11-i)*33}%` : 6,
          animation: active ? `blink ${0.4+(i*0.07)%0.8}s ease-in-out ${i*0.1}s infinite alternate` : 'none',
          transition:'all 0.3s',
        }}/>
      ))}
    </div>
  )
}

export default function CasinoClawMachine({ tier, onPullComplete, disabled, pulls }) {
  const cfg = TIER_MACHINE[tier] || TIER_MACHINE.CoreClaw
  const [phase, setPhase] = useState('idle')
  const [clawY, setClawY] = useState(0)
  const [lightsOn, setLightsOn] = useState(false)
  const animRef = useRef(null)

  useEffect(() => {
    const interval = setInterval(() => setLightsOn(v => !v || Math.random() > 0.3), 600)
    return () => clearInterval(interval)
  }, [])

  const runPull = async () => {
    if (phase !== 'idle' || disabled || !pulls) return

    // KEY FIX: Fire API call immediately — parallel with animation
    const apiPromise = onPullComplete ? onPullComplete() : Promise.resolve()

    playCoinInsert()
    setPhase('inserting')
    await delay(600)

    setPhase('descending')
    playClawDescend(1.8)
    const t0 = Date.now()
    const desc = () => {
      const t = Math.min((Date.now()-t0)/1800, 1)
      setClawY(t)
      if (t < 1) animRef.current = requestAnimationFrame(desc)
    }
    animRef.current = requestAnimationFrame(desc)
    await delay(1800)

    setPhase('grabbing')
    playClawGrab()
    await delay(600)

    setPhase('rising')
    const t1 = Date.now()
    const rise = () => {
      const t = Math.max(1-(Date.now()-t1)/1500, 0)
      setClawY(t)
      if (t > 0) animRef.current = requestAnimationFrame(rise)
    }
    animRef.current = requestAnimationFrame(rise)
    await delay(1500)

    setPhase('delivering')

    // Wait for API to finish if not done yet (usually done by now)
    await apiPromise

    await delay(400)
    setPhase('idle')
    setClawY(0)
  }

  const glassH = 200
  const clawTop = 20 + clawY * (glassH - 80)
  const isActive = !disabled && pulls > 0
  const isRunning = phase !== 'idle'
  const tierPrice = { CoreClaw:'$25', PremierClaw:'$50', UltraClaw:'$100', QuantumClaw:'$500' }[tier]

  return (
    <div style={{ width:'100%', maxWidth:320, margin:'0 auto', userSelect:'none' }}>
      <style>{`
        @keyframes blink{from{opacity:0.3}to{opacity:1}}
        @keyframes marqueeScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes coinGlow{0%,100%{box-shadow:0 0 12px ${cfg.accentColor}}50%{box-shadow:0 0 28px ${cfg.accentColor},0 0 48px ${cfg.accentColor}}}
        @keyframes machineShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}
      `}</style>

      {/* Marquee header */}
      <div style={{ overflow:'hidden', background:`${cfg.accentColor}18`, border:`1px solid ${cfg.accentColor}40`, borderRadius:'10px 10px 0 0', padding:'6px 0', marginBottom:-1 }}>
        <div style={{ display:'flex', width:'200%', animation:'marqueeScroll 8s linear infinite', whiteSpace:'nowrap' }}>
          {[0,1].map(k => (
            <div key={k} style={{ flex:'0 0 50%', display:'flex', gap:40, paddingRight:40 }}>
              {['🎰 PULL TO WIN','✨ GRADED CARDS','💎 NFT OWNERSHIP','🏆 TOP COLLECTORS','🎰 PULL TO WIN','✨ GRADED CARDS'].map((t,i) => (
                <span key={i} style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, fontWeight:700, letterSpacing:2, color:cfg.neonColor }}>{t}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Cabinet */}
      <div style={{ background:cfg.cabinetGrad, border:`2px solid ${cfg.accentColor}60`, borderRadius:'0 0 16px 16px', padding:16, position:'relative', boxShadow:`0 0 40px ${cfg.glowColor},inset 0 0 60px rgba(0,0,0,0.5)`, animation:phase==='grabbing'?'machineShake 0.3s ease':'none' }}>
        <MarqueeLights color={cfg.lightColor} active={lightsOn||isRunning} count={16}/>

        <div style={{ textAlign:'center', marginBottom:10, position:'relative', zIndex:1 }}>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, fontWeight:700, letterSpacing:4, color:cfg.neonColor, textShadow:`0 0 10px ${cfg.neonColor}` }}>{cfg.label}</div>
          <div style={{ color:'#F59E0B', fontSize:12, letterSpacing:2 }}>{cfg.stars}</div>
        </div>

        {/* Glass */}
        <div style={{ height:glassH, background:'linear-gradient(180deg,rgba(0,0,0,0.8) 0%,rgba(0,20,40,0.9) 100%)', border:`2px solid ${cfg.accentColor}50`, borderRadius:10, position:'relative', overflow:'hidden', marginBottom:14, boxShadow:`inset 0 0 30px rgba(0,0,0,0.6),inset 0 0 10px ${cfg.accentColor}20` }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:60, background:'linear-gradient(180deg,rgba(255,255,255,0.04),transparent)', pointerEvents:'none', borderRadius:'8px 8px 0 0' }}/>
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:40, backgroundImage:`repeating-linear-gradient(0deg,${cfg.accentColor}10 0px,transparent 1px,transparent 12px),repeating-linear-gradient(90deg,${cfg.accentColor}10 0px,transparent 1px,transparent 12px)`, opacity:0.5 }}/>
          <div style={{ position:'absolute', bottom:12, left:0, right:0, display:'flex', justifyContent:'space-around', padding:'0 10px' }}>
            {[...Array(3)].map((_,i) => (
              <div key={i} style={{ width:36, height:50, background:`linear-gradient(135deg,${cfg.accentColor}30,rgba(0,0,0,0.5))`, border:`1px solid ${cfg.accentColor}40`, borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, opacity:0.5+i*0.15 }}>🃏</div>
            ))}
          </div>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:`${cfg.accentColor}40` }}/>
          <div style={{ position:'absolute', left:'50%', top:clawTop, transform:'translateX(-50%)', transition:phase==='idle'?'top 0.5s ease':'none', zIndex:10 }}>
            <div style={{ width:3, height:clawTop, background:`linear-gradient(180deg,${cfg.clawColor}80,${cfg.clawColor})`, position:'absolute', top:-clawTop, left:'50%', transform:'translateX(-50%)' }}/>
            <ClawSVG tier={tier} phase={phase} color={cfg.clawColor}/>
          </div>
          {phase === 'inserting' && <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:cfg.neonColor, letterSpacing:3, textShadow:`0 0 20px ${cfg.neonColor}` }}>INSERT COIN…</div></div>}
          {phase === 'delivering' && <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:`radial-gradient(circle,${cfg.accentColor}30 0%,transparent 70%)` }}><div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:cfg.neonColor, letterSpacing:3 }}>GOT ONE! 🎉</div></div>}
        </div>

        {/* Control panel */}
        <div style={{ background:'rgba(0,0,0,0.4)', border:`1px solid ${cfg.accentColor}30`, borderRadius:10, padding:'12px 16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:9, letterSpacing:2, color:'rgba(240,237,230,0.3)' }}>CREDITS</div>
            <div style={{ display:'flex', gap:6 }}>
              {[...Array(Math.min(pulls||0,5))].map((_,i) => <div key={i} style={{ width:10, height:10, borderRadius:'50%', background:cfg.neonColor, boxShadow:`0 0 8px ${cfg.neonColor}` }}/>)}
              {!pulls && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'rgba(240,237,230,0.2)' }}>NO PULLS</div>}
            </div>
          </div>
          <button onClick={runPull} disabled={!isActive||isRunning} style={{ width:'100%', padding:'14px', background:isActive&&!isRunning?`linear-gradient(135deg,${cfg.accentColor},${cfg.accentColor}80)`:'rgba(255,255,255,0.05)', border:`2px solid ${isActive?cfg.accentColor:'rgba(255,255,255,0.08)'}`, borderRadius:10, cursor:isActive&&!isRunning?'pointer':'not-allowed', fontFamily:"'Oswald',sans-serif", fontSize:18, fontWeight:700, letterSpacing:3, color:isActive&&!isRunning?'#0a0a0a':'rgba(240,237,230,0.2)', boxShadow:isActive&&!isRunning?`0 0 20px ${cfg.accentColor}`:'none', transition:'all 0.2s', animation:isActive&&!isRunning?`coinGlow 2s ease-in-out infinite`:'none' }}>
            {isRunning
              ? phase==='inserting'?'INSERTING…':phase==='descending'?'DESCENDING…':phase==='grabbing'?'⊂(◉‿◉)つ GRABBING…':phase==='rising'?'RISING…':'DELIVERING…'
              : isActive ? `🎰 PULL NOW` : `BUY A PULL · ${tierPrice}`
            }
          </button>
        </div>
      </div>
    </div>
  )
}

const delay = ms => new Promise(r => setTimeout(r, ms))
