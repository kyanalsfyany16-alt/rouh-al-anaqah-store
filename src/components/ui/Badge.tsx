import { cn } from '../../lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'gold' | 'primary' | 'success' | 'danger' | 'warning' | 'blue' | 'neutral'
}

export function Badge({ className, variant = 'primary', children, ...props }: BadgeProps) {
  const variants = {
    gold: 'badge-gold',
    primary: 'badge-primary',
    success: 'badge-success',
    danger: 'badge-danger',
    warning: 'badge-warning',
    blue: 'badge-blue',
    neutral: 'badge-neutral',
  }
  return <span className={cn(variants[variant], className)} {...props}>{children}</span>
}