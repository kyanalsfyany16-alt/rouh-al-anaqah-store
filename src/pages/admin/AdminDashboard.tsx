import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { PageHeader, StatCard } from '../../components/admin'
import { cn, formatPrice, formatRelativeTime } from '../../lib/utils'
import { Package, ShoppingBag, Users, DollarSign, AlertTriangle, Tag, ChevronLeft } from 'lucide-react'

interface DashboardStats {
  totalSales: number
  totalOrders: number
  pendingOrders: number
  totalProducts: number
  totalCustomers: number
  totalEmployees: number
  lowStockProducts: number
  recentOrders: Array<{ id: string; total: number; created_at: string; user: { first_name: string | null; last_name: string | null } | null }>
  topProducts: Array<{ id: string; name: string; price: number; discount_price: number | null; rating: number; review_count: number; images: string[] }>
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalEmployees: 0,
    lowStockProducts: 0,
    recentOrders: [],
    topProducts: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const [
        { count: totalProducts },
        { count: totalCustomers },
        { count: totalEmployees },
        { count: totalOrders },
        { count: pendingOrders },
        { data: salesData },
        { data: recentOrders },
        { data: productsForStock },
        { data: topProducts },
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'employee'),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('total').eq('status', 'delivered'),
        supabase.from('orders').select('id, total, created_at, user:profiles!orders_user_id_fkey(first_name,last_name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('products').select('stock, low_stock_threshold').eq('is_published', true).limit(100),
        supabase.from('products').select('id, name, price, discount_price, rating, review_count, images').eq('is_published', true).order('rating', { ascending: false }).limit(5),
      ])

      const totalSales = salesData?.reduce((sum: number, o: { total: number }) => sum + Number(o.total), 0) ?? 0

      // Low stock: client-side comparison stock <= low_stock_threshold
      const lowStockCount = productsForStock?.filter((p: { stock: number; low_stock_threshold: number }) => p.stock <= p.low_stock_threshold).length ?? 0

      setStats({
        totalSales,
        totalOrders: totalOrders ?? 0,
        pendingOrders: pendingOrders ?? 0,
        totalProducts: totalProducts ?? 0,
        totalCustomers: totalCustomers ?? 0,
        totalEmployees: totalEmployees ?? 0,
        lowStockProducts: lowStockCount,
        recentOrders: (recentOrders as DashboardStats['recentOrders']) ?? [],
        topProducts: (topProducts as DashboardStats['topProducts']) ?? [],
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحميل الإحصائيات')
    } finally {
      setLoading(false)
    }
  }

  function formatNumber(n: number) {
    return new Intl.NumberFormat('ar-SA').format(n)
  }

  return (
    <div className="space-y-8">
      <PageHeader title="لوحة التحكم" description="نظرة عامة على أداء متجر روح الأناقة" />

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="إجمالي المبيعات" value={formatPrice(stats.totalSales)} icon={DollarSign} color="gold" loading={loading} />
        <StatCard label="عدد الطلبات" value={formatNumber(stats.totalOrders)} icon={ShoppingBag} color="primary" loading={loading} />
        <StatCard label="الطلبات الجديدة" value={formatNumber(stats.pendingOrders)} icon={AlertTriangle} color="warning" loading={loading} />
        <StatCard label="إجمالي المنتجات" value={formatNumber(stats.totalProducts)} icon={Package} color="blue" loading={loading} />
        <StatCard label="إجمالي العملاء" value={formatNumber(stats.totalCustomers)} icon={Users} color="success" loading={loading} />
        <StatCard label="الموظفون" value={formatNumber(stats.totalEmployees)} icon={Tag} color="primary" loading={loading} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadDashboard} className="btn-outline text-sm">
            إعادة المحاولة
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <section className="bg-white rounded-2xl border border-primary-200 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-primary-900">أحدث الطلبات</h2>
            <Link to="/admin/orders" className="text-sm text-gold hover:underline inline-flex items-center gap-1">
              عرض الكل <ChevronLeft className="h-4 w-4" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 skeleton rounded-xl" />
              ))}
            </div>
          ) : stats.recentOrders.length > 0 ? (
            <div className="space-y-3">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-primary-50 rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white border border-primary-200 flex items-center justify-center shrink-0">
                      <ShoppingBag className="h-5 w-5 text-primary-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-primary-900 text-sm">#{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-primary-500 truncate">
                        {(order.user?.first_name ?? '') + ' ' + (order.user?.last_name ?? '') || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="font-semibold text-gold text-sm">{formatPrice(order.total)}</p>
                    <p className="text-xs text-primary-500">{formatRelativeTime(order.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-primary-500">لا توجد طلبات حديثة</p>
              <p className="text-xs text-primary-400 mt-1">ستظهر الطلبات هنا عند إنشائها</p>
            </div>
          )}
        </section>

        {/* Top products */}
        <section className="bg-white rounded-2xl border border-primary-200 p-5 sm:p-6">
          <h2 className="font-semibold text-primary-900 mb-4">المنتجات الأعلى تقييماً</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 skeleton rounded-xl" />
              ))}
            </div>
          ) : stats.topProducts.length > 0 ? (
            <div className="space-y-3">
              {stats.topProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl">
                  <img
                    src={product.images?.[0] || '/placeholder.svg'}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover bg-white border border-primary-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-primary-900 text-sm truncate">{product.name}</p>
                    <p className="text-xs text-primary-500">
                      {product.review_count} تقييم • {Number(product.rating).toFixed(1)}★
                    </p>
                  </div>
                  <span className="text-gold font-semibold text-sm shrink-0">
                    {formatPrice(product.discount_price ?? product.price)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-primary-500">لا توجد منتجات بعد</p>
              <p className="text-xs text-primary-400 mt-1">أضف منتجات لتظهر هنا</p>
            </div>
          )}
        </section>
      </div>

      {stats.lowStockProducts > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="font-medium">تنبيه: {formatNumber(stats.lowStockProducts)} منتج بمخزون منخفض</p>
          </div>
          <Link to="/admin/products" className="btn-outline bg-white whitespace-nowrap">
            عرض المنتجات
          </Link>
        </section>
      )}
    </div>
  )
}
