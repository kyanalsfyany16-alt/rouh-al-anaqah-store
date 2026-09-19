import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { cn } from '../../lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  backHref?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, description, backHref, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
      <div>
        {backHref && (
          <Link
            to={backHref}
            className="inline-flex items-center gap-1.5 text-sm text-primary-500 hover:text-gold mb-3 transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
            رجوع
          </Link>
        )}
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary-900">{title}</h1>
        {description && <p className="text-primary-500 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}