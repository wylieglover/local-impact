type Props = {
  username: string
  position: { x: number; y: number }
  onViewProfile: () => void
  onClose: () => void
}

export default function PlayerContextMenu({ username, position, onViewProfile, onClose }: Props) {
  return (
    <>
      {/* Backdrop */}
      <div className="absolute inset-0 z-[150]" onClick={onClose} />

      {/* Menu — positioned to the right of the tap point */}
      <div
        className="absolute z-[151] animate-in fade-in zoom-in-95 duration-150"
        style={{
          left: position.x + 30,
          top: position.y,
        }}
      >
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl overflow-hidden shadow-xl min-w-[180px]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-800">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              Operative
            </p>
            <p className="text-sm font-black text-sky-400 uppercase tracking-tight">
              @{username}
            </p>
          </div>

          {/* Actions */}
          <div className="p-1.5 flex flex-col gap-0.5">
            <button
              onClick={onViewProfile}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 transition-all text-left group"
            >
              <div className="p-1.5 bg-slate-800 group-hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors">
                <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-[10px] font-black text-slate-300 group-hover:text-white uppercase tracking-widest transition-colors">
                View Profile
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}