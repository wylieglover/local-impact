import { useAuthStore } from '../../stores/auth.store'
import { progressToNextLevel, xpForCurrentLevel, xpRequiredForLevel } from '../../utils/xp'

export default function XPBar() {
  const user = useAuthStore((state) => state.user)
  if (!user) return null

  const { experience = 0, level = 1 } = user
  const progress = progressToNextLevel(experience, level)
  const currentXp = xpForCurrentLevel(experience, level)
  const prevRequired = level > 1 ? xpRequiredForLevel(level - 1) : 0
  const xpNeeded = xpRequiredForLevel(level) - prevRequired

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[100] px-4 pb-[env(safe-area-inset-bottom)] pt-3 bg-gradient-to-t from-slate-900/95 to-slate-900/0 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-1.5">
        {/* Level badge */}
        <div className="flex items-center gap-1.5">
          <div className="bg-slate-800 border border-emerald-500/40 rounded-lg px-2 py-0.5 flex items-center gap-1">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">LVL</span>
            <span className="text-sm font-black text-emerald-400 tabular-nums">{level}</span>
          </div>
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
            Operative Rank
          </span>
        </div>

        {/* XP counter — WoW style */}
        <span className="text-[9px] font-black text-slate-400 tabular-nums tracking-wider">
          {currentXp.toLocaleString()}
          <span className="text-slate-600"> / </span>
          {xpNeeded.toLocaleString()}
          <span className="text-slate-600 ml-1">XP</span>
        </span>
      </div>

      {/* Bar track */}
      <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
        {/* Filled portion */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
        {/* Shimmer overlay */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full animate-[shimmer_2s_ease-in-out_infinite]"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <style>{`
        @keyframes shimmer {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}