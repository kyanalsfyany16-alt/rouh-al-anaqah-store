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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={closeOnOverlayClick ? onClose : undefined} ref={overlayRef}>
      <div
        ref={contentRef}
        className={cn('w-full bg-white rounded-2xl shadow-xl animate-scale-in', sizes[size])}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {(title || footer) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-primary-200">
            {title && <h2 id="modal-title" className="text-lg font-semibold text-primary-900">{title}</h2>}
            <button onClick={onClose} className="p-1 rounded-lg text-primary-400 hover:text-primary-600 hover:bg-primary-100 transition-colors" aria-label="إغلاق">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-primary-200 bg-primary-50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}