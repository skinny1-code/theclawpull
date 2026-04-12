import { Routes, Route, useLocation } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useEffect, useRef } from 'react'
import Dashboard      from './pages/Dashboard.jsx'
import Store          from './pages/Store.jsx'
import PaymentSuccess from './pages/PaymentSuccess.jsx'
import OperatorDash   from './pages/OperatorDash.jsx'
import Leaderboard    from './pages/Leaderboard.jsx'
import Marketplace    from './pages/Marketplace.jsx'
import Profile        from './pages/Profile.jsx'
import Wallet         from './pages/Wallet.jsx'
import NotFound       from './pages/NotFound.jsx'
import CoreClawPage    from './pages/tiers/CoreClawPage.jsx'
import PremierClawPage from './pages/tiers/PremierClawPage.jsx'
import UltraClawPage   from './pages/tiers/UltraClawPage.jsx'
import QuantumClawPage from './pages/tiers/QuantumClawPage.jsx'
import AdminAuthGate  from './components/AdminAuthGate.jsx'
import ErrorBoundary  from './components/ErrorBoundary.jsx'
import BottomNav      from './components/BottomNav.jsx'
import { TestModeBanner } from './components/TestModeBanner.jsx'
import { GS }         from './lib/constants.js'
import { useApi }     from './hooks/useApi.js'

// Secret operator button — 5 taps bottom-left corner
function SecretOperatorButton() {
  const taps = useRef(0)
  const timer = useRef(null)
  const { pathname } = useLocation()
  const navigate = (window.history.pushState ? (p) => window.history.pushState(null,'',p) : null)
  const handleTap = () => {
    taps.current += 1
    clearTimeout(timer.current)
    timer.current = setTimeout(() => { taps.current = 0 }, 2000)
    if (taps.current >= 5) { taps.current = 0; window.location.href = '/operator' }
  }
  return <div onClick={handleTap} style={{ position:'fixed',bottom:0,left:0,width:44,height:44,zIndex:9999 }}/>
}

export default function App() {
  const { isLoaded, isSignedIn } = useAuth()
  const { apiFetch } = useApi()

  useEffect(() => {
    if (!isSignedIn) return
    apiFetch('/api/user', { method:'POST', body:{} }).catch(() => {})
  }, [isSignedIn])

  if (!isLoaded) {
    return (
      <div style={{ minHeight:'100vh',background:'#080b10',display:'flex',alignItems:'center',justifyContent:'center' }}>
        <style>{GS}</style>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:600,letterSpacing:4,color:'#C9A84C' }}>THE CLAW PULL</div>
          <div style={{ marginTop:16,width:24,height:24,border:'2px solid rgba(201,168,76,0.3)',borderTopColor:'#C9A84C',borderRadius:'50%',animation:'spin360 0.8s linear infinite',margin:'16px auto 0' }}/>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{GS}</style>
      <ErrorBoundary>
        <TestModeBanner />
        <Routes>
          <Route path="/"                element={<Dashboard />} />
          <Route path="/store"           element={<Store />} />
          <Route path="/marketplace"     element={<Marketplace />} />
          <Route path="/profile"         element={<Profile />} />
          <Route path="/leaderboard"     element={<Leaderboard />} />
          <Route path="/wallet"          element={<Wallet />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/operator"        element={<AdminAuthGate><OperatorDash /></AdminAuthGate>} />
          <Route path="/coreclaw"        element={<CoreClawPage />} />
          <Route path="/premierclaw"     element={<PremierClawPage />} />
          <Route path="/ultraclaw"       element={<UltraClawPage />} />
          <Route path="/quantumclaw"     element={<QuantumClawPage />} />
          <Route path="*"                element={<NotFound />} />
        </Routes>
        <BottomNav />
        <SecretOperatorButton />
      </ErrorBoundary>
    </>
  )
}
