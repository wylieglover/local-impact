export default function PlayerMarker() {
  return (
    <div className="relative flex items-center justify-center">
      {/* 1. Detection Radius (Large Pulse) */}
      <div className="absolute w-32 h-32 rounded-full border border-emerald-500/20 bg-emerald-500/5 animate-[ping_3s_linear_infinite]" />
      
      {/* 2. Outer Rotating HUD Ring */}
      <div className="absolute w-12 h-12 border-2 border-dashed border-emerald-400/40 rounded-full animate-[spin_10s_linear_infinite]" />

      {/* 3. Middle Static HUD Ring */}
      <div className="absolute w-10 h-10 border border-emerald-500/30 rounded-full" />

      {/* 4. The Operator Core */}
      <div className="relative z-10 w-9 h-9 flex items-center justify-center">
        {/* Glowing Background Glow */}
        <div className="absolute inset-0 bg-emerald-500 blur-md opacity-40 animate-pulse" />
        
        {/* The Core Shape */}
        <div className="relative w-full h-full bg-slate-900 border-2 border-emerald-400 rounded-xl rotate-45 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]">
          {/* Inner Glyph - Crosshair style */}
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 fill-emerald-400 -rotate-45"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
          </svg>
        </div>

        {/* Directional "Point" (Small arrow showing orientation) */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
      </div>

      {/* 5. Operator Label (Shows briefly or when zoomed in) */}
      <div className="absolute top-8 whitespace-nowrap">
        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] bg-slate-900/80 px-2 py-0.5 rounded border border-emerald-500/20 backdrop-blur-sm">
          Signal_Origin
        </span>
      </div>
      
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}