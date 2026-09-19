import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/admin'
import { Button, Modal, EmptyState, LoadingSkeleton, Badge, RatingStars } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { cn } from '../../lib/utils'
import { Plus, Search, Edit, Trash2, CheckCircle, XCircle, Star, Eye } from 'lucide-react'
import type { Review } from '../../lib/types'

export function AdminReviews() {
  const { success, error: toastError } = useToast()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadReviews() }, [])

  const loadReviews = async () => {
    const { data } = await supabase.from('reviews').select('*, product:products(name, images), user:profiles(first_name, last_name, email)').order('created_at', { ascending: false })
    setReviews(data || [])
    setLoading(false)
  }

  const updateStatus = async (id: string, is_approved: boolean) => {
    await supabase.from('reviews').update({ is_approved }).eq('id', id)
    success(is_approved ? 'تم الموافقة على التقييم' : 'تم رفض التقييم')
    loadReviews()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التقييم؟')) return
    await supabase.from('reviews').delete().eq('id', id)
    success('تم حذف التقييم')
    loadReviews()
  }

  if (loading) return <LoadingSkeleton variant="list" count={5} />

  return (
    <div>
      <PageHeader title="إدارة التقييمات" />
      <div className="bg-white rounded-2xl border border-primary-200">
        {reviews.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-50">
                <tr className="text-right">
                  <th className="p-4 font-medium text-primary-500">المنتج</th>
                  <th className="p-4 font-medium text-primary-500">المستخدم</th>
                  <th className="p-4 font-medium text-primary-500">التقييم</th>
                  <th className="p-4 font-medium text-primary-500">التعليق</th>
                  <th className="p-4 font-medium text-primary-500">الحالة</th>
                  <th className="p-4 font-medium text-primary-500">التاريخ</th>
                  <th className="p-4 font-medium text-primary-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100">
                {reviews.map(review => (
                  <tr key={review.id}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={review.product?.images[0] || '/placeholder.svg'} alt="" className="w-10 h-10 rounded-xl object-cover" />
                        <span className="font-medium text-primary-900 truncate max-w-[200px]">{review.product?.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-primary-900">{review.user?.first_name} {review.user?.last_name}</p>
                        <p className="text-sm text-primary-500">{review.user?.email}</p>
                      </div>
                    </td>
                    <td className="p-4"><RatingStars rating={review.rating} size="sm" /></td>
                    <td className="p-4 text-primary-600 max-w-[200px] truncate">{review.comment || '—'}</td>
                    <td className="p-4"><span className={cn('badge', review.is_approved ? 'badge-success' : 'badge-warning')}>{review.is_approved ? 'معتمد' : 'قيد المراجعة'}</span></td>
                    <td className="p-4 text-primary-500">{new Date(review.created_at).toLocaleDateString('ar-SA')}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {!review.is_approved && <Button onClick={() => updateStatus(review.id, true)} variant="success" size="sm"><CheckCircle className="h-3 w-3" /></Button>}
                        {review.is_approved && <Button onClick={() => updateStatus(review.id, false)} variant="warning" size="sm"><XCircle className="h-3 w-3" /></Button>}
                        <Button onClick={() => handleDelete(review.id)} variant="danger" size="sm"><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<Star className="h-12 w-12" />} title="لا توجد تقييمات" description="ستظهر التقييمات هنا عند إضافتها من العملاء" />
        )}
      </div>
    </div>
  )
}