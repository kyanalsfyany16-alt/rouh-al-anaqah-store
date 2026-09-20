import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/admin'
import { Button, Input, Label, Select, Modal, EmptyState, LoadingSkeleton, Badge } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { cn } from '../../lib/utils'
import { Plus, Search, Edit, Trash2, Loader2, Save, Tag, Percent } from 'lucide-react'
import type { Coupon } from '../../lib/types'

export function AdminCoupons() {
  const { success, error: toastError } = useToast()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({ code: '', type: 'percentage', value: 0, min_order: 0, max_uses: null, is_active: true, valid_from: '', valid_until: '' })

  useEffect(() => { loadCoupons() }, [])

  const loadCoupons = async () => {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    setCoupons(data || [])
    setLoading(false)
  }

  const openModal = (coup?: Coupon) => {
    if (coup) {
      setEditingCoupon(coup)
      setFormData({ code: coup.code, type: coup.type, value: coup.value, min_order: coup.min_order, max_uses: coup.max_uses, is_active: coup.is_active, valid_from: coup.valid_from?.slice(0, 16) || '', valid_until: coup.valid_until?.slice(0, 16) || '' })
    } else {
      setEditingCoupon(null)
      setFormData({ code: '', type: 'percentage', value: 0, min_order: 0, max_uses: null, is_active: true, valid_from: '', valid_until: '' })
    }
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditingCoupon(null) }

  const handleSubmit = async () => {
    setSaving(true)
    const payload = { ...formData, max_uses: formData.max_uses || null, valid_from: formData.valid_from || null, valid_until: formData.valid_until || null }
    if (editingCoupon) {
      await supabase.from('coupons').update(payload).eq('id', editingCoupon.id)
    } else {
      await supabase.from('coupons').insert(payload)
    }
    success(editingCoupon ? 'تم تحديث الكوبون' : 'تم إضافة الكوبون')
    closeModal()
    loadCoupons()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكوبون؟')) return
    await supabase.from('coupons').delete().eq('id', id)
    success('تم حذف الكوبون')
    loadCoupons()
  }

  if (loading) return <LoadingSkeleton variant="list" count={5} />

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden">
      <PageHeader title="إدارة الكوبونات" actions={<Button onClick={() => openModal()} variant="gold"><Plus className="h-4 w-4" /> إضافة كوبون</Button>} />
      <div className="bg-white rounded-2xl border border-primary-200">
        {coupons.length > 0 ? (
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full min-w-[600px]">
              <thead className="bg-primary-50">
                <tr className="text-right">
                  <th className="p-4 font-medium text-primary-500">الكود</th>
                  <th className="p-4 font-medium text-primary-500">النوع</th>
                  <th className="p-4 font-medium text-primary-500">القيمة</th>
                  <th className="p-4 font-medium text-primary-500">الحد الأدنى</th>
                  <th className="p-4 font-medium text-primary-500">الاستخدامات</th>
                  <th className="p-4 font-medium text-primary-500">الحالة</th>
                  <th className="p-4 font-medium text-primary-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100">
                {coupons.map(coup => (
                  <tr key={coup.id}>
                    <td className="p-4 font-mono font-medium text-primary-900">{coup.code}</td>
                    <td className="p-4"><Badge variant={coup.type === 'percentage' ? 'blue' : 'gold'}>{coup.type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}</Badge></td>
                    <td className="p-4 text-primary-900">{coup.type === 'percentage' ? coup.value + '%' : coup.value + ' ر.س'}</td>
                    <td className="p-4 text-primary-500">{coup.min_order} ر.س</td>
                    <td className="p-4 text-primary-500">{coup.used_count} / {coup.max_uses || '∞'}</td>
                    <td className="p-4"><span className={cn('badge', coup.is_active ? 'badge-success' : 'badge-neutral')}>{coup.is_active ? 'نشط' : 'غير نشط'}</span></td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button onClick={() => openModal(coup)} variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                        <Button onClick={() => handleDelete(coup.id)} variant="danger" size="sm"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<Tag className="h-12 w-12" />} title="لا توجد كوبونات" description="أضف كوبونات خصم للعملاء" action={<Button onClick={() => openModal()} variant="gold">إضافة كوبون</Button>} />
        )}
      </div>

      <Modal open={showModal} onClose={closeModal} title={editingCoupon ? 'تعديل الكوبون' : 'إضافة كوبون جديد'} size="lg">
        <form onSubmit={e => { e.preventDefault(); handleSubmit() }} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full max-w-full">
            <div><Label>الكود *</Label><Input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} required /></div>
            <div><Label>النوع</Label><Select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}><option value="percentage">نسبة مئوية</option><option value="fixed">مبلغ ثابت</option></Select></div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full max-w-full">
            <div><Label>القيمة *</Label><Input type="number" step="0.01" min="0" value={formData.value} onChange={e => setFormData({ ...formData, value: Number(e.target.value) })} required /></div>
            <div><Label>الحد الأدنى للطلب</Label><Input type="number" step="0.01" min="0" value={formData.min_order} onChange={e => setFormData({ ...formData, min_order: Number(e.target.value) })} /></div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full max-w-full">
            <div><Label>الحد الأقصى للاستخدامات</Label><Input type="number" min="1" value={formData.max_uses || ''} onChange={e => setFormData({ ...formData, max_uses: e.target.value ? Number(e.target.value) : null })} /></div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="h-4 w-4 rounded border-primary-300 text-gold focus:ring-gold" />
              <Label htmlFor="is_active" className="mb-0 cursor-pointer">نشط</Label>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full max-w-full">
            <div><Label>صالح من</Label><Input type="datetime-local" value={formData.valid_from} onChange={e => setFormData({ ...formData, valid_from: e.target.value })} /></div>
            <div><Label>صالح حتى</Label><Input type="datetime-local" value={formData.valid_until} onChange={e => setFormData({ ...formData, valid_until: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-primary-200">
            <Button type="button" onClick={closeModal} variant="outline">إلغاء</Button>
            <Button type="submit" loading={saving} variant="gold"><Save className="h-4 w-4" /> حفظ</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}