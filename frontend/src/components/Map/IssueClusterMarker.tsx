// Create a new file: components/Map/IssueClusterMarker.tsx

type ClusterProps = {
  count: number
  pointCount: number
  onExpand: () => void
}

export default function IssueClusterMarker({ count, pointCount, onExpand }: ClusterProps) {
  // Scale the size based on how many issues are inside
  const size = 40 + Math.min(count / pointCount * 20, 30)

  return (
    <div 
      onClick={onExpand}
      className="relative flex items-center justify-center cursor-pointer group"
      style={{ width: size, height: size }}
    >
      {/* Outer Pulse */}
      <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping" />
      
      {/* Rotating Hex Frame */}
      <div className="absolute inset-0 border-2 border-emerald-500/50 rounded-xl rotate-45 group-hover:rotate-90 transition-transform duration-700 bg-slate-900/80 backdrop-blur-md" />

      {/* The Count */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <span className="text-[10px] font-black text-emerald-500 leading-none tracking-tighter uppercase">Sector</span>
        <span className="text-sm font-black text-white">{count}</span>
      </div>
      
      {/* Corner Accents */}
      <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
}