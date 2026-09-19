import { cn } from '../../lib/utils'

export function ProductGrid({ children, className, columns = 4 }: { children: React.ReactNode; className?: string; columns?: number }) {
  return (
    <div
      className={cn(
        'grid gap-6',
        `grid-cols-2 sm:grid-cols-3 lg:grid-cols-${columns}`,
        className
      )}
    >
      {children}
    </div>
  )
}