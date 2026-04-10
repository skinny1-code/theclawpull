import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useApi } from '../hooks/useApi.js'
import { RarityBadge, Spinner, Toast } from '../components/UI.jsx'
import { RARITY_CFG, CAT_COLOR } from '../lib/constants.js'

const NAVS = [
  { key:'overview',  label:'Overview'         },
  { key:'pool',      label:'Pool Management'  },
  { key:'log',       label:'Pull Log'         },
  { key:'analytics', label:'Analytics'        },
]

const INP = { background:'#F8F7F4', border:'1px solid #E5E2DC', borderRadius:7, padding:'9px 13px', fontSize:12, fontFamily:"'DM Mono',monospace", color:'#1C1C22', outline:'none', width:'100%' }

export default function OperatorDash({ adminUser, onLogout }) {
  const navigate          = useNavigate()
  const { isSignedIn }    = useAuth()
  const { apiFetch }      = useApi()
  const [nav, setNav]     = useState('overview')
  const [stats, setStats] = useState(null)
  const [pool, setPool]   = useState([])
  const [statsLoading, setStatsLoading] = useState(false)
  const [poolLoading, setPoolLoading]   = useState(false)
  const [addLoading, setAddLoading]     = useState(false)
  const [formMsg, setFormMsg] = useState('')
  const [toast, setToast]     = useState(null)
  const [addForm, setAddForm] = useState({ name:'', sport:'Sports', fmv:'', rarity:'Rare', grade:'PSA 9', image_url:'' })

  const showToast = (msg, type='default') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000) }

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try { const data = await apiFetch('/api/admin?type=stats'); setStats(data) }
    catch (err) { showToast(err.message, 'error') }
    finally { setStatsLoading(false) }
  }, [apiFetch])

  const loadPool = useCallback(async () => {
    setPoolLoading(true)
    try { const { cards } = await apiFetch('/api/admin'); setPool(cards || []) }
    catch { /* silent */ }
    finally { setPoolLoading(false) }
  }, [apiFetch])

  useEffect(() => { if (nav === 'overview' || nav === 'analytics') loadStats() }, [nav])
  useEffect(() => { if (nav === 'pool' || nav === 'log') loadPool() }, [nav])

  const addCard = async () => {
    if (!addForm.name || !addForm.fmv) { setFormMsg('Name and FMV are required.'); return }
    setAddLoading(true)
    try {
      await apiFetch('/api/admin', { method:'POST', body:{ ...addForm, fmv:parseInt(addForm.fmv), total_supply:1 } })
      setAddForm({ name:'', sport:'Sports', fmv:'', rarity:'Rare', grade:'PSA 9', image_url:'' })
      setFormMsg('Card added to pool.')
      setTimeout(() => setFormMsg(''), 2500)
      await loadPool()
    } catch (err) { setFormMsg(err.message) }
    finally { setAddLoading(false) }
  }

  const removeCard = async (id) => {
    try { await apiFetch('/api/admin', { method:'DELETE', body:{ id } }); setPool(p => p.filter(c => c.id !== id)) }
    catch (err) { showToast(err.message, 'error') }
  }

  const M = (label, val, sub, accent) => ({ label, val, sub, accent })
  const METRICS = stats ? [
    M('Pool Cards',       stats.pool?.total_cards ?? 0,                            'available',          '#C9A84C'),
    M('Pool Value',       `$${(stats.pool?.total_pool_fmv||0).toLocaleString()}`,  'total FMV',          '#34D399'),
    M('Gross Revenue',    `$${((stats.revenue?.total_revenue_cents||0)/100).toLocaleString()}`, 'collected', '#60A5FA'),
    M('Total Pulls',      stats.pulls?.total_pulls ?? 0,                           'all time',           '#A78BFA'),
    M('Active NFTs',      stats.vault?.active_nfts ?? 0,                           'outstanding',        '#F59E0B'),
    M('Vault Exposure',   `$${(stats.vault?.vault_exposure_fmv||0).toLocaleString()}`, 'FMV liability',  '#F472B6'),
    M('Swaps',            stats.pulls?.total_swaps ?? 0,                           'cards recycled',     '#38BDF8'),
    M('Redemptions',      stats.vault?.burned_nfts ?? 0,                           'NFTs burned',        '#F87171'),
  ] : []

  return (
    <div style={{ minHeight:'100vh', background:'#F4F2EE', color:'#1C1C22', fontFamily:"'Lato',sans-serif", display:'flex' }}>

      {/* ── Sidebar ── */}
      <div style={{ width:224, background:'#FAFAF8', borderRight:'1px solid #E8E5DF', display:'flex', flexDirection:'column', position:'fixed', top:0, bottom:0, left:0, zIndex:50 }}>
        <div style={{ padding:'24px 22px 18px', borderBottom:'1px solid #E8E5DF' }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:9, letterSpacing:4, color:'#C9A84C', marginBottom:4 }}>CARD CLAW CO</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:600, lineHeight:1.15 }}>Operator<br/>Console</div>
        </div>
        <div style={{ padding:'12px 22px', borderBottom:'1px solid #E8E5DF', display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,rgba(201,168,76,0.3),rgba(201,168,76,0.1))', border:'1px solid rgba(201,168,76,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'capitalize' }}>{adminUser}</div>
            <div style={{ fontSize:9, color:'#94A38C', letterSpacing:1 }}>ADMINISTRATOR</div>
          </div>
        </div>
        <nav style={{ padding:'14px 12px', flex:1 }}>
          {NAVS.map(n => (
            <button key={n.key} onClick={() => setNav(n.key)} style={{ width:'100%', padding:'10px 14px', background:nav===n.key?'rgba(201,168,76,0.1)':'transparent', border:nav===n.key?'1px solid rgba(201,168,76,0.25)':'1px solid transparent', borderRadius:8, textAlign:'left', cursor:'pointer', fontFamily:"'Lato',sans-serif", fontSize:13, color:nav===n.key?'#B8930A':'#64645C', fontWeight:nav===n.key?700:400, marginBottom:2 }}>
              {n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding:'14px 22px', borderTop:'1px solid #E8E5DF' }}>
          <button onClick={() => navigate('/')} style={{ width:'100%', padding:'8px 12px', background:'transparent', border:'1px solid #E8E5DF', borderRadius:8, cursor:'pointer', fontFamily:"'Lato',sans-serif", fontSize:11, color:'#94A38C', letterSpacing:0.5, display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            ← Customer View
          </button>
          <button onClick={onLogout} style={{ width:'100%', padding:'8px 12px', background:'transparent', border:'1px solid #E8E5DF', borderRadius:8, cursor:'pointer', fontFamily:"'Lato',sans-serif", fontSize:11, color:'#94A38C', letterSpacing:0.5, display:'flex', alignItems:'center', gap:8 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
          <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:6,height:6,borderRadius:'50%',background:'#34D399',boxShadow:'0 0 5px #34D399' }}/>
            <span style={{ fontSize:10, color:'#94A38C', letterSpacing:1 }}>LIVE</span>
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ marginLeft:224, flex:1, padding:'32px 36px', overflowY:'auto' }}>

        {/* OVERVIEW */}
        {nav === 'overview' && (
          <div style={{ animation:'fadeUp 0.3s ease' }}>
            <div style={{ marginBottom:24 }}>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:600, marginBottom:3 }}>Platform Overview</h2>
              <p style={{ fontSize:12, color:'#94A38C' }}>{new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
            </div>
            {statsLoading ? (
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'40px 0', color:'#94A38C' }}><Spinner size={18} color="#C9A84C"/> Loading stats…</div>
            ) : (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
                  {METRICS.map(m => (
                    <div key={m.label} style={{ background:'#FAFAF8', border:'1px solid #E8E5DF', borderRadius:12, padding:'18px 20px', borderTop:`3px solid ${m.accent}` }}>
                      <div style={{ fontSize:9,color:'#94A38C',letterSpacing:1.5,marginBottom:8,textTransform:'uppercase' }}>{m.label}</div>
                      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:600, lineHeight:1, marginBottom:4 }}>{m.val}</div>
                      <div style={{ fontSize:11, color:'#B8B0A8' }}>{m.sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  {[
                    ['Pool Rarity Distribution', Object.entries(RARITY_CFG).map(([r,c]) => ({ label:r, color:c.color, cnt:(stats?.rarityBreakdown||[]).find(x=>x.rarity===r)?.count||0 }))],
                    ['Pool by Category', ['Sports','Pokémon','Anime','NFT'].map(cat => ({ label:cat, color:CAT_COLOR[cat]||'#94A3B8', cnt:pool.filter(x=>x.sport===cat||x.set_name?.includes(cat)).length }))],
                  ].map(([title, rows]) => (
                    <div key={title} style={{ background:'#FAFAF8', border:'1px solid #E8E5DF', borderRadius:12, padding:'20px 22px' }}>
                      <div style={{ fontSize:11,fontWeight:700,letterSpacing:1.5,color:'#64645C',marginBottom:18,textTransform:'uppercase' }}>{title}</div>
                      {rows.map(row => {
                        const total = rows.reduce((a,r) => a+r.cnt, 0)
                        const pct = total ? Math.round(row.cnt/total*100) : 0
                        return (
                          <div key={row.label} style={{ marginBottom:13 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                              <span style={{ fontSize:11 }}>{row.label}</span>
                              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:'#94A38C' }}>{row.cnt} · {pct}%</span>
                            </div>
                            <div style={{ height:4, background:'#EDE9E2', borderRadius:4 }}>
                              <div style={{ height:'100%', width:`${pct}%`, background:row.color, borderRadius:4, transition:'width 0.6s ease' }}/>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* POOL MANAGEMENT */}
        {nav === 'pool' && (
          <div style={{ animation:'fadeUp 0.3s ease' }}>
            <div style={{ marginBottom:22 }}>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:600, marginBottom:3 }}>Pool Management</h2>
              <p style={{ fontSize:12, color:'#94A38C' }}>{pool.length} cards active</p>
            </div>
            {/* Add form */}
            <div style={{ background:'#FAFAF8', border:'1px solid #E8E5DF', borderRadius:12, padding:'22px 24px', marginBottom:20 }}>
              <div style={{ fontSize:11,fontWeight:700,letterSpacing:1.5,color:'#64645C',marginBottom:16,textTransform:'uppercase' }}>Add Card to Pool</div>
              <div style={{ display:'grid', gridTemplateColumns:'2.5fr 1fr 1fr 1fr 1fr', gap:10, marginBottom:10 }}>
                <input placeholder="Card name" value={addForm.name} onChange={e=>setAddForm(f=>({...f,name:e.target.value}))} style={INP}/>
                <select value={addForm.sport} onChange={e=>setAddForm(f=>({...f,sport:e.target.value}))} style={INP}>
                  {['Sports','Pokémon','Anime','NFT'].map(c=><option key={c}>{c}</option>)}
                </select>
                <select value={addForm.rarity} onChange={e=>setAddForm(f=>({...f,rarity:e.target.value}))} style={INP}>
                  {Object.keys(RARITY_CFG).map(r=><option key={r}>{r}</option>)}
                </select>
                <input placeholder="FMV ($)" type="number" value={addForm.fmv} onChange={e=>setAddForm(f=>({...f,fmv:e.target.value}))} style={INP}/>
                <input placeholder="Grade (PSA 10)" value={addForm.grade} onChange={e=>setAddForm(f=>({...f,grade:e.target.value}))} style={INP}/>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <button onClick={addCard} disabled={addLoading} style={{ padding:'9px 22px', background:'#1C1C22', border:'none', borderRadius:8, color:'#F4F2EE', fontFamily:"'Lato',sans-serif", fontSize:12, fontWeight:700, letterSpacing:1, cursor:addLoading?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:8, opacity:addLoading?0.7:1 }}>
                  {addLoading && <Spinner size={12} color="#F4F2EE"/>} Add to Pool
                </button>
                {formMsg && <span style={{ fontSize:11, color:formMsg.includes('Error')||formMsg.includes('required')?'#F87171':'#34D399' }}>{formMsg}</span>}
              </div>
            </div>
            {/* Table */}
            {poolLoading ? (
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'30px 0', color:'#94A38C' }}><Spinner size={16} color="#C9A84C"/> Loading pool…</div>
            ) : (
              <div style={{ background:'#FAFAF8', border:'1px solid #E8E5DF', borderRadius:12, overflow:'hidden' }}>
                <div style={{ display:'grid', gridTemplateColumns:'2.5fr 90px 110px 80px 80px 70px', padding:'11px 20px', borderBottom:'1px solid #E8E5DF', background:'#F4F2EE' }}>
                  {['Card','Category','Rarity','FMV','Grade',''].map(h=><span key={h} style={{ fontSize:9,letterSpacing:1.5,color:'#94A38C',fontWeight:700,textTransform:'uppercase' }}>{h}</span>)}
                </div>
                <div style={{ maxHeight:440, overflowY:'auto' }}>
                  {pool.map((c,i) => (
                    <div key={c.id} style={{ display:'grid', gridTemplateColumns:'2.5fr 90px 110px 80px 80px 70px', padding:'11px 20px', borderBottom:'1px solid #EDE9E2', background:i%2===0?'#FAFAF8':'#F8F6F2', alignItems:'center' }}>
                      <span style={{ fontSize:13 }}>{c.name}</span>
                      <span style={{ fontSize:11, color:CAT_COLOR[c.sport]||'#94A3B8', fontWeight:700 }}>{c.sport||'—'}</span>
                      <RarityBadge rarity={c.rarity} small />
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:12 }}>${(c.fmv||0).toLocaleString()}</span>
                      <span style={{ fontSize:11, color:'#64645C' }}>{c.grade}</span>
                      <button onClick={() => removeCard(c.id)} style={{ padding:'3px 10px', background:'transparent', border:'1px solid #E8E5DF', borderRadius:5, color:'#B8B0A8', fontSize:10, cursor:'pointer' }}>Remove</button>
                    </div>
                  ))}
                  {pool.length === 0 && <div style={{ padding:40, textAlign:'center', color:'#B8B0A8', fontSize:13, fontStyle:'italic' }}>No cards in pool</div>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PULL LOG */}
        {nav === 'log' && (
          <div style={{ animation:'fadeUp 0.3s ease' }}>
            <div style={{ marginBottom:22 }}>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:600, marginBottom:3 }}>Pull Log</h2>
              <p style={{ fontSize:12, color:'#94A38C' }}>{stats?.recentPulls?.length ?? '—'} recent pulls loaded</p>
            </div>
            {statsLoading ? (
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'30px 0', color:'#94A38C' }}><Spinner size={16} color="#C9A84C"/> Loading…</div>
            ) : (
              <div style={{ background:'#FAFAF8', border:'1px solid #E8E5DF', borderRadius:12, overflow:'hidden' }}>
                <div style={{ display:'grid', gridTemplateColumns:'130px 2fr 90px 110px 80px 100px', padding:'11px 20px', borderBottom:'1px solid #E8E5DF', background:'#F4F2EE' }}>
                  {['Time','Card','FMV','Rarity','Grade','NFT ID'].map(h=><span key={h} style={{ fontSize:9,letterSpacing:1.5,color:'#94A38C',fontWeight:700,textTransform:'uppercase' }}>{h}</span>)}
                </div>
                {(!stats?.recentPulls?.length) && <div style={{ padding:48, textAlign:'center', color:'#B8B0A8', fontSize:13, fontStyle:'italic' }}>No pulls yet</div>}
                <div style={{ maxHeight:500, overflowY:'auto' }}>
                  {(stats?.recentPulls||[]).map((p,i) => (
                    <div key={p.id} style={{ display:'grid', gridTemplateColumns:'130px 2fr 90px 110px 80px 100px', padding:'11px 20px', borderBottom:'1px solid #EDE9E2', background:i%2===0?'#FAFAF8':'#F8F6F2', alignItems:'center' }}>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:'#94A38C' }}>{new Date(p.pulled_at).toLocaleTimeString()}</span>
                      <span style={{ fontSize:13 }}>{p.card_name}</span>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:500 }}>${(p.fmv||0).toLocaleString()}</span>
                      <RarityBadge rarity={p.rarity} small />
                      <span style={{ fontSize:11, color:'#64645C' }}>{p.grade||'—'}</span>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:'#38BDF8' }}>{p.nft_token_id||'—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS */}
        {nav === 'analytics' && (
          <div style={{ animation:'fadeUp 0.3s ease' }}>
            <div style={{ marginBottom:22 }}>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:600, marginBottom:3 }}>Analytics</h2>
              <p style={{ fontSize:12, color:'#94A38C' }}>Platform economics & performance</p>
            </div>
            {statsLoading ? (
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'30px 0', color:'#94A38C' }}><Spinner size={16} color="#C9A84C"/> Loading…</div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div style={{ background:'#FAFAF8', border:'1px solid #E8E5DF', borderRadius:12, padding:'22px 24px' }}>
                  <div style={{ fontSize:11,fontWeight:700,letterSpacing:1.5,color:'#64645C',marginBottom:18,textTransform:'uppercase' }}>Economics</div>
                  {[
                    ['Pull Price',       '$1 credit / pull',                                                          '#1C1C22'],
                    ['Swap Payout',      '65% of FMV in credits',                                                    '#1C1C22'],
                    ['Avg Pull FMV',     `$${Math.round(stats?.pulls?.avg_pull_fmv||0).toLocaleString()}`,           '#C9A84C'],
                    ['Revenue Collected',`$${((stats?.revenue?.total_revenue_cents||0)/100).toLocaleString()}`,      '#34D399'],
                    ['Credits Sold',     (stats?.revenue?.total_credits_sold||0).toLocaleString(),                   '#60A5FA'],
                    ['Vault Exposure',   `$${(stats?.vault?.vault_exposure_fmv||0).toLocaleString()}`,               '#F59E0B'],
                    ['Cards Redeemed',   stats?.vault?.burned_nfts||0,                                               '#F87171'],
                  ].map(([l,v,c]) => (
                    <div key={l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #EDE9E2' }}>
                      <span style={{ fontSize:12, color:'#64645C' }}>{l}</span>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:c, fontWeight:500 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background:'#FAFAF8', border:'1px solid #E8E5DF', borderRadius:12, padding:'22px 24px' }}>
                  <div style={{ fontSize:11,fontWeight:700,letterSpacing:1.5,color:'#64645C',marginBottom:18,textTransform:'uppercase' }}>Most Pulled Cards</div>
                  {!(stats?.topCards?.length) && <div style={{ fontSize:12, color:'#B8B0A8', fontStyle:'italic' }}>No data yet</div>}
                  {(stats?.topCards||[]).map(c => (
                    <div key={c.name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:'1px solid #EDE9E2' }}>
                      <span style={{ fontSize:12 }}>{c.name.slice(0,30)}</span>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:'#A78BFA', background:'rgba(167,139,250,0.1)', border:'1px solid rgba(167,139,250,0.2)', padding:'2px 8px', borderRadius:4 }}>×{c.pull_count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Toast toast={toast}/>
    </div>
  )
}
