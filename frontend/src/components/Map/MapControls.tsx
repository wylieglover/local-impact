type MapControlsProps = {
  loading: boolean
  error: string | null
  onRetry: () => void
}

export default function MapControls({ loading, error, onRetry }: MapControlsProps) {
  if (!loading && !error) return null

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
      {loading && (
        <div className="bg-white rounded-full shadow-lg px-4 py-2 flex items-center gap-2 text-xs text-gray-500">
          <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          Loading nearby issues...
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-100 rounded-full shadow-lg px-4 py-2 flex items-center gap-2 text-xs text-red-500">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {error}
          <button
            onClick={onRetry}
            className="underline font-medium hover:text-red-600"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )
}