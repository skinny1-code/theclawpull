import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useApi } from '../hooks/useApi.js'
import { useUser } from '../hooks/useUser.js'
import { RarityBadge, Spinner, Toast, Modal, ModalButtons } from '../components/UI.jsx'
import { CardSkeleton } from '../components/Skeleton.jsx'
import { RARITY_CFG } from '../lib/constants.js'

const RARITY_COLORS = { Legendary:'#C9A84C', 'Ultra Rare':'#A78BFA', Rare:'#60A5FA', Common:'#9CA3AF' }

export default function Marketplace() {
  const navigate = useNavigate()
  const { isSignedIn } = useAuth()
  const { apiFetch } = useApi()
  const { user, refresh } = useUser()

  const [listings, setListings] = useState([])
  const [myVault, setMyVault] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('browse')
  const [buyTarget, setBuyTarget] = useState(null)
  const [tradeTarget, setTradeTarget] = useState(null)
  const [listTarget, setListTarget] = useState(null)
  const [listForm, setListForm] = useState({ askCredits:'', tradeOpen:true })
  const [tradeCard, setTradeCard] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [myTrades, setMyTrades] = useState({ incoming:[], outgoing:[] })

  const showToast = (msg, ok=true) => { setToast({ msg, type: ok ? 'default' : 'error' }); setTimeout(() => setToast(null), 3000) }

  const loadListings = useCallback(async () => {
    try { const d = await apiFetch('/api/marketplace'); setListings(d.listings || []) }
    catch {} finally { setLoading(false) }
  }, [])

  const loadVault = useCallback(async () => {
    try { const d = await apiFetch('/api/vault'); setMyVault(d.items?.filter(c=>!c.burned) || []) }
    catch {}
  }, [])

  const loadTrades = useCallback(async () => {
    try { const d = await apiFetch('/api/trade'); setMyTrades(d) }
    catch {}
  }, [])

  useEffect(() => { loadListings() }, [])
  useEffect(() => {
    if (isSignedIn && tab !== 'browse') { loadVault(); loadTrades() }
  }, [tab, isSignedIn])

  const handleBuy = async () => {
    setActionLoading(true)
    try {
      await apiFetch('/api/trade', { method:'POST', body:{ action:'buy', buyListingId: buyTarget.id } })
      showToast(`Purchased! Card added to your vault`)
      setBuyTarget(null); loadListings(); refresh()
    } catch(err) { showToast(err.message, false) }
    finally { setActionLoading(false) }
  }

  const handleTradeOffer = async () => {
    if (!tradeCard) return
    setActionLoading(true)
    try {
      await apiFetch('/api/trade', { method:'POST', body:{ listingId: tradeTarget.id, offeredVaultId: tradeCard.id } })
      showToast('Trade offer sent!')
      setTradeTarget(null); setTradeCard(null); loadTrades()
    } catch(err) { showToast(err.message, false) }
    finally { setActionLoading(false) }
  }

  const handleList = async () => {
    if (!listTarget) return
    setActionLoading(true)
    try {
      const askCredits = listForm.askCredits ? parseInt(listForm.askCredits) : null
      await apiFetch('/api/marketplace', { method:'POST', body:{ vaultId: listTarget.id, askCredits, tradeOpen: listForm.tradeOpen } })
      showToast('Card listed!')
      setListTarget(null); loadListings(); loadVault()
    } catch(err) { showToast(err.message, false) }
    finally { setActionLoading(false) }
  }

  const handleRespondTrade = async (offerId, action) => {
    setActionLoading(true)
    try {
      await apiFetch('/api/trade', { method:'PATCH', body:{ offerId, action } })
      showToast(action === 'accept' ? 'Trade accepted! Card swapped.' : 'Offer declined')
      loadTrades(); loadListings(); loadVault(); refresh()
    } catch(err) { showToast(err.message, false) }
    finally { setActionLoading(false) }
  }

  const cancelListing = async (listingId) => {
    try {
      await apiFetch('/api/marketplace', { method:'DELETE', body:{ listingId } })
      showToast('Listing cancelled'); loadListings()
    } catch(err) { showToast(err.message, false) }
  }

  const TAB = { fontFamily:"'Lato',sans-serif",fontSize:10,fontWeight:700,letterSpacing:2,padding:'12px 0',background:'none',border:'none',borderBottom:'2px solid transparent',color:'rgba(240,237,230,0.3)',cursor:'pointer',flex:1,textTransform:'uppercase' }
  const TAB_A = { ...TAB, borderBottomColor:'#C9A84C', color:'#C9A84C' }
  const INPUT = { width:'100%',padding:'10px 13px',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,background:'rgba(255,255,255,0.04)',color:'#F0EDE6',fontFamily:"'Lato',sans-serif",fontSize:13,outline:'none',boxSizing:'border-box' }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#0C0C10 0%,#0F0F16 55%,#0C0C10 100%)', color:'#F0EDE6' }}>
      <div style={{ position:'fixed',top:'10%',left:'50%',transform:'translateX(-50%)',width:700,height:300,background:'radial-gradient(ellipse,rgba(201,168,76,0.04) 0%,transparent 65%)',pointerEvents:'none',zIndex:0 }}/>

      {/* Header */}
      <div style={{ padding:'18px 20px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:480, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div>
              <button onClick={() => navigate('/')} style={{ background:'none',border:'none',color:'rgba(240,237,230,0.35)',fontFamily:"'Lato',sans-serif",fontSize:11,letterSpacing:2,cursor:'pointer',padding:0,marginBottom:6 }}>← BACK</button>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <h1 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:600,color:'#F0EDE6',margin:0 }}>Marketplace</h1>
                <span style={{ fontFamily:"'DM Mono',monospace",fontSize:9,background:'rgba(52,211,153,0.1)',border:'1px solid rgba(52,211,153,0.25)',color:'#34D399',padding:'2px 8px',borderRadius:4,letterSpacing:1 }}>{listings.length} ACTIVE</span>
              </div>
            </div>
            {isSignedIn && (
              <button onClick={() => { setTab('sell'); loadVault() }} style={{ padding:'9px 16px',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.3)',borderRadius:9,color:'#C9A84C',fontFamily:"'Lato',sans-serif",fontSize:11,fontWeight:700,letterSpacing:1,cursor:'pointer' }}>
                + LIST CARD
              </button>
            )}
          </div>
          <div style={{ display:'flex', borderBottom:'none' }}>
            {[['browse','Browse'],['sell','Sell / Trade'],['offers','My Offers']].map(([k,l]) => (
              <button key={k} onClick={() => setTab(k)} style={tab===k?TAB_A:TAB}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'16px 20px 60px', position:'relative', zIndex:1 }}>

        {/* ── BROWSE ── */}
        {tab === 'browse' && (
          loading ? [1,2,3].map(i=><CardSkeleton key={i}/>) :
          listings.length === 0 ? (
            <div style={{ textAlign:'center',padding:'80px 0',color:'rgba(240,237,230,0.2)',fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontStyle:'italic' }}>
              No active listings.<br/><span style={{ fontSize:11,fontFamily:"'Lato',sans-serif",letterSpacing:2,fontStyle:'normal' }}>BE THE FIRST TO LIST</span>
            </div>
          ) : listings.map(l => {
            const r = RARITY_CFG[l.cards?.rarity]||RARITY_CFG.Common
            return (
              <div key={l.id} style={{ background:`linear-gradient(135deg,${r.dimBg},rgba(255,255,255,0.01))`,border:`1px solid ${r.border}`,borderRadius:14,padding:'16px 18px',marginBottom:12,boxShadow:`0 4px 20px ${r.glow}10` }}>
                <div style={{ display:'flex',gap:14,alignItems:'flex-start',marginBottom:12 }}>
                  {l.cards?.image_url
                    ? <img src={l.cards.image_url} style={{ width:52,height:66,objectFit:'cover',borderRadius:7,border:`1px solid ${r.border}`,flexShrink:0 }} alt="" onError={e=>{e.target.style.display='none'}}/>
                    : <div style={{ width:52,height:66,background:'rgba(0,0,0,0.3)',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,flexShrink:0 }}>🃏</div>}
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,color:'#F0EDE6',marginBottom:4 }}>{l.cards?.name}</div>
                    <div style={{ display:'flex',gap:5,flexWrap:'wrap',marginBottom:6 }}>
                      <RarityBadge rarity={l.cards?.rarity} small/>
                      <span style={{ fontFamily:"'DM Mono',monospace",fontSize:8,color:'rgba(240,237,230,0.3)' }}>{l.cards?.grade}</span>
                    </div>
                    <div style={{ fontFamily:"'DM Mono',monospace",fontSize:8,color:'rgba(240,237,230,0.25)' }}>
                      Seller #{l.seller_id_short} · ◈ {l.vault?.nft_token_id}
                    </div>
                  </div>
                </div>

                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:12 }}>
                  {[['FMV',`$${(l.cards?.fmv||0).toLocaleString()}`,r.color],['Listed',l.ask_credits?`${l.ask_credits} credits`:'—','#F0EDE6'],['Trade',l.trade_open?'Open':'No',l.trade_open?'#34D399':'rgba(240,237,230,0.25)']].map(([lb,v,c])=>(
                    <div key={lb} style={{ background:'rgba(0,0,0,0.2)',borderRadius:7,padding:'8px 10px' }}>
                      <div style={{ fontFamily:"'DM Mono',monospace",fontSize:7,letterSpacing:1.5,color:'rgba(240,237,230,0.25)',marginBottom:3 }}>{lb}</div>
                      <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,color:c }}>{v}</div>
                    </div>
                  ))}
                </div>

                {isSignedIn && !l.is_mine && (
                  <div style={{ display:'flex',gap:8 }}>
                    {l.ask_credits && (
                      <button onClick={() => setBuyTarget(l)} style={{ flex:1,padding:'10px',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.3)',borderRadius:8,color:'#C9A84C',fontFamily:"'Lato',sans-serif",fontSize:11,fontWeight:700,letterSpacing:1,cursor:'pointer' }}>
                        BUY · {l.ask_credits} credits
                      </button>
                    )}
                    {l.trade_open && (
                      <button onClick={() => { setTradeTarget(l); loadVault() }} style={{ flex:1,padding:'10px',background:'rgba(56,189,248,0.08)',border:'1px solid rgba(56,189,248,0.2)',borderRadius:8,color:'#38BDF8',fontFamily:"'Lato',sans-serif",fontSize:11,fontWeight:700,letterSpacing:1,cursor:'pointer' }}>
                        OFFER TRADE
                      </button>
                    )}
                  </div>
                )}
                {l.is_mine && (
                  <button onClick={() => cancelListing(l.id)} style={{ width:'100%',padding:'9px',background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,color:'#F87171',fontFamily:"'Lato',sans-serif",fontSize:11,fontWeight:700,letterSpacing:1,cursor:'pointer' }}>
                    CANCEL LISTING
                  </button>
                )}
              </div>
            )
          })
        )}

        {/* ── SELL / LIST ── */}
        {tab === 'sell' && (
          <div>
            <p style={{ fontFamily:"'Lato',sans-serif",fontSize:12,color:'rgba(240,237,230,0.35)',marginBottom:16,lineHeight:1.6 }}>
              Select a card from your vault to list. Set a credit price, accept trades, or both.
            </p>
            {myVault.length === 0 ? (
              <div style={{ textAlign:'center',padding:'60px 0',color:'rgba(240,237,230,0.2)',fontFamily:"'Cormorant Garamond',serif",fontSize:18 }}>Your vault is empty</div>
            ) : myVault.map(c => {
              const r = RARITY_CFG[c.rarity]||RARITY_CFG.Common
              const isSelected = listTarget?.id === c.id
              return (
                <div key={c.id} onClick={() => setListTarget(isSelected ? null : c)} style={{ background:isSelected?r.dimBg:'rgba(255,255,255,0.02)',border:`1px solid ${isSelected?r.border:'rgba(255,255,255,0.06)'}`,borderRadius:12,padding:'12px 14px',marginBottom:10,cursor:'pointer',transition:'all 0.2s' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                    {c.image_url
                      ? <img src={c.image_url} style={{ width:40,height:50,objectFit:'cover',borderRadius:5,border:'1px solid rgba(255,255,255,0.1)',flexShrink:0 }} alt="" onError={e=>{e.target.style.display='none'}}/>
                      : <div style={{ width:40,height:50,background:'rgba(255,255,255,0.05)',borderRadius:5,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>🃏</div>}
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:14,fontWeight:600,color:'#F0EDE6',marginBottom:3 }}>{c.card_name}</div>
                      <RarityBadge rarity={c.rarity} small/>
                    </div>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,color:'#C9A84C' }}>${c.fmv}</div>
                  </div>

                  {isSelected && (
                    <div style={{ marginTop:14,paddingTop:14,borderTop:'1px solid rgba(255,255,255,0.06)' }} onClick={e=>e.stopPropagation()}>
                      <div style={{ marginBottom:10 }}>
                        <label style={{ fontFamily:"'Lato',sans-serif",fontSize:11,color:'rgba(240,237,230,0.5)',letterSpacing:1,display:'block',marginBottom:5 }}>SALE PRICE (credits) — leave blank for trade only</label>
                        <input type="number" placeholder={`Suggested: ${Math.floor(c.fmv*0.8)}`} value={listForm.askCredits} onChange={e=>setListForm(f=>({...f,askCredits:e.target.value}))} style={{ ...{width:'100%',padding:'9px 12px',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,background:'rgba(255,255,255,0.04)',color:'#F0EDE6',fontFamily:"'Lato',sans-serif",fontSize:13,outline:'none',boxSizing:'border-box'} }}/>
                      </div>
                      <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:12 }}>
                        <label style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontFamily:"'Lato',sans-serif",fontSize:12,color:'rgba(240,237,230,0.5)' }}>
                          <input type="checkbox" checked={listForm.tradeOpen} onChange={e=>setListForm(f=>({...f,tradeOpen:e.target.checked}))} style={{ accentColor:'#C9A84C' }}/>
                          Open to trade offers
                        </label>
                      </div>
                      <button onClick={handleList} disabled={actionLoading} style={{ width:'100%',padding:'11px',background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.35)',borderRadius:9,color:'#C9A84C',fontFamily:"'Lato',sans-serif",fontSize:11,fontWeight:700,letterSpacing:2,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
                        {actionLoading ? <Spinner size={14}/> : null}
                        LIST FOR {listForm.askCredits ? `${listForm.askCredits} CREDITS` : 'TRADE ONLY'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── MY OFFERS ── */}
        {tab === 'offers' && (
          <div>
            {/* Incoming */}
            <div style={{ fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:2,color:'rgba(240,237,230,0.3)',marginBottom:10 }}>INCOMING TRADE OFFERS</div>
            {myTrades.incoming?.length === 0
              ? <div style={{ fontFamily:"'Lato',sans-serif",fontSize:12,color:'rgba(240,237,230,0.2)',textAlign:'center',padding:'20px 0',marginBottom:16 }}>No incoming offers</div>
              : myTrades.incoming?.map(o => (
                <div key={o.id} style={{ background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'14px 16px',marginBottom:10 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:10 }}>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:'#F0EDE6' }}>
                      Trade for <b>{o.listings?.cards?.name}</b>
                    </div>
                    <span style={{ fontFamily:"'DM Mono',monospace",fontSize:8,color:'#F59E0B',background:'rgba(245,158,11,0.1)',padding:'2px 8px',borderRadius:4 }}>PENDING</span>
                  </div>
                  <div style={{ display:'flex',gap:10,alignItems:'center',marginBottom:12 }}>
                    <div style={{ flex:1,background:'rgba(0,0,0,0.2)',borderRadius:7,padding:'8px 10px',textAlign:'center' }}>
                      <div style={{ fontFamily:"'DM Mono',monospace",fontSize:7,color:'rgba(240,237,230,0.25)',letterSpacing:1.5,marginBottom:3 }}>THEY WANT</div>
                      <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:13,color:'#F0EDE6' }}>{o.listings?.cards?.name}</div>
                      <div style={{ fontFamily:"'DM Mono',monospace",fontSize:10,color:'#C9A84C' }}>${o.listings?.cards?.fmv}</div>
                    </div>
                    <div style={{ fontSize:18,color:'rgba(240,237,230,0.3)' }}>⇄</div>
                    <div style={{ flex:1,background:'rgba(0,0,0,0.2)',borderRadius:7,padding:'8px 10px',textAlign:'center' }}>
                      <div style={{ fontFamily:"'DM Mono',monospace",fontSize:7,color:'rgba(240,237,230,0.25)',letterSpacing:1.5,marginBottom:3 }}>THEY OFFER</div>
                      <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:13,color:'#F0EDE6' }}>{o.offered_vault?.cards?.name}</div>
                      <div style={{ fontFamily:"'DM Mono',monospace",fontSize:10,color:'#38BDF8' }}>${o.offered_vault?.cards?.fmv}</div>
                    </div>
                  </div>
                  <div style={{ display:'flex',gap:8 }}>
                    <button onClick={() => handleRespondTrade(o.id,'accept')} disabled={actionLoading} style={{ flex:1,padding:'10px',background:'rgba(52,211,153,0.1)',border:'1px solid rgba(52,211,153,0.3)',borderRadius:8,color:'#34D399',fontFamily:"'Lato',sans-serif",fontSize:11,fontWeight:700,letterSpacing:1,cursor:'pointer' }}>ACCEPT</button>
                    <button onClick={() => handleRespondTrade(o.id,'decline')} disabled={actionLoading} style={{ flex:1,padding:'10px',background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,color:'#F87171',fontFamily:"'Lato',sans-serif",fontSize:11,fontWeight:700,letterSpacing:1,cursor:'pointer' }}>DECLINE</button>
                  </div>
                </div>
              ))}

            {/* Outgoing */}
            <div style={{ fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:2,color:'rgba(240,237,230,0.3)',marginBottom:10,marginTop:20 }}>MY SENT OFFERS</div>
            {myTrades.outgoing?.length === 0
              ? <div style={{ fontFamily:"'Lato',sans-serif",fontSize:12,color:'rgba(240,237,230,0.2)',textAlign:'center',padding:'20px 0' }}>No outgoing offers</div>
              : myTrades.outgoing?.map(o => (
                <div key={o.id} style={{ background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:'12px 14px',marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                  <div>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:'#F0EDE6',marginBottom:3 }}>{o.listings?.cards?.name}</div>
                    <div style={{ fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(240,237,230,0.3)' }}>Offered: {o.offered_vault?.cards?.name}</div>
                  </div>
                  <span style={{ fontFamily:"'DM Mono',monospace",fontSize:8,padding:'2px 8px',borderRadius:4,background:o.status==='accepted'?'rgba(52,211,153,0.1)':o.status==='declined'?'rgba(239,68,68,0.1)':'rgba(245,158,11,0.1)',color:o.status==='accepted'?'#34D399':o.status==='declined'?'#F87171':'#F59E0B',letterSpacing:1 }}>{o.status.toUpperCase()}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* BUY MODAL */}
      <Modal open={!!buyTarget} onClose={() => setBuyTarget(null)} title="Confirm Purchase" accentColor="rgba(201,168,76,0.25)">
        {buyTarget && (
          <>
            <div style={{ display:'flex',alignItems:'center',gap:14,marginBottom:18,padding:14,background:'rgba(255,255,255,0.03)',borderRadius:10,border:'1px solid rgba(255,255,255,0.06)' }}>
              {buyTarget.cards?.image_url && <img src={buyTarget.cards.image_url} style={{ width:44,height:54,objectFit:'cover',borderRadius:6,border:'1px solid rgba(255,255,255,0.1)' }} alt=""/>}
              <div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:'#F0EDE6',marginBottom:4 }}>{buyTarget.cards?.name}</div>
                <RarityBadge rarity={buyTarget.cards?.rarity} small/>
              </div>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20 }}>
              {[['Card FMV',`$${(buyTarget.cards?.fmv||0).toLocaleString()}`,'rgba(240,237,230,0.6)'],['You Pay',`${buyTarget.ask_credits} credits`,'#C9A84C']].map(([l,v,c])=>(
                <div key={l} style={{ background:'rgba(0,0,0,0.3)',borderRadius:8,padding:'12px 14px' }}>
                  <div style={{ fontFamily:"'DM Mono',monospace",fontSize:8,letterSpacing:1.5,color:'rgba(240,237,230,0.25)',marginBottom:4 }}>{l}</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:600,color:c }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily:"'Lato',sans-serif",fontSize:11,color:'rgba(240,237,230,0.3)',marginBottom:18 }}>
              Balance after: {(user?.credits||0) - (buyTarget.ask_credits||0)} credits
            </div>
            <ModalButtons onCancel={()=>setBuyTarget(null)} onConfirm={handleBuy} confirmLabel="CONFIRM PURCHASE" confirmColor="#C9A84C" loading={actionLoading}/>
          </>
        )}
      </Modal>

      {/* TRADE OFFER MODAL */}
      <Modal open={!!tradeTarget} onClose={() => { setTradeTarget(null); setTradeCard(null) }} title="Send Trade Offer" accentColor="rgba(56,189,248,0.2)">
        {tradeTarget && (
          <>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:2,color:'rgba(240,237,230,0.3)',marginBottom:8 }}>THEY'RE LISTING</div>
              <div style={{ display:'flex',alignItems:'center',gap:10,padding:12,background:'rgba(0,0,0,0.2)',borderRadius:8 }}>
                {tradeTarget.cards?.image_url && <img src={tradeTarget.cards.image_url} style={{ width:36,height:44,objectFit:'cover',borderRadius:5,border:'1px solid rgba(255,255,255,0.1)' }} alt=""/>}
                <div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:'#F0EDE6',marginBottom:3 }}>{tradeTarget.cards?.name}</div>
                  <div style={{ fontFamily:"'DM Mono',monospace",fontSize:10,color:'#C9A84C' }}>${tradeTarget.cards?.fmv}</div>
                </div>
              </div>
            </div>
            <div style={{ fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:2,color:'rgba(240,237,230,0.3)',marginBottom:8 }}>OFFER FROM YOUR VAULT</div>
            {myVault.length === 0
              ? <div style={{ color:'rgba(240,237,230,0.3)',fontFamily:"'Lato',sans-serif",fontSize:12,padding:'20px 0',textAlign:'center' }}>Vault is empty</div>
              : myVault.map(c => (
                <div key={c.id} onClick={() => setTradeCard(tradeCard?.id===c.id ? null : c)} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 12px',border:`1px solid ${tradeCard?.id===c.id?'rgba(56,189,248,0.4)':'rgba(255,255,255,0.06)'}`,borderRadius:9,marginBottom:7,cursor:'pointer',background:tradeCard?.id===c.id?'rgba(56,189,248,0.06)':'rgba(255,255,255,0.02)' }}>
                  {c.image_url && <img src={c.image_url} style={{ width:32,height:40,objectFit:'cover',borderRadius:4,border:'1px solid rgba(255,255,255,0.1)',flexShrink:0 }} alt="" onError={e=>{e.target.style.display='none'}}/>}
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:13,color:'#F0EDE6',marginBottom:2 }}>{c.card_name}</div>
                    <div style={{ fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(240,237,230,0.3)' }}>{c.rarity} · ${c.fmv}</div>
                  </div>
                  {tradeCard?.id===c.id && <span style={{ fontSize:16 }}>✓</span>}
                </div>
              ))
            }
            <div style={{ marginTop:14 }}>
              <ModalButtons onCancel={()=>{setTradeTarget(null);setTradeCard(null)}} onConfirm={handleTradeOffer} confirmLabel="SEND OFFER" confirmColor="#38BDF8" loading={actionLoading || !tradeCard}/>
            </div>
          </>
        )}
      </Modal>

      <Toast toast={toast}/>
    </div>
  )
}
