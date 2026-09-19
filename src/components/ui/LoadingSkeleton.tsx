import { cn } from '../../lib/utils'

export function LoadingSkeleton({ variant = 'card', count = 4 }: { variant?: 'card' | 'product' | 'list'; count?: number }) {
  const items = Array.from({ length: count }, (_, i) => i)

  if (variant === 'product') {
    return (
      <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map(i => (
          <div key={i} className="card">
            <div className="aspect-square skeleton" />
            <div className="p-4 space-y-3">
              <div className="h-4 w-1/4 skeleton rounded" />
              <div className="h-4 w-3/4 skeleton rounded" />
              <div className="h-4 w-1/2 skeleton rounded" />
              <div className="h-5 w-1/3 skeleton rounded mt-2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map(i => (
        <div key={i} className="flex gap-4 p-4 card">
          <div className="h-16 w-16 rounded-xl skeleton flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-1/3 skeleton rounded" />
            <div className="h-4 w-1/2 skeleton rounded" />
            <div className="h-4 w-1/4 skeleton rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}