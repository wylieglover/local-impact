import type { Issue } from '../../api/issues.api'

type IssueDetailProps = {
  issue: Issue
  onClose: () => void
}

const STATUS_CONFIG = {
  open: {
    label: 'ACTIVE BOUNTY',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    dot: 'bg-amber-500',
    ping: 'bg-amber-400',
    border: 'border-amber-500/50',
  },
  in_progress: {
    label: 'INTERCEPTING',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    dot: 'bg-blue-500',
    ping: 'bg-blue-400',
    border: 'border-blue-500/50',
  },
  resolved: {
    label: 'NEUTRALIZED',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    dot: 'bg-emerald-500',
    ping: 'bg-emerald-400',
    border: 'border-emerald-500/50',
  },
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).toUpperCase()
}

export default function IssueDetail({ issue, onClose }: IssueDetailProps) {
  const previewUrl = issue.photoUrl ?? null
  const status = STATUS_CONFIG[issue.status] ?? STATUS_CONFIG.open
  const rewardPoints = previewUrl ? 15 : 10

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-slate-900 text-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10 animate-in slide-in-from-bottom duration-300 border-t-4 border-slate-800">
      {/* HUD Handle */}
      <div className="pt-4 pb-2 flex justify-center">
        <div className="w-14 h-1.5 bg-slate-700 rounded-full" />
      </div>

      {previewUrl && (
        <div className="relative w-full overflow-hidden bg-slate-950 border-b-2 border-slate-800 group">
          {/* 1. Blurred Background (Prevents "Compacted" look/Black bars) */}
          <div 
            className="absolute inset-0 opacity-30 blur-xl scale-110"
            style={{ backgroundImage: `url(${previewUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />

          {/* 2. The Actual Image (Full view) */}
          <div className="relative flex justify-center items-center min-h-[300px] max-h-[70vh]">
            <img
              src={previewUrl}
              alt="Intel preview"
              className="relative z-10 w-full h-full object-contain max-h-[500px]"
            />
            
            {/* 3. Scanner Overlay UI (Now scales with image) */}
            <div className="absolute inset-4 pointer-events-none z-20">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-500/80" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-500/80" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-500/80" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-500/80" />
              
              {/* Scanning Line */}
              <div className="w-full h-[1px] bg-emerald-400/30 shadow-[0_0_8px_rgba(16,185,129,0.8)] absolute top-0 animate-[scan_4s_ease-in-out_infinite]" />
            </div>

            {/* "Enhance" Button Overlay (Shows on hover/touch) */}
            <div className="absolute bottom-8 right-8 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-emerald-500 text-slate-900 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter">
                  Intel Enhanced
              </div>
            </div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-slate-900 z-10" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-slate-900/80 backdrop-blur-md rounded-xl text-white border border-slate-700 hover:bg-red-500 transition-all z-40"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
              Bounty Intel Report
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">
              Anomaly #{issue.id.slice(-4)}
            </h2>
          </div>
          
          {!previewUrl && (
             <button
              onClick={onClose}
              className="p-2 bg-slate-800 rounded-xl text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* The Intel Box */}
        <div className="bg-slate-800/50 border-l-4 border-emerald-500 rounded-r-2xl p-4 mb-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-2 opacity-10">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
           </div>
          <p className="text-[16px] text-slate-200 leading-relaxed font-medium">
            {issue.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 items-center">
          {/* Status Badge */}
          <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${status.border} ${status.bg}`}>
            <span className="relative flex h-3 w-3">
              {issue.status !== 'resolved' && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status.ping} opacity-75`} />
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${status.dot}`} />
            </span>
            <span className={`text-xs font-black tracking-widest ${status.color}`}>
              {status.label}
            </span>
          </div>

          {/* Reward Value */}
          <div className="bg-slate-800 rounded-xl px-4 py-2 border border-slate-700 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-slate-500 tracking-tighter uppercase">Reward</span>
            <span className="text-amber-400 font-black text-sm">{rewardPoints} POINTS</span>
          </div>
        </div>

        {/* Metadata Footer */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center text-[11px] font-bold tracking-widest">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 uppercase">Signal Origin</span>
            <span className="text-emerald-400 uppercase italic">@{issue.username || 'ANON_OPERATIVE'}</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-slate-500 uppercase">Timestamp</span>
            <span className="text-slate-300">{formatDate(issue.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Global CSS for the scanning line - place in your global CSS file or a style tag */}
      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  )
}