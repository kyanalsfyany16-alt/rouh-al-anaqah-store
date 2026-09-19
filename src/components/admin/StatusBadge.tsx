import { cn } from '../../lib/utils'

type Variant = 'gold' | 'primary' | 'success' | 'danger' | 'warning' | 'blue' | 'neutral' | 'info'

interface StatusBadgeProps {
  variant?: Variant
  children: React.ReactNode
  className?: string
}

const map: Record<Variant, string> = {
  gold: 'bg-gold/15 text-gold-dark border-gold/30',
  primary: 'bg-primary-100 text-primary-800',
  success: 'bg-green-50 text-green-700 border-green-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  neutral: 'bg-primary-100 text-primary-600',
}

export function StatusBadge({ variant = 'neutral', children, className }: StatusBadgeProps) {
  return <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border', map[variant], className)}>{children}</span>
}
