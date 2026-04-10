import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'
import { authApi } from '../../api/auth.api'
import { useThemeStore } from '../../stores/theme.store'

type Props = {
  onOpenProfile: () => void
  onOpenFriends: () => void
}

export default function UserHUD({ onOpenProfile, onOpenFriends }: Props) {
  const { mode, toggleTheme } = useThemeStore()
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const points = useAuthStore((state) => state.user?.points ?? 0)
  
  const handleLogout = async () => {
    try {
      await authApi.logout()
      navigate("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <div className="absolute top-15 left-4 z-[100] flex flex-col gap-2">
      {/* 1. The Points Counter (The Trigger) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative group transition-transform active:scale-95 text-left"
      >
        <div className="absolute -inset-0.5 bg-emerald-500/10 blur rounded-xl group-hover:bg-emerald-500/20 transition-all" />
        
        <div className={`relative bg-slate-900/90 backdrop-blur-md border border-slate-700 border-l-2 ${isOpen ? 'border-l-amber-500' : 'border-l-emerald-500'} rounded-xl px-3 py-1.5 flex items-center gap-3 shadow-xl transition-colors`}>
          <div className="flex items-center justify-center bg-slate-800 p-1.5 rounded-lg border border-slate-700">
            <svg 
              className={`w-3.5 h-3.5 transition-colors ${isOpen ? 'text-amber-400' : 'text-emerald-400'}`}
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5">
              Operator Status
            </span>
            <div className="flex items-baseline gap-1 leading-none">
              <span className="text-lg font-black text-white tabular-nums tracking-tight">
                {points.toLocaleString()}
              </span>
              <span className="text-[8px] font-bold text-slate-500 uppercase">PTS</span>
            </div>
          </div>

          {/* Chevron Indicator */}
          <div className={`ml-1 transition-transform duration-300 ${isOpen ? 'rotate-180 text-amber-500' : 'text-slate-600'}`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* 2. The Dropdown Menu */}
      {isOpen && (
        <div className="flex flex-col gap-1 w-full min-w-[140px] animate-in slide-in-from-top-2 fade-in duration-200">
          
          { /* 0. The Profile Button } */}
          <button
            onClick={() => { onOpenProfile(); setIsOpen(false) }}
            className="group flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-700 border-l-2 border-l-emerald-500 p-3 rounded-xl hover:bg-emerald-500/10 transition-all text-left"
          >
            <div className="p-1.5 bg-slate-800 rounded-lg border border-slate-700 group-hover:border-emerald-500/50">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-white">
              Profile
            </span>
          </button>

          <button
            onClick={() => { onOpenFriends(); setIsOpen(false) }}
            className="group flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-700 border-l-2 border-l-sky-400 p-3 rounded-xl hover:bg-sky-400/10 transition-all text-left"
          >
            <div className="p-1.5 bg-slate-800 rounded-lg border border-slate-700 group-hover:border-sky-400/50">
              <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-white">
              Allies
            </span>
          </button>

          <button 
            onClick={toggleTheme}
            className="group flex items-center justify-between bg-slate-900/90 backdrop-blur-md border border-slate-700 border-l-2 border-l-blue-400 p-3 rounded-xl hover:bg-blue-400/10 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-slate-800 rounded-lg border border-slate-700 group-hover:border-blue-400/50">
                {mode === 'dark' ? (
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-white">
                {mode === 'dark' ? 'Night Vision' : 'Daylight'}
              </span>
            </div>

            {/* Visual Toggle Switch */}
            <div className={`w-6 h-3 rounded-full relative transition-colors ${mode === 'dark' ? 'bg-slate-700' : 'bg-blue-500'}`}>
              <div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all ${mode === 'dark' ? 'left-0.5' : 'left-3.5'}`} />
            </div>
          </button>

          {/* Menu Item: Logout */}
          <button 
            onClick={handleLogout}
            className="group flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-700 border-l-2 border-l-red-500 p-3 rounded-xl hover:bg-red-500/10 transition-all text-left"
          >
            <div className="p-1.5 bg-slate-800 rounded-lg border border-slate-700 group-hover:border-red-500/50">
              <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-white">
              End Session
            </span>
          </button>

          {/* Placeholder for future Map Toggle */}
          <div className="flex items-center gap-3 bg-slate-900/40 backdrop-blur-md border border-slate-800 border-l-2 border-l-slate-700 p-3 rounded-xl opacity-50 italic">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              More Systems Offline
            </span>
          </div>

        </div>
      )}
    </div>
  )
}