import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PageHeader, SearchInput, ConfirmDialog } from '../../components/admin'
import { Button, Input, Label, Select, Modal, EmptyState, LoadingSkeleton, ImageUploader } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { cn } from '../../lib/utils'
import { Plus, Edit, Trash2, Tag, Save, Settings2, X } from 'lucide-react'
import type { Category, CategoryAttribute } from '../../lib/types'

export function AdminCategories() {
  const { success, error: toastError } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [filtered, setFiltered] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [formData, setFormData] = useState({ name: '', slug: '', description: '', parent_id: '', is_active: true, sort_order: 0, image_url: '' })

  // Attributes
  const [attrCategory, setAttrCategory] = useState<Category | null>(null)
  const [attrs, setAttrs] = useState<CategoryAttribute[]>([])
  const [attrLoading, setAttrLoading] = useState(false)
  const [showAttrModal, setShowAttrModal] = useState(false)
  const [editingAttr, setEditingAttr] = useState<CategoryAttribute | null>(null)
  const [attrForm, setAttrForm] = useState({ name: '', slug: '', type: 'text', options: '', is_required: false, sort_order: 0 })

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (!search.trim()) setFiltered(categories)
    else {
      const term = search.trim().toLowerCase()
      setFiltered(categories.filter((c) => c.name.toLowerCase().includes(term) || c.slug.toLowerCase().includes(term)))
    }
  }, [search, categories])

  const loadCategories = async () => {
    setLoading(true)
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    setCategories((data as Category[]) ?? [])
    setLoading(false)
  }

  const openModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat)
      setFormData({ name: cat.name, slug: cat.slug, description: cat.description || '', parent_id: cat.parent_id || '', is_active: cat.is_active, sort_order: cat.sort_order, image_url: cat.image_url || '' })
    } else {
      setEditingCategory(null)
      setFormData({ name: '', slug: '', description: '', parent_id: '', is_active: true, sort_order: 0, image_url: '' })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCategory(null)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) return toastError('الاسم مطلوب')
    setSaving(true)
    const payload = { name: formData.name.trim(), slug: (formData.slug || formData.name).trim(), description: formData.description || null, parent_id: formData.parent_id || null, is_active: formData.is_active, sort_order: Number(formData.sort_order) || 0, image_url: formData.image_url || null }
    let error
    if (editingCategory) {
      const { error: e } = await supabase.from('categories').update(payload).eq('id', editingCategory.id)
      error = e
    } else {
      const { error: e } = await supabase.from('categories').insert(payload)
      error = e
    }
    if (error) toastError(error.message)
    else {
      success(editingCategory ? 'تم تحديث الفئة' : 'تم إضافة الفئة')
      closeModal()
      loadCategories()
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const cat = categories.find((c) => c.id === deleteId)
    if (cat?.image_url) {
      const marker = '/object/public/category-images/'
      const idx = cat.image_url.indexOf(marker)
      if (idx !== -1) {
        const p = cat.image_url.substring(idx + marker.length)
        await supabase.storage.from('category-images').remove([p])
      }
    }
    const { error } = await supabase.from('categories').delete().eq('id', deleteId)
    if (error) toastError(error.message)
    else {
      success('تم حذف الفئة')
      setDeleteId(null)
      loadCategories()
    }
  }

  // Attributes
  const openAttrs = async (cat: Category) => {
    setAttrCategory(cat)
    setAttrLoading(true)
    const { data } = await supabase.from('category_attributes').select('*').eq('category_id', cat.id).order('sort_order')
    setAttrs((data as CategoryAttribute[]) ?? [])
    setAttrLoading(false)
  }

  const openAttrModal = (attr?: CategoryAttribute) => {
    if (attr) {
      setEditingAttr(attr)
      setAttrForm({ name: attr.name, slug: attr.slug, type: attr.type, options: Array.isArray(attr.options) ? (attr.options as string[]).join(', ') : '', is_required: attr.is_required, sort_order: attr.sort_order })
    } else {
      setEditingAttr(null)
      setAttrForm({ name: '', slug: '', type: 'text', options: '', is_required: false, sort_order: 0 })
    }
    setShowAttrModal(true)
  }

  const handleAttrSubmit = async () => {
    if (!attrCategory) return
    if (!attrForm.name.trim() || !attrForm.slug.trim()) return toastError('الاسم والرابط مطلوبان')
    const options = attrForm.options
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const payload = {
      category_id: attrCategory.id,
      name: attrForm.name.trim(),
      slug: attrForm.slug.trim(),
      type: attrForm.type,
      options: options as unknown as string[],
      is_required: attrForm.is_required,
      sort_order: Number(attrForm.sort_order) || 0,
    }
    let error
    if (editingAttr) {
      const { error: e } = await supabase.from('category_attributes').update(payload).eq('id', editingAttr.id)
      error = e
    } else {
      const { error: e } = await supabase.from('category_attributes').insert(payload)
      error = e
    }
    if (error) toastError(error.message)
    else {
      success(editingAttr ? 'تم تحديث السمة' : 'تمت إضافة السمة')
      setShowAttrModal(false)
      setEditingAttr(null)
      openAttrs(attrCategory)
    }
  }

  const handleAttrDelete = async (id: string) => {
    if (!confirm('حذف السمة؟')) return
    const { error } = await supabase.from('category_attributes').delete().eq('id', id)
    if (error) toastError(error.message)
    else {
      success('تم حذف السمة')
      if (attrCategory) openAttrs(attrCategory)
    }
  }

  if (loading) return <LoadingSkeleton variant="list" count={5} />

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden">
      <PageHeader
        title="إدارة الفئات"
        description={`${categories.length} فئة`}
        actions={
          <Button onClick={() => openModal()} variant="gold" className="w-full sm:w-auto">
            <Plus className="h-4 w-4" /> إضافة فئة
          </Button>
        }
      />

      <div className="bg-white rounded-2xl border border-primary-200 p-3 sm:p-4 mb-4 w-full max-w-full overflow-hidden">
        <SearchInput value={search} onChange={setSearch} placeholder="بحث بالاسم أو الرابط..." />
      </div>

      <div className="bg-white rounded-2xl border border-primary-200 overflow-hidden w-full max-w-full">
        {filtered.length ? (
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full min-w-[600px]">
              <thead className="bg-primary-50">
                <tr className="text-right">
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">الصورة</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">الاسم</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">الرابط</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">الأب</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">الحالة</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100">
                {filtered.map((cat) => (
                  <tr key={cat.id} className="hover:bg-primary-50/50">
                    <td className="px-4 py-3">
                      <img src={cat.image_url || '/placeholder.svg'} alt="" className="w-12 h-12 rounded-xl object-cover border border-primary-200" />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-primary-900 text-sm">{cat.name}</p>
                      <button onClick={() => openAttrs(cat)} className="text-xs text-gold hover:underline inline-flex items-center gap-1">
                        <Settings2 className="h-3 w-3" /> إدارة السمات
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-primary-500">{cat.slug}</td>
                    <td className="px-4 py-3 text-sm text-primary-500">{categories.find((p) => p.id === cat.parent_id)?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('badge', cat.is_active ? 'badge-success' : 'badge-neutral')}>{cat.is_active ? 'نشط' : 'غير نشط'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button onClick={() => openModal(cat)} variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => setDeleteId(cat.id)} variant="ghost" size="sm" className="text-danger hover:bg-red-50">
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
              title="لا توجد فئات"
              description={search ? 'لا نتائج للبحث' : 'ابدأ بإضافة أول فئة لتنظيم منتجاتك'}
              action={
                !search ? (
                  <Button onClick={() => openModal()} variant="gold">
                    إضافة فئة
                  </Button>
                ) : undefined
              }
            />
          </div>
        )}
      </div>

      {/* Category modal */}
      <Modal open={showModal} onClose={closeModal} title={editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'} size="lg" footer={
        <>
          <Button type="button" onClick={closeModal} variant="outline">
            إلغاء
          </Button>
          <Button type="button" onClick={handleSubmit} loading={saving} variant="gold">
            <Save className="h-4 w-4" /> حفظ
          </Button>
        </>
      }>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
          className="space-y-4 w-full max-w-full min-w-0"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full max-w-full">
            <div className="min-w-0">
              <Label>الاسم *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="min-w-0">
              <Label>الرابط (Slug)</Label>
              <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="يُنشأ من الاسم" />
            </div>
          </div>
          <div className="min-w-0">
            <Label>الوصف</Label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="textarea w-full max-w-full" rows={3} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full max-w-full">
            <div className="min-w-0">
              <Label>الفئة الأب</Label>
              <Select value={formData.parent_id} onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}>
                <option value="">لا يوجد (فئة رئيسية)</option>
                {categories
                  .filter((c) => c.id !== editingCategory?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </Select>
            </div>
            <div className="min-w-0">
              <Label>الترتيب</Label>
              <Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })} />
            </div>
          </div>
          <div className="min-w-0 w-full max-w-full">
            <Label>صورة الفئة</Label>
            <ImageUploader bucket="category-images" value={formData.image_url} onChange={(url) => setFormData({ ...formData, image_url: url || '' })} />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="h-4 w-4 rounded border-primary-300 text-gold" />
            <span className="text-sm">نشط</span>
          </label>
        </form>
      </Modal>

      {/* Attributes drawer/modal */}
      <Modal open={!!attrCategory} onClose={() => setAttrCategory(null)} title={`سمات الفئة: ${attrCategory?.name ?? ''}`} size="lg">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-primary-500">السمات تختلف حسب الفئة (مثال: الملابس → اللون/المقاس)</p>
            <Button onClick={() => openAttrModal()} variant="gold" size="sm">
              <Plus className="h-4 w-4" /> إضافة سمة
            </Button>
          </div>
          {attrLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 skeleton rounded-xl" />
              ))}
            </div>
          ) : attrs.length ? (
            <div className="space-y-2">
              {attrs.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 border border-primary-200 rounded-xl">
                  <div>
                    <p className="font-medium text-primary-900 text-sm">
                      {a.name} <span className="text-xs text-primary-400">({a.slug})</span>
                    </p>
                    <p className="text-xs text-primary-500">
                      {a.type} {a.is_required ? '• مطلوب' : ''} {Array.isArray(a.options) && a.options.length ? `• ${a.options.join(', ')}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button onClick={() => openAttrModal(a)} variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => handleAttrDelete(a.id)} variant="ghost" size="sm" className="text-danger">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-primary-500 py-6">لا توجد سمات لهذه الفئة</p>
          )}
        </div>
      </Modal>

      <Modal open={showAttrModal} onClose={() => { setShowAttrModal(false); setEditingAttr(null) }} title={editingAttr ? 'تعديل سمة' : 'إضافة سمة'} size="lg" footer={
        <>
          <Button type="button" onClick={() => { setShowAttrModal(false); setEditingAttr(null) }} variant="outline">
            إلغاء
          </Button>
          <Button type="button" onClick={handleAttrSubmit} variant="gold">
            حفظ
          </Button>
        </>
      }>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleAttrSubmit()
          }}
          className="space-y-4 w-full max-w-full min-w-0"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full max-w-full">
            <div className="min-w-0">
              <Label>الاسم *</Label>
              <Input value={attrForm.name} onChange={(e) => setAttrForm({ ...attrForm, name: e.target.value })} placeholder="اللون" required />
            </div>
            <div className="min-w-0">
              <Label>الرابط *</Label>
              <Input value={attrForm.slug} onChange={(e) => setAttrForm({ ...attrForm, slug: e.target.value })} placeholder="color" required />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full max-w-full">
            <div className="min-w-0">
              <Label>النوع</Label>
              <Select value={attrForm.type} onChange={(e) => setAttrForm({ ...attrForm, type: e.target.value })}>
                <option value="text">نص</option>
                <option value="number">رقم</option>
                <option value="select">اختيار</option>
                <option value="multiselect">اختيار متعدد</option>
                <option value="boolean">نعم/لا</option>
                <option value="date">تاريخ</option>
                <option value="image">صورة</option>
              </Select>
            </div>
            <div className="min-w-0">
              <Label>الترتيب</Label>
              <Input type="number" value={attrForm.sort_order} onChange={(e) => setAttrForm({ ...attrForm, sort_order: Number(e.target.value) })} />
            </div>
          </div>
          {(attrForm.type === 'select' || attrForm.type === 'multiselect') && (
            <div className="min-w-0">
              <Label>الخيارات (افصل بفاصلة)</Label>
              <Input value={attrForm.options} onChange={(e) => setAttrForm({ ...attrForm, options: e.target.value })} placeholder="أسود, أبيض, بيج" />
            </div>
          )}
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={attrForm.is_required} onChange={(e) => setAttrForm({ ...attrForm, is_required: e.target.checked })} className="h-4 w-4 rounded" />
            <span className="text-sm">مطلوب</span>
          </label>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="حذف الفئة" description="سيتم حذف الفئة. إذا كانت هناك منتجات مرتبطة سيتم فصلها." confirmLabel="حذف" variant="danger" />
    </div>
  )
}
