import { useEffect } from 'react'

type DescriptionModalProps = {
  isOpen: boolean
  onClose: () => void
  description: string
  title?: string
}

export default function DescriptionModal({ isOpen, onClose, description, title = "Full Intel Report" }: DescriptionModalProps) {
  // Prevent the background map from scrolling while open
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

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose} // Clicking the blurry background closes it
    >
      {/* The "Small Box" in the center */}
      <div 
        className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // Clicking inside the box does NOT close it
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/80">
          <h3 className="text-emerald-400 font-black tracking-[0.2em] uppercase text-[10px]">
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 bg-slate-700/50 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Text Content - Scrollable if the text is massive */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <p className="text-[15px] text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}