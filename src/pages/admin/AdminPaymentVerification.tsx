import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { PageHeader, StatusBadge } from '../../components/admin'
import { EmptyState, LoadingSkeleton } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { formatPrice, formatRelativeTime } from '../../lib/utils'
import { CreditCard, CheckCircle, XCircle, ExternalLink, Eye } from 'lucide-react'
import type { PaymentReceipt } from '../../lib/types'

export function AdminPaymentVerification() {
  const { success, error: toastError } = useToast()
  const [receipts, setReceipts] = useState<(PaymentReceipt & { order: { id: string; total: number; user: { first_name: string | null; last_name: string | null; email: string } | null } | null; bank_account: { bank_name: string; account_holder: string } | null })[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('pending_verification')
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    load()
  }, [filter])

  const load = async () => {
    setLoading(true)
    let query = supabase
      .from('payment_receipts')
      .select('*, order:orders!payment_receipts_order_id_fkey(id,total,user:profiles!orders_user_id_fkey(first_name,last_name,email)), bank_account:bank_accounts(bank_name,account_holder)')
      .order('created_at', { ascending: false })
      .limit(50)
    if (filter) query = query.eq('status', filter)
    const { data, error } = await query
    if (error) toastError(error.message)
    else {
      const list = (data as typeof receipts) ?? []
      setReceipts(list)
      // Generate signed URLs
      const urls: Record<string, string> = {}
      for (const r of list) {
        const { data: s } = await supabase.storage.from('payment-receipts').createSignedUrl(r.storage_path, 3600)
        if (s?.signedUrl) urls[r.id] = s.signedUrl
        else urls[r.id] = r.public_url
      }
      setSignedUrls(urls)
    }
    setLoading(false)
  }

  const handleAction = async (id: string, orderId: string, action: 'approved' | 'rejected') => {
    const newStatus = action === 'approved' ? 'approved' : 'rejected'
    const payStatus = action === 'approved' ? 'paid' : 'unpaid'
    const orderStatus = action === 'approved' ? 'paid' : 'pending'
    const { error: recErr } = await supabase.from('payment_receipts').update({ status: newStatus, reviewed_at: new Date().toISOString(), admin_notes: action === 'approved' ? 'تمت الموافقة' : 'مرفوض' }).eq('id', id)
    if (recErr) return toastError(recErr.message)
    const { error: ordErr } = await supabase.from('orders').update({ payment_status: payStatus, status: orderStatus }).eq('id', orderId)
    if (ordErr) toastError(ordErr.message)
    else {
      success(action === 'approved' ? 'تمت الموافقة' : 'تم الرفض')
      load()
    }
  }

  if (loading) return <LoadingSkeleton variant="list" count={5} />

  return (
    <div>
      <PageHeader title="التحقق من المدفوعات" description="مراجعة إيصالات التحويل البنكي" />

      <div className="bg-white rounded-2xl border border-primary-200 p-4 mb-4 flex gap-2">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="select w-48">
          <option value="">الكل</option>
          <option value="pending">قيد الانتظار</option>
          <option value="pending_verification">بانتظار التحقق</option>
          <option value="approved">مقبول</option>
          <option value="rejected">مرفوض</option>
          <option value="paid">مدفوع</option>
        </select>
        <button onClick={load} className="btn-outline text-sm">
          تحديث
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-primary-200 overflow-hidden">
        {receipts.length ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-50">
                <tr className="text-right">
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">الإيصال</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">الطلب</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">العميل</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">المبلغ</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">البنك</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">الحالة</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100">
                {receipts.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3">
                      {signedUrls[r.id] ? (
                        <a href={signedUrls[r.id]} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 rounded-xl overflow-hidden border">
                          <img src={signedUrls[r.id]} alt="إيصال" className="w-full h-full object-cover" />
                        </a>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center">
                          <CreditCard className="h-6 w-6 text-primary-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/orders/${r.order?.id}`} className="font-mono text-sm text-primary-900 hover:text-gold">
                        #{r.order?.id.slice(0, 8).toUpperCase()}
                      </Link>
                      <p className="text-xs text-primary-500">{formatRelativeTime(r.created_at)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-primary-900">
                        {r.order?.user?.first_name} {r.order?.user?.last_name}
                      </p>
                      <p className="text-xs text-primary-500">{r.order?.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gold text-sm">{formatPrice(r.amount)}</td>
                    <td className="px-4 py-3 text-sm text-primary-700">{r.bank_account?.bank_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={r.status === 'approved' || r.status === 'paid' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'}>
                        {r.status === 'pending_verification' ? 'بانتظار التحقق' : r.status === 'pending' ? 'قيد الانتظار' : r.status === 'approved' ? 'مقبول' : r.status}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {signedUrls[r.id] && (
                          <a href={signedUrls[r.id]} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-primary-500 hover:bg-primary-100">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <Link to={`/admin/orders/${r.order?.id}`} className="p-1.5 rounded-lg text-primary-500 hover:bg-primary-100">
                          <Eye className="h-4 w-4" />
                        </Link>
                        {r.status === 'pending_verification' || r.status === 'pending' ? (
                          <>
                            <button onClick={() => handleAction(r.id, r.order!.id, 'approved')} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100">
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleAction(r.id, r.order!.id, 'rejected')} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <EmptyState icon={<CreditCard className="h-12 w-12" />} title="لا توجد إيصالات" description="ستظهر إيصالات التحويل هنا عند رفعها من العملاء" />
          </div>
        )}
      </div>
    </div>
  )
}
