import { Routes, Route, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useEffect, useState, useRef } from 'react'
import CustomerView from './pages/CustomerView.jsx'
import Store from './pages/Store.jsx'
import PaymentSuccess from './pages/PaymentSuccess.jsx'
import OperatorDash from './pages/OperatorDash.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import Marketplace from './pages/Marketplace.jsx'
import Profile from './pages/Profile.jsx'
import NotFound from './pages/NotFound.jsx'
import AdminAuthGate from './components/AdminAuthGate.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { GS } from './lib/constants.js'
import { useApi } from './hooks/useApi.js'

// Secret operator access — 5 rapid taps on bottom-left corner
function SecretOperatorButton() {
  const navigate = useNavigate()
  const taps = useRef(0)
  const timer = useRef(null)

  const handleTap = () => {
    taps.current += 1
    clearTimeout(timer.current)
    timer.current = setTimeout(() => { taps.current = 0 }, 2000)
    if (taps.current >= 5) {
      taps.current = 0
      navigate('/operator')
    }
  }

  return (
    <div
      onClick={handleTap}
      style={{
        position: 'fixed', bottom: 0, left: 0,
        width: 44, height: 44,
        zIndex: 9999,
        cursor: 'default',
        // Completely invisible — no visual hint
      }}
    />
  )
}

export default function App() {
  const { isLoaded, isSignedIn } = useAuth()
  const { apiFetch } = useApi()

  useEffect(() => {
    if (!isSignedIn) return
    apiFetch('/api/user', { method: 'POST', body: {} }).catch(() => {})
  }, [isSignedIn])

  if (!isLoaded) {
    return (
      <div style={{ minHeight:'100vh', background:'#0C0C10', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <style>{GS}</style>
        <div style={{ textAlign:'center' }}>
          <div className="gold-text" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:600, letterSpacing:4 }}>CARD CLAW CO</div>
          <div style={{ marginTop:16, width:28, height:28, border:'2px solid rgba(201,168,76,0.3)', borderTopColor:'#C9A84C', borderRadius:'50%', animation:'spin360 0.8s linear infinite', margin:'16px auto 0' }}/>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{GS}</style>
      <ErrorBoundary>
        <Routes>
          <Route path="/"                element={<CustomerView />} />
          <Route path="/store"           element={<Store />} />
          <Route path="/marketplace"     element={<Marketplace />} />
          <Route path="/profile"         element={<Profile />} />
          <Route path="/leaderboard"     element={<Leaderboard />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/operator"        element={<AdminAuthGate><OperatorDash /></AdminAuthGate>} />
          <Route path="*"                element={<NotFound />} />
        </Routes>
        <SecretOperatorButton />
      </ErrorBoundary>
    </>
  )
}
