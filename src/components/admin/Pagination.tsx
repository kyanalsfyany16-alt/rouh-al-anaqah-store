import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (p: number) => void
  className?: string
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, page - 3),
    Math.min(totalPages, page + 2)
  )

  return (
    <div className={cn('flex items-center justify-between gap-2 py-4', className)}>
      <p className="text-sm text-primary-500">
        صفحة {page} من {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="p-2 rounded-xl border border-primary-200 text-primary-600 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="السابق"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              'min-w-9 h-9 rounded-xl text-sm font-medium border',
              p === page ? 'bg-gold text-primary-950 border-gold' : 'bg-white text-primary-700 border-primary-200 hover:bg-primary-50'
            )}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="p-2 rounded-xl border border-primary-200 text-primary-600 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="التالي"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
