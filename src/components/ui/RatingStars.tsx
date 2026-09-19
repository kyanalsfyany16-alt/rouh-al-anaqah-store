import { cn } from '../../lib/utils'

interface RatingStarsProps {
  rating: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onChange?: (rating: number) => void
  showValue?: boolean
}

export function RatingStars({ rating, max = 5, size = 'md', interactive = false, onChange, showValue = false }: RatingStarsProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' }
  const stars = Array.from({ length: max }, (_, i) => i + 1)

  return (
    <div className="flex items-center gap-0.5" role={interactive ? 'radiogroup' : 'img'} aria-label={interactive ? 'التقييم' : `تقييم ${rating} من ${max}`}>
      {stars.map(star => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => interactive && onChange?.(star)}
          className={cn(
            'transition-transform duration-100',
            sizes[size],
            interactive ? 'cursor-pointer hover:scale-110' : '',
            star <= Math.floor(rating)
              ? 'text-gold'
              : star - 0.5 <= rating
              ? 'text-gold/50'
              : 'text-primary-200'
          )}
          aria-label={interactive ? `${star} نجوم` : undefined}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
      {showValue && <span className="text-sm text-primary-600 ml-2">{rating.toFixed(1)}</span>}
    </div>
  )
}