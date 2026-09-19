import { useToast } from '../../contexts/ToastContext'
import { X } from 'lucide-react'
import { classNames } from '../../lib/utils'

export function ToastContainer() {
  const { toasts, remove } = useToast()

  return (
    <div className="fixed top-4 left-4 z-[100] flex flex-col gap-2 pointer-events-none" role="region" aria-label="الإشعارات">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={classNames(
            'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg min-w-[300px] max-w-md animate-slide-in',
            'bg-white border',
            toast.type === 'success' && 'border-success text-success',
            toast.type === 'error' && 'border-danger text-danger',
            toast.type === 'warning' && 'border-warning text-warning',
            toast.type === 'info' && 'border-primary-200 text-primary-900'
          )}
          role="alert"
          aria-live="polite"
        >
          <div className="flex-1 text-sm font-medium">{toast.message}</div>
          <button onClick={() => remove(toast.id)} className="p-1 rounded-lg hover:bg-primary-100 transition-colors" aria-label="إغلاق">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}