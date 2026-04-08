export function CardSkeleton() {
  return (
    <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:12, padding:'14px 16px', overflow:'hidden', position:'relative' }}>
      <style>{`@keyframes shimmerSk{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)', animation:'shimmerSk 1.4s ease-in-out infinite', pointerEvents:'none' }}/>
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        <div style={{ width:48, height:60, background:'rgba(255,255,255,0.04)', borderRadius:7 }}/>
        <div style={{ flex:1 }}>
          <div style={{ height:14, background:'rgba(255,255,255,0.04)', borderRadius:4, marginBottom:8, width:'70%' }}/>
          <div style={{ height:10, background:'rgba(255,255,255,0.03)', borderRadius:4, width:'45%' }}/>
        </div>
        <div style={{ width:50, height:20, background:'rgba(255,255,255,0.04)', borderRadius:4 }}/>
      </div>
    </div>
  )
}

export function StatSkeleton() {
  return (
    <div style={{ background:'rgba(255,255,255,0.02)', borderRadius:10, padding:'14px 16px', position:'relative', overflow:'hidden' }}>
      <style>{`@keyframes shimmerSk{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)', animation:'shimmerSk 1.4s ease-in-out infinite', pointerEvents:'none' }}/>
      <div style={{ height:10, background:'rgba(255,255,255,0.04)', borderRadius:3, marginBottom:10, width:'50%' }}/>
      <div style={{ height:28, background:'rgba(255,255,255,0.04)', borderRadius:4, width:'60%' }}/>
    </div>
  )
}
