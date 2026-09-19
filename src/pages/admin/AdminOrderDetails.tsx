import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { PageHeader, StatusBadge } from '../../components/admin'
import { Button } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { formatPrice, formatDate } from '../../lib/utils'
import { Package, MapPin, User, CreditCard, FileText, ExternalLink, Truck } from 'lucide-react'
import type { Order, PaymentReceipt } from '../../lib/types'

const statusOptions = [
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'paid', label: 'مدفوع' },
  { value: 'processing', label: 'قيد التجهيز' },
  { value: 'shipped', label: 'تم الشحن' },
  { value: 'delivered', label: 'تم التوصيل' },
  { value: 'cancelled', label: 'ملغي' },
  { value: 'returned', label: 'مرتجع' },
]

export function AdminOrderDetails() {
  const { id } = useParams<{ id: string }>()
  const { success, error: toastError } = useToast()
  const [order, setOrder] = useState<(Order & { user: { first_name: string | null; last_name: string | null; email: string; phone: string | null } | null }) | null>(null)
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (id) loadOrder()
  }, [id])

  const loadOrder = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('orders').select('*, user:profiles!orders_user_id_fkey(first_name,last_name,email,phone), items:order_items(*)').eq('id', id).single()
    if (error || !data) {
      setOrder(null)
      setLoading(false)
      return
    }
    setOrder(data as typeof order)
    const { data: rec } = await supabase.from('payment_receipts').select('*').eq('order_id', id).maybeSingle()
    if (rec) {
      setReceipt(rec as PaymentReceipt)
      const { data: signed } = await supabase.storage.from('payment-receipts').createSignedUrl((rec as PaymentReceipt).storage_path, 3600)
      if (signed?.signedUrl) setSignedUrl(signed.signedUrl)
      else setSignedUrl((rec as PaymentReceipt).public_url)
    }
    setLoading(false)
  }

  const updateStatus = async (newStatus: string) => {
    setUpdating(true)
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id)
    if (error) toastError(error.message)
    else {
      success('تم تحديث الحالة')
      if (order?.user_id) {
        const labels: Record<string, string> = { pending: 'قيد الانتظار', paid: 'مدفوع', processing: 'جاري تجهيز طلبك', shipped: 'تم شحن طلبك', delivered: 'تم تسليم طلبك', cancelled: 'تم إلغاء طلبك', returned: 'تم إرجاع طلبك' }
        await supabase.from('notifications').insert({ user_id: order.user_id, title: labels[newStatus] ?? 'تحديث الطلب', message: `طلب #${id!.slice(0, 8).toUpperCase()} — ${labels[newStatus] ?? newStatus}`, type: newStatus === 'cancelled' ? 'error' : newStatus === 'delivered' ? 'success' : 'info' })
      }
      loadOrder()
    }
    setUpdating(false)
  }

  const updatePaymentStatus = async (newStatus: string) => {
    setUpdating(true)
    const { error } = await supabase.from('orders').update({ payment_status: newStatus }).eq('id', id)
    if (error) toastError(error.message)
    else {
      success('تم تحديث حالة الدفع')
      if (order?.user_id) {
        await supabase.from('notifications').insert({ user_id: order.user_id, title: 'تحديث حالة الدفع', message: `طلب #${id!.slice(0, 8).toUpperCase()} — حالة الدفع: ${newStatus}`, type: newStatus === 'paid' ? 'success' : 'info' })
      }
      loadOrder()
    }
    setUpdating(false)
  }

  const handleReceiptAction = async (action: 'approved' | 'rejected') => {
    if (!receipt) return
    setUpdating(true)
    const newStatus = action === 'approved' ? 'paid' : 'rejected'
    const { error: recErr } = await supabase.from('payment_receipts').update({ status: newStatus, admin_notes: action === 'approved' ? 'تمت الموافقة' : 'مرفوض', reviewed_at: new Date().toISOString() }).eq('id', receipt.id)
    if (recErr) toastError(recErr.message)
    else {
      // Also update order payment_status
      const payStatus = action === 'approved' ? 'paid' : 'unpaid'
      await supabase.from('orders').update({ payment_status: payStatus, status: action === 'approved' ? 'paid' : 'pending' }).eq('id', id)
      success(action === 'approved' ? 'تمت الموافقة على الإيصال' : 'تم رفض الإيصال')
      loadOrder()
    }
    setUpdating(false)
  }

  if (loading) return <div className="p-8 skeleton h-64 rounded-2xl" />
  if (!order) return <div className="text-center py-12 text-primary-500">الطلب غير موجود</div>

  return (
    <div className="space-y-6">
      <PageHeader title={`طلب #${order.id.slice(0, 8).toUpperCase()}`} description={formatDate(order.created_at)} backHref="/admin/orders" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-2xl border border-primary-200 p-5">
            <h3 className="font-semibold text-primary-900 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" /> المنتجات
            </h3>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 bg-primary-50 rounded-xl">
                  <img src={item.image_url || '/placeholder.svg'} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-primary-900 text-sm truncate">{item.name}</p>
                    {item.variant_name && <p className="text-xs text-gold">{item.variant_name}</p>}
                    <p className="text-xs text-primary-500">
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-bold text-gold text-sm">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-primary-200 p-5">
            <h3 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5" /> العنوان
            </h3>
            {order.shipping_address ? (
              <div className="text-sm text-primary-700 leading-relaxed">
                <p className="font-medium text-primary-900">{order.shipping_address.full_name}</p>
                <p>{order.shipping_address.phone}</p>
                <p>
                  {order.shipping_address.line1} {order.shipping_address.line2 ? `، ${order.shipping_address.line2}` : ''} — {order.shipping_address.city}
                </p>
                <p>
                  {order.shipping_address.state ?? ''} {order.shipping_address.postal_code ?? ''} • {order.shipping_address.country}
                </p>
              </div>
            ) : (
              <p className="text-sm text-primary-500">لا يوجد عنوان</p>
            )}
          </section>

          {receipt && (
            <section className="bg-white rounded-2xl border border-primary-200 p-5">
              <h3 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" /> إيصال الدفع
              </h3>
              <div className="flex flex-col sm:flex-row gap-4">
                {signedUrl ? (
                  <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="block w-full sm:w-48 h-48 rounded-xl overflow-hidden border">
                    <img src={signedUrl} alt="إيصال" className="w-full h-full object-cover" />
                  </a>
                ) : (
                  <div className="w-48 h-48 rounded-xl bg-primary-100 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-primary-400" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm">المبلغ: {formatPrice(receipt.amount)}</p>
                  <p className="text-xs text-primary-500">الحالة: {receipt.status}</p>
                  {receipt.admin_notes && <p className="text-xs mt-2 p-2 bg-primary-50 rounded">ملاحظة: {receipt.admin_notes}</p>}
                  <div className="flex gap-2 mt-3">
                    <Button onClick={() => handleReceiptAction('approved')} variant="gold" size="sm" disabled={updating || receipt.status === 'approved'}>
                      قبول
                    </Button>
                    <Button onClick={() => handleReceiptAction('rejected')} variant="danger" size="sm" disabled={updating || receipt.status === 'rejected'}>
                      رفض
                    </Button>
                    {signedUrl && (
                      <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="btn-outline text-xs inline-flex items-center gap-1">
                        فتح <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-2xl border border-primary-200 p-5">
            <h3 className="font-semibold text-primary-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5" /> العميل
            </h3>
            <p className="font-medium text-primary-900 text-sm">
              {order.user?.first_name} {order.user?.last_name}
            </p>
            <p className="text-sm text-primary-500">{order.user?.email}</p>
            <p className="text-sm text-primary-500">{order.user?.phone ?? '—'}</p>
          </section>

          <section className="bg-white rounded-2xl border border-primary-200 p-5">
            <h3 className="font-semibold text-primary-900 mb-3">ملخص الدفع</h3>
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
                <span>{order.shipping === 0 ? 'مجاني' : formatPrice(order.shipping)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>الإجمالي</span>
                <span className="text-gold">{formatPrice(order.total)}</span>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="label">حالة الطلب</label>
                <select value={order.status} onChange={(e) => updateStatus(e.target.value)} className="select" disabled={updating}>
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">حالة الدفع</label>
                <select value={order.payment_status} onChange={(e) => updatePaymentStatus(e.target.value)} className="select" disabled={updating}>
                  <option value="unpaid">غير مدفوع</option>
                  <option value="pending_verification">بانتظار التحقق</option>
                  <option value="paid">مدفوع</option>
                  <option value="refunded">مسترد</option>
                </select>
              </div>
              <p className="text-xs text-primary-500">طريقة الدفع: {order.payment_method === 'cash_on_delivery' ? 'عند الاستلام' : 'تحويل بنكي'}</p>
            </div>
          </section>

          {order.notes && (
            <section className="bg-white rounded-2xl border border-primary-200 p-5">
              <h3 className="font-semibold text-primary-900 mb-2">ملاحظات</h3>
              <p className="text-sm text-primary-700">{order.notes}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
