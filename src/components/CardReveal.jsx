import { useState, useEffect } from 'react'
import { playDrumroll, playFanfare, playThunder } from '../lib/casinoAudio.js'
import { RarityBadge } from './UI.jsx'

// Tiered reveal — each tier more extravagant
// CoreClaw:    simple card flip + basic fanfare
// PremierClaw: drumroll build + sparkle burst + chord fanfare
// UltraClaw:   drumroll + spotlight + orchestral build + confetti
// QuantumClaw: darkness → thunder → spotlight → card materializes → gold explosion

const TIER_REVEAL = {
  CoreClaw:    { drumroll:false, spotlight:false, thunder:false, particles:20,  color:'#60A5FA', delay:800  },
  PremierClaw: { drumroll:true,  spotlight:false, thunder:false, particles:50,  color:'#34D399', delay:2500 },
  UltraClaw:   { drumroll:true,  spotlight:true,  thunder:false, particles:100, color:'#A78BFA', delay:3500 },
  QuantumClaw: { drumroll:true,  spotlight:true,  thunder:true,  particles:200, color:'#F59E0B', delay:5000 },
}

// Confetti particle
function Particle({ color, x, y, rotation, size, drift }) {
  return (
    <div style={{
      position:'absolute',
      left: `${x}%`,
      top: `${y}%`,
      width: size,
      height: size * 0.5,
      background: color,
      borderRadius: 2,
      transform: `rotate(${rotation}deg)`,
      animation: `confettiFall ${1.5 + Math.random()}s ease-in ${Math.random() * 0.5}s forwards`,
    }}/>
  )
}

