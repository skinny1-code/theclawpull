export const RARITY_CFG = {
  Legendary:   { color:"#C9A84C", glow:"rgba(201,168,76,0.6)",  dimBg:"rgba(201,168,76,0.07)",  border:"rgba(201,168,76,0.28)",  label:"LEGENDARY",   pct:5  },
  "Ultra Rare":{ color:"#A78BFA", glow:"rgba(167,139,250,0.6)", dimBg:"rgba(167,139,250,0.07)", border:"rgba(167,139,250,0.28)", label:"ULTRA RARE",  pct:15 },
  Rare:        { color:"#60A5FA", glow:"rgba(96,165,250,0.6)",  dimBg:"rgba(96,165,250,0.07)",  border:"rgba(96,165,250,0.25)",  label:"RARE",         pct:30 },
  Common:      { color:"#94A3B8", glow:"rgba(148,163,184,0.3)", dimBg:"rgba(148,163,184,0.04)", border:"rgba(148,163,184,0.15)", label:"COMMON",       pct:50 },
}

export const CAT_COLOR = {
  Sports:"#F59E0B", "Pokémon":"#34D399", Anime:"#F472B6", NFT:"#38BDF8",
}

// 1 credit = 1 pull = $1
export const CREDIT_PACKS = [
  {
    id:       "coreclaw",
    name:     "CoreClaw",
    credits:  25,
    price:    "$25",
    priceNum: 2500,
    badge:    null,
    desc:     "25 pulls · entry level",
    accent:   "#60A5FA",
    icon:     "⚙️",
  },
  {
    id:       "premierclaw",
    name:     "PremierClaw",
    credits:  50,
    price:    "$50",
    priceNum: 5000,
    badge:    "POPULAR",
    desc:     "50 pulls · most popular",
    accent:   "#34D399",
    icon:     "⭐",
  },
  {
    id:       "ultraclaw",
    name:     "UltraClaw",
    credits:  100,
    price:    "$100",
    priceNum: 10000,
    badge:    "BEST VALUE",
    desc:     "100 pulls · serious collector",
    accent:   "#A78BFA",
    icon:     "💎",
  },
  {
    id:       "quantumclaw",
    name:     "QuantumClaw",
    credits:  500,
    price:    "$500",
    priceNum: 50000,
    badge:    "ULTIMATE",
    desc:     "500 pulls · ultimate vault",
    accent:   "#C9A84C",
    icon:     "⚡",
  },
]

export const GS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=DM+Mono:wght@400;500&family=Lato:wght@300;400;700;900&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  ::-webkit-scrollbar { width:4px; background:transparent; }
  ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:4px; }
  button { transition:all 0.18s ease; }
  input, select { transition:border-color 0.15s ease; }
  input:focus, select:focus { border-color:rgba(201,168,76,0.5) !important; outline:none; }

  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes fadeUp    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes toastIn   { from{opacity:0;transform:translate(-50%,10px)} to{opacity:1;transform:translate(-50%,0)} }
  @keyframes spin360   { to{transform:rotate(360deg)} }
  @keyframes shimmer   { 0%{background-position:200% center} 100%{background-position:-200% center} }
  @keyframes goldGlow  { 0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0)} 50%{box-shadow:0 0 22px 4px rgba(201,168,76,0.35)} }
  @keyframes winFlash  { 0%,100%{opacity:0} 25%,75%{opacity:0.18} 50%{opacity:0.35} }
  @keyframes winPulse  { 0%,100%{opacity:0.4} 50%{opacity:1} }
  @keyframes revealDrop{ from{opacity:0;transform:translateY(-20px) scale(0.92)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes confettiFall { to{transform:translateY(320px) rotate(720deg);opacity:0} }
  @keyframes pulse     { 0%,100%{opacity:0.6} 50%{opacity:1} }
  @keyframes pinShake  { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }

  .gold-text {
    background:linear-gradient(90deg,#C9A84C 0%,#F0D080 45%,#C9A84C 70%,#A07820 100%);
    background-size:200% auto;
    -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    animation:shimmer 3.5s linear infinite;
  }
  .rarity-chip {
    display:inline-flex; align-items:center; gap:5px;
    font-family:'DM Mono',monospace; font-size:9px; font-weight:500;
    letter-spacing:1.5px; padding:3px 9px; border-radius:3px; text-transform:uppercase;
  }
`
