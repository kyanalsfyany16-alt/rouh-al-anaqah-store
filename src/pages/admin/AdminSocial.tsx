import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/admin'
import { Button, Input, Label, Modal, EmptyState, LoadingSkeleton, Badge } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { useSettings } from '../../hooks'
import { cn } from '../../lib/utils'
import { Plus, Search, Edit, Trash2, Loader2, Save, Globe, Link2, X } from 'lucide-react'
import type { SocialMedia } from '../../lib/types'

export function AdminSocial() {
  const { social, refresh } = useSettings()
  const { success, error: toastError } = useToast()
  const [items, setItems] = useState<SocialMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<SocialMedia | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({ platform: '', url: '', icon: '', is_active: true, sort_order: 0 })

  useEffect(() => { setItems(social); setLoading(false) }, [social])

  const openModal = (item?: SocialMedia) => {
    if (item) {
      setEditingItem(item)
      setFormData({ platform: item.platform, url: item.url, icon: item.icon || '', is_active: item.is_active, sort_order: item.sort_order })
    } else {
      setEditingItem(null)
      setFormData({ platform: '', url: '', icon: '', is_active: true, sort_order: 0 })
    }
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditingItem(null) }

  const handleSubmit = async () => {
    setSaving(true)
    if (editingItem) {
      await supabase.from('social_media').update(formData).eq('id', editingItem.id)
    } else {
      await supabase.from('social_media').insert(formData)
    }
    success(editingItem ? 'تم تحديث الرابط' : 'تم إضافة الرابط')
    closeModal()
    refresh()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الرابط؟')) return
    await supabase.from('social_media').delete().eq('id', id)
    success('تم حذف الرابط')
    refresh()
  }

  if (loading) return <LoadingSkeleton variant="list" count={5} />

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden">
      <PageHeader title="وسائل التواصل الاجتماعي" actions={<Button onClick={() => openModal()} variant="gold"><Plus className="h-4 w-4" /> إضافة رابط</Button>} />
      <div className="bg-white rounded-2xl border border-primary-200">
        {items.length > 0 ? (
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full min-w-[600px]">
              <thead className="bg-primary-50">
                <tr className="text-right">
                  <th className="p-4 font-medium text-primary-500">المنصة</th>
                  <th className="p-4 font-medium text-primary-500">الرابط</th>
                  <th className="p-4 font-medium text-primary-500">الأيقونة</th>
                  <th className="p-4 font-medium text-primary-500">الحالة</th>
                  <th className="p-4 font-medium text-primary-500">الترتيب</th>
                  <th className="p-4 font-medium text-primary-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100">
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="p-4 font-medium text-primary-900">{item.platform}</td>
                    <td className="p-4"><a href={item.url} target="_blank" rel="noopener" className="text-gold hover:underline truncate max-w-[200px] block">{item.url}</a></td>
                    <td className="p-4 text-primary-500">{item.icon || '—'}</td>
                    <td className="p-4"><span className={cn('badge', item.is_active ? 'badge-success' : 'badge-neutral')}>{item.is_active ? 'نشط' : 'غير نشط'}</span></td>
                    <td className="p-4 text-primary-500">{item.sort_order}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button onClick={() => openModal(item)} variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                        <Button onClick={() => handleDelete(item.id)} variant="danger" size="sm"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<Globe className="h-12 w-12" />} title="لا توجد روابط تواصل" description="أضف روابط حسابات المتجر على وسائل التواصل" action={<Button onClick={() => openModal()} variant="gold">إضافة رابط</Button>} />
        )}
      </div>

      <Modal open={showModal} onClose={closeModal} title={editingItem ? 'تعديل الرابط' : 'إضافة رابط تواصل'} size="lg">
        <form onSubmit={e => { e.preventDefault(); handleSubmit() }} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full max-w-full">
            <div><Label>المنصة (مثل: Twitter, Instagram, Snapchat)</Label><Input value={formData.platform} onChange={e => setFormData({ ...formData, platform: e.target.value })} required /></div>
            <div><Label>الأيقونة (emoji أو اسم الأيقونة)</Label><Input value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} placeholder="🐦 أو twitter" /></div>
          </div>
          <div><Label>الرابط *</Label><Input value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} placeholder="https://twitter.com/yourstore" required /></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full max-w-full">
            <div><Label>الترتيب</Label><Input type="number" value={formData.sort_order} onChange={e => setFormData({ ...formData, sort_order: Number(e.target.value) })} /></div>
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