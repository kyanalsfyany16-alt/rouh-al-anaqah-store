import { cn } from '../../lib/utils'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  retryLabel?: string
}

export function ErrorState({ title = 'حدث خطأ', message = 'لم نتمكن من تحميل البيانات', onRetry, retryLabel = 'إعادة المحاولة' }: ErrorStateProps) {
  return (
    <div className="text-center py-16 px-4">
      <div className="mx-auto mb-4 p-4 bg-red-50 rounded-2xl w-fit text-red-500">
        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      </div>
      <h3 className="text-xl font-semibold text-primary-900 mb-2">{title}</h3>
      <p className="text-primary-500 mb-6 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary">
          {retryLabel}
        </button>
      )}
    </div>
  )
}