import { ReactNode, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: ReactNode
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({ open, onClose, title, children, size = 'md', footer, closeOnOverlayClick = true, closeOnEscape = true }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, closeOnEscape, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/50 animate-fade-in overflow-y-auto overscroll-contain" onClick={closeOnOverlayClick ? onClose : undefined} ref={overlayRef}>
      <div
        ref={contentRef}
        className={cn('w-full max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl animate-scale-in flex flex-col max-h-[95vh] sm:max-h-[90vh] my-4 sm:my-8 overflow-hidden', sizes[size])}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {(title || footer) && (
          <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-4 border-b border-primary-200 shrink-0 sticky top-0 bg-white z-10 rounded-t-2xl">
            {title && <h2 id="modal-title" className="text-base sm:text-lg font-semibold text-primary-900 truncate min-w-0">{title}</h2>}
            <button onClick={onClose} className="p-1 rounded-lg text-primary-400 hover:text-primary-600 hover:bg-primary-100 transition-colors shrink-0" aria-label="إغلاق">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 overscroll-contain">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 border-t border-primary-200 bg-white sm:bg-primary-50 rounded-b-2xl flex-wrap shrink-0 sticky bottom-0 z-10 w-full max-w-full">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}