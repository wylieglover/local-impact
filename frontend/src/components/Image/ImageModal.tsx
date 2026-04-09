import { useEffect } from 'react'

type ImageModalProps = {
  isOpen: boolean
  onClose: () => void
  imageUrl: string | null
  title?: string
}

export default function ImageModal({ isOpen, onClose, imageUrl, title = "Raw Intel Feed" }: ImageModalProps) {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !imageUrl) return null

  return (
    <div 
      className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-200"
      onClick={onClose} // Clicking the background closes it
    >
      {/* Close Button */}
      <button 
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-[110]"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* The Image */}
      <div className="flex-1 flex items-center justify-center p-4">
        <img 
          src={imageUrl} 
          alt="Full screen view" 
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()} // Clicking the image does NOTHING
        />
      </div>

      {/* Optional HUD Footer */}
      <div className="p-8 text-center pointer-events-none">
        <span className="text-emerald-400 font-black tracking-[0.3em] uppercase text-xs">
          {title}
        </span>
      </div>
    </div>
  )
}