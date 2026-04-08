type Props = {
  username: string
}

export default function OtherPlayerMarker({ username }: Props) {
  return (
    <div className="relative flex items-center justify-center">
      {/* 1. Soft Presence Ring */}
      <div className="absolute w-10 h-10 rounded-full border border-sky-400/20 bg-sky-400/5" />

      {/* 2. Outer Rotating Ring — slower, subtler than self */}
      <div className="absolute w-8 h-8 border border-dashed border-sky-400/30 rounded-full animate-[spin_14s_linear_infinite]" />

      {/* 3. The Unit Core */}
      <div className="relative z-10 w-6 h-6 flex items-center justify-center">
        {/* Glow */}
        <div className="absolute inset-0 bg-sky-500 blur-md opacity-30 animate-pulse" />

        {/* Rotated square — same language as PlayerMarker but sky blue */}
        <div className="relative w-full h-full bg-slate-900 border-2 border-sky-400 rounded-md rotate-45 flex items-center justify-center shadow-[0_0_10px_rgba(56,189,248,0.4)]">
          {/* Inner dot */}
          <div className="w-1.5 h-1.5 rounded-full bg-sky-400 -rotate-45" />
        </div>
      </div>

      {/* 4. Username Label */}
      <div className="absolute top-6 whitespace-nowrap">
        <span className="text-[9px] font-black text-sky-400 uppercase tracking-[0.15em] bg-slate-900/80 px-2 py-0.5 rounded border border-sky-500/20 backdrop-blur-sm">
          {username}
        </span>
      </div>
    </div>
  )
}