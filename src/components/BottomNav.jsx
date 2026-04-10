import { useNavigate, useLocation } from 'react-router-dom'
import { useUser } from '../hooks/useUser.js'

const TIER_PATHS = ['/coreclaw','/premierclaw','/ultraclaw','/quantumclaw']

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user } = useUser()

  const totalPulls = user
    ? (user.coreclaw_pulls||0)+(user.premierclaw_pulls||0)+(user.ultraclaw_pulls||0)+(user.quantumclaw_pulls||0)
    : 0

  const walletDollars = user ? Math.floor(user.wallet_cents/100) : 0

  const tabs = [
    { path:'/',           icon:'🎰', label:'Pull'      },
    { path:'/marketplace',icon:'🏪', label:'Market'    },
    { path:'/wallet',     icon:'💳', label:'Wallet',   badge: walletDollars > 0 ? `$${walletDollars}` : null },
    { path:'/profile',    icon:'👤', label:'Profile'   },
    { path:'/leaderboard',icon:'🏆', label:'Board'     },
  ]

  // Hide nav on tier pages — they have their own back button
  if (TIER_PATHS.includes(pathname)) return null

  return (
    <nav style={{
      position:'fixed', bottom:0, left:0, right:0, zIndex:200,
      background:'rgba(8,11,16,0.96)',
      borderTop:'1px solid rgba(255,255,255,0.07)',
      backdropFilter:'blur(20px)',
      display:'flex', alignItems:'stretch',
      paddingBottom:'env(safe-area-inset-bottom, 8px)',
    }}>
      {tabs.map(t => {
        const active = pathname === t.path
        return (
          <button key={t.path} onClick={() => navigate(t.path)} style={{
            flex:1, padding:'10px 4px 6px', background:'none', border:'none',
            cursor:'pointer', display:'flex', flexDirection:'column',
            alignItems:'center', gap:3, position:'relative',
            borderTop: active ? '2px solid #C9A84C' : '2px solid transparent',
            transition:'all 0.15s',
          }}>
            <span style={{ fontSize:20, lineHeight:1 }}>{t.icon}</span>
            <span style={{
              fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:1,
              color: active ? '#C9A84C' : 'rgba(240,237,230,0.3)',
              transition:'color 0.15s',
            }}>{t.label}</span>
            {t.badge && (
              <span style={{
                position:'absolute', top:6, right:'calc(50% - 18px)',
                background:'#34D399', color:'#0C0C10',
                fontFamily:"'DM Mono',monospace", fontSize:7, fontWeight:700,
                padding:'1px 5px', borderRadius:8, letterSpacing:0.5,
              }}>{t.badge}</span>
            )}
            {t.path === '/' && totalPulls > 0 && (
              <span style={{
                position:'absolute', top:6, right:'calc(50% - 18px)',
                background:'#C9A84C', color:'#0C0C10',
                fontFamily:"'DM Mono',monospace", fontSize:7, fontWeight:700,
                padding:'1px 5px', borderRadius:8,
              }}>{totalPulls}</span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
