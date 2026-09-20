import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PageHeader, SearchInput, ConfirmDialog } from '../../components/admin'
import { Button, Input, Label, Modal, EmptyState, LoadingSkeleton, ImageUploader } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { cn } from '../../lib/utils'
import { Plus, Edit, Trash2, Tag, Save } from 'lucide-react'
import type { Brand } from '../../lib/types'

export function AdminBrands() {
  const { success, error: toastError } = useToast()
  const [brands, setBrands] = useState<Brand[]>([])
  const [filtered, setFiltered] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [formData, setFormData] = useState({ name: '', slug: '', description: '', logo_url: '', is_active: true })

  useEffect(() => {
    loadBrands()
  }, [])

  useEffect(() => {
    if (!search.trim()) setFiltered(brands)
    else {
      const term = search.trim().toLowerCase()
      setFiltered(brands.filter((b) => b.name.toLowerCase().includes(term) || b.slug.toLowerCase().includes(term)))
    }
  }, [search, brands])

  const loadBrands = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('brands').select('*').order('created_at', { ascending: false })
    if (error) toastError(error.message)
    else setBrands((data as Brand[]) ?? [])
    setLoading(false)
  }

  const openModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand)
      setFormData({ name: brand.name, slug: brand.slug, description: brand.description || '', logo_url: brand.logo_url || '', is_active: brand.is_active })
    } else {
      setEditingBrand(null)
      setFormData({ name: '', slug: '', description: '', logo_url: '', is_active: true })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingBrand(null)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) return toastError('الاسم مطلوب')
    setSaving(true)
    const payload = { name: formData.name.trim(), slug: (formData.slug || formData.name).trim(), description: formData.description || null, logo_url: formData.logo_url || null, is_active: formData.is_active }
    let error
    if (editingBrand) {
      const { error: e } = await supabase.from('brands').update(payload).eq('id', editingBrand.id)
      error = e
    } else {
      const { error: e } = await supabase.from('brands').insert(payload)
      error = e
    }
    if (error) toastError(error.message)
    else {
      success(editingBrand ? 'تم تحديث العلامة التجارية' : 'تم إضافة العلامة التجارية')
      closeModal()
      loadBrands()
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const br = brands.find((b) => b.id === deleteId)
    if (br?.logo_url) {
      const marker = '/object/public/brand-images/'
      const idx = br.logo_url.indexOf(marker)
      if (idx !== -1) {
        const p = br.logo_url.substring(idx + marker.length)
        await supabase.storage.from('brand-images').remove([p])
      }
    }
    const { error } = await supabase.from('brands').delete().eq('id', deleteId)
    if (error) toastError(error.message)
    else {
      success('تم حذف العلامة التجارية')
      setDeleteId(null)
      loadBrands()
    }
  }

  if (loading) return <LoadingSkeleton variant="list" count={5} />

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden">
      <PageHeader
        title="إدارة العلامات التجارية"
        description={`${brands.length} علامة`}
        actions={
          <Button onClick={() => openModal()} variant="gold">
            <Plus className="h-4 w-4" /> إضافة علامة تجارية
          </Button>
        }
      />

      <div className="bg-white rounded-2xl border border-primary-200 p-3 sm:p-4 mb-4 w-full max-w-full">
        <SearchInput value={search} onChange={setSearch} placeholder="بحث بالاسم أو الرابط..." />
      </div>

      <div className="bg-white rounded-2xl border border-primary-200 overflow-hidden w-full max-w-full">
        {filtered.length ? (
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full min-w-[600px]">
              <thead className="bg-primary-50">
                <tr className="text-right">
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">الشعار</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">الاسم</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">الرابط</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">الحالة</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100">
                {filtered.map((brand) => (
                  <tr key={brand.id} className="hover:bg-primary-50/50">
                    <td className="px-4 py-3">
                      <img src={brand.logo_url || '/placeholder.svg'} alt="" className="w-12 h-12 rounded-xl object-contain bg-primary-50 border border-primary-200" />
                    </td>
                    <td className="px-4 py-3 font-medium text-primary-900 text-sm">{brand.name}</td>
                    <td className="px-4 py-3 text-sm text-primary-500">{brand.slug}</td>
                    <td className="px-4 py-3">
                      <span className={cn('badge', brand.is_active ? 'badge-success' : 'badge-neutral')}>{brand.is_active ? 'نشط' : 'غير نشط'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button onClick={() => openModal(brand)} variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => setDeleteId(brand.id)} variant="ghost" size="sm" className="text-danger hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <EmptyState
              icon={<Tag className="h-12 w-12" />}
              title="لا توجد علامات تجارية"
              description={search ? 'لا نتائج للبحث' : 'أضف علامات تجارية لمنتجاتك'}
              action={
                !search ? (
                  <Button onClick={() => openModal()} variant="gold">
                    إضافة علامة تجارية
                  </Button>
                ) : undefined
              }
            />
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={closeModal} title={editingBrand ? 'تعديل العلامة التجارية' : 'إضافة علامة تجارية جديدة'} size="lg">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full max-w-full">
            <div>
              <Label>الاسم *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div>
              <Label>الرابط (Slug)</Label>
              <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="يُنشأ من الاسم" />
            </div>
          </div>
          <div>
            <Label>الوصف</Label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="textarea" rows={3} />
          </div>
          <div>
            <Label>الشعار</Label>
            <ImageUploader bucket="brand-images" value={formData.logo_url} onChange={(url) => setFormData({ ...formData, logo_url: url || '' })} />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="h-4 w-4 rounded border-primary-300 text-gold" />
            <span className="text-sm">نشط</span>
          </label>
          <div className="flex justify-end gap-2 pt-4 border-t border-primary-200">
            <Button type="button" onClick={closeModal} variant="outline">
              إلغاء
            </Button>
            <Button type="submit" loading={saving} variant="gold">
              <Save className="h-4 w-4" /> حفظ
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="حذف العلامة التجارية" description="سيتم حذف العلامة وسيتم فصل المنتجات المرتبطة." confirmLabel="حذف" variant="danger" />
    </div>
  )
}
