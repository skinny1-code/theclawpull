import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignInButton, UserButton, useAuth } from '@clerk/clerk-react'
import { useUser } from '../hooks/useUser.js'
import { useApi } from '../hooks/useApi.js'
import { usePull } from '../hooks/usePull.js'
import ClawMachine from '../components/ClawMachine.jsx'
import { RarityBadge, NFTTag, Toast, Modal, ModalButtons, Spinner } from '../components/UI.jsx'
import DailyPull from '../components/DailyPull.jsx'
import LiveFeed from '../components/LiveFeed.jsx'
import VaultStats from '../components/VaultStats.jsx'
import CardDetailModal from '../components/CardDetailModal.jsx'
import ShareButton from '../components/ShareButton.jsx'
import { CardSkeleton } from '../components/Skeleton.jsx'
import { RARITY_CFG, CAT_COLOR } from '../lib/constants.js'

export default function CustomerView() {
  const navigate = useNavigate()
  const { isSignedIn } = useAuth()
  const { user, refresh: refreshUser } = useUser()
  const { apiFetch } = useApi()

  const [tab, setTab]           = useState('PLAY')
  const [pool, setPool]         = useState([])
  const [vault, setVault]       = useState([])
  const [poolLoading, setPoolLoading] = useState(false)
  const [vaultLoading, setVaultLoading] = useState(false)
  const [lastCard, setLastCard] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [swapTarget, setSwapTarget]     = useState(null)
  const [redeemTarget, setRedeemTarget] = useState(null)
  const [detailCard, setDetailCard]     = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast]       = useState(null)
  const [historyTab, setHistoryTab] = useState('vault') // vault | history

  const showToast = (msg, type='default') => { setToast({msg,type}); setTimeout(()=>setToast(null),3200) }

  const loadPool = useCallback(async () => {
    if (!isSignedIn) return
    setPoolLoading(true)
    try { const { cards } = await apiFetch('/api/pool'); setPool(cards || []) }
    catch {} finally { setPoolLoading(false) }
  }, [isSignedIn])

  const loadVault = useCallback(async () => {
    if (!isSignedIn) return
    setVaultLoading(true)
    try { const { items } = await apiFetch('/api/vault'); setVault(items || []) }
    catch {} finally { setVaultLoading(false) }
  }, [isSignedIn])

  useEffect(() => { loadPool() }, [isSignedIn])
  useEffect(() => { if (tab === 'VAULT') loadVault() }, [tab, isSignedIn])

  const { pull, pulling } = usePull({
    onSuccess: async (result) => {
      setRevealed(false)
      const vaultEntry = result.vault
      const displayCard = { ...result.card, nft_token_id: vaultEntry?.nft_token_id, vault_id: vaultEntry?.id }
      setLastCard(displayCard)
      await loadPool()
      await refreshUser()
      setTimeout(() => setRevealed(true), 300)
    }
  })

  const [selectedTier, setSelectedTier] = useState(null)

  const TIER_INFO = {
    CoreClaw:    { key:'coreclaw_pulls',    price:'$25',  color:'#60A5FA', icon:'⚙️', pullsKey:'coreclaw_pulls'    },
    PremierClaw: { key:'premierclaw_pulls', price:'$50',  color:'#34D399', icon:'⭐', pullsKey:'premierclaw_pulls' },
    UltraClaw:   { key:'ultraclaw_pulls',   price:'$100', color:'#A78BFA', icon:'💎', pullsKey:'ultraclaw_pulls'   },
    QuantumClaw: { key:'quantumclaw_pulls', price:'$500', color:'#C9A84C', icon:'⚡', pullsKey:'quantumclaw_pulls' },
  }

  // Auto-select tier if user has pulls ready
  const availableTiers = user ? Object.entries(TIER_INFO).filter(([t,info]) => (user[info.pullsKey]||0) > 0) : []

  const handlePull = async () => {
    const tierToUse = selectedTier || availableTiers[0]?.[0]
    if (pulling || !tierToUse) return
    try { await pull(tierToUse) } catch (err) { showToast(err.message, 'error') }
  }

  const doSwap = async () => {
    if (!swapTarget) return
    setActionLoading(true)
    try {
      const res = await apiFetch('/api/vault', { method:'POST', body:{ action:'swap', vaultId: swapTarget.id } })
      showToast(`Swapped · +$${res.creditsEarned} credits`, 'swap')
      setSwapTarget(null)
      if (lastCard?.vault_id === swapTarget.id) { setLastCard(null); setRevealed(false) }
      await refreshUser(); await loadVault()
    } catch (err) { showToast(err.message, 'error') }
    finally { setActionLoading(false) }
  }

  const doRedeem = async () => {
    if (!redeemTarget) return
    setActionLoading(true)
    try {
      await apiFetch('/api/vault', { method:'POST', body:{ action:'redeem', vaultId: redeemTarget.id } })
      showToast('NFT burned · physical card shipment initiated', 'redeem')
      setRedeemTarget(null); await loadVault()
    } catch (err) { showToast(err.message, 'error') }
    finally { setActionLoading(false) }
  }

  const liveVault = vault.filter(c => !c.burned)
  const cfg = lastCard ? RARITY_CFG[lastCard.rarity] : null
  const isQuantum = lastCard?.claw_tier === 'QuantumClaw'

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#0C0C10 0%,#0F0F16 55%,#0C0C10 100%)', color:'#F0EDE6' }}>
      <div style={{ position:'fixed',top:'-5%',left:'50%',transform:'translateX(-50%)',width:600,height:400,background:'radial-gradient(ellipse,rgba(201,168,76,0.06) 0%,transparent 65%)',pointerEvents:'none',zIndex:0 }}/>

      {/* Header */}
      <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.05)', position:'relative', zIndex:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:9, letterSpacing:6, color:'#C9A84C', marginBottom:2 }}>THE CLAW PULL</div>
          <h1 className="gold-text" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:600, letterSpacing:2, lineHeight:1 }}>TheClawPull™</h1>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {isSignedIn ? (
            <>
              <button onClick={() => navigate('/')} style={{ background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:8, padding:'5px 12px', cursor:'pointer', textAlign:'center' }}>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, letterSpacing:1.5, color:'rgba(240,237,230,0.3)' }}>PULLS READY</div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:'#C9A84C', lineHeight:1.4 }}>
                  {user ? <>
                    {user.coreclaw_pulls>0 && <div>⚙️ {user.coreclaw_pulls}</div>}
                    {user.premierclaw_pulls>0 && <div>⭐ {user.premierclaw_pulls}</div>}
                    {user.ultraclaw_pulls>0 && <div>💎 {user.ultraclaw_pulls}</div>}
                    {user.quantumclaw_pulls>0 && <div>⚡ {user.quantumclaw_pulls}</div>}
                    {!user.coreclaw_pulls && !user.premierclaw_pulls && !user.ultraclaw_pulls && !user.quantumclaw_pulls && <div style={{color:'rgba(240,237,230,0.25)'}}>none</div>}
                  </> : <Spinner size={10}/>}
                </div>
              </button>
              <button onClick={() => navigate('/marketplace')} style={{ background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:8, padding:'5px 10px', cursor:'pointer', textAlign:'center' }}>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, letterSpacing:1.5, color:'rgba(52,211,153,0.5)' }}>MARKET</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:13, fontWeight:600, color:'#34D399', lineHeight:1 }}>Shop</div>
              </button>
              <button onClick={() => navigate('/profile')} style={{ background:'rgba(167,139,250,0.08)', border:'1px solid rgba(167,139,250,0.2)', borderRadius:8, padding:'5px 10px', cursor:'pointer', textAlign:'center' }}>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, letterSpacing:1.5, color:'rgba(167,139,250,0.5)' }}>ACCOUNT</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:13, fontWeight:600, color:'#A78BFA', lineHeight:1 }}>Profile</div>
              </button>
              {user?.pull_streak > 0 && (
                <div style={{ background:'rgba(255,100,0,0.1)', border:'1px solid rgba(255,100,0,0.25)', borderRadius:8, padding:'5px 10px', textAlign:'center' }}>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:'rgba(255,140,0,0.6)', letterSpacing:1 }}>STREAK</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:'#FF8C00' }}>🔥{user.pull_streak}</div>
                </div>
              )}
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <SignInButton mode="modal">
              <button style={{ padding:'8px 18px', background:'linear-gradient(135deg,rgba(201,168,76,0.2),rgba(201,168,76,0.08))', border:'1px solid rgba(201,168,76,0.35)', borderRadius:9, color:'#C9A84C', fontFamily:"'Lato',sans-serif", fontSize:11, fontWeight:700, letterSpacing:1.5, cursor:'pointer' }}>SIGN IN</button>
            </SignInButton>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.05)', position:'relative', zIndex:1 }}>
        {[['PLAY','Play'],['VAULT',`Vault${liveVault.length?` (${liveVault.length})`:''}`],['BOARD','↗']].map(([k,l]) => (
          <button key={k} onClick={() => { if(k==='BOARD') navigate('/leaderboard'); else setTab(k) }} style={{ flex:1, padding:'12px 0', background:'none', border:'none', borderBottom:tab===k?'1px solid #C9A84C':'1px solid transparent', color:tab===k?'#C9A84C':'rgba(240,237,230,0.28)', fontFamily:"'Lato',sans-serif", fontSize:10, letterSpacing:2.5, cursor:'pointer', textTransform:'uppercase', marginBottom:-1 }}>
            {l}
          </button>
        ))}
      </div>

      {/* ── PLAY TAB ── */}
      {tab === 'PLAY' && (
        <div style={{ maxWidth:400, margin:'0 auto', padding:'16px 20px 50px', position:'relative', zIndex:1 }}>

          {/* Not signed in */}
          {!isSignedIn && (
            <div style={{ textAlign:'center', padding:'60px 20px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, marginBottom:16 }}>
              <div style={{ fontSize:36, marginBottom:12 }}>🔒</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:'#F0EDE6', marginBottom:8 }}>Sign in to pull cards</div>
              <SignInButton mode="modal">
                <button style={{ padding:'12px 28px', background:'linear-gradient(135deg,rgba(201,168,76,0.2),rgba(201,168,76,0.08))', border:'1px solid rgba(201,168,76,0.4)', borderRadius:10, color:'#C9A84C', fontFamily:"'Lato',sans-serif", fontSize:12, fontWeight:700, letterSpacing:2, cursor:'pointer', marginTop:8 }}>SIGN IN</button>
              </SignInButton>
            </div>
          )}

          {isSignedIn && (
            <>
              {/* Daily pull */}
              <div style={{ marginBottom:12 }}>
                <DailyPull apiFetch={apiFetch} onClaimed={() => refreshUser()} />
              </div>

              {/* Live feed */}
              <div style={{ marginBottom:12 }}>
                <LiveFeed apiFetch={apiFetch} />
              </div>

              {/* Tier selector */}
              <div style={{ marginBottom:12 }}>
                <div style={{ fontFamily:"'DM Mono',monospace",fontSize:8,letterSpacing:2.5,color:'rgba(240,237,230,0.25)',marginBottom:10,textAlign:'center' }}>SELECT MACHINE</div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
                  {Object.entries(TIER_INFO).map(([tier,info]) => {
                    const pulls = user?.[info.pullsKey] || 0
                    const isSelected = selectedTier === tier || (!selectedTier && availableTiers[0]?.[0] === tier)
                    return (
                      <button key={tier} onClick={() => setSelectedTier(tier)} style={{ padding:'10px 12px',background:isSelected?`${info.color}15`:'rgba(255,255,255,0.02)',border:`1px solid ${isSelected?info.color:'rgba(255,255,255,0.06)'}`,borderRadius:10,cursor:'pointer',textAlign:'left',transition:'all 0.2s' }}>
                        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3 }}>
                          <span style={{ fontSize:16 }}>{info.icon}</span>
                          {pulls > 0 && <span style={{ fontFamily:"'DM Mono',monospace",fontSize:8,color:info.color,background:`${info.color}15`,padding:'1px 6px',borderRadius:4 }}>{pulls} READY</span>}
                        </div>
                        <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:14,fontWeight:600,color:'#F0EDE6' }}>{tier}</div>
                        <div style={{ fontFamily:"'DM Mono',monospace",fontSize:9,color:info.color }}>{info.price} / pull</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Claw machine */}
              <ClawMachine poolSize={pool.filter(c => c.claw_tier === (selectedTier || availableTiers[0]?.[0] || 'CoreClaw')).length} onPull={handlePull} disabled={!user || availableTiers.length === 0} pulling={pulling} />

              {/* Low credits nudge */}
              {user && !user.coreclaw_pulls && !user.premierclaw_pulls && !user.ultraclaw_pulls && !user.quantumclaw_pulls && (
                <div style={{ marginTop:12, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[['⚙️','CoreClaw','$25','/coreclaw','#60A5FA'],['⭐','PremierClaw','$50','/premierclaw','#34D399'],['💎','UltraClaw','$100','/ultraclaw','#A78BFA'],['⚡','QuantumClaw','$500','/quantumclaw','#C9A84C']].map(([icon,name,price,path,color])=>(
                    <button key={name} onClick={()=>navigate(path)} style={{ padding:'10px',background:`${color}08`,border:`1px solid ${color}20`,borderRadius:10,cursor:'pointer',textAlign:'center' }}>
                      <div style={{ fontSize:18,marginBottom:3 }}>{icon}</div>
                      <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:13,fontWeight:600,color:'#F0EDE6' }}>{name}</div>
                      <div style={{ fontFamily:"'DM Mono',monospace",fontSize:9,color }}>{price} / pull</div>
                    </button>
                  ))}
                </div>
              )}

              {/* QuantumClaw special reveal */}
              {revealed && lastCard && isQuantum && (
                <div style={{ marginTop:16, background:'linear-gradient(135deg,rgba(201,168,76,0.15),rgba(201,168,76,0.05))', border:'2px solid rgba(201,168,76,0.6)', borderRadius:16, padding:'20px', textAlign:'center', animation:'revealDrop 0.5s cubic-bezier(0.34,1.56,0.64,1)', boxShadow:'0 0 60px rgba(201,168,76,0.3)' }}>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:3, color:'#C9A84C', marginBottom:8 }}>⚡ QUANTUM PULL ⚡</div>
                  <div style={{ fontSize:60, marginBottom:8 }}>🎰</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:600, color:'#F0EDE6', marginBottom:4 }}>{lastCard.name}</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:'#C9A84C', fontWeight:600, marginBottom:12 }}>${(lastCard.fmv||0).toLocaleString()}</div>
                  <div style={{ display:'flex', justifyContent:'center', gap:10 }}>
                    <ShareButton card={lastCard} />
                    <button onClick={() => setSwapTarget({id:lastCard.vault_id,...lastCard})} style={{ padding:'8px 16px', background:'rgba(56,189,248,0.1)', border:'1px solid rgba(56,189,248,0.3)', borderRadius:8, color:'#38BDF8', fontFamily:"'Lato',sans-serif", fontSize:11, fontWeight:700, letterSpacing:1, cursor:'pointer' }}>SWAP</button>
                    <button onClick={() => setRedeemTarget({id:lastCard.vault_id,...lastCard})} style={{ padding:'8px 16px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, color:'#F87171', fontFamily:"'Lato',sans-serif", fontSize:11, fontWeight:700, letterSpacing:1, cursor:'pointer' }}>REDEEM</button>
                  </div>
                </div>
              )}

              {/* Regular pull reveal */}
              {revealed && lastCard && cfg && !isQuantum && (
                <div style={{ marginTop:14, background:cfg.dimBg, border:`1px solid ${cfg.border}`, borderRadius:12, padding:'14px 16px', animation:'revealDrop 0.4s cubic-bezier(0.34,1.56,0.64,1)', boxShadow:`0 8px 32px ${cfg.glow}20` }}>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:2.5, color:cfg.color, marginBottom:8, textAlign:'center' }}>◆ PULLED ◆</div>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                    <div style={{ width:48,height:60,background:'rgba(0,0,0,0.35)',borderRadius:7,border:`1px solid ${cfg.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,flexShrink:0,boxShadow:`0 0 16px ${cfg.glow}40` }}>
                      {lastCard.image_url ? <img src={lastCard.image_url} style={{ width:'100%',height:'100%',objectFit:'cover',borderRadius:6 }} alt="" /> : '🃏'}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, fontWeight:500, color:'#F0EDE6', marginBottom:4 }}>{lastCard.name}</div>
                      {lastCard.total_pulls !== undefined && (
                        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'rgba(240,237,230,0.35)', marginBottom:4 }}>
                          {lastCard.total_pulls === 0 ? '🔥 First ever pull of this card' :
                           lastCard.total_pulls <= 3 ? `🔥 Only pulled ${lastCard.total_pulls} time${lastCard.total_pulls===1?'':'s'} ever` :
                           `Pulled ${lastCard.total_pulls} times total`}
                        </div>
                      )}
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:6 }}>
                        <RarityBadge rarity={lastCard.rarity} small />
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                        {[['FMV',`$${(lastCard.fmv||0).toLocaleString()}`,cfg.color],['Swap',`$${Math.floor((lastCard.fmv||0)*0.65).toLocaleString()}`,'#38BDF8']].map(([l,v,c])=>(
                          <div key={l} style={{ background:'rgba(0,0,0,0.25)',borderRadius:5,padding:'5px 8px' }}>
                            <div style={{ fontFamily:"'DM Mono',monospace",fontSize:7,letterSpacing:1.5,color:'rgba(240,237,230,0.25)',marginBottom:2 }}>{l}</div>
                            <div style={{ fontFamily:"'DM Mono',monospace",fontSize:11,color:c,fontWeight:500 }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <button onClick={() => setSwapTarget({id:lastCard.vault_id,...lastCard})} style={{ flex:1,padding:'8px',background:'rgba(56,189,248,0.08)',border:'1px solid rgba(56,189,248,0.2)',borderRadius:7,color:'#38BDF8',fontFamily:"'Lato',sans-serif",fontSize:10,fontWeight:700,letterSpacing:1,cursor:'pointer' }}>
                      SWAP · ${Math.floor((lastCard.fmv||0)*0.65).toLocaleString()}
                    </button>
                    <button onClick={() => setRedeemTarget({id:lastCard.vault_id,...lastCard})} style={{ flex:1,padding:'8px',background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:7,color:'#F87171',fontFamily:"'Lato',sans-serif",fontSize:10,fontWeight:700,letterSpacing:1,cursor:'pointer' }}>REDEEM</button>
                    <ShareButton card={lastCard} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── VAULT TAB ── */}
      {tab === 'VAULT' && (
        <div style={{ maxWidth:400, margin:'0 auto', padding:'16px 20px 50px', position:'relative', zIndex:1 }}>
          {/* Vault stats */}
          {vault.length > 0 && <div style={{ marginBottom:12 }}><VaultStats vault={vault} user={user} /></div>}

          {/* Sub-tabs */}
          <div style={{ display:'flex', gap:0, marginBottom:14, background:'rgba(255,255,255,0.02)', borderRadius:9, padding:3 }}>
            {[['vault','My Vault'],['history','History']].map(([k,l]) => (
              <button key={k} onClick={() => setHistoryTab(k)} style={{ flex:1,padding:'8px',background:historyTab===k?'rgba(201,168,76,0.12)':'transparent',border:historyTab===k?'1px solid rgba(201,168,76,0.2)':'1px solid transparent',borderRadius:7,color:historyTab===k?'#C9A84C':'rgba(240,237,230,0.3)',fontFamily:"'Lato',sans-serif",fontSize:10,letterSpacing:2,cursor:'pointer',textTransform:'uppercase' }}>
                {l}
              </button>
            ))}
          </div>

          {vaultLoading ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[1,2,3].map(i => <CardSkeleton key={i} />)}
            </div>
          ) : vault.length === 0 ? (
            <div style={{ textAlign:'center',padding:'80px 0',color:'rgba(240,237,230,0.2)',fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontStyle:'italic' }}>
              Your vault is empty.<br/><span style={{ fontSize:11,fontFamily:"'Lato',sans-serif",letterSpacing:2,fontStyle:'normal' }}>PULL A CARD TO BEGIN</span>
            </div>
          ) : (
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              {(historyTab === 'vault' ? vault.filter(c=>!c.burned) : vault).map(c => {
                const r = RARITY_CFG[c.rarity]||RARITY_CFG.Common
                return (
                  <div key={c.id} onClick={() => setDetailCard(c)} className="hover-lift" style={{ background:c.burned?'rgba(255,255,255,0.015)':`linear-gradient(135deg,${r.dimBg},rgba(255,255,255,0.015))`,border:`1px solid ${c.burned?'rgba(255,255,255,0.05)':r.border}`,borderRadius:12,padding:'12px 14px',opacity:c.burned?0.5:1,filter:c.burned?'grayscale(0.8)':'none',boxShadow:c.burned?'none':`0 4px 20px ${r.glow}15`,cursor:'pointer' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                      <div style={{ width:44,height:54,background:'rgba(0,0,0,0.3)',borderRadius:6,border:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0,overflow:'hidden' }}>
                        {c.image_url ? <img src={c.image_url} style={{ width:'100%',height:'100%',objectFit:'cover' }} alt="" /> : '🃏'}
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:13,fontWeight:500,color:'#F0EDE6',marginBottom:3 }}>{c.card_name}</div>
                        <div style={{ display:'flex',gap:5,flexWrap:'wrap',marginBottom:4 }}>
                          <RarityBadge rarity={c.rarity} small />
                          <NFTTag id={c.nft_token_id} burned={c.burned} />
                        </div>
                      </div>
                      <div style={{ textAlign:'right',flexShrink:0 }}>
                        <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,color:c.burned?'rgba(240,237,230,0.2)':'#C9A84C' }}>${(c.fmv||0).toLocaleString()}</div>
                        <div style={{ fontFamily:"'DM Mono',monospace",fontSize:8,color:'rgba(240,237,230,0.25)' }}>{c.grade}</div>
                      </div>
                    </div>
                    {!c.burned && (
                      <div style={{ display:'flex',gap:6,marginTop:8,paddingTop:8,borderTop:'1px solid rgba(255,255,255,0.05)' }} onClick={e=>e.stopPropagation()}>
                        <button onClick={() => setSwapTarget(c)} style={{ flex:1,padding:'7px',background:'rgba(56,189,248,0.08)',border:'1px solid rgba(56,189,248,0.2)',borderRadius:6,color:'#38BDF8',fontFamily:"'Lato',sans-serif",fontSize:9,fontWeight:700,letterSpacing:1,cursor:'pointer' }}>SWAP · ${Math.floor((c.fmv||0)*0.65).toLocaleString()}</button>
                        <button onClick={() => setRedeemTarget(c)} style={{ flex:1,padding:'7px',background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:6,color:'#F87171',fontFamily:"'Lato',sans-serif",fontSize:9,fontWeight:700,letterSpacing:1,cursor:'pointer' }}>REDEEM</button>
                      </div>
                    )}
                    {c.burned && <div style={{ marginTop:6,paddingTop:6,borderTop:'1px solid rgba(255,255,255,0.04)',fontFamily:"'DM Mono',monospace",fontSize:8,color:'rgba(240,237,230,0.2)',letterSpacing:1.5 }}>NFT BURNED · CARD SHIPPED</div>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* SWAP MODAL */}
      <Modal open={!!swapTarget} onClose={() => !actionLoading && setSwapTarget(null)} title="Swap Card" subtitle="65% FMV → your wallet (use for pulls or cash out)" accentColor="rgba(56,189,248,0.25)">
        {swapTarget && (
          <>
            <div style={{ display:'flex',alignItems:'center',gap:14,marginBottom:20,padding:14,background:'rgba(255,255,255,0.03)',borderRadius:10,border:'1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize:26 }}>🃏</span>
              <div><div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:'#F0EDE6',marginBottom:4 }}>{swapTarget.card_name||swapTarget.name}</div><RarityBadge rarity={swapTarget.rarity} small /></div>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:22 }}>
              {[['Fair Market Value',`$${(swapTarget.fmv||0).toLocaleString()}`,'rgba(240,237,230,0.5)'],['You Receive',`$${Math.floor((swapTarget.fmv||0)*0.65).toLocaleString()}`,'#38BDF8']].map(([l,v,c])=>(
                <div key={l} style={{ background:'rgba(0,0,0,0.3)',borderRadius:8,padding:'12px 14px' }}>
                  <div style={{ fontFamily:"'DM Mono',monospace",fontSize:8,letterSpacing:1.5,color:'rgba(240,237,230,0.25)',marginBottom:5 }}>{l}</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:600,color:c }}>{v}</div>
                </div>
              ))}
            </div>
            <ModalButtons onCancel={()=>setSwapTarget(null)} onConfirm={doSwap} confirmLabel="CONFIRM SWAP" confirmColor="#38BDF8" loading={actionLoading} />
          </>
        )}
      </Modal>

      {/* REDEEM MODAL */}
      <Modal open={!!redeemTarget} onClose={() => !actionLoading && setRedeemTarget(null)} title="Burn & Redeem" subtitle="Irreversible action" accentColor="rgba(239,68,68,0.2)">
        {redeemTarget && (
          <>
            <div style={{ display:'flex',alignItems:'center',gap:14,marginBottom:14,padding:14,background:'rgba(255,255,255,0.02)',borderRadius:10,border:'1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize:26 }}>🃏</span>
              <div><div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:'#F0EDE6',marginBottom:4 }}>{redeemTarget.card_name||redeemTarget.name}</div><NFTTag id={redeemTarget.nft_token_id} /></div>
            </div>
            <p style={{ fontFamily:"'Lato',sans-serif",fontSize:12,color:'rgba(240,237,230,0.35)',lineHeight:1.7,marginBottom:22 }}>Burning this NFT permanently removes it from circulation and initiates shipment of your physical graded card from our secure vault. This cannot be undone.</p>
            <ModalButtons onCancel={()=>setRedeemTarget(null)} onConfirm={doRedeem} confirmLabel="BURN NFT" confirmColor="#F87171" loading={actionLoading} />
          </>
        )}
      </Modal>

      {/* Card detail modal */}
      <CardDetailModal card={detailCard} onClose={() => setDetailCard(null)} onSwap={setSwapTarget} onRedeem={setRedeemTarget} />

      <Toast toast={toast} />
    </div>
  )
}
