import { cn } from '../../lib/utils'

interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  getRowKey?: (row: T, idx: number) => string
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading,
  emptyTitle = 'لا توجد بيانات',
  emptyDescription,
  emptyAction,
  getRowKey,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-primary-200 overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 skeleton rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="bg-white rounded-2xl border border-primary-200 p-12 text-center">
        <p className="font-medium text-primary-900">{emptyTitle}</p>
        {emptyDescription && <p className="text-sm text-primary-500 mt-1 max-w-md mx-auto">{emptyDescription}</p>}
        {emptyAction && <div className="mt-4 inline-flex">{emptyAction}</div>}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-primary-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-primary-50">
            <tr className="text-right">
              {columns.map((c) => (
                <th key={c.key} className={cn('px-4 py-3 text-xs font-medium text-primary-500 whitespace-nowrap', c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-100">
            {data.map((row, idx) => (
              <tr key={getRowKey ? getRowKey(row, idx) : String(idx)} className="hover:bg-primary-50/50">
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3 text-sm', col.className)}>
                    {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
