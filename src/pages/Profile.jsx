import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserButton, useAuth } from '@clerk/clerk-react'
import { useApi } from '../hooks/useApi.js'
import { RarityBadge, NFTTag, Spinner } from '../components/UI.jsx'
import { CardSkeleton, StatSkeleton } from '../components/Skeleton.jsx'
import { RARITY_CFG } from '../lib/constants.js'

function StatBox({ label, value, sub, color='#111827', loading }) {
  return (
    <div style={{ background:'#fff', borderRadius:12, padding:'16px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
      {loading
        ? <StatSkeleton/>
        : <>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:'#6B7280', fontWeight:500, marginBottom:6, letterSpacing:0.5 }}>{label}</div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:26, fontWeight:700, color }}>{value}</div>
            {sub && <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:'#9CA3AF', marginTop:2 }}>{sub}</div>}
          </>}
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { isSignedIn } = useAuth()
  const { apiFetch } = useApi()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('stats')

  useEffect(() => {
    if (!isSignedIn) return
    apiFetch('/api/profile')
      .then(d => setProfile(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isSignedIn])

  const user = profile?.user
  const history = profile?.pull_history || []
  const RARITY_COLORS = { Legendary:'#C9A84C', 'Ultra Rare':'#A78BFA', Rare:'#60A5FA', Common:'#9CA3AF' }

  const TAB = { fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:500, padding:'10px 18px', background:'none', border:'none', borderBottom:'2px solid transparent', color:'#9CA3AF', cursor:'pointer' }
  const TAB_A = { ...TAB, borderBottomColor:'#4F46E5', color:'#4F46E5', fontWeight:600 }

  return (
    <div style={{ minHeight:'100vh', background:'#F9FAFB' }}>
      <style>{'@import url(\'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap\')'}</style>

      {/* Header */}
      <div style={{ background:'#fff', borderBottom:'1px solid #E5E7EB', padding:'0 20px' }}>
        <div style={{ maxWidth:680, margin:'0 auto', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <button onClick={() => navigate('/')} style={{ background:'none', border:'none', color:'#6B7280', fontSize:13, cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>← Back</button>
            <span style={{ fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:16, color:'#111827' }}>My Profile</span>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      <div style={{ maxWidth:680, margin:'0 auto', padding:'24px 20px 60px' }}>

        {/* Profile header card */}
        <div style={{ background:'linear-gradient(135deg,#1E1B4B,#312E81)', borderRadius:16, padding:'24px 24px 20px', marginBottom:20, color:'#fff', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, background:'rgba(255,255,255,0.04)', borderRadius:'50%' }}/>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, letterSpacing:2, color:'rgba(255,255,255,0.5)', marginBottom:8 }}>CARD CLAW CO · COLLECTOR</div>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:22, fontWeight:700, color:'#fff', marginBottom:4 }}>
            {loading ? '···' : `Collector #${user?.clerk_id?.slice(-6)||'------'}`}
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:12 }}>
            {[
              [`${loading?'—':user?.credits||0}`, 'credits'],
              [`${loading?'—':user?.pull_streak||0}🔥`, 'streak'],
              [`${loading?'—':profile?.vault_count||0}`, 'in vault'],
            ].map(([v,l]) => (
              <div key={l} style={{ background:'rgba(255,255,255,0.1)', borderRadius:8, padding:'6px 14px', textAlign:'center' }}>
                <div style={{ fontFamily:"'Inter',sans-serif", fontSize:16, fontWeight:700, color:'#fff' }}>{v}</div>
                <div style={{ fontFamily:"'Inter',sans-serif", fontSize:10, color:'rgba(255,255,255,0.5)', letterSpacing:1 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stat boxes */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
          <StatBox label="Vault Value" value={`$${(profile?.vault_fmv||0).toLocaleString()}`} sub="Fair Market Value" color='#C9A84C' loading={loading}/>
          <StatBox label="Total Pulled" value={`$${(user?.total_fmv_pulled||0).toLocaleString()}`} sub="All-time FMV" color='#4F46E5' loading={loading}/>
          <StatBox label="Total Pulls" value={profile?.total_pulls||0} sub={`${profile?.total_swaps||0} swaps`} loading={loading}/>
          <StatBox label="Total Spent" value={`$${((profile?.total_spent||0)/100).toLocaleString()}`} sub="Real money" loading={loading}/>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid #E5E7EB', marginBottom:20 }}>
          {[['stats','Activity'],['vault','Vault'],['marketplace','Listings'],['history','Pull History']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} style={tab===k?TAB_A:TAB}>{l}</button>
          ))}
        </div>

        {/* ── ACTIVITY TAB ── */}
        {tab === 'stats' && (
          <div>
            {/* Streak progress */}
            <div style={{ background:'#fff', borderRadius:12, padding:'18px 20px', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:600, color:'#111827', marginBottom:12 }}>Pull Streak</div>
              <div style={{ display:'flex', gap:6, marginBottom:12 }}>
                {Array.from({length:7}).map((_,i) => {
                  const filled = i < ((user?.pull_streak||0) % 7 || ((user?.pull_streak||0) % 7 === 0 && (user?.pull_streak||0) > 0 ? 7 : 0))
                  return <div key={i} style={{ flex:1, height:10, borderRadius:3, background:filled?'#C9A84C':'#F3F4F6', boxShadow:filled?'0 0 6px rgba(201,168,76,0.4)':'none', transition:'all 0.3s' }}/>
                })}
              </div>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:'#6B7280' }}>
                {user?.pull_streak||0} day streak · Longest: {user?.longest_streak||0} days · Next bonus in {7 - ((user?.pull_streak||0) % 7)} days
              </div>
            </div>

            {/* Recent activity from pull history */}
            <div style={{ background:'#fff', borderRadius:12, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:600, color:'#111827', marginBottom:14 }}>Recent Activity</div>
              {loading ? [1,2,3].map(i=><CardSkeleton key={i}/>) : history.slice(0,8).map((h,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid #F9FAFB' }}>
                  {h.image_url
                    ? <img src={h.image_url} style={{ width:36,height:44,objectFit:'cover',borderRadius:4,border:'1px solid #E5E7EB',flexShrink:0 }} alt="" onError={e=>{e.target.style.display='none'}}/>
                    : <div style={{ width:36,height:44,background:'#F3F4F6',borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0 }}>🃏</div>}
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:500,color:'#111827',marginBottom:3 }}>{h.card_name}</div>
                    <div style={{ display:'flex',gap:6,alignItems:'center' }}>
                      <span style={{ fontSize:10,padding:'1px 7px',borderRadius:3,background:`${RARITY_COLORS[h.rarity]||'#9CA3AF'}18`,color:RARITY_COLORS[h.rarity]||'#9CA3AF',fontWeight:600,fontFamily:"'Inter',sans-serif" }}>{h.rarity}</span>
                      {h.action==='swap' && <span style={{ fontSize:10,color:'#38BDF8',fontFamily:"'Inter',sans-serif" }}>↔ swapped</span>}
                    </div>
                  </div>
                  <div style={{ textAlign:'right',flexShrink:0 }}>
                    <div style={{ fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:700,color:'#111827' }}>${h.fmv}</div>
                    <div style={{ fontFamily:"'Inter',sans-serif",fontSize:10,color:'#9CA3AF' }}>{h.pulled_at?new Date(h.pulled_at).toLocaleDateString():''}</div>
                  </div>
                </div>
              ))}
              {!loading && !history.length && <div style={{ textAlign:'center',padding:'30px 0',color:'#9CA3AF',fontSize:13 }}>No pulls yet</div>}
            </div>
          </div>
        )}

        {/* ── VAULT TAB ── */}
        {tab === 'vault' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ background:'#fff', borderRadius:10, padding:'14px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:13, color:'#374151' }}><b>{profile?.vault_count||0}</b> cards · Total value: <b style={{ color:'#C9A84C' }}>${(profile?.vault_fmv||0).toLocaleString()}</b></div>
              <button onClick={() => navigate('/marketplace')} style={{ padding:'7px 14px',background:'#EEF2FF',border:'none',borderRadius:7,color:'#4F46E5',fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:600,cursor:'pointer' }}>List a Card</button>
            </div>
            {loading ? [1,2,3].map(i=><CardSkeleton key={i}/>) : history.filter(h=>!h.burned && (h.action===null||h.action==='pull')).map((h,i) => {
              const r = RARITY_CFG[h.rarity]||RARITY_CFG.Common
              return (
                <div key={i} style={{ background:'#fff', border:`1px solid ${r.border}20`, borderRadius:12, padding:'14px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', display:'flex', alignItems:'center', gap:12 }}>
                  {h.image_url
                    ? <img src={h.image_url} style={{ width:44,height:54,objectFit:'cover',borderRadius:6,border:'1px solid #E5E7EB',flexShrink:0 }} alt="" onError={e=>{e.target.style.display='none'}}/>
                    : <div style={{ width:44,height:54,background:'#F3F4F6',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0 }}>🃏</div>}
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:600,color:'#111827',marginBottom:4 }}>{h.card_name}</div>
                    <div style={{ display:'flex',gap:6,alignItems:'center' }}>
                      <span style={{ fontSize:10,padding:'2px 8px',borderRadius:3,background:`${RARITY_COLORS[h.rarity]||'#9CA3AF'}18`,color:RARITY_COLORS[h.rarity]||'#9CA3AF',fontWeight:600,fontFamily:"'Inter',sans-serif" }}>{h.rarity}</span>
                      <span style={{ fontSize:11,color:'#9CA3AF',fontFamily:"'Inter',sans-serif" }}>{h.grade}</span>
                    </div>
                  </div>
                  <div style={{ fontFamily:"'Inter',sans-serif",fontSize:18,fontWeight:700,color:'#C9A84C' }}>${h.fmv}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── PULL HISTORY TAB ── */}
        {tab === 'history' && (
          <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', overflow:'hidden' }}>
            {loading ? <div style={{ padding:40,textAlign:'center' }}><Spinner/></div> : history.map((h,i) => (
              <div key={i} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 18px',borderBottom:'1px solid #F9FAFB' }}>
                {h.image_url
                  ? <img src={h.image_url} style={{ width:32,height:40,objectFit:'cover',borderRadius:4,border:'1px solid #E5E7EB',flexShrink:0 }} alt="" onError={e=>{e.target.style.display='none'}}/>
                  : <div style={{ width:32,height:40,background:'#F3F4F6',borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0 }}>🃏</div>}
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:500,color:'#111827' }}>{h.card_name}</div>
                  <div style={{ fontFamily:"'Inter',sans-serif",fontSize:11,color:'#9CA3AF' }}>{new Date(h.pulled_at).toLocaleString()}</div>
                </div>
                <div style={{ textAlign:'right',flexShrink:0 }}>
                  <span style={{ fontSize:10,padding:'2px 8px',borderRadius:3,background:`${RARITY_COLORS[h.rarity]||'#9CA3AF'}18`,color:RARITY_COLORS[h.rarity]||'#9CA3AF',fontWeight:600,fontFamily:"'Inter',sans-serif" }}>{h.rarity}</span>
                  <div style={{ fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:700,color:h.action==='swap'?'#38BDF8':'#111827',marginTop:2 }}>
                    {h.action==='swap'?'↔ Swap':`$${h.fmv}`}
                  </div>
                </div>
              </div>
            ))}
            {!loading && !history.length && <div style={{ padding:'60px 0',textAlign:'center',color:'#9CA3AF',fontSize:13 }}>No pull history yet</div>}
          </div>
        )}
      </div>
    </div>
  )
}
