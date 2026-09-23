import { cn } from '../../lib/utils'

export function ProductGrid({ children, className, columns = 4 }: { children: React.ReactNode; className?: string; columns?: number }) {
  const colsClass = columns === 4 ? 'lg:grid-cols-4' : columns === 3 ? 'lg:grid-cols-3' : `lg:grid-cols-${columns}`
  return (
    <div
      className={cn(
        'grid gap-3 sm:gap-4 lg:gap-6 w-full max-w-full min-w-0',
        'grid-cols-2 sm:grid-cols-3',
        colsClass,
        className
      )}
    >
      {children}
    </div>
  )
}