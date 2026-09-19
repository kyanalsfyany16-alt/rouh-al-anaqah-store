import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/admin'
import { Button, Input, Label, Select, Modal, EmptyState, LoadingSkeleton, Badge, ImageUploader } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { cn } from '../../lib/utils'
import { Plus, Search, Edit, Trash2, Image, Loader2, Save, Eye, ToggleLeft, ToggleRight } from 'lucide-react'
import type { Banner } from '../../lib/types'

export function AdminBanners() {
  const { success, error: toastError } = useToast()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({ title: '', subtitle: '', image_url: '', link_url: '', position: 'home', is_active: true, sort_order: 0 })

  useEffect(() => { loadBanners() }, [])

  const loadBanners = async () => {
    const { data } = await supabase.from('banners').select('*').order('sort_order')
    setBanners(data || [])
    setLoading(false)
  }

  const openModal = (ban?: Banner) => {
    if (ban) {
      setEditingBanner(ban)
      setFormData({ title: ban.title || '', subtitle: ban.subtitle || '', image_url: ban.image_url, link_url: ban.link_url || '', position: ban.position, is_active: ban.is_active, sort_order: ban.sort_order })
    } else {
      setEditingBanner(null)
      setFormData({ title: '', subtitle: '', image_url: '', link_url: '', position: 'home', is_active: true, sort_order: 0 })
    }
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditingBanner(null) }

  const handleSubmit = async () => {
    setSaving(true)
    if (editingBanner) {
      await supabase.from('banners').update(formData).eq('id', editingBanner.id)
    } else {
      await supabase.from('banners').insert(formData)
    }
    success(editingBanner ? 'تم تحديث البانر' : 'تم إضافة البانر')
    closeModal()
    loadBanners()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا البانر؟')) return
    await supabase.from('banners').delete().eq('id', id)
    success('تم حذف البانر')
    loadBanners()
  }

  if (loading) return <LoadingSkeleton variant="list" count={5} />

  return (
    <div>
      <PageHeader title="إدارة البنرات" actions={<Button onClick={() => openModal()} variant="gold"><Plus className="h-4 w-4" /> إضافة بانر</Button>} />
      <div className="bg-white rounded-2xl border border-primary-200">
        {banners.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-50">
                <tr className="text-right">
                  <th className="p-4 font-medium text-primary-500">الصورة</th>
                  <th className="p-4 font-medium text-primary-500">العنوان</th>
                  <th className="p-4 font-medium text-primary-500">الموضع</th>
                  <th className="p-4 font-medium text-primary-500">الحالة</th>
                  <th className="p-4 font-medium text-primary-500">الترتيب</th>
                  <th className="p-4 font-medium text-primary-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100">
                {banners.map(ban => (
                  <tr key={ban.id}>
                    <td className="p-4"><img src={ban.image_url} alt="" className="w-16 h-12 rounded-xl object-cover" /></td>
                    <td className="p-4 font-medium text-primary-900">{ban.title}</td>
                    <td className="p-4 text-primary-500">{ban.position}</td>
                    <td className="p-4"><span className={cn('badge', ban.is_active ? 'badge-success' : 'badge-neutral')}>{ban.is_active ? 'نشط' : 'غير نشط'}</span></td>
                    <td className="p-4 text-primary-500">{ban.sort_order}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button onClick={() => openModal(ban)} variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                        <Button onClick={() => handleDelete(ban.id)} variant="danger" size="sm"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<Image className="h-12 w-12" />} title="لا توجد بنرات" description="أضف بنرات للعروض والإعلانات" action={<Button onClick={() => openModal()} variant="gold">إضافة بانر</Button>} />
        )}
      </div>

      <Modal open={showModal} onClose={closeModal} title={editingBanner ? 'تعديل البانر' : 'إضافة بانر جديد'} size="lg">
        <form onSubmit={e => { e.preventDefault(); handleSubmit() }} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>العنوان</Label><Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
            <div><Label>الوصف الفرعي</Label><Input value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} /></div>
          </div>
          <div><Label>الرابط (اختياري)</Label><Input value={formData.link_url} onChange={e => setFormData({ ...formData, link_url: e.target.value })} placeholder="https://example.com" /></div>
          <div><Label>الصورة *</Label><ImageUploader bucket="banner-images" value={formData.image_url} onChange={url => setFormData({ ...formData, image_url: url || '' })} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>الموضع</Label><Select value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })}><option value="home">الرئيسية</option><option value="shop">المتجر</option><option value="category">الفئة</option><option value="product">المنتج</option></Select></div>
            <div><Label>الترتيب</Label><Input type="number" value={formData.sort_order} onChange={e => setFormData({ ...formData, sort_order: Number(e.target.value) })} /></div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="h-4 w-4 rounded border-primary-300 text-gold focus:ring-gold" />
            <Label htmlFor="is_active" className="mb-0 cursor-pointer">نشط</Label>
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