export default function CardReveal({ card, tier, onClose, onPullAgain, pullsLeft }) {
  if (!card) return null
  const cfg = TIER_REVEAL[tier] || TIER_REVEAL.CoreClaw
  const [phase, setPhase] = useState('drumroll') // drumroll → reveal → celebrate
  const [particles, setParticles] = useState([])
  const [darkness, setDarkness] = useState(tier === 'QuantumClaw' ? 1 : 0)

  const RARITY_GLOW = {
    Legendary:  '#F59E0B',
    'Ultra Rare': '#A78BFA',
    Rare:       '#60A5FA',
    Common:     '#9CA3AF',
  }
  const glow = RARITY_GLOW[card?.rarity] || cfg.color

  useEffect(() => {
    const run = async () => {
      // Phase 1: Thunder for Quantum
      if (tier === 'QuantumClaw') {
        playThunder()
        await delay(800)
        setDarkness(0.85)
        await delay(400)
      }

      // Phase 2: Drumroll
      if (cfg.drumroll) {
        playDrumroll(tier, () => {})
        await delay(cfg.delay - 300)
      } else {
        await delay(cfg.delay)
      }

      // Phase 3: Reveal
      setPhase('reveal')
      playFanfare(tier)

      // Phase 4: Particles
      await delay(300)
      const colors = ['#F59E0B','#EF4444','#3B82F6','#10B981','#8B5CF6','#EC4899','#FBBF24','#34D399']
      setParticles(Array.from({ length: cfg.particles }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        color: colors[i % colors.length],
        rotation: Math.random() * 360,
        size: 4 + Math.random() * 8,
        drift: (Math.random() - 0.5) * 20,
      })))

      await delay(2000)
      setPhase('celebrate')
    }
    run()
  }, [])

  const isReveal = phase === 'reveal' || phase === 'celebrate'

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:500,
      background: darkness > 0
        ? `rgba(0,0,0,${darkness})`
        : 'rgba(0,0,0,0.92)',
      backdropFilter:'blur(12px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:20,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap');
        @keyframes confettiFall {
          from { transform: translateY(0) rotate(var(--rot)) scale(1); opacity:1 }
          to   { transform: translateY(600px) rotate(calc(var(--rot) + 720deg)) scale(0); opacity:0 }
        }
        @keyframes cardFlipIn {
          0%   { transform:perspective(600px) rotateY(90deg) scale(0.8); opacity:0 }
          60%  { transform:perspective(600px) rotateY(-8deg) scale(1.05); opacity:1 }
          100% { transform:perspective(600px) rotateY(0deg) scale(1); opacity:1 }
        }
        @keyframes spotlightPulse {
          0%,100% { opacity:0.6 } 50% { opacity:1 }
        }
        @keyframes goldExplosion {
          0%   { transform:scale(0.3); opacity:0 }
          50%  { transform:scale(1.2); opacity:1 }
          100% { transform:scale(1);   opacity:1 }
        }
        @keyframes drumrollText {
          0%,100% { transform:scale(1); opacity:1 }
          50%     { transform:scale(1.05); opacity:0.8 }
        }
        @keyframes shimmer {
          0%   { background-position:-400px 0 }
          100% { background-position:400px 0 }
        }
        @keyframes float {
          0%,100% { transform:translateY(0) } 50% { transform:translateY(-8px) }
        }
      `}</style>

      {/* Confetti particles */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden' }}>
        {particles.map(p => (
          <div key={p.id} style={{
            position:'absolute',
            left:`${p.x}%`, top:'-5%',
            width:p.size, height:p.size*0.5,
            background:p.color, borderRadius:2,
            animation:`confettiFall ${1.5+Math.random()}s ease-in ${Math.random()*0.8}s forwards`,
            transform:`rotate(${p.rotation}deg)`,
          }}/>
        ))}
      </div>

      {/* Spotlight for Ultra/Quantum */}
      {cfg.spotlight && isReveal && (
        <div style={{
          position:'fixed', inset:0, pointerEvents:'none',
          background:`radial-gradient(ellipse 300px 400px at 50% 45%,transparent 0%,rgba(0,0,0,0.7) 100%)`,
          animation:'spotlightPulse 2s ease-in-out infinite',
        }}/>
      )}

      {/* Drumroll phase */}
      {!isReveal && (
        <div style={{ textAlign:'center', zIndex:10 }}>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize: tier === 'QuantumClaw' ? 48 : tier === 'UltraClaw' ? 40 : 32, fontWeight:700, color:cfg.color, letterSpacing:4, textShadow:`0 0 30px ${cfg.color}`, animation:'drumrollText 0.4s ease-in-out infinite', marginBottom:20 }}>
            {tier === 'QuantumClaw' ? '⚡ QUANTUM PULL ⚡' :
             tier === 'UltraClaw'   ? '💎 ULTRA PULL 💎' :
             tier === 'PremierClaw' ? '⭐ PREMIER PULL ⭐' :
             '🎰 PULL REVEAL'}
          </div>
          {cfg.drumroll && (
            <div style={{ display:'flex', justifyContent:'center', gap:6 }}>
              {[...Array(tier==='QuantumClaw'?8:tier==='UltraClaw'?6:4)].map((_,i) => (
                <div key={i} style={{ width:6, height:20+(i%3)*8, background:cfg.color, borderRadius:3, animation:`drumrollText ${0.3+i*0.05}s ease ${i*0.08}s infinite alternate`, opacity:0.6+i*0.05 }}/>
              ))}
            </div>
          )}
          {tier === 'QuantumClaw' && (
            <div style={{ marginTop:16, fontFamily:"'Oswald',sans-serif", fontSize:14, color:'rgba(245,158,11,0.6)', letterSpacing:3 }}>INVESTMENT GRADE PULL</div>
          )}
        </div>
      )}

      {/* Card reveal */}
      {isReveal && (
        <div style={{
          animation: tier === 'QuantumClaw' ? 'goldExplosion 0.6s cubic-bezier(0.34,1.56,0.64,1)'
                   : 'cardFlipIn 0.7s cubic-bezier(0.34,1.56,0.64,1)',
          zIndex:10, maxWidth:360, width:'100%',
        }}>
          {/* Tier banner */}
          <div style={{ textAlign:'center', marginBottom:16 }}>
            <div style={{
              display:'inline-block',
              fontFamily:"'Oswald',sans-serif", fontSize:11, fontWeight:700,
              letterSpacing:4, color:cfg.color,
              background:`${cfg.color}15`, border:`1px solid ${cfg.color}40`,
              padding:'4px 18px', borderRadius:20,
              textShadow:`0 0 15px ${cfg.color}`,
              boxShadow:`0 0 20px ${cfg.color}30`,
            }}>
              ◆ {tier.toUpperCase().replace('CLAW',' CLAW')} ◆
            </div>
          </div>

          {/* Card container */}
          <div style={{
            background:`linear-gradient(135deg,${glow}18,rgba(0,0,0,0.6))`,
            border:`2px solid ${glow}`,
            borderRadius:20,
            padding:'24px 20px',
            textAlign:'center',
            boxShadow:`0 0 60px ${glow}50, 0 0 120px ${glow}20, inset 0 1px 0 rgba(255,255,255,0.1)`,
            position:'relative', overflow:'hidden',
          }}>
            {/* Shimmer overlay */}
            <div style={{
              position:'absolute', inset:0,
              background:`linear-gradient(90deg,transparent,${glow}15,transparent)`,
              backgroundSize:'800px 100%',
              animation:'shimmer 2.5s infinite',
              pointerEvents:'none',
            }}/>

            {/* Card image */}
            <div style={{
              width:120, height:160, margin:'0 auto 16px',
              borderRadius:12, overflow:'hidden',
              border:`3px solid ${glow}`,
              boxShadow:`0 0 30px ${glow}60, 0 8px 32px rgba(0,0,0,0.5)`,
              animation:'float 3s ease-in-out infinite',
              background:'rgba(0,0,0,0.4)',
            }}>
              {card?.image_url
                ? <img src={card.image_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" onError={e=>{e.target.style.display='none'}}/>
                : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:52 }}>🃏</div>
              }
            </div>

            {/* Card name */}
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:24, fontWeight:700, color:'#F0EDE6', marginBottom:8, letterSpacing:1, lineHeight:1.2 }}>
              {card?.name}
            </div>

            {/* Rarity + grade row */}
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:10, marginBottom:12 }}>
              <RarityBadge rarity={card?.rarity}/>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:'rgba(240,237,230,0.4)', background:'rgba(0,0,0,0.3)', padding:'2px 8px', borderRadius:4 }}>{card?.grade}</span>
            </div>

            {/* FMV — big number */}
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:52, fontWeight:700, color:glow, lineHeight:1, textShadow:`0 0 20px ${glow}`, marginBottom:4 }}>
              ${(card?.fmv||0).toLocaleString()}
            </div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'rgba(240,237,230,0.3)', letterSpacing:2, marginBottom:12 }}>FAIR MARKET VALUE</div>

            {/* Scarcity */}
            {card?.total_pulls !== undefined && card.total_pulls <= 3 && (
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:'#F59E0B', letterSpacing:2, marginBottom:12, textShadow:'0 0 10px #F59E0B' }}>
                🔥 {card.total_pulls === 0 ? 'FIRST EVER PULL OF THIS CARD' : `ONLY PULLED ${card.total_pulls} TIME${card.total_pulls===1?'':'S'} EVER`}
              </div>
            )}

            {/* NFT token */}
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'rgba(56,189,248,0.5)', marginBottom:16 }}>
              ◈ NFT: {card?.nft_token_id}
            </div>

            {/* Action buttons */}
            <div style={{ display:'flex', gap:10 }}>
              {pullsLeft > 0 && (
                <button onClick={onPullAgain} style={{
                  flex:1, padding:'12px',
                  background:`${cfg.color}20`, border:`1px solid ${cfg.color}50`,
                  borderRadius:10, color:cfg.color,
                  fontFamily:"'Oswald',sans-serif", fontSize:14, fontWeight:600, letterSpacing:2,
                  cursor:'pointer',
                }}>
                  PULL AGAIN ({pullsLeft})
                </button>
              )}
              <button onClick={onClose} style={{
                flex:2, padding:'12px',
                background:`linear-gradient(135deg,${glow}30,${glow}10)`,
                border:`1.5px solid ${glow}60`, borderRadius:10, color:glow,
                fontFamily:"'Oswald',sans-serif", fontSize:14, fontWeight:600, letterSpacing:2,
                cursor:'pointer',
                boxShadow:`0 0 20px ${glow}30`,
              }}>
                {pullsLeft > 0 ? 'VIEW CARD' : '🎉 AWESOME!'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const delay = ms => new Promise(r => setTimeout(r, ms))
