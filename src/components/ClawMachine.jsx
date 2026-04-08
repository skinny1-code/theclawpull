import { useState, useEffect, useRef } from 'react'
import { RARITY_CFG } from '../lib/constants.js'

const PHASES = { IDLE:'idle', DESC:'descending', GRAB:'grabbing', ASC:'ascending', DELIVER:'delivering' }
const CONF_COLORS = ['#C9A84C','#F0D080','#A78BFA','#60A5FA','#F472B6','#34D399']
const LIGHTS = 16

export default function ClawMachine({ poolSize=0, onPull, disabled, pulling }) {
  const [cableH, setCableH]     = useState(22)
  const [clawOpen, setClawOpen] = useState(true)
  const [phase, setPhase]       = useState(PHASES.IDLE)
  const [winFlash, setWinFlash] = useState(false)
  const [confetti, setConfetti] = useState([])
  const [lightTick, setLightTick] = useState(0)
  const [grabbedEmoji, setGrabbedEmoji] = useState(null)
  const timers = useRef([])
  const lightTimer = useRef(null)

  useEffect(() => {
    lightTimer.current = setInterval(() => setLightTick(n => n+1), 280)
    return () => clearInterval(lightTimer.current)
  }, [])

  // Trigger animation when parent sets pulling=true
  useEffect(() => {
    if (!pulling) {
      // Reset after parent signals done
      return
    }
    runAnimation()
  }, [pulling])

  const addTimer = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t) }
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }

  function runAnimation() {
    clearTimers()
    setClawOpen(true)
    setWinFlash(false)
    setConfetti([])
    setGrabbedEmoji(null)

    const targetH = 150 + Math.random() * 25

    // Descend
    setPhase(PHASES.DESC)
    let h = 22
    const step = (targetH - 22) / 40
    const down = setInterval(() => {
      h = Math.min(h + step, targetH)
      setCableH(h)
      if (h >= targetH) clearInterval(down)
    }, 18)

    // Grab
    addTimer(() => {
      setPhase(PHASES.GRAB)
      setClawOpen(false)
      setWinFlash(true)
      setGrabbedEmoji(['⚾','🏀','🔥','⚡','👾','💧','💎','🃏'][Math.floor(Math.random()*8)])
      addTimer(() => setWinFlash(false), 500)
    }, 760)

    // Ascend
    addTimer(() => {
      setPhase(PHASES.ASC)
      let h2 = targetH
      const upStep = (targetH - 22) / 35
      const up = setInterval(() => {
        h2 = Math.max(h2 - upStep, 22)
        setCableH(h2)
        if (h2 <= 22) clearInterval(up)
      }, 18)
    }, 1200)

    // Deliver + confetti
    addTimer(() => {
      setPhase(PHASES.DELIVER)
      setConfetti(Array.from({length:18},(_,i)=>i))
      addTimer(() => setConfetti([]), 1200)
    }, 2200)

    // Reset
    addTimer(() => {
      setPhase(PHASES.IDLE)
      setClawOpen(true)
      setCableH(22)
      setGrabbedEmoji(null)
    }, 4200)
  }

  const canPull = phase === PHASES.IDLE && !disabled && poolSize > 0 && !pulling
  const isActive = phase !== PHASES.IDLE

  return (
    <div style={{ position:'relative', userSelect:'none' }}>
      <div style={{
        background:'linear-gradient(180deg,#0E0A1A 0%,#110D20 100%)',
        border:'2px solid rgba(201,168,76,0.2)', borderRadius:18,
        boxShadow:'0 0 0 1px rgba(255,255,255,0.04), 0 24px 60px rgba(0,0,0,0.6)',
        overflow:'hidden', position:'relative',
      }}>
        {/* Marquee lights */}
        <div style={{ position:'absolute',inset:0,borderRadius:18,pointerEvents:'none',zIndex:20,overflow:'hidden' }}>
          {['top','bottom'].map((pos,pi) => (
            <div key={pos} style={{ position:'absolute',[pos]:6,left:12,right:12,display:'flex',justifyContent:'space-between' }}>
              {Array.from({length:LIGHTS}).map((_,i) => {
                const on = (i + lightTick + pi) % 2 === 0
                const col = pi === 0 ? '#C9A84C' : '#A78BFA'
                return <div key={i} style={{ width:7,height:7,borderRadius:'50%',background:on?col:`${col}25`,boxShadow:on?`0 0 8px ${col}, 0 0 16px ${col}55`:undefined,transition:'all 0.25s' }}/>
              })}
            </div>
          ))}
        </div>

        {/* Header */}
        <div style={{ textAlign:'center', paddingTop:22, paddingBottom:10, position:'relative', zIndex:5 }}>
          <div className="gold-text" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, letterSpacing:5, fontWeight:600 }}>CARD CLAW CO</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:3, color:'rgba(240,237,230,0.25)', marginTop:2 }}>GRADED CARD RETRIEVAL</div>
        </div>

        {/* Glass cabinet */}
        <div style={{ margin:'0 16px 14px', position:'relative' }}>
          <div style={{
            background:'linear-gradient(180deg,rgba(14,10,26,0.95),rgba(10,8,20,0.98))',
            borderRadius:12, border:'1px solid rgba(255,255,255,0.07)',
            boxShadow:'inset 0 0 40px rgba(0,0,0,0.7)',
            height:260, overflow:'hidden', position:'relative',
          }}>
            {/* Flash overlay */}
            {winFlash && <div style={{ position:'absolute',inset:0,background:'rgba(255,255,255,0.12)',zIndex:15,borderRadius:12,animation:'winFlash 0.5s ease forwards',pointerEvents:'none' }}/>}

            {/* Spotlight */}
            <div style={{ position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:100,height:'100%',background:'linear-gradient(180deg,rgba(255,255,240,0.04),transparent)',pointerEvents:'none',zIndex:2 }}/>

            {/* Rail */}
            <div style={{ position:'absolute',top:18,left:20,right:20,height:5,background:'linear-gradient(90deg,rgba(100,80,40,0.4),rgba(201,168,76,0.5),rgba(100,80,40,0.4))',borderRadius:3,zIndex:8,boxShadow:'0 2px 6px rgba(0,0,0,0.5)' }}>
              {[15,85].map(p => <div key={p} style={{ position:'absolute',top:'50%',left:`${p}%`,transform:'translate(-50%,-50%)',width:7,height:7,borderRadius:'50%',background:'radial-gradient(circle at 35% 35%,#888,#333)',border:'1px solid rgba(0,0,0,0.5)' }}/>)}
            </div>

            {/* Cable */}
            <div style={{ position:'absolute',top:21,left:'50%',transform:'translateX(-50%)',width:3,height:cableH,background:'linear-gradient(180deg,#4A3A20,#6B5B35,#4A3A20)',borderRadius:2,zIndex:9,boxShadow:'1px 0 3px rgba(0,0,0,0.5)' }}/>

            {/* Claw */}
            <div style={{ position:'absolute',top:21+cableH-6,left:'50%',transform:'translateX(-50%)',zIndex:10,width:52 }}>
              <div style={{ width:52,height:16,margin:'0 auto',background:'linear-gradient(180deg,#2A2040,#1A1530)',borderRadius:'6px 6px 0 0',border:'1px solid rgba(201,168,76,0.2)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <div style={{ width:8,height:8,borderRadius:'50%',background:'radial-gradient(circle at 35% 35%,#C9A84C,#7A5A10)',boxShadow:'0 0 6px rgba(201,168,76,0.6)' }}/>
              </div>
              <div style={{ display:'flex',justifyContent:'space-between',width:52,margin:'0 auto' }}>
                {[[-30,-8,2,'0 0 5px 0'],['0','0',0,'0 0 0 0'],[30,8,2,'0 0 0 5px']].map(([open,closed,ml,br],i) => (
                  <div key={i} style={{ width:5,height:i===1?36:30,background:'linear-gradient(180deg,#3A3050,#2A2040)',borderRadius:br,border:'1px solid rgba(201,168,76,0.15)',transformOrigin:'top center',transform:`rotate(${clawOpen?open:closed}deg)`,transition:'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',marginLeft:i===0?ml:0,marginRight:i===2?ml:0 }}/>
                ))}
              </div>
              {/* Grabbed card */}
              {grabbedEmoji && (phase===PHASES.ASC||phase===PHASES.DELIVER) && (
                <div style={{ position:'absolute',top:38,left:'50%',transform:'translateX(-50%)',width:32,height:42,background:'rgba(201,168,76,0.1)',border:'1px solid #C9A84C',borderRadius:5,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,zIndex:11,boxShadow:'0 0 16px rgba(201,168,76,0.5)',animation:'fadeIn 0.2s ease' }}>
                  {grabbedEmoji}
                </div>
              )}
            </div>

            {/* Pool indicator dots */}
            <div style={{ position:'absolute',bottom:10,left:12,right:12,display:'flex',flexWrap:'wrap',gap:5,justifyContent:'center',zIndex:3 }}>
              {Array.from({length:Math.min(poolSize,18)}).map((_,i) => (
                <div key={i} style={{ width:8,height:8,borderRadius:2,background:'rgba(201,168,76,0.2)',border:'1px solid rgba(201,168,76,0.3)' }}/>
              ))}
              {poolSize > 18 && <div style={{ fontSize:9,fontFamily:"'DM Mono',monospace",color:'rgba(240,237,230,0.2)' }}>+{poolSize-18}</div>}
              {poolSize === 0 && <div style={{ fontSize:12,fontFamily:"'Cormorant Garamond',serif",color:'rgba(240,237,230,0.2)',fontStyle:'italic',padding:'16px 0' }}>Pool is empty</div>}
            </div>

            {/* Confetti */}
            {confetti.map(i => (
              <div key={i} style={{ position:'absolute',top:'25%',left:`${10+Math.random()*80}%`,width:5+Math.random()*5,height:5+Math.random()*5,borderRadius:Math.random()>0.5?'50%':2,background:CONF_COLORS[i%CONF_COLORS.length],zIndex:18,pointerEvents:'none',animation:`confettiFall ${0.8+Math.random()*0.8}s ease-in ${Math.random()*0.4}s forwards` }}/>
            ))}
          </div>
        </div>

        {/* Pull button */}
        <div style={{ padding:'0 16px 20px' }}>
          <button onClick={onPull} disabled={!canPull} style={{
            width:'100%', padding:'15px',
            background:canPull?'linear-gradient(135deg,rgba(201,168,76,0.22),rgba(201,168,76,0.1))':'rgba(255,255,255,0.03)',
            border:`1px solid ${canPull?'rgba(201,168,76,0.45)':'rgba(255,255,255,0.06)'}`,
            borderRadius:11, cursor:canPull?'pointer':'not-allowed',
            fontFamily:"'Cormorant Garamond',serif", fontSize:17, fontWeight:600, letterSpacing:4,
            color:canPull?'#C9A84C':'rgba(240,237,230,0.18)',
            textShadow:canPull?'0 0 20px rgba(201,168,76,0.5)':'none',
            animation:canPull?'goldGlow 2.5s ease-in-out infinite':'none',
            display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          }}>
            {pulling && <span style={{ width:14,height:14,borderRadius:'50%',border:'1.5px solid rgba(201,168,76,0.3)',borderTop:'1.5px solid #C9A84C',display:'inline-block',animation:'spin360 0.8s linear infinite' }}/>}
            {pulling ? (
              phase===PHASES.DESC?'Descending…':phase===PHASES.GRAB?'Grabbing…':phase===PHASES.ASC?'Retrieving…':phase===PHASES.DELIVER?'Delivering…':'Pulling…'
            ) : disabled ? 'Insufficient Credits' : poolSize===0 ? 'Pool Empty' : 'PULL  ·  1 Credit'}
          </button>
          <div style={{ textAlign:'center',marginTop:8,fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(240,237,230,0.18)',letterSpacing:1 }}>
            $1 per pull · 5% Legendary · 15% Ultra Rare · 30% Rare
          </div>
        </div>
      </div>
    </div>
  )
}
