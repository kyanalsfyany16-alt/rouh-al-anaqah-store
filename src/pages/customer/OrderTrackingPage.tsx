import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Order, PaymentReceipt } from '../../lib/types'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { cn, formatPrice, formatDate } from '../../lib/utils'
import { Package, Clock, Truck, CheckCircle, XCircle, AlertCircle, MapPin, FileText, ExternalLink } from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string; icon: typeof Package }> = {
  pending: { label: 'قيد الانتظار', color: 'warning', icon: Clock },
  paid: { label: 'مدفوع', color: 'info', icon: CheckCircle },
  processing: { label: 'قيد التجهيز', color: 'primary', icon: Package },
  shipped: { label: 'تم الشحن', color: 'blue', icon: Truck },
  delivered: { label: 'تم التوصيل', color: 'success', icon: CheckCircle },
  cancelled: { label: 'ملغي', color: 'danger', icon: XCircle },
  returned: { label: 'مرتجع', color: 'neutral', icon: AlertCircle },
}

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  unpaid: { label: 'غير مدفوع', color: 'danger' },
  pending_verification: { label: 'بانتظار التحقق', color: 'warning' },
  paid: { label: 'مدفوع', color: 'success' },
  refunded: { label: 'مسترد', color: 'info' },
  pending: { label: 'بانتظار التأكيد', color: 'warning' },
}

