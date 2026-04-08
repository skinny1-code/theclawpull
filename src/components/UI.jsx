import { RARITY_CFG } from '../lib/constants.js'

export function Spinner({ size = 18, color = '#C9A84C' }) {
  return (
    <div style={{ width:size, height:size, border:`2px solid ${color}30`, borderTopColor:color, borderRadius:'50%', animation:'spin360 0.7s linear infinite', flexShrink:0 }} />
  )
}

export function RarityBadge({ rarity, small }) {
  const cfg = RARITY_CFG[rarity] || RARITY_CFG.Common
  return (
    <span className="rarity-chip" style={{ background:cfg.dimBg, border:`1px solid ${cfg.border}`, color:cfg.color, fontSize: small ? 8 : 9 }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:cfg.color, flexShrink:0 }}/>
      {cfg.label}
    </span>
  )
}

export function NFTTag({ id, burned }) {
  if (!id) return null
  return (
    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color: burned ? 'rgba(240,237,230,0.2)' : 'rgba(56,189,248,0.7)', background: burned ? 'rgba(255,255,255,0.03)' : 'rgba(56,189,248,0.06)', border:`1px solid ${burned ? 'rgba(255,255,255,0.06)' : 'rgba(56,189,248,0.18)'}`, padding:'2px 7px', borderRadius:3, letterSpacing:0.5 }}>
      {burned ? '🔥 BURNED' : `◈ ${id}`}
    </span>
  )
}

export function Toast({ toast }) {
  if (!toast) return null
  const colors = { error:'rgba(239,68,68,0.9)', swap:'rgba(56,189,248,0.9)', redeem:'rgba(239,68,68,0.9)', default:'rgba(52,211,153,0.9)' }
  return (
    <div style={{ position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)', background:colors[toast.type]||colors.default, color:'#fff', padding:'10px 20px', borderRadius:10, fontFamily:"'Lato',sans-serif", fontSize:12, fontWeight:700, letterSpacing:0.5, zIndex:1000, boxShadow:'0 8px 24px rgba(0,0,0,0.4)', animation:'toastIn 0.3s ease', whiteSpace:'nowrap', maxWidth:'90vw', textAlign:'center' }}>
      {toast.msg}
    </div>
  )
}

export function Modal({ open, onClose, title, subtitle, accentColor, children }) {
  if (!open) return null
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'0 0 0 0', animation:'fadeIn 0.2s ease' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width:'100%', maxWidth:440, background:'linear-gradient(180deg,#111118 0%,#0C0C10 100%)', border:`1px solid ${accentColor||'rgba(255,255,255,0.08)'}`, borderBottom:'none', borderRadius:'20px 20px 0 0', padding:'24px 22px 36px', maxHeight:'88vh', overflowY:'auto', animation:'slideDown 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
        {(title || subtitle) && (
          <div style={{ marginBottom:18 }}>
            {title && <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:600, color:'#F0EDE6', marginBottom:4 }}>{title}</div>}
            {subtitle && <div style={{ fontFamily:"'Lato',sans-serif", fontSize:11, color:'rgba(240,237,230,0.35)', letterSpacing:0.5 }}>{subtitle}</div>}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export function ModalButtons({ onCancel, onConfirm, confirmLabel, confirmColor = '#C9A84C', loading }) {
  return (
    <div style={{ display:'flex', gap:10 }}>
      <button onClick={onCancel} disabled={loading} style={{ flex:1, padding:'12px', background:'transparent', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, color:'rgba(240,237,230,0.35)', fontFamily:"'Lato',sans-serif", fontSize:11, letterSpacing:1.5, cursor:'pointer' }}>
        CANCEL
      </button>
      <button onClick={onConfirm} disabled={loading} style={{ flex:2, padding:'12px', background:`${confirmColor}18`, border:`1px solid ${confirmColor}50`, borderRadius:10, color:confirmColor, fontFamily:"'Lato',sans-serif", fontSize:11, fontWeight:700, letterSpacing:1.5, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
        {loading ? <><Spinner size={14} color={confirmColor}/> Processing…</> : confirmLabel}
      </button>
    </div>
  )
}
