import { useRef, useState } from 'react'
import { useAuthStore } from '../../stores/auth.store'
import type { Issue } from '../../api/issues.api'
import { getDistanceMeters } from '../../utils/geo'
import ImageModal from '../Image/ImageModal'
import DescriptionModal from '../Image/DescriptionModal'

type IssueDetailProps = {
  issue: Issue
  userLocation: { latitude: number; longitude: number } | null
  onClose: () => void
  onDelete: (id: string) => Promise<void>
  onClaim: (id: string, latitude: number, longitude: number) => Promise<void>
  onResolve: (id: string, afterPhoto: File, latitude: number, longitude: number) => Promise<void>
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
  claimed: {
    label: 'INTERCEPTING',
    color: 'text-sky-400',
    bg: 'bg-sky-400/10',
    dot: 'bg-sky-500',
    ping: 'bg-sky-400',
    border: 'border-sky-500/50',
  },
  in_progress: {
    label: 'IN PROGRESS',
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

const PROXIMITY_METERS = 3

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).toUpperCase()
}

export default function IssueDetail({ issue, userLocation, onClose, onDelete, onClaim, onResolve }: IssueDetailProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  const [afterPhoto, setAfterPhoto] = useState<File | null>(null)
  const [afterPreview, setAfterPreview] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [isDescModalOpen, setIsDescModalOpen] = useState(false)
  const afterPhotoRef = useRef<HTMLInputElement>(null)

  const user = useAuthStore((state) => state.user)
  const status = STATUS_CONFIG[issue.status] ?? STATUS_CONFIG.open

  // Distance calculation
  const distanceMeters = userLocation
    ? getDistanceMeters(userLocation, { latitude: issue.latitude, longitude: issue.longitude })
    : null
  const isWithinRange = distanceMeters !== null && distanceMeters <= PROXIMITY_METERS

  // Permissions
  const isReporter = issue.username === user?.username
  const isClaimer = issue.claimedByUserId === user?.userId
  const isMod = user?.role === 'moderator' || user?.role === 'admin'

  const canClaim = issue.status === 'open' && !isReporter && !isMod
  const canResolve = (issue.status === 'claimed' || issue.status === 'in_progress') && (isClaimer || isMod)
  const canDelete =
    user?.role === 'admin' ||
    user?.role === 'moderator' ||
    (user?.role === 'reporter' && isReporter)

  const handleClaim = async () => {
    if (!userLocation || !isWithinRange) return
    setIsClaiming(true)
    setActionError(null)
    try {
      await onClaim(issue.id, userLocation.latitude, userLocation.longitude)
    } catch (err: any) {
      setActionError(err.response?.data?.message ?? 'Failed to claim issue')
    } finally {
      setIsClaiming(false)
    }
  }

  const handleAfterPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (!file) return
    setAfterPhoto(file)
    setAfterPreview(URL.createObjectURL(file))
  }

  const handleResolve = async () => {
    if (!afterPhoto || !userLocation) return
    setIsResolving(true)
    setActionError(null)
    try {
      await onResolve(issue.id, afterPhoto, userLocation.latitude, userLocation.longitude)
    } catch (err: any) {
      setActionError(err.response?.data?.message ?? 'Failed to resolve issue')
    } finally {
      setIsResolving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setIsDeleting(true)
    try {
      await onDelete(issue.id)
    } finally {
      setIsDeleting(false)
      setConfirmDelete(false)
    }
  }

  const openImage = (url: string) => {
    setActiveImage(url)
    setIsModalOpen(true)
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[500px] overflow-y-auto bg-slate-900 text-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10 animate-in slide-in-from-bottom duration-300 border-t-4 border-slate-800">
      {/* Handle */}
      <div className="pt-4 pb-2 flex justify-center sticky top-0 bg-slate-900 z-50">
        <div className="w-14 h-1.5 bg-slate-700 rounded-full" />
      </div>

      {/* Before photo */}
      {issue.beforePhotoUrl && (
        <div
          onClick={() => openImage(issue.beforePhotoUrl!)}
          className="relative w-full h-[200px] overflow-hidden bg-slate-950 border-b-2 border-slate-800 group cursor-zoom-in"
        >
          <img src={issue.beforePhotoUrl} alt="Before" className="w-full h-full object-cover" />
          <div className="absolute top-2 left-2 z-20 bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-slate-700">
            <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Before</span>
          </div>
          <div className="absolute inset-4 pointer-events-none z-20">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-500/80" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-500/80" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-500/80" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-500/80" />
            <div className="w-full h-[1px] bg-emerald-400/30 shadow-[0_0_8px_rgba(16,185,129,0.8)] absolute top-0 animate-[scan_4s_ease-in-out_infinite]" />
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose() }}
            className="absolute top-4 right-4 p-2 bg-slate-900/80 backdrop-blur-md rounded-xl text-white border border-slate-700 hover:bg-red-500 transition-all z-40"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* After photo — only shown if resolved */}
      {issue.afterPhotoUrl && (
        <div
          onClick={() => openImage(issue.afterPhotoUrl!)}
          className="relative w-full h-[160px] overflow-hidden bg-slate-950 border-b-2 border-slate-800 group cursor-zoom-in"
        >
          <img src={issue.afterPhotoUrl} alt="After" className="w-full h-full object-cover" />
          <div className="absolute top-2 left-2 z-20 bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-emerald-500/30">
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">After</span>
          </div>
        </div>
      )}

      <div className="p-6 pb-24">
        <div className="flex items-start justify-between mb-6">
          <div>
            <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
              Bounty Intel Report
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">
              Anomaly #{issue.id.slice(-4)}
            </h2>
          </div>
          {!issue.beforePhotoUrl && (
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

        {/* Description */}
        <div
          onClick={() => setIsDescModalOpen(true)}
          className="bg-slate-800/50 border-l-4 border-emerald-500 rounded-r-2xl p-4 mb-4 relative overflow-hidden max-h-[90px] cursor-pointer hover:bg-slate-800 transition-colors group"
        >
          <p className="text-[14px] text-slate-200 leading-tight font-medium line-clamp-3">
            {issue.description}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-800 to-transparent flex items-end justify-center pb-1">
            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
              Tap to expand
            </span>
          </div>
        </div>

        {/* Status + Reward */}
        <div className="grid grid-cols-2 gap-4 items-center mb-4">
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
          <div className="bg-slate-800 rounded-xl px-4 py-2 border border-slate-700 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-slate-500 tracking-tighter uppercase">Reward</span>
            <span className="text-amber-400 font-black text-sm">15 POINTS</span>
          </div>
        </div>

        {/* Action error */}
        {actionError && (
          <div className="mb-4 px-4 py-3 bg-red-900/50 border border-red-500/50 rounded-xl text-xs text-red-300 font-black uppercase tracking-widest">
            {actionError}
          </div>
        )}

        {/* Claim button */}
        {canClaim && issue.status === 'open' && (
          <div className="mb-4">
            <button
              onClick={handleClaim}
              disabled={!isWithinRange || isClaiming}
              className={`w-full py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all border flex items-center justify-center gap-2 ${
                isWithinRange
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20'
                  : 'bg-slate-800/30 border-slate-700 text-slate-600 cursor-not-allowed opacity-60'
              } disabled:opacity-50`}
            >
              {isClaiming ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Claiming...
                </>
              ) : isWithinRange ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Claim Bounty
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {distanceMeters !== null
                    ? `${Math.round(distanceMeters)}m away — move closer`
                    : 'Locating...'}
                </>
              )}
            </button>
          </div>
        )}

        {/* Resolve section */}
        {canResolve && (
          <div className="mb-4 flex flex-col gap-3">
            <input
              ref={afterPhotoRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleAfterPhotoChange}
              className="hidden"
            />

            {afterPreview ? (
              <div className="relative w-full h-32 rounded-xl overflow-hidden border-2 border-emerald-500/40">
                <img src={afterPreview} alt="After evidence" className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 bg-emerald-500 text-slate-900 px-2 py-0.5 rounded text-[9px] font-black uppercase">
                  After Photo
                </div>
                <button
                  type="button"
                  onClick={() => { setAfterPhoto(null); setAfterPreview(null) }}
                  className="absolute top-2 right-2 bg-slate-900/80 p-1.5 rounded-lg text-white hover:bg-red-500 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => afterPhotoRef.current?.click()}
                className="w-full py-4 flex items-center justify-center gap-2 border-2 border-dashed border-emerald-500/30 rounded-xl hover:border-emerald-400 hover:bg-emerald-400/5 transition-all"
              >
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                  Capture After Photo
                </span>
              </button>
            )}

            <button
              onClick={handleResolve}
              disabled={!afterPhoto || isResolving || (!isMod && !isWithinRange)}
              className={`w-full py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all border flex items-center justify-center gap-2 ${
                afterPhoto && (isMod || isWithinRange)
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-slate-800/30 border-slate-700 text-slate-600 cursor-not-allowed opacity-60'
              } disabled:opacity-50`}
            >
              {isResolving ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Resolving...
                </>
              ) : !afterPhoto ? (
                'Add after photo to resolve'
              ) : !isMod && !isWithinRange ? (
                `${distanceMeters !== null ? `${Math.round(distanceMeters)}m away — ` : ''}move closer to resolve`
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  Mark Neutralized
                </>
              )}
            </button>
          </div>
        )}

        {/* Delete */}
        {canDelete && (
          <div className="mt-4">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={`w-full py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all border ${
                confirmDelete
                  ? 'bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30'
                  : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:border-red-500/50 hover:text-red-400'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isDeleting ? 'Purging intel...' : confirmDelete ? '⚠ Confirm — purge this bounty?' : 'Purge Intel'}
            </button>
            {confirmDelete && !isDeleting && (
              <button
                onClick={() => setConfirmDelete(false)}
                className="w-full mt-2 py-2 text-[10px] font-bold tracking-widest uppercase text-slate-600 hover:text-slate-400 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        )}

        {/* Footer */}
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

      <ImageModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setActiveImage(null) }}
        imageUrl={activeImage}
        title={`Anomaly #${issue.id.slice(-4)}`}
      />

      <DescriptionModal
        isOpen={isDescModalOpen}
        onClose={() => setIsDescModalOpen(false)}
        description={issue.description}
        title={`Intel Report #${issue.id.slice(-4)}`}
      />

      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  )
}