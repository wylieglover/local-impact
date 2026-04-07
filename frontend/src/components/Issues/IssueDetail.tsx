import type { Issue } from '../../api/issues.api'

type IssueDetailProps = {
  issue: Issue
  onClose: () => void
}

const STATUS_CONFIG = {
  open: {
    label: 'Open',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    dot: 'bg-orange-500',
    ping: 'bg-orange-400',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    dot: 'bg-blue-500',
    ping: 'bg-blue-400',
  },
  resolved: {
    label: 'Resolved',
    color: 'text-green-600',
    bg: 'bg-green-50',
    dot: 'bg-green-500',
    ping: 'bg-green-400',
  },
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function IssueDetail({ issue, onClose }: IssueDetailProps) {
  const previewUrl = issue.photoUrl ?? null
  const status = STATUS_CONFIG[issue.status] ?? STATUS_CONFIG.open

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2rem] shadow-[0_-8px_30px_rgb(0,0,0,0.12)] z-10 animate-in slide-in-from-bottom duration-300">
      <div className="pt-4 pb-2 flex justify-center">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
      </div>

      {previewUrl && (
        <div className="relative w-full h-56 overflow-hidden bg-gray-100">
          <img
            src={previewUrl}
            alt="Issue photo"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur-sm rounded-full text-white hover:bg-black/60 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="p-6">
        {!previewUrl && (
          <div className="flex items-start justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Issue details
            </h2>
            <button
              onClick={onClose}
              className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {previewUrl && (
          <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-5">
            Issue details
          </h2>
        )}

        <div className="bg-gray-50 rounded-2xl p-4 mb-4">
          <p className="text-[15px] text-gray-800 leading-relaxed">
            {issue.description}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bg}`}>
            <span className="relative flex h-2 w-2">
              {issue.status !== 'resolved' && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status.ping} opacity-75`} />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${status.dot}`} />
            </span>
            <span className={`text-xs font-semibold ${status.color}`}>
              {status.label}
            </span>
          </div>

          <div className="flex flex-col items-end gap-0.5">
            {issue.username && (
              <span className="text-xs font-medium text-gray-600">
                @{issue.username}
              </span>
            )}
            {issue.created_at && (
              <span className="text-xs text-gray-400">
                {formatDate(issue.created_at)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}