import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/admin'
import { Button, Input, Label, Select, Modal, EmptyState, LoadingSkeleton, Badge, ImageUploader } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { cn } from '../../lib/utils'
import { Plus, Search, Edit, Trash2, Loader2, Save, DollarSign, Circle, Globe } from 'lucide-react'
import type { Currency } from '../../lib/types'

export function AdminCurrencies() {
  const { success, error: toastError } = useToast()
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({ code: '', name: '', symbol: '', rate: 1, is_default: false, is_active: true })

  useEffect(() => { loadCurrencies() }, [])

  const loadCurrencies = async () => {
    const { data } = await supabase.from('currencies').select('*').order('is_default', { ascending: false })
    setCurrencies(data || [])
    setLoading(false)
  }

  const openModal = (cur?: Currency) => {
    if (cur) {
      setEditingCurrency(cur)
      setFormData({ code: cur.code, name: cur.name, symbol: cur.symbol, rate: cur.rate, is_default: cur.is_default, is_active: cur.is_active })
    } else {
      setEditingCurrency(null)
      setFormData({ code: '', name: '', symbol: '', rate: 1, is_default: false, is_active: true })
    }
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditingCurrency(null) }

  const handleSubmit = async () => {
    setSaving(true)
    if (formData.is_default) {
      await supabase.from('currencies').update({ is_default: false }).neq('id', editingCurrency?.id || '')
    }
    const payload = { ...formData, rate: Number(formData.rate) }
    if (editingCurrency) {
      await supabase.from('currencies').update(payload).eq('id', editingCurrency.id)
    } else {
      await supabase.from('currencies').insert(payload)
    }
    success(editingCurrency ? 'تم تحديث العملة' : 'تم إضافة العملة')
    closeModal()
    loadCurrencies()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه العملة؟')) return
    await supabase.from('currencies').delete().eq('id', id)
    success('تم حذف العملة')
    loadCurrencies()
  }

  if (loading) return <LoadingSkeleton variant="list" count={5} />

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden">
      <PageHeader title="إدارة العملات" actions={<Button onClick={() => openModal()} variant="gold"><Plus className="h-4 w-4" /> إضافة عملة</Button>} />
      <div className="bg-white rounded-2xl border border-primary-200">
        {currencies.length > 0 ? (
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full min-w-[600px]">
              <thead className="bg-primary-50">
                <tr className="text-right">
                  <th className="p-4 font-medium text-primary-500">الكود</th>
                  <th className="p-4 font-medium text-primary-500">الاسم</th>
                  <th className="p-4 font-medium text-primary-500">الرمز</th>
                  <th className="p-4 font-medium text-primary-500">سعر الصرف</th>
                  <th className="p-4 font-medium text-primary-500">الافتراضية</th>
                  <th className="p-4 font-medium text-primary-500">الحالة</th>
                  <th className="p-4 font-medium text-primary-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100">
                {currencies.map(cur => (
                  <tr key={cur.id}>
                    <td className="p-4 font-mono font-medium text-primary-900">{cur.code}</td>
                    <td className="p-4 text-primary-900">{cur.name}</td>
                    <td className="p-4 text-primary-900">{cur.symbol}</td>
                    <td className="p-4 text-primary-500">{cur.rate}</td>
                    <td className="p-4"><span className={cn('badge', cur.is_default ? 'badge-gold' : 'badge-neutral')}>{cur.is_default ? 'نعم' : 'لا'}</span></td>
                    <td className="p-4"><span className={cn('badge', cur.is_active ? 'badge-success' : 'badge-neutral')}>{cur.is_active ? 'نشط' : 'غير نشط'}</span></td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button onClick={() => openModal(cur)} variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                        <Button onClick={() => handleDelete(cur.id)} variant="danger" size="sm"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<DollarSign className="h-12 w-12" />} title="لا توجد عملات" description="أضف العملات المدعومة في المتجر" action={<Button onClick={() => openModal()} variant="gold">إضافة عملة</Button>} />
        )}
      </div>

      <Modal open={showModal} onClose={closeModal} title={editingCurrency ? 'تعديل العملة' : 'إضافة عملة جديدة'} size="lg">
        <form onSubmit={e => { e.preventDefault(); handleSubmit() }} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full max-w-full">
            <div><Label>الكود (مثل: SAR, USD)</Label><Input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} required /></div>
            <div><Label>الاسم</Label><Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full max-w-full">
            <div><Label>الرمز (مثل: ر.س, $)</Label><Input value={formData.symbol} onChange={e => setFormData({ ...formData, symbol: e.target.value })} required /></div>
            <div><Label>سعر الصرف</Label><Input type="number" step="0.0001" min="0" value={formData.rate} onChange={e => setFormData({ ...formData, rate: Number(e.target.value) })} required /></div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full max-w-full">
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="is_default" checked={formData.is_default} onChange={e => setFormData({ ...formData, is_default: e.target.checked })} className="h-4 w-4 rounded border-primary-300 text-gold focus:ring-gold" />
              <Label htmlFor="is_default" className="mb-0 cursor-pointer">العملة الافتراضية</Label>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="h-4 w-4 rounded border-primary-300 text-gold focus:ring-gold" />
              <Label htmlFor="is_active" className="mb-0 cursor-pointer">نشط</Label>
            </div>
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