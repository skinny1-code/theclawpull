import { useState, useEffect, useRef } from 'react'
import { RARITY_CFG } from '../lib/constants.js'

const TIER_ICON = { CoreClaw:'⚙️', PremierClaw:'⭐', UltraClaw:'💎', QuantumClaw:'⚡' }

export default function LiveFeed({ apiFetch }) {
  const [feed, setFeed] = useState([])
  const [newItem, setNewItem] = useState(null)
  const timerRef = useRef(null)

  const loadFeed = async () => {
    try {
      const { feed: items } = await apiFetch('/api/feed')
      setFeed(items || [])
    } catch {}
  }

  useEffect(() => {
    loadFeed()
    // Poll every 8 seconds
    const interval = setInterval(loadFeed, 8000)
    return () => clearInterval(interval)
  }, [])

  // Highlight newest item
  useEffect(() => {
    if (!feed.length) return
    setNewItem(feed[0]?.nft_token)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setNewItem(null), 3000)
  }, [feed[0]?.nft_token])

  if (!feed.length) return null

  const timeAgo = (ts) => {
    const s = Math.floor((Date.now() - new Date(ts)) / 1000)
    if (s < 60) return `${s}s ago`
    if (s < 3600) return `${Math.floor(s/60)}m ago`
    return `${Math.floor(s/3600)}h ago`
  }

  return (
    <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ width:7, height:7, borderRadius:'50%', background:'#34D399', boxShadow:'0 0 6px #34D399', animation:'pulse 2s ease-in-out infinite' }}/>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:2, color:'rgba(240,237,230,0.4)' }}>LIVE PULLS</span>
      </div>

      {/* Feed items */}
      <div style={{ maxHeight:200, overflowY:'auto' }}>
        {feed.slice(0,8).map((item, i) => {
          const cfg = RARITY_CFG[item.card_rarity] || RARITY_CFG.Common
          const isNew = item.nft_token === newItem
          return (
            <div key={item.nft_token || i} style={{
              display:'flex', alignItems:'center', gap:10, padding:'8px 16px',
              borderBottom:'1px solid rgba(255,255,255,0.03)',
              background: isNew ? `${cfg.dimBg}` : 'transparent',
              transition:'background 0.5s ease',
              animation: isNew ? 'fadeIn 0.4s ease' : 'none',
            }}>
              <div style={{ fontSize:16, width:28, height:28, background:'rgba(0,0,0,0.3)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {item.card_emoji || '🃏'}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"'Lato',sans-serif", fontSize:11, color:'#F0EDE6', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {item.card_name}
                </div>
                <div style={{ display:'flex', gap:6, alignItems:'center', marginTop:2 }}>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:cfg.color }}>{item.card_rarity}</span>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:'rgba(240,237,230,0.2)' }}>·</span>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:'rgba(240,237,230,0.3)' }}>{TIER_ICON[item.claw_tier]} {item.claw_tier}</span>
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:13, fontWeight:600, color:cfg.color }}>${(item.card_fmv||0).toLocaleString()}</div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:'rgba(240,237,230,0.2)' }}>{timeAgo(item.pulled_at)}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
