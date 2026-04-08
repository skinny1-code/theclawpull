import { RARITY_CFG } from '../lib/constants.js'

export default function VaultStats({ vault, user }) {
  const live = vault.filter(c => !c.burned)
  const totalFMV = live.reduce((a,c) => a + (c.fmv || 0), 0)
  const bestCard = live.sort((a,b) => (b.fmv||0) - (a.fmv||0))[0]
  const legendaryCount = live.filter(c => c.rarity === 'Legendary').length

  if (!live.length && !user?.total_fmv_pulled) return null

  return (
    <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'14px 16px' }}>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:2, color:'rgba(240,237,230,0.3)', marginBottom:12 }}>VAULT OVERVIEW</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
        {[
          ['Total Value', `$${totalFMV.toLocaleString()}`, '#C9A84C'],
          ['Cards Held', live.length, '#F0EDE6'],
          ['Legendaries', legendaryCount, RARITY_CFG.Legendary.color],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background:'rgba(0,0,0,0.2)', borderRadius:8, padding:'10px 12px', textAlign:'center' }}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:1.5, color:'rgba(240,237,230,0.25)', marginBottom:4 }}>{label}</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:600, color }}>{val}</div>
          </div>
        ))}
      </div>
      {bestCard && (
        <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'rgba(240,237,230,0.3)' }}>BEST PULL</span>
          <span style={{ fontFamily:"'Lato',sans-serif", fontSize:11, color: RARITY_CFG[bestCard.rarity]?.color || '#F0EDE6', flex:1 }}>{bestCard.card_name}</span>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:'#C9A84C' }}>${(bestCard.fmv||0).toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}
