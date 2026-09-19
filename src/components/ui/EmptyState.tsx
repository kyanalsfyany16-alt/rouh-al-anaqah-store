import { cn } from '../../lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      <div className="mx-auto mb-4 p-4 bg-primary-100 rounded-2xl w-fit text-primary-400">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-primary-900 mb-2">{title}</h3>
      {description && <p className="text-primary-500 mb-6 max-w-md mx-auto">{description}</p>}
      {action && <div className="inline-flex">{action}</div>}
    </div>
  )
}