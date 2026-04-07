import type { Issue } from '../../types/Issue'

type IssueMarkerProps = {
  issue: Issue
  isSelected: boolean
}

const STATUS_COLORS = {
  open: {
    fill: '#F97316',
    stroke: '#EA580C',
    pulse: 'bg-orange-400',
  },
  in_progress: {
    fill: '#3B82F6',
    stroke: '#2563EB',
    pulse: 'bg-blue-400',
  },
  resolved: {
    fill: '#22C55E',
    stroke: '#16A34A',
    pulse: 'bg-green-400',
  },
}

export default function IssueMarker({ issue, isSelected }: IssueMarkerProps) {
  const colors = STATUS_COLORS[issue.status] ?? STATUS_COLORS.open

  return (
    <div
      className={`
        relative flex flex-col items-center transition-transform duration-150
        ${isSelected ? 'scale-125' : 'hover:scale-110'}
        cursor-pointer
      `}
    >
      {/* Custom map pin SVG */}
      <svg
        width="32"
        height="40"
        viewBox="0 0 32 40"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-md"
      >
        {/* Pin body */}
        <path
          d="M16 0C9.373 0 4 5.373 4 12c0 8 12 28 12 28S28 20 28 12C28 5.373 22.627 0 16 0z"
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth="1.5"
        />
        {/* Inner circle */}
        <circle cx="16" cy="12" r="6" fill="white" opacity="0.9" />
        {/* Warning icon */}
        <text
          x="16"
          y="17"
          textAnchor="middle"
          fontSize="9"
          fontWeight="bold"
          fill={colors.fill}
        >
          !
        </text>
      </svg>

      {/* Selected indicator */}
      {isSelected && (
        <div
          className={`
            absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white
            ${colors.pulse}
          `}
        />
      )}
    </div>
  )
}