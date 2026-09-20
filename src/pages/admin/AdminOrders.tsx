import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { PageHeader, SearchInput, StatusBadge } from '../../components/admin'
import { EmptyState, LoadingSkeleton } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { formatPrice, formatRelativeTime } from '../../lib/utils'
import { Eye, Package, Clock, Truck, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import type { Order } from '../../lib/types'

const statusOptions = [
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'paid', label: 'مدفوع' },
  { value: 'processing', label: 'قيد التجهيز' },
  { value: 'shipped', label: 'تم الشحن' },
  { value: 'delivered', label: 'تم التوصيل' },
  { value: 'cancelled', label: 'ملغي' },
  { value: 'returned', label: 'مرتجع' },
]

const statusColor: Record<string, 'warning' | 'info' | 'primary' | 'blue' | 'success' | 'danger' | 'neutral'> = {
  pending: 'warning',
  paid: 'info',
  processing: 'primary',
  shipped: 'blue',
  delivered: 'success',
  cancelled: 'danger',
  returned: 'neutral',
}

export function AdminOrders() {
  const { success, error: toastError } = useToast()
  const [orders, setOrders] = useState<(Order & { user: { first_name: string | null; last_name: string | null; email: string } | null })[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  const loadOrders = async () => {
    setLoading(true)
    let query = supabase.from('orders').select('*, user:profiles!orders_user_id_fkey(first_name,last_name,email)').order('created_at', { ascending: false })
    if (statusFilter) query = query.eq('status', statusFilter)
    const { data, error } = await query
    if (error) toastError(error.message)
    else setOrders((data as typeof orders) ?? [])
    setLoading(false)
  }

  const updateStatus = async (id: string, newStatus: string) => {
    const order = orders.find((o) => o.id === id)
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id)
    if (error) toastError(error.message)
    else {
      success('تم تحديث حالة الطلب')
      if (order?.user_id) {
        const statusLabels: Record<string, string> = { pending: 'قيد الانتظار', paid: 'مدفوع', processing: 'جاري تجهيز طلبك', shipped: 'تم شحن طلبك', delivered: 'تم تسليم طلبك', cancelled: 'تم إلغاء طلبك', returned: 'تم إرجاع طلبك' }
        await supabase.from('notifications').insert({ user_id: order.user_id, title: statusLabels[newStatus] ?? 'تحديث الطلب', message: `طلب #${id.slice(0, 8).toUpperCase()} — ${statusLabels[newStatus] ?? newStatus}`, type: newStatus === 'cancelled' ? 'error' : newStatus === 'delivered' ? 'success' : 'info' })
      }
      loadOrders()
    }
  }

  const filtered = orders.filter((o) => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return o.id.toLowerCase().includes(term) || o.user?.email.toLowerCase().includes(term) || `${o.user?.first_name ?? ''} ${o.user?.last_name ?? ''}`.toLowerCase().includes(term)
  })

  if (loading) return <LoadingSkeleton variant="list" count={6} />

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden">
      <PageHeader title="إدارة الطلبات" description={`${orders.length} طلب`} />

      <div className="bg-white rounded-2xl border border-primary-200 p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="بحث برقم الطلب أو العميل..." />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select sm:w-48">
          <option value="">كل الحالات</option>
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-primary-200 overflow-hidden w-full max-w-full">
        {filtered.length ? (
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full min-w-[600px]">
              <thead className="bg-primary-50">
                <tr className="text-right">
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">الطلب</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">العميل</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">التاريخ</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">الإجمالي</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">الحالة</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">الدفع</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-primary-50/50">
                    <td className="px-4 py-3">
                      <Link to={`/admin/orders/${order.id}`} className="font-mono font-medium text-primary-900 hover:text-gold text-sm">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-primary-900 text-sm">
                        {order.user?.first_name} {order.user?.last_name}
                      </p>
                      <p className="text-xs text-primary-500">{order.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-primary-500">{formatRelativeTime(order.created_at)}</td>
                    <td className="px-4 py-3 font-semibold text-gold text-sm">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={statusColor[order.status] ?? 'neutral'}>{statusOptions.find((s) => s.value === order.status)?.label ?? order.status}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className={order.payment_status === 'paid' ? 'text-success' : order.payment_status === 'pending_verification' ? 'text-warning' : 'text-primary-500'}>
                        {order.payment_status === 'paid' ? 'مدفوع' : order.payment_status === 'pending_verification' ? 'بانتظار التحقق' : order.payment_status === 'unpaid' ? 'غير مدفوع' : order.payment_status}
                      </span>
                      <span className="block text-primary-400">{order.payment_method === 'cash_on_delivery' ? 'عند الاستلام' : 'تحويل'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link to={`/admin/orders/${order.id}`} className="p-1.5 rounded-lg text-primary-500 hover:bg-primary-100">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className="text-xs border border-primary-200 rounded-lg px-2 py-1 bg-white"
                        >
                          {statusOptions.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <EmptyState icon={<Package className="h-12 w-12" />} title="لا توجد طلبات" description="ستظهر الطلبات هنا عند إنشائها" />
          </div>
        )}
      </div>
    </div>
  )
}
