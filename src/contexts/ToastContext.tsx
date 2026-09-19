import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import type { Toast } from '../lib/types'

interface ToastContextType {
  toasts: Toast[]
  toast: (message: string, type?: Toast['type']) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
  remove: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = { id, message, type }
    setToasts(prev => [...prev, newToast])
    setTimeout(() => remove(id), 3500)
  }, [])

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const success = (message: string) => addToast(message, 'success')
  const error = (message: string) => addToast(message, 'error')
  const info = (message: string) => addToast(message, 'info')
  const warning = (message: string) => addToast(message, 'warning')

  return (
    <ToastContext.Provider value={{ toasts, toast: addToast, success, error, info, warning, remove }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 left-4 z-[9999] flex flex-col gap-2 w-80">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 p-4 rounded-xl shadow-card animate-slide-in ${
            t.type === 'success' ? 'bg-green-50 border-r-4 border-green-500 text-green-800' :
            t.type === 'error' ? 'bg-red-50 border-r-4 border-red-500 text-red-800' :
            t.type === 'warning' ? 'bg-yellow-50 border-r-4 border-yellow-500 text-yellow-800' :
            'bg-primary-50 border-r-4 border-primary-500 text-primary-800'
          }`}
        >
          <span className="flex-1 text-sm">{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="text-current opacity-50 hover:opacity-100">×</button>
        </div>
      ))}
    </div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}