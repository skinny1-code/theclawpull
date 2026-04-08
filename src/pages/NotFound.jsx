import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight:'100vh', background:'#0C0C10', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, fontFamily:"'Lato',sans-serif", color:'#F0EDE6' }}>
      <style>{'@import url(\'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&display=swap\')'}</style>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:80, fontWeight:600, color:'rgba(201,168,76,0.2)', lineHeight:1 }}>404</div>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#C9A84C' }}>Page not found</div>
      <button onClick={() => navigate('/')} style={{ marginTop:12, padding:'11px 26px', background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:9, color:'#C9A84C', fontSize:11, fontWeight:700, letterSpacing:2, cursor:'pointer' }}>
        BACK TO PULLS
      </button>
    </div>
  )
}