export function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>()
  const { session } = useAuth()
  const { error: toastError } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id && session?.user) loadOrder()
  }, [id, session?.user?.id])

  const loadOrder = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('orders').select('*, items:order_items(*, product:products(*))').eq('id', id).eq('user_id', session!.user.id).single()
    if (error || !data) {
      setOrder(null)
      setLoading(false)
      return
    }
    setOrder(data as Order)
    // Fetch receipt separately
    const { data: rec } = await supabase.from('payment_receipts').select('*').eq('order_id', id).maybeSingle()
    if (rec) {
      setReceipt(rec as PaymentReceipt)
      // Create signed URL for private bucket
      const { data: signed } = await supabase.storage.from('payment-receipts').createSignedUrl(rec.storage_path, 3600)
      if (signed?.signedUrl) setSignedUrl(signed.signedUrl)
      else setSignedUrl(rec.public_url)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 skeleton rounded-2xl" />
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <Package className="h-12 w-12 mx-auto text-primary-300 mb-4" />
        <h2 className="text-xl font-semibold text-primary-900 mb-2">الطلب غير موجود</h2>
        <p className="text-primary-500 mb-4">لا يمكن عرض هذا الطلب أو ليس لديك صلاحية</p>
        <Link to="/orders" className="btn-gold">
          العودة لطلباتي
        </Link>
      </div>
    )
  }

  const isCancelled = order.status === 'cancelled' || order.status === 'returned'
  const steps = isCancelled ? [{ id: 'cancelled', label: 'تم الإلغاء' }] : [
    { id: 'pending', label: 'تم إنشاء الطلب' },
    { id: 'paid', label: 'تم التأكيد' },
    { id: 'processing', label: 'جاري التجهيز' },
    { id: 'shipped', label: 'تم الشحن' },
    { id: 'delivered', label: 'تم التسليم' },
  ]

  const currentIdx = isCancelled ? 0 : steps.findIndex((s) => s.id === order.status)
  const config = statusConfig[order.status] ?? { label: order.status, color: 'neutral', icon: Package }
  const StatusIcon = config.icon
  const payCfg = paymentStatusConfig[order.payment_status] ?? { label: order.payment_status, color: 'neutral' }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary-900">طلب #{order.id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-sm text-primary-500">بتاريخ {formatDate(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border', config.color === 'success' ? 'bg-green-50 text-green-700 border-green-200' : config.color === 'danger' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-primary-100 text-primary-700')}>
            <StatusIcon className="h-3.5 w-3.5" /> {config.label}
          </span>
          <span className={cn('px-3 py-1.5 rounded-full text-xs font-medium border', payCfg.color === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200')}>
            {payCfg.label}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-primary-200 p-5">
        <h3 className="font-medium text-primary-900 mb-4">تتبع الطلب</h3>
        {isCancelled ? (
          <div className="flex items-center gap-3 text-danger">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-5 w-5" />
            </div>
            <span className="font-medium">تم إلغاء الطلب</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
            {steps.map((step, i) => {
              const completed = i <= currentIdx
              const active = i === currentIdx
              return (
                <div key={step.id} className="flex items-center shrink-0">
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2', completed ? 'bg-gold border-gold text-primary-950' : 'bg-white border-primary-200 text-primary-400', active && 'ring-2 ring-gold/30')}>
                    {i + 1}
                  </div>
                  <span className={cn('mx-2 text-xs whitespace-nowrap', completed ? 'text-primary-900 font-medium' : 'text-primary-400')}>{step.label}</span>
                  {i < steps.length - 1 && <div className={cn('w-12 h-0.5 mx-1', i < currentIdx ? 'bg-gold' : 'bg-primary-200')} />}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-2xl border border-primary-200 p-5">
            <h2 className="font-semibold text-primary-900 mb-4">المنتجات ({order.items?.length ?? 0})</h2>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 bg-primary-50 rounded-xl">
                  <img src={item.image_url || '/placeholder.svg'} alt={item.name} className="w-16 h-16 rounded-xl object-cover border" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-primary-900 text-sm truncate">{item.name}</p>
                    {item.variant_name && <p className="text-xs text-gold">{item.variant_name}</p>}
                    <p className="text-xs text-primary-500">الكمية: {item.quantity} • {formatPrice(item.price)}</p>
                  </div>
                  <span className="font-bold text-gold text-sm">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </section>

          {receipt && (
            <section className="bg-white rounded-2xl border border-primary-200 p-5">
              <h2 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-gold" /> إيصال الدفع
              </h2>
              <div className="flex flex-col sm:flex-row gap-4">
                {signedUrl ? (
                  <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="block w-full sm:w-40 h-40 rounded-xl overflow-hidden border group relative">
                    <img src={signedUrl} alt="إيصال" className="w-full h-full object-cover group-hover:opacity-90" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                      <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100" />
                    </span>
                  </a>
                ) : (
                  <div className="w-40 h-40 rounded-xl bg-primary-100 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-primary-400" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary-900">المبلغ: {formatPrice(receipt.amount)}</p>
                  <p className="text-xs text-primary-500">الحالة: {payCfg.label}</p>
                  {receipt.admin_notes && <p className="text-xs text-primary-600 mt-2 p-2 bg-primary-50 rounded">ملاحظة الإدارة: {receipt.admin_notes}</p>}
                  {signedUrl && (
                    <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-gold hover:underline mt-2">
                      عرض الإيصال <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </section>
          )}

          <section className="bg-white rounded-2xl border border-primary-200 p-5">
            <h2 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gold" /> عنوان التوصيل
            </h2>
            {order.shipping_address ? (
              <div className="text-sm leading-relaxed text-primary-700">
                <p className="font-medium text-primary-900">{order.shipping_address.full_name}</p>
                <p>{order.shipping_address.phone}</p>
                <p>
                  {order.shipping_address.line1}
                  {order.shipping_address.line2 ? `، ${order.shipping_address.line2}` : ''} — {order.shipping_address.city}
                </p>
                <p>
                  {order.shipping_address.state ?? ''} {order.shipping_address.postal_code ?? ''} • {order.shipping_address.country}
                </p>
              </div>
            ) : (
              <p className="text-sm text-primary-500">لا يوجد عنوان</p>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-2xl border border-primary-200 p-5">
            <h2 className="font-semibold text-primary-900 mb-4">ملخص الدفع</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-primary-600">
                <span>المجموع</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>الخصم</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-primary-600">
                <span>الشحن</span>
                <span>{order.shipping === 0 ? <span className="text-success">مجاني</span> : formatPrice(order.shipping)}</span>
              </div>
              <div className="border-t border-primary-200 pt-3 flex justify-between font-bold">
                <span>الإجمالي</span>
                <span className="text-gold">{formatPrice(order.total)}</span>
              </div>
              <div className="pt-3 border-t border-primary-100 text-xs text-primary-500 space-y-1">
                <p>طريقة الدفع: {order.payment_method === 'cash_on_delivery' ? 'الدفع عند الاستلام' : 'تحويل بنكي'}</p>
                <p>
                  حالة الدفع: <span className="font-medium">{payCfg.label}</span>
                </p>
              </div>
            </div>
          </section>

          {order.notes && (
            <section className="bg-white rounded-2xl border border-primary-200 p-5">
              <h3 className="font-medium text-primary-900 mb-2">ملاحظات</h3>
              <p className="text-sm text-primary-700">{order.notes}</p>
            </section>
          )}

          <Link to="/orders" className="btn-outline w-full text-center block">
            العودة لطلباتي
          </Link>
        </div>
      </div>
    </div>
  )
}
