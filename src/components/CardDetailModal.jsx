import { Modal, RarityBadge, NFTTag } from './UI.jsx'
import { RARITY_CFG, CAT_COLOR } from '../lib/constants.js'

export default function CardDetailModal({ card, onClose, onSwap, onRedeem }) {
  if (!card) return null
  const r = RARITY_CFG[card.rarity] || RARITY_CFG.Common
  const swapVal = Math.floor((card.fmv || 0) * 0.65)

  return (
    <Modal open={!!card} onClose={onClose} accentColor={r.border}>
      <div style={{ textAlign:'center', marginBottom:16 }}>
        <div style={{ width:80, height:100, background:r.dimBg, border:`1px solid ${r.border}`, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:44, boxShadow:`0 0 24px ${r.glow}` }}>
          {card.image_url ? <img src={card.image_url} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:9 }} alt="" /> : '🃏'}
        </div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:600, color:'#F0EDE6', marginBottom:8 }}>{card.card_name || card.name}</div>
        <div style={{ display:'flex', justifyContent:'center', gap:6, flexWrap:'wrap', marginBottom:12 }}>
          <RarityBadge rarity={card.rarity} />
          {card.sport && <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:CAT_COLOR[card.sport]||'#94A3B8', background:`${CAT_COLOR[card.sport]||'#94A3B8'}12`, border:`1px solid ${CAT_COLOR[card.sport]||'#94A3B8'}30`, padding:'3px 9px', borderRadius:3 }}>{card.sport}</span>}
          {card.nft_token_id && <NFTTag id={card.nft_token_id} burned={card.burned} />}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
        {[
          ['Fair Market Value', `$${(card.fmv||0).toLocaleString()}`,    r.color],
          ['Swap Value (65%)',  `$${swapVal.toLocaleString()}`,           '#38BDF8'],
          ['Grade',             card.grade || '—',                        '#F0EDE6'],
          ['Year',              card.year  || '—',                        '#F0EDE6'],
          ['Set',               (card.set_name||'—').slice(0,18),        'rgba(240,237,230,0.5)'],
          ['Player',            (card.player||card.card_name||'—').slice(0,18), 'rgba(240,237,230,0.5)'],
        ].map(([l,v,c]) => (
          <div key={l} style={{ background:'rgba(0,0,0,0.25)', borderRadius:7, padding:'9px 12px' }}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:1.5, color:'rgba(240,237,230,0.25)', marginBottom:3 }}>{l}</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, fontWeight:600, color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      {!card.burned && onSwap && onRedeem && (
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => { onSwap(card); onClose() }} style={{ flex:1, padding:'11px', background:'rgba(56,189,248,0.1)', border:'1px solid rgba(56,189,248,0.3)', borderRadius:9, color:'#38BDF8', fontFamily:"'Lato',sans-serif", fontSize:11, fontWeight:700, letterSpacing:1, cursor:'pointer' }}>
            SWAP · ${swapVal.toLocaleString()}
          </button>
          <button onClick={() => { onRedeem(card); onClose() }} style={{ flex:1, padding:'11px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:9, color:'#F87171', fontFamily:"'Lato',sans-serif", fontSize:11, fontWeight:700, letterSpacing:1, cursor:'pointer' }}>
            REDEEM
          </button>
        </div>
      )}
      {card.burned && (
        <div style={{ textAlign:'center', fontFamily:"'DM Mono',monospace", fontSize:10, color:'rgba(240,237,230,0.25)', letterSpacing:1.5 }}>NFT BURNED · CARD SHIPPED</div>
      )}

      <button onClick={onClose} style={{ width:'100%', marginTop:10, padding:'10px', background:'transparent', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, color:'rgba(240,237,230,0.3)', fontFamily:"'Lato',sans-serif", fontSize:11, letterSpacing:1, cursor:'pointer' }}>Close</button>
    </Modal>
  )
}
