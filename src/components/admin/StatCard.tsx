import { cn } from '../../lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color?: 'gold' | 'primary' | 'success' | 'warning' | 'danger' | 'blue'
  loading?: boolean
  trend?: string | null
}

const colorMap: Record<string, string> = {
  gold: 'bg-gold/15 text-gold',
  primary: 'bg-primary-100 text-primary-700',
  success: 'bg-green-50 text-green-600',
  warning: 'bg-yellow-50 text-yellow-600',
  danger: 'bg-red-50 text-red-600',
  blue: 'bg-blue-50 text-blue-600',
}

export function StatCard({ label, value, icon: Icon, color = 'primary', loading, trend }: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-primary-200 p-5 animate-pulse">
        <div className="h-10 w-10 rounded-xl skeleton" />
        <div className="h-6 w-20 skeleton rounded mt-4" />
        <div className="h-4 w-24 skeleton rounded mt-2" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-primary-200 p-5 hover:border-gold hover:shadow-soft transition-all">
      <div className="flex items-center justify-between">
        <div className={cn('p-2.5 rounded-xl', colorMap[color])}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && <span className="text-xs font-medium text-success bg-green-50 px-2 py-1 rounded-full">{trend}</span>}
      </div>
      <p className="text-2xl font-bold text-primary-900 mt-4">{value}</p>
      <p className="text-sm text-primary-500 mt-1">{label}</p>
    </div>
  )
}
