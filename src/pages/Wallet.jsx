import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApi } from '../hooks/useApi.js'

const TIER_INFO = {
  CoreClaw:    { price:'$25',  cents:2500,  color:'#60A5FA', icon:'⚙️' },
  PremierClaw: { price:'$50',  cents:5000,  color:'#34D399', icon:'⭐' },
  UltraClaw:   { price:'$100', cents:10000, color:'#A78BFA', icon:'💎' },
  QuantumClaw: { price:'$500', cents:50000, color:'#C9A84C', icon:'⚡' },
}

export default function Wallet() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { apiFetch } = useApi()

  const [wallet, setWallet]     = useState(null)
  const [loading, setLoading]   = useState(true)
  const [working, setWorking]   = useState(null) // which action is loading
  const [msg, setMsg]           = useState(null)
  const [cashoutAmt, setCashout]= useState('')

  const showMsg = (text, type='ok') => { setMsg({text,type}); setTimeout(()=>setMsg(null),4000) }

  useEffect(() => {
    apiFetch('/api/wallet').then(d => { setWallet(d); setLoading(false) }).catch(() => setLoading(false))
    if (params.get('onboard') === 'success') {
      // Mark onboarded in DB
      apiFetch('/api/wallet', { method:'POST', body:{ action:'onboard_complete' } }).catch(()=>{})
      showMsg('Payout account connected! You can now cash out.')
    }
  }, [])

  const handleUsePulls = async (tier) => {
    setWorking(tier)
    try {
      const r = await apiFetch('/api/wallet', { method:'POST', body:{ action:'use_for_pulls', tier } })
      showMsg(`1 ${tier} pull added! $${(TIER_INFO[tier].cents/100)} deducted.`)
      setWallet(w => ({ ...w, wallet_cents: r.wallet_cents_remaining }))
    } catch(err) { showMsg(err.message, 'err') }
    finally { setWorking(null) }
  }

  const handleOnboard = async () => {
    setWorking('onboard')
    try {
      const { url } = await apiFetch('/api/wallet', { method:'POST', body:{ action:'onboard' } })
      window.location.href = url
    } catch(err) { showMsg(err.message, 'err'); setWorking(null) }
  }

  const handleCashout = async () => {
    const cents = Math.floor(parseFloat(cashoutAmt) * 100)
    if (!cents || cents < 1000) return showMsg('Minimum cashout is $10', 'err')
    setWorking('cashout')
    try {
      const r = await apiFetch('/api/wallet', { method:'POST', body:{ action:'cashout', amount_cents: cents } })
      showMsg(r.message)
      setWallet(w => ({ ...w, wallet_cents: w.wallet_cents - cents }))
      setCashout('')
    } catch(err) { showMsg(err.message, 'err') }
    finally { setWorking(null) }
  }

  const balanceDollars = wallet ? (wallet.wallet_cents / 100).toFixed(2) : '0.00'

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#080c12 0%,#0a0f18 60%,#060a10 100%)', color:'#F0EDE6', fontFamily:"'Lato',sans-serif" }}>
      <style>{'@import url(\'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Mono:wght@400;500&family=Lato:wght@300;400;700&display=swap\')'}</style>

      {/* Toast */}
      {msg && (
        <div style={{ position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',zIndex:999,background:msg.type==='err'?'rgba(239,68,68,0.15)':'rgba(52,211,153,0.12)',border:`1px solid ${msg.type==='err'?'rgba(239,68,68,0.4)':'rgba(52,211,153,0.3)'}`,borderRadius:10,padding:'12px 20px',fontFamily:"'Lato',sans-serif",fontSize:13,color:msg.type==='err'?'#F87171':'#34D399',maxWidth:340,textAlign:'center' }}>
          {msg.text}
        </div>
      )}

      <div style={{ maxWidth:480, margin:'0 auto', padding:'36px 20px 80px' }}>
        <button onClick={() => navigate('/')} style={{ background:'none',border:'none',color:'rgba(240,237,230,0.3)',fontSize:11,letterSpacing:2,cursor:'pointer',padding:0,marginBottom:28,fontFamily:"'Lato',sans-serif" }}>← BACK</button>

        <div style={{ fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:4,color:'rgba(240,237,230,0.3)',marginBottom:6 }}>CARD CLAW CO</div>
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:40,fontWeight:600,color:'#F0EDE6',margin:'0 0 4px' }}>My Wallet</h1>
        <p style={{ fontFamily:"'Lato',sans-serif",fontSize:12,color:'rgba(240,237,230,0.35)',margin:'0 0 28px' }}>Earnings from card swaps & sales</p>

        {/* Balance card */}
        <div style={{ background:'linear-gradient(135deg,rgba(201,168,76,0.1),rgba(201,168,76,0.04))',border:'1.5px solid rgba(201,168,76,0.35)',borderRadius:18,padding:'28px 24px',marginBottom:24,textAlign:'center',boxShadow:'0 0 40px rgba(201,168,76,0.08)' }}>
          <div style={{ fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:3,color:'rgba(201,168,76,0.6)',marginBottom:12 }}>WALLET BALANCE</div>
          {loading ? (
            <div style={{ fontSize:48, color:'rgba(240,237,230,0.2)' }}>···</div>
          ) : (
            <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:64,fontWeight:600,color:'#C9A84C',lineHeight:1 }}>
              ${balanceDollars}
            </div>
          )}
          <div style={{ fontFamily:"'Lato',sans-serif",fontSize:11,color:'rgba(240,237,230,0.3)',marginTop:8 }}>
            Earned from card swaps · 65% FMV per swap
          </div>
        </div>

        {/* How you earn */}
        <div style={{ background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:'16px 18px',marginBottom:24 }}>
          <div style={{ fontFamily:"'DM Mono',monospace",fontSize:8,letterSpacing:2,color:'rgba(240,237,230,0.25)',marginBottom:12 }}>HOW YOUR WALLET GROWS</div>
          {[
            ['↔ Swap a card','65% of its Fair Market Value lands in your wallet','#60A5FA'],
            ['🏪 Sell on Marketplace','100% of your listing price goes to your wallet','#34D399'],
          ].map(([title,desc,color]) => (
            <div key={title} style={{ display:'flex',gap:12,alignItems:'flex-start',marginBottom:10 }}>
              <div style={{ width:6,height:6,borderRadius:'50%',background:color,marginTop:5,flexShrink:0 }}/>
              <div>
                <div style={{ fontFamily:"'Lato',sans-serif",fontSize:12,fontWeight:700,color:'#F0EDE6',marginBottom:2 }}>{title}</div>
                <div style={{ fontFamily:"'Lato',sans-serif",fontSize:11,color:'rgba(240,237,230,0.4)' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Option 1: Use for more pulls */}
        <div style={{ background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'20px',marginBottom:16 }}>
          <div style={{ fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:2,color:'rgba(240,237,230,0.3)',marginBottom:14 }}>OPTION 1 — USE FOR MORE PULLS</div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            {Object.entries(TIER_INFO).map(([tier,info]) => {
              const canAfford = wallet && wallet.wallet_cents >= info.cents
              const isWorking = working === tier
              return (
                <button key={tier} onClick={() => handleUsePulls(tier)} disabled={!canAfford || !!working}
                  style={{ padding:'12px',background:canAfford?`${info.color}10`:'rgba(255,255,255,0.02)',border:`1px solid ${canAfford?info.color+'30':'rgba(255,255,255,0.06)'}`,borderRadius:10,cursor:canAfford&&!working?'pointer':'not-allowed',textAlign:'center',opacity:canAfford?1:0.4,transition:'all 0.2s' }}>
                  <div style={{ fontSize:22,marginBottom:4 }}>{info.icon}</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:13,fontWeight:600,color:'#F0EDE6',marginBottom:2 }}>{tier}</div>
                  <div style={{ fontFamily:"'DM Mono',monospace",fontSize:9,color:info.color }}>{isWorking?'Adding…':`${info.price} / pull`}</div>
                </button>
              )
            })}
          </div>
          <div style={{ marginTop:12,fontFamily:"'Lato',sans-serif",fontSize:11,color:'rgba(240,237,230,0.25)',textAlign:'center' }}>
            Select a machine to convert your wallet balance into a pull
          </div>
        </div>

        {/* Option 2: Cash out */}
        <div style={{ background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'20px' }}>
          <div style={{ fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:2,color:'rgba(240,237,230,0.3)',marginBottom:14 }}>OPTION 2 — CASH OUT TO DEBIT CARD</div>

          {!wallet?.onboarded ? (
            <div>
              <p style={{ fontFamily:"'Lato',sans-serif",fontSize:12,color:'rgba(240,237,230,0.45)',lineHeight:1.6,marginBottom:16 }}>
                Set up your payout account once and cash out anytime. Powered by Stripe — takes 2 minutes.
              </p>
              <button onClick={handleOnboard} disabled={working==='onboard'} style={{ width:'100%',padding:'14px',background:'linear-gradient(135deg,rgba(52,211,153,0.2),rgba(52,211,153,0.06))',border:'1px solid rgba(52,211,153,0.4)',borderRadius:11,color:'#34D399',fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,letterSpacing:1,cursor:working?'not-allowed':'pointer' }}>
                {working==='onboard'?'Redirecting…':'Set Up Payout Account →'}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display:'flex',gap:10,marginBottom:12 }}>
                <div style={{ position:'relative',flex:1 }}>
                  <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'rgba(240,237,230,0.4)' }}>$</span>
                  <input
                    type="number" min="10" step="1" placeholder="0.00"
                    value={cashoutAmt} onChange={e=>setCashout(e.target.value)}
                    style={{ width:'100%',padding:'13px 14px 13px 28px',background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'#F0EDE6',fontFamily:"'Cormorant Garamond',serif",fontSize:20,outline:'none',boxSizing:'border-box' }}
                  />
                </div>
                <button onClick={() => setCashout((wallet.wallet_cents/100).toFixed(2))}
                  style={{ padding:'0 14px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,color:'rgba(240,237,230,0.4)',fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:1,cursor:'pointer',whiteSpace:'nowrap' }}>
                  MAX
                </button>
              </div>
              <button onClick={handleCashout} disabled={!!working}
                style={{ width:'100%',padding:'14px',background:'linear-gradient(135deg,rgba(52,211,153,0.2),rgba(52,211,153,0.06))',border:'1px solid rgba(52,211,153,0.4)',borderRadius:11,color:'#34D399',fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,letterSpacing:1,cursor:working?'not-allowed':'pointer' }}>
                {working==='cashout'?'Sending…':'Cash Out to Debit Card'}
              </button>
              <div style={{ marginTop:10,fontFamily:"'Lato',sans-serif",fontSize:10,color:'rgba(240,237,230,0.2)',textAlign:'center' }}>
                Min $10 · Arrives in 1–2 business days · Powered by Stripe
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
