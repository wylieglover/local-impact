import { useAuthStore } from '../../stores/auth.store'

export default function PointsCounter() {
  const points = useAuthStore((state) => state.user?.points ?? 0)

  return (
    <div className="absolute top-15 left-4 z-10">
      {/* Outer glow/pulse effect */}
      <div className="absolute -inset-0.5 bg-emerald-500/10 blur rounded-xl animate-pulse" />
      
      <div className="relative bg-slate-900/80 backdrop-blur-md border border-slate-700 border-l-2 border-l-emerald-500 rounded-xl px-3 py-1.5 flex items-center gap-3 shadow-xl">
        
        {/* Compact Icon */}
        <div className="flex items-center justify-center bg-slate-800 p-1.5 rounded-lg border border-slate-700 shadow-inner">
          <svg 
            className="w-3.5 h-3.5 text-emerald-400 drop-shadow-[0_0_3px_rgba(52,211,153,0.5)]" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>

        {/* Data readout */}
        <div className="flex flex-col justify-center">
          <span className="text-[9px] font-black text-emerald-500/80 uppercase tracking-[0.15em] leading-none mb-0.5">
            Bounty Points
          </span>
          <div className="flex items-baseline gap-1 leading-none">
            <span className="text-lg font-black text-white tabular-nums tracking-tight">
              {points.toLocaleString()}
            </span>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
              PTS
            </span>
          </div>
        </div>

        {/* HUD scanning line decoration */}
        <div className="absolute top-0 bottom-0 right-0 w-[1px] bg-emerald-500/20" />
      </div>
    </div>
  )
}