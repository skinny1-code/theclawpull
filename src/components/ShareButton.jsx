import { useState } from 'react'
import { RARITY_CFG } from '../lib/constants.js'

export default function ShareButton({ card }) {
  const [copied, setCopied] = useState(false)
  if (!card) return null

  const cfg = RARITY_CFG[card.rarity] || RARITY_CFG.Common

  const share = async () => {
    const text = `🎰 Just pulled a ${card.rarity} ${card.card_name || card.name} (${card.grade}) worth $${(card.fmv||0).toLocaleString()} on TheClawPull!\n\nNFT: ${card.nft_token_id || ''}\n\nhttps://theclawpull.vercel.app`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'TheClawPull Pull!', text })
        return
      } catch {}
    }

    // Fallback: copy to clipboard
    await navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <button
      onClick={share}
      style={{
        display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
        background: `${cfg.dimBg}`,
        border: `1px solid ${cfg.border}`,
        borderRadius:8, cursor:'pointer',
        fontFamily:"'Lato',sans-serif", fontSize:11, fontWeight:700,
        color: cfg.color, letterSpacing:1,
        transition:'all 0.2s',
      }}
    >
      <span>{copied ? '✓' : '↗'}</span>
      {copied ? 'COPIED!' : 'SHARE PULL'}
    </button>
  )
}
