import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignInButton, useAuth } from '@clerk/clerk-react'
import { useApi } from '../hooks/useApi.js'
import { useUser } from '../hooks/useUser.js'
import { RarityBadge, Spinner, Modal } from '../components/UI.jsx'
import { CardSkeleton } from '../components/Skeleton.jsx'

const RC = { Legendary:'#C9A84C', 'Ultra Rare':'#A78BFA', Rare:'#60A5FA', Common:'#9CA3AF' }
const TIER_COLOR = { CoreClaw:'#60A5FA', PremierClaw:'#34D399', UltraClaw:'#A78BFA', QuantumClaw:'#C9A84C' }

export default function Marketplace() {
  const navigate = useNavigate()
  const { isSignedIn } = useAuth()
  const { apiFetch } = useApi()
  const { user, refresh } = useUser()

  const [tab, setTab]           = useState('browse')
  const [listings, setListings] = useState([])
  const [myVault, setMyVault]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [toast, setToast]       = useState(null)
  const [buyTarget, setBuy]     = useState(null)
  const [listTarget, setList]   = useState(null)
  const [listPrice, setListPrice] = useState('')
  const [working, setWorking]   = useState(false)
  const [filter, setFilter]     = useState('all')

  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3500) }

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const d = await apiFetch('/api/marketplace')
      setListings(d.listings || [])
    } catch {} finally { setLoading(false) }
  }, [])

  const loadVault = useCallback(async () => {
    try {
      const d = await apiFetch('/api/vault')
      setMyVault(d.items?.filter(c => !c.burned) || [])
    } catch {}
  }, [])

  useEffect(() => { loadAll() }, [])
  useEffect(() => { if (isSignedIn && tab === 'sell') loadVault() }, [tab, isSignedIn])

  const handleBuy = async () => {
    setWorking(true)
    try {
      await apiFetch('/api/marketplace', { method:'POST', body:{ action:'buy', listingId: buyTarget.id } })
      showToast(`Card added to your vault! Wallet debited $${(buyTarget.price_cents/100).toFixed(2)}`)
      setBuy(null); loadAll(); refresh()
    } catch(err) { showToast(err.message, false) }
    finally { setWorking(false) }
  }

  const handleList = async () => {
    if (!listPrice || parseFloat(listPrice) < 1) return showToast('Minimum price is $1', false)
    setWorking(true)
    try {
      await apiFetch('/api/marketplace', { method:'POST', body:{ action:'list', vaultId: listTarget.id, priceDollars: listPrice } })
      showToast(`Listed for $${listPrice}!`)
      setList(null); setListPrice(''); loadAll(); loadVault()
    } catch(err) { showToast(err.message, false) }
    finally { setWorking(false) }
  }

  const handleCancel = async (listingId) => {
    setWorking(listingId)
    try {
      await apiFetch('/api/marketplace', { method:'POST', body:{ action:'cancel', listingId } })
      showToast('Listing cancelled')
      loadAll()
    } catch(err) { showToast(err.message, false) }
    finally { setWorking(false) }
  }

  const tiers = ['all', 'CoreClaw', 'PremierClaw', 'UltraClaw', 'QuantumClaw']
  const filteredListings = filter === 'all' ? listings : listings.filter(l => l.cards?.claw_tier === filter)
  const myListings = listings.filter(l => l.is_mine)

  const walletDollars = user ? (user.wallet_cents / 100).toFixed(2) : '0.00'
  const canAfford = (l) => user && user.wallet_cents >= l.price_cents

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#080c12 0%,#0a0f18 60%,#060a10 100%)', color:'#F0EDE6', fontFamily:"'Lato',sans-serif" }}>
      <style>{'@import url(\'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Mono:wght@400;500&family=Lato:wght@300;400;700&display=swap\')'}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',zIndex:999,background:toast.ok?'rgba(52,211,153,0.12)':'rgba(239,68,68,0.12)',border:`1px solid ${toast.ok?'rgba(52,211,153,0.3)':'rgba(239,68,68,0.3)'}`,borderRadius:10,padding:'12px 20px',fontFamily:"'Lato',sans-serif",fontSize:13,color:toast.ok?'#34D399':'#F87171',maxWidth:360,textAlign:'center' }}>
          {toast.msg}
        </div>
      )}

      {/* Buy confirm modal */}
      {buyTarget && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(6px)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
          <div style={{ background:'#0f1218',border:'1px solid rgba(255,255,255,0.08)',borderRadius:18,padding:'28px 24px',maxWidth:340,width:'100%' }}>
            <div style={{ fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:3,color:'rgba(240,237,230,0.3)',marginBottom:16 }}>CONFIRM PURCHASE</div>
            <div style={{ display:'flex',gap:14,marginBottom:20 }}>
              <div style={{ width:56,height:70,borderRadius:8,overflow:'hidden',background:'rgba(0,0,0,0.4)',border:`1px solid ${RC[buyTarget.cards?.rarity]||'rgba(255,255,255,0.1)'}30`,flexShrink:0 }}>
                {buyTarget.cards?.image_url && <img src={buyTarget.cards.image_url} style={{ width:'100%',height:'100%',objectFit:'cover' }} alt="" onError={e=>{e.target.style.display='none'}}/>}
              </div>
              <div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:600,color:'#F0EDE6',marginBottom:4 }}>{buyTarget.cards?.name}</div>
                <RarityBadge rarity={buyTarget.cards?.rarity}/>
                <div style={{ fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(240,237,230,0.35)',marginTop:4 }}>{buyTarget.cards?.grade}</div>
              </div>
            </div>

            <div style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:'14px',marginBottom:20 }}>
              {[
                ['Price', `$${(buyTarget.price_cents/100).toFixed(2)}`, '#F0EDE6'],
                ['Your Wallet', `$${walletDollars}`, canAfford(buyTarget)?'#34D399':'#F87171'],
                ['After Purchase', canAfford(buyTarget)?`$${((user.wallet_cents-buyTarget.price_cents)/100).toFixed(2)}`:'—', 'rgba(240,237,230,0.4)'],
              ].map(([l,v,c]) => (
                <div key={l} style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                  <span style={{ fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(240,237,230,0.3)',letterSpacing:1 }}>{l}</span>
                  <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,color:c }}>{v}</span>
                </div>
              ))}
            </div>

            {!canAfford(buyTarget) && (
              <div style={{ background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,padding:'10px 12px',marginBottom:14,fontFamily:"'Lato',sans-serif",fontSize:11,color:'#F87171',textAlign:'center' }}>
                Not enough wallet balance. Swap a card to earn more.
              </div>
            )}

            <div style={{ display:'flex',gap:10 }}>
              <button onClick={() => setBuy(null)} style={{ flex:1,padding:'12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,color:'rgba(240,237,230,0.4)',fontFamily:"'Lato',sans-serif",fontSize:12,cursor:'pointer',letterSpacing:1 }}>CANCEL</button>
              <button onClick={handleBuy} disabled={!canAfford(buyTarget)||working} style={{ flex:2,padding:'12px',background:canAfford(buyTarget)?'linear-gradient(135deg,rgba(52,211,153,0.25),rgba(52,211,153,0.08))':'rgba(255,255,255,0.02)',border:`1px solid ${canAfford(buyTarget)?'rgba(52,211,153,0.5)':'rgba(255,255,255,0.06)'}`,borderRadius:10,color:canAfford(buyTarget)?'#34D399':'rgba(240,237,230,0.2)',fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,cursor:canAfford(buyTarget)&&!working?'pointer':'not-allowed',letterSpacing:1 }}>
                {working ? <Spinner size={14} color="#34D399"/> : `Buy · $${(buyTarget.price_cents/100).toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List card modal */}
      {listTarget && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(6px)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
          <div style={{ background:'#0f1218',border:'1px solid rgba(255,255,255,0.08)',borderRadius:18,padding:'28px 24px',maxWidth:340,width:'100%' }}>
            <div style={{ fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:3,color:'rgba(240,237,230,0.3)',marginBottom:16 }}>LIST FOR SALE</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:600,color:'#F0EDE6',marginBottom:4 }}>{listTarget.card?.name || listTarget.cards?.name}</div>
            <div style={{ fontFamily:"'DM Mono',monospace",fontSize:10,color:'rgba(240,237,230,0.35)',marginBottom:6 }}>{listTarget.card?.grade || listTarget.cards?.grade}</div>
            <div style={{ fontFamily:"'Lato',sans-serif",fontSize:11,color:'rgba(240,237,230,0.3)',marginBottom:18 }}>
              FMV: <b style={{ color:'#C9A84C' }}>${(listTarget.card?.fmv || listTarget.cards?.fmv || 0).toLocaleString()}</b> · Buyer pays with their wallet · 100% goes to your wallet
            </div>
            <div style={{ position:'relative',marginBottom:14 }}>
              <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'rgba(240,237,230,0.35)' }}>$</span>
              <input type="number" min="1" step="1" placeholder="Set your price" value={listPrice} onChange={e=>setListPrice(e.target.value)}
                style={{ width:'100%',padding:'14px 14px 14px 30px',background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'#F0EDE6',fontFamily:"'Cormorant Garamond',serif",fontSize:22,outline:'none',boxSizing:'border-box' }}/>
            </div>
            {listPrice && parseFloat(listPrice) > 0 && (
              <div style={{ fontFamily:"'Lato',sans-serif",fontSize:11,color:'rgba(240,237,230,0.3)',marginBottom:14,textAlign:'center' }}>
                You receive <b style={{ color:'#34D399' }}>${parseFloat(listPrice).toFixed(2)}</b> in your wallet when sold
              </div>
            )}
            <div style={{ display:'flex',gap:10 }}>
              <button onClick={() => { setList(null); setListPrice('') }} style={{ flex:1,padding:'12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,color:'rgba(240,237,230,0.4)',fontFamily:"'Lato',sans-serif",fontSize:12,cursor:'pointer' }}>CANCEL</button>
              <button onClick={handleList} disabled={working} style={{ flex:2,padding:'12px',background:'linear-gradient(135deg,rgba(201,168,76,0.25),rgba(201,168,76,0.08))',border:'1px solid rgba(201,168,76,0.4)',borderRadius:10,color:'#C9A84C',fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,cursor:working?'not-allowed':'pointer' }}>
                {working ? <Spinner size={14} color="#C9A84C"/> : 'List for Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'28px 20px 0' }}>
        <div style={{ maxWidth:520,margin:'0 auto' }}>
          <button onClick={() => navigate('/')} style={{ background:'none',border:'none',color:'rgba(240,237,230,0.3)',fontSize:11,letterSpacing:2,cursor:'pointer',padding:0,marginBottom:16,fontFamily:"'Lato',sans-serif" }}>← BACK</button>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:20 }}>
            <div>
              <div style={{ fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:4,color:'rgba(240,237,230,0.3)',marginBottom:4 }}>CARD CLAW CO</div>
              <h1 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:600,color:'#F0EDE6',margin:0 }}>Marketplace</h1>
            </div>
            {isSignedIn && user && (
              <button onClick={() => navigate('/wallet')} style={{ background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.2)',borderRadius:10,padding:'8px 14px',cursor:'pointer',textAlign:'right' }}>
                <div style={{ fontFamily:"'DM Mono',monospace",fontSize:7,letterSpacing:1.5,color:'rgba(52,211,153,0.5)' }}>WALLET</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:600,color:'#34D399',lineHeight:1 }}>${walletDollars}</div>
              </button>
            )}
          </div>

          {/* How it works callout */}
          <div style={{ background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:10,padding:'11px 14px',marginBottom:16,display:'flex',gap:20,flexWrap:'wrap' }}>
            {[['↔ Swap','Get 65% FMV in your wallet'],['🏪 Sell','List for any price — 100% yours'],['💳 Buy','Spend wallet balance on cards'],['🔄 Keep pulling','Reinvest wallet into more pulls']].map(([t,d])=>(
              <div key={t} style={{ display:'flex',gap:8,alignItems:'center',minWidth:0 }}>
                <span style={{ fontFamily:"'DM Mono',monospace",fontSize:9,color:'#C9A84C',whiteSpace:'nowrap' }}>{t}</span>
                <span style={{ fontFamily:"'Lato',sans-serif",fontSize:10,color:'rgba(240,237,230,0.3)' }}>{d}</span>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display:'flex',gap:0,borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            {['browse','sell','mine'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ flex:1,padding:'12px',background:'none',border:'none',borderBottom:`2px solid ${tab===t?'#C9A84C':'transparent'}`,color:tab===t?'#C9A84C':'rgba(240,237,230,0.3)',fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:2,cursor:'pointer',textTransform:'uppercase',transition:'all 0.2s' }}>
                {t === 'browse' ? `Browse (${listings.length})` : t === 'sell' ? 'Sell a Card' : `My Listings (${myListings.length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:520,margin:'0 auto',padding:'20px 20px 80px' }}>

        {/* ── BROWSE TAB ── */}
        {tab === 'browse' && (
          <>
            {/* Tier filter */}
            <div style={{ display:'flex',gap:8,marginBottom:16,overflowX:'auto',paddingBottom:4 }}>
              {tiers.map(t => (
                <button key={t} onClick={() => setFilter(t)} style={{ padding:'6px 14px',background:filter===t?`${TIER_COLOR[t]||'rgba(255,255,255,0.1)'}18`:'rgba(255,255,255,0.03)',border:`1px solid ${filter===t?TIER_COLOR[t]||'rgba(255,255,255,0.3)':'rgba(255,255,255,0.07)'}`,borderRadius:20,color:filter===t?TIER_COLOR[t]||'#F0EDE6':'rgba(240,237,230,0.4)',fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:1,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0 }}>
                  {t === 'all' ? 'ALL' : t.replace('Claw',' ').trim().toUpperCase()}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                {[...Array(6)].map((_,i) => <CardSkeleton key={i}/>)}
              </div>
            ) : filteredListings.length === 0 ? (
              <div style={{ textAlign:'center',padding:'60px 20px' }}>
                <div style={{ fontSize:40,marginBottom:12 }}>🏪</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'rgba(240,237,230,0.4)' }}>No listings yet</div>
                <div style={{ fontFamily:"'Lato',sans-serif",fontSize:12,color:'rgba(240,237,230,0.2)',marginTop:8 }}>Be the first to list a card for sale</div>
              </div>
            ) : (
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                {filteredListings.map(l => {
                  const c = l.cards || {}
                  const tc = TIER_COLOR[c.claw_tier] || '#9CA3AF'
                  const rc = RC[c.rarity] || '#9CA3AF'
                  const affordable = canAfford(l)
                  return (
                    <div key={l.id} style={{ background:`${tc}05`,border:`1px solid ${tc}18`,borderRadius:14,overflow:'hidden',position:'relative' }}>
                      {/* Card image */}
                      <div style={{ height:100,background:'rgba(0,0,0,0.4)',overflow:'hidden',position:'relative' }}>
                        {c.image_url ? <img src={c.image_url} style={{ width:'100%',height:'100%',objectFit:'cover' }} alt="" onError={e=>{e.target.style.display='none'}}/> : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36 }}>🃏</div>}
                        <div style={{ position:'absolute',top:6,left:6 }}>
                          <RarityBadge rarity={c.rarity}/>
                        </div>
                        {l.is_mine && <div style={{ position:'absolute',top:6,right:6,fontFamily:"'DM Mono',monospace",fontSize:7,color:'#C9A84C',background:'rgba(0,0,0,0.7)',padding:'2px 6px',borderRadius:4 }}>YOURS</div>}
                      </div>

                      <div style={{ padding:'10px 12px' }}>
                        <div style={{ fontFamily:"'Lato',sans-serif",fontSize:11,fontWeight:700,color:'#F0EDE6',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{c.name}</div>
                        <div style={{ fontFamily:"'DM Mono',monospace",fontSize:8,color:'rgba(240,237,230,0.3)',marginBottom:6 }}>{c.grade} · FMV ${(c.fmv||0).toLocaleString()}</div>
                        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                          <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:600,color:rc }}>${(l.price_cents/100).toFixed(0)}</div>
                          {l.is_mine ? (
                            <button onClick={() => handleCancel(l.id)} disabled={working===l.id} style={{ padding:'5px 10px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:7,color:'#F87171',fontFamily:"'DM Mono',monospace",fontSize:8,cursor:'pointer',letterSpacing:1 }}>
                              {working===l.id ? '…' : 'CANCEL'}
                            </button>
                          ) : isSignedIn ? (
                            <button onClick={() => setBuy(l)} style={{ padding:'6px 12px',background:affordable?`${rc}18`:'rgba(255,255,255,0.03)',border:`1px solid ${affordable?rc+'40':'rgba(255,255,255,0.08)'}`,borderRadius:8,color:affordable?rc:'rgba(240,237,230,0.3)',fontFamily:"'DM Mono',monospace",fontSize:8,cursor:'pointer',letterSpacing:1 }}>
                              {affordable ? 'BUY' : 'NEED $'}
                            </button>
                          ) : (
                            <SignInButton mode="modal">
                              <button style={{ padding:'6px 12px',background:`${rc}18`,border:`1px solid ${rc}40`,borderRadius:8,color:rc,fontFamily:"'DM Mono',monospace",fontSize:8,cursor:'pointer',letterSpacing:1 }}>BUY</button>
                            </SignInButton>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── SELL TAB ── */}
        {tab === 'sell' && (
          <>
            {!isSignedIn ? (
              <div style={{ textAlign:'center',padding:'60px 20px' }}>
                <div style={{ fontSize:40,marginBottom:12 }}>🔒</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'rgba(240,237,230,0.4)',marginBottom:16 }}>Sign in to sell</div>
                <SignInButton mode="modal"><button style={{ padding:'12px 28px',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.3)',borderRadius:10,color:'#C9A84C',fontFamily:"'Cormorant Garamond',serif",fontSize:18,cursor:'pointer' }}>Sign In</button></SignInButton>
              </div>
            ) : myVault.length === 0 ? (
              <div style={{ textAlign:'center',padding:'60px 20px' }}>
                <div style={{ fontSize:40,marginBottom:12 }}>🎰</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'rgba(240,237,230,0.4)',marginBottom:8 }}>No cards in vault</div>
                <div style={{ fontFamily:"'Lato',sans-serif",fontSize:12,color:'rgba(240,237,230,0.25)',marginBottom:20 }}>Pull some cards first to list them here</div>
                <button onClick={() => navigate('/')} style={{ padding:'12px 24px',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.3)',borderRadius:10,color:'#C9A84C',fontFamily:"'Cormorant Garamond',serif",fontSize:16,cursor:'pointer' }}>Go Pull Cards</button>
              </div>
            ) : (
              <>
                <div style={{ fontFamily:"'Lato',sans-serif",fontSize:12,color:'rgba(240,237,230,0.35)',marginBottom:16,lineHeight:1.6 }}>
                  Set your own price. Buyer pays from their wallet. <b style={{ color:'#34D399' }}>100% of the sale price goes to your wallet</b> — no platform fee.
                </div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                  {myVault.map(item => {
                    const c = item.card || item
                    const tc = TIER_COLOR[c.claw_tier] || '#9CA3AF'
                    const alreadyListed = listings.some(l => l.vault?.id === item.id && l.is_mine)
                    return (
                      <div key={item.id} style={{ background:`${tc}05`,border:`1px solid ${alreadyListed?'rgba(201,168,76,0.3)':tc+'18'}`,borderRadius:14,overflow:'hidden',position:'relative' }}>
                        <div style={{ height:90,background:'rgba(0,0,0,0.4)',overflow:'hidden' }}>
                          {c.image_url ? <img src={c.image_url} style={{ width:'100%',height:'100%',objectFit:'cover' }} alt="" onError={e=>{e.target.style.display='none'}}/> : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32 }}>🃏</div>}
                        </div>
                        <div style={{ padding:'10px 12px' }}>
                          <div style={{ fontFamily:"'Lato',sans-serif",fontSize:10,fontWeight:700,color:'#F0EDE6',marginBottom:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{c.name}</div>
                          <div style={{ fontFamily:"'DM Mono',monospace",fontSize:8,color:'rgba(240,237,230,0.3)',marginBottom:6 }}>FMV ${(c.fmv||0).toLocaleString()}</div>
                          {alreadyListed ? (
                            <div style={{ fontFamily:"'DM Mono',monospace",fontSize:8,color:'#C9A84C',textAlign:'center',padding:'5px',background:'rgba(201,168,76,0.08)',borderRadius:6 }}>LISTED</div>
                          ) : (
                            <button onClick={() => { setList(item); setListPrice(Math.floor(c.fmv*0.8)||'') }} style={{ width:'100%',padding:'7px',background:`${tc}18`,border:`1px solid ${tc}30`,borderRadius:8,color:tc,fontFamily:"'DM Mono',monospace",fontSize:8,cursor:'pointer',letterSpacing:1 }}>
                              LIST FOR SALE
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* ── MY LISTINGS TAB ── */}
        {tab === 'mine' && (
          <>
            {myListings.length === 0 ? (
              <div style={{ textAlign:'center',padding:'60px 20px' }}>
                <div style={{ fontSize:40,marginBottom:12 }}>📋</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'rgba(240,237,230,0.4)',marginBottom:8 }}>No active listings</div>
                <button onClick={() => setTab('sell')} style={{ padding:'11px 24px',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.3)',borderRadius:10,color:'#C9A84C',fontFamily:"'Cormorant Garamond',serif",fontSize:16,cursor:'pointer' }}>List a Card</button>
              </div>
            ) : (
              <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                {myListings.map(l => {
                  const c = l.cards || {}
                  const tc = TIER_COLOR[c.claw_tier] || '#9CA3AF'
                  return (
                    <div key={l.id} style={{ background:`${tc}05`,border:`1px solid ${tc}18`,borderRadius:12,padding:'14px',display:'flex',gap:14,alignItems:'center' }}>
                      <div style={{ width:48,height:60,borderRadius:8,overflow:'hidden',background:'rgba(0,0,0,0.4)',flexShrink:0 }}>
                        {c.image_url && <img src={c.image_url} style={{ width:'100%',height:'100%',objectFit:'cover' }} alt="" onError={e=>{e.target.style.display='none'}}/>}
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontFamily:"'Lato',sans-serif",fontSize:13,fontWeight:700,color:'#F0EDE6',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{c.name}</div>
                        <div style={{ fontFamily:"'DM Mono',monospace",fontSize:8,color:'rgba(240,237,230,0.3)',marginBottom:4 }}>{c.grade}</div>
                        <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:600,color:RC[c.rarity]||'#9CA3AF' }}>${(l.price_cents/100).toFixed(0)}</div>
                      </div>
                      <button onClick={() => handleCancel(l.id)} disabled={working===l.id} style={{ padding:'8px 14px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,color:'#F87171',fontFamily:"'DM Mono',monospace",fontSize:8,cursor:'pointer',letterSpacing:1,flexShrink:0 }}>
                        {working===l.id?'…':'CANCEL'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
