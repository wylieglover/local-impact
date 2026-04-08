import type { Issue } from '../../api/issues.api'

type IssueMarkerProps = {
  issue: Issue
  isSelected: boolean
}

const STATUS_THEME = {
  open: {
    primary: '#f59e0b', // Amber
    secondary: '#78350f',
    glow: 'rgba(245, 158, 11, 0.5)',
  },
  in_progress: {
    primary: '#3b82f6', // Blue
    secondary: '#1e3a8a',
    glow: 'rgba(59, 130, 246, 0.5)',
  },
  resolved: {
    primary: '#10b981', // Emerald
    secondary: '#064e3b',
    glow: 'rgba(16, 185, 129, 0.5)',
  },
}

export default function IssueMarker({ issue, isSelected }: IssueMarkerProps) {
  const theme = STATUS_THEME[issue.status] ?? STATUS_THEME.open

  return (
    <div
      className={`
        relative flex flex-col items-center transition-all duration-300
        ${isSelected ? 'scale-125' : 'hover:scale-110'}
        cursor-pointer
      `}
    >
      {/* Target Lock Ring (Ground Level) */}
      <div 
        className={`
          absolute bottom-0 w-8 h-3 rounded-[100%] border-2 transition-all duration-500
          ${isSelected ? 'opacity-100 scale-125' : 'opacity-40 scale-100'}
        `}
        style={{ 
          borderColor: theme.primary,
          boxShadow: `0 0 10px ${theme.glow}`,
          transform: 'translateY(4px)' 
        }}
      />

      {/* Floating Anomaly Icon */}
      <div className={`relative mb-1 transition-transform duration-700 ${!isSelected && 'animate-bounce'}`} style={{ animationDuration: '3s' }}>
        <svg
          width="36"
          height="42"
          viewBox="0 0 36 42"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]"
        >
          {/* Main Diamond Shape */}
          <path
            d="M18 2L32 16L18 38L4 16L18 2Z"
            fill="#0f172a" /* Dark Slate inner */
            stroke={theme.primary}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          
          {/* Inner Tech Core */}
          <path
            d="M18 8L26 16L18 28L10 16L18 8Z"
            fill={theme.primary}
            className={isSelected ? 'animate-pulse' : ''}
          />

          {/* Glitch/Scan Lines across the marker */}
          <line x1="8" y1="14" x2="28" y2="14" stroke={theme.primary} strokeWidth="0.5" opacity="0.5" />
          <line x1="8" y1="18" x2="28" y2="18" stroke={theme.primary} strokeWidth="0.5" opacity="0.5" />
        </svg>

        {/* Selected "Lock-On" Brackets */}
        {isSelected && (
          <>
            <div className="absolute -top-2 -left-2 w-2 h-2 border-t-2 border-l-2 border-white" />
            <div className="absolute -top-2 -right-2 w-2 h-2 border-t-2 border-r-2 border-white" />
            <div className="absolute -bottom-2 -left-2 w-2 h-2 border-b-2 border-l-2 border-white" />
            <div className="absolute -bottom-2 -right-2 w-2 h-2 border-b-2 border-r-2 border-white" />
          </>
        )}
      </div>

      {/* Distance/Label Tag (Optional aesthetic) */}
      {isSelected && (
        <div className="absolute top-[-30px] whitespace-nowrap bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-black text-white uppercase tracking-tighter shadow-xl">
          Target Locked
        </div>
      )}
    </div>
  )
}