import { Search, X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface SearchInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({ value, onChange, placeholder = 'بحث...', className }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pr-9 pl-8 py-2.5 bg-white border border-primary-200 rounded-xl text-sm text-primary-900 placeholder:text-primary-400 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-primary-400 hover:text-primary-600 hover:bg-primary-100"
          aria-label="مسح البحث"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
