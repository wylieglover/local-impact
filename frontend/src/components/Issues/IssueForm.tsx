import { useRef, useState } from 'react'

type IssueFormProps = {
  onClose: () => void
  onSubmit: (description: string, photo: File | null) => Promise<void>
}

const MIN_CHARS = 10
const MAX_CHARS = 500

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
      setError(`Please provide at least ${MIN_CHARS} characters`)
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
      setError(err.response?.data?.message ?? err.message ?? 'Failed to submit. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const isUnderMin = charCount > 0 && charCount < MIN_CHARS
  const isNearMax = charCount > MAX_CHARS * 0.9

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2rem] shadow-[0_-8px_30px_rgb(0,0,0,0.15)] p-6 z-10 animate-in slide-in-from-bottom duration-300">
      <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          Report an issue
        </h2>
        <button
          onClick={onClose}
          disabled={loading}
          className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            name="description"
            placeholder="Tell us what's happening..."
            rows={3}
            maxLength={MAX_CHARS}
            disabled={loading}
            onChange={(e) => setCharCount(e.target.value.length)}
            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-[15px] text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all resize-none disabled:opacity-50"
            autoFocus
          />
          {/* Character counter */}
          <div className={`absolute bottom-3 right-4 text-xs tabular-nums transition-colors ${
            isNearMax
              ? 'text-red-400'
              : isUnderMin
              ? 'text-orange-400'
              : 'text-gray-300'
          }`}>
            {charCount}/{MAX_CHARS}
          </div>
        </div>

        {/* Photo Section */}
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
            <div className="relative w-full h-44 rounded-2xl overflow-hidden shadow-sm">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              {!loading && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white p-1.5 rounded-full hover:bg-black/80 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-6 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50/50 transition-all group disabled:opacity-50"
            >
              <div className="bg-gray-100 p-2 rounded-full mb-2 group-hover:bg-blue-100 transition-colors">
                <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-500 group-hover:text-blue-600">
                Add a photo
              </span>
              <span className="text-xs text-gray-400">Makes it easier to fix</span>
            </button>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || charCount < MIN_CHARS}
            className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:bg-gray-300 disabled:shadow-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </span>
            ) : "Drop pin"}
          </button>
        </div>
      </form>
    </div>
  )
}