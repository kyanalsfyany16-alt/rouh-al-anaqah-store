import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Order } from '../../lib/types'
import { useAuth } from '../../contexts/AuthContext'
import { EmptyState, LoadingSkeleton } from '../../components/ui'
import { cn, formatPrice, formatRelativeTime, formatDate } from '../../lib/utils'
import { Package, Clock, Truck, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'قيد الانتظار', color: 'warning', icon: Clock },
  paid: { label: 'مدفوع', color: 'info', icon: CheckCircle },
  processing: { label: 'قيد التجهيز', color: 'primary', icon: Package },
  shipped: { label: 'تم الشحن', color: 'blue', icon: Truck },
  delivered: { label: 'تم التوصيل', color: 'success', icon: CheckCircle },
  cancelled: { label: 'ملغي', color: 'danger', icon: XCircle },
  returned: { label: 'مرتجع', color: 'neutral', icon: AlertCircle },
}

export function OrdersPage() {
  const { session } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user) loadOrders()
  }, [session])

  const loadOrders = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, items:order_items(*, product:products(*))')
      .eq('user_id', session!.user.id)
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 bg-white rounded-xl border border-primary-200 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-6 w-32 skeleton rounded" />
              <div className="h-6 w-24 skeleton rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="page-title">طلباتي ({orders.length})</h1>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map(order => {
            const config = statusConfig[order.status] || { label: order.status, color: 'neutral', icon: Package }
            const StatusIcon = config.icon
            const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0

            return (
              <Link key={order.id} to={`/orders/${order.id}`} className="block p-6 bg-white rounded-2xl border border-primary-200 hover:border-gold hover:shadow-soft transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center">
                      <Package className="h-8 w-8 text-primary-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-primary-900">طلب #{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-sm text-primary-500">{itemCount} منتج • {formatRelativeTime(order.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div className="text-right">
                      <p className="font-bold text-gold">{formatPrice(order.total, 'SAR')}</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium" style={{ backgroundColor: `var(--color-${config.color}-100)`, color: `var(--color-${config.color}-700)` }}>
                      <StatusIcon className="h-4 w-4" />
                      {config.label}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="لا توجد طلبات"
          description="لم تقم بأي طلبات بعد. ابدأ التسوق الآن!"
          action={<Link to="/shop" className="btn-gold">تسوق الآن</Link>}
        />
      )}
    </div>
  )
}