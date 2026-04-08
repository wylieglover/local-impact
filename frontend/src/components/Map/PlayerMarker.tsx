import { useRef, useState, useEffect } from 'react'

type Props = {
  facing: number | null
}

export default function PlayerMarker({ facing }: Props) {
  const accumulated = useRef<number | null>(null)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    if (facing == null) return

    // First reading — just set it directly, no transition yet
    if (accumulated.current === null) {
      accumulated.current = facing
      setRotation(facing)
      return
    }

    // Calculate shortest angular delta (-180 to +180)
    let delta = facing - (accumulated.current % 360)
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360

    // Accumulate rather than set — CSS transitions between
    // these large numbers correctly, always via the short path
    accumulated.current += delta
    setRotation(accumulated.current)
  }, [facing])

  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute w-32 h-32 rounded-full border border-emerald-500/20 bg-emerald-500/5 animate-[ping_3s_linear_infinite]" />
      <div className="absolute w-12 h-12 border-2 border-dashed border-emerald-400/40 rounded-full animate-[spin_10s_linear_infinite]" />
      <div className="absolute w-10 h-10 border border-emerald-500/30 rounded-full" />

      <div className="relative z-10 w-9 h-9 flex items-center justify-center">
        <div className="absolute inset-0 bg-emerald-500 blur-md opacity-40 animate-pulse" />
        <div className="relative w-full h-full bg-slate-900 border-2 border-emerald-400 rounded-xl rotate-45 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]">
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 fill-emerald-400 -rotate-45"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
          </svg>
        </div>

        <div
          className="absolute inset-0 flex items-start justify-center"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: accumulated.current !== null ? 'transform 0.3s ease-out' : 'none',
          }}
        >
          <div className="w-0 h-0 -translate-y-3 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
        </div>
      </div>

      <div className="absolute top-8 whitespace-nowrap">
        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] bg-slate-900/80 px-2 py-0.5 rounded border border-emerald-500/20 backdrop-blur-sm">
          Signal_Origin
        </span>
      </div>
    </div>
  )
}