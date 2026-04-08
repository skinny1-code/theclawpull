import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser.js'
import { Spinner } from '../components/UI.jsx'

export default function PaymentSuccess() {
  const navigate = useNavigate()
  const { refresh } = useUser()
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Give Stripe webhook ~2s to fire and credit the user before refreshing
    const timer = setTimeout(async () => {
      await refresh()
      setDone(true)
      setTimeout(() => navigate('/'), 2200)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div style={{ minHeight:'100vh', background:'#0C0C10', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:20 }}>
      {!done ? (
        <>
          <Spinner size={32} color="#C9A84C"/>
          <div style={{ fontFamily:"'Lato',sans-serif", fontSize:12, color:'rgba(240,237,230,0.3)', letterSpacing:2 }}>
            CONFIRMING PAYMENT…
          </div>
        </>
      ) : (
        <div style={{ textAlign:'center', animation:'fadeUp 0.4s ease' }}>
          <div style={{ width:64,height:64,borderRadius:'50%',background:'rgba(52,211,153,0.1)',border:'1px solid rgba(52,211,153,0.3)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',fontSize:28 }}>✓</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:'#C9A84C', marginBottom:8 }}>Credits Added</div>
          <div style={{ fontFamily:"'Lato',sans-serif", fontSize:11, color:'rgba(240,237,230,0.3)', letterSpacing:1.5 }}>
            Redirecting to pull screen…
          </div>
        </div>
      )}
    </div>
  )
}
