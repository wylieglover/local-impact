import { useRef, useState } from 'react'

type IssueFormProps = {
  onClose: () => void
  onSubmit: (description: string, photo: File | null) => Promise<void>
}

const MIN_CHARS = 10
const MAX_CHARS = 500
const BASE_POINTS = 10
const PHOTO_BONUS_POINTS = 5

export default function IssueForm({ onClose, onSubmit }: IssueFormProps) {
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [charCount, setCharCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (!file) return
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleRemovePhoto = () => {
    setPhoto(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const description = (
      form.elements.namedItem('description') as HTMLTextAreaElement
    ).value.trim()

    if (!description) return
    if (description.length < MIN_CHARS) {
      setError(`Intel too short. Need at least ${MIN_CHARS} characters.`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onSubmit(description, photo)
      form.reset()
      setCharCount(0)
      handleRemovePhoto()
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message ?? 'Link failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const isUnderMin = charCount > 0 && charCount < MIN_CHARS
  const isNearMax = charCount > MAX_CHARS * 0.9
  
  // Gamification: Calculate dynamic XP based on user input
  const currentPoints = BASE_POINTS + (photo ? PHOTO_BONUS_POINTS : 0)

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-slate-900 text-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(16,185,129,0.15)] p-6 z-10 animate-in slide-in-from-bottom duration-300 border-t-4 border-emerald-500">
      <div className="w-14 h-1.5 bg-slate-700 rounded-full mx-auto mb-6" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col">
          <span className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-1 shadow-emerald-400/20 drop-shadow-md">
            New Local Bounty
          </span>
          <h2 className="text-2xl font-black tracking-tight text-white uppercase">
            Paint Target
          </h2>
        </div>
        <button
          onClick={onClose}
          disabled={loading}
          className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 transition-colors disabled:opacity-50 border border-slate-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-900/50 border-2 border-red-500/50 rounded-xl text-sm text-red-200 flex items-center gap-3 font-medium">
          <span className="text-xl">⚠️</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="relative group">
          <textarea
            name="description"
            placeholder="Describe the issue/claim..."
            rows={3}
            maxLength={MAX_CHARS}
            disabled={loading}
            onChange={(e) => setCharCount(e.target.value.length)}
            className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 text-[16px] text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-0 transition-all resize-none disabled:opacity-50 font-medium"
            autoFocus
          />
          <div className={`absolute bottom-3 right-4 text-xs font-bold tabular-nums transition-colors ${
            isNearMax ? 'text-red-400' : isUnderMin ? 'text-amber-400' : 'text-emerald-500'
          }`}>
            {charCount}/{MAX_CHARS}
          </div>
        </div>

        {/* Photo Section - Scanner Style */}
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            className="hidden"
          />

          {preview ? (
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)] group">
              <div className="absolute inset-0 border-4 border-emerald-500/20 z-10 pointer-events-none rounded-2xl"></div>
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-emerald-500 text-slate-900 px-3 py-1 rounded-lg text-xs font-black uppercase z-20">
                +{PHOTO_BONUS_POINTS} Bonus Points
              </div>
              {!loading && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-md text-white p-2 rounded-xl hover:bg-red-500 hover:text-white transition-all z-20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-7 flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-2xl hover:border-emerald-400 hover:bg-emerald-400/5 transition-all group disabled:opacity-50 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] pointer-events-none" />
              
              <div className="bg-slate-800 p-3 rounded-2xl mb-3 group-hover:bg-emerald-500/20 transition-colors border border-slate-700 group-hover:border-emerald-500/50">
                <svg className="w-7 h-7 text-slate-400 group-hover:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-sm font-black text-slate-300 group-hover:text-emerald-400 uppercase tracking-wide">
                Scan Evidence
              </span>
              <span className="text-xs font-bold text-amber-500 mt-1 bg-amber-500/10 px-2 py-0.5 rounded">
                +{PHOTO_BONUS_POINTS} Bonus Points
              </span>
            </button>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-4 rounded-2xl font-black text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors uppercase tracking-wider text-sm disabled:opacity-50"
          >
            Abort
          </button>
          <button
            type="submit"
            disabled={loading || charCount < MIN_CHARS}
            className="flex-[2] py-4 rounded-2xl bg-emerald-500 text-slate-900 font-black uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:bg-slate-700 disabled:text-slate-500 disabled:shadow-none relative overflow-hidden flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Syncing...
              </span>
            ) : (
              <>
                Deploy Beacon
                <span className="bg-slate-900/20 px-2 py-1 rounded-lg text-xs ml-1">
                  +{currentPoints} pts
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}