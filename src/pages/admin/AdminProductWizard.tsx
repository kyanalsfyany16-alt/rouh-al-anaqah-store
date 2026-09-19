import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/admin'
import { Button, Input, Label, Select, ImageUploader } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { cn, slugify } from '../../lib/utils'
import { Plus, Trash2, Tag, Box, Image as ImageIcon, Package, ChevronLeft, ChevronRight, Save, X } from 'lucide-react'
import type { Category, Brand, CategoryAttribute, ProductVariant } from '../../lib/types'

const steps = [
  { id: 'info', label: 'معلومات أساسية' },
  { id: 'category', label: 'الفئة والعلامة' },
  { id: 'pricing', label: 'التسعير' },
  { id: 'inventory', label: 'المخزون' },
  { id: 'images', label: 'الصور' },
  { id: 'attributes', label: 'السمات' },
  { id: 'variants', label: 'المتغيرات' },
]

interface VariantForm {
  id?: string
  name: string
  sku: string
  price: number
  stock: number
  image_url: string
  attributes: Record<string, string>
}

interface AttributeValue {
  attribute_id: string
  value_text: string | null
  value_number: string
  value_boolean: boolean
  value_date: string
  value_image: string | null
}

export function AdminProductWizard() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()

  const [currentStep, setCurrentStep] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [categoryAttrs, setCategoryAttrs] = useState<CategoryAttribute[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEdit)

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    price: '' as string,
    discount_price: '' as string,
    tax_rate: '0',
    sku: '',
    barcode: '',
    stock: '0',
    min_stock: '0',
    low_stock_threshold: '5',
    category_id: '',
    brand_id: '',
    currency_code: 'SAR',
    is_featured: false,
    is_published: true,
    is_returnable: false,
    is_new_arrival: false,
    is_best_seller: false,
  })

  const [images, setImages] = useState<string[]>([])
  const [variants, setVariants] = useState<VariantForm[]>([])
  const [attrValues, setAttrValues] = useState<Record<string, AttributeValue>>({})

  useEffect(() => {
    loadMeta()
  }, [])

  useEffect(() => {
    if (isEdit && id) loadProduct(id)
  }, [id])

  useEffect(() => {
    if (form.category_id) loadCategoryAttributes(form.category_id)
    else setCategoryAttrs([])
  }, [form.category_id])

  const loadMeta = async () => {
    const [{ data: cats }, { data: brs }] = await Promise.all([
      supabase.from('categories').select('id,name,slug').eq('is_active', true).order('name'),
      supabase.from('brands').select('id,name,slug').eq('is_active', true).order('name'),
    ])
    setCategories((cats as Category[]) ?? [])
    setBrands((brs as Brand[]) ?? [])
    setLoading(false)
  }

  const loadCategoryAttributes = async (catId: string) => {
    const { data } = await supabase.from('category_attributes').select('*').eq('category_id', catId).order('sort_order')
    const attrs = (data as CategoryAttribute[]) ?? []
    setCategoryAttrs(attrs)
    // Preserve existing values if editing, otherwise init
    setAttrValues((prev) => {
      const next: Record<string, AttributeValue> = { ...prev }
      for (const a of attrs) {
        if (!next[a.id]) {
          next[a.id] = { attribute_id: a.id, value_text: '', value_number: '', value_boolean: false, value_date: '', value_image: null }
        }
      }
      // Remove values for attrs no longer in category
      for (const key of Object.keys(next)) {
        if (!attrs.find((x) => x.id === key)) delete next[key]
      }
      return next
    })
  }

  const loadProduct = async (pid: string) => {
    setInitialLoading(true)
    const { data: prod, error } = await supabase.from('products').select('*').eq('id', pid).single()
    if (error || !prod) {
      toastError('لم يتم العثور على المنتج')
      navigate('/admin/products')
      return
    }
    setForm({
      name: prod.name ?? '',
      slug: prod.slug ?? '',
      description: prod.description ?? '',
      short_description: prod.short_description ?? '',
      price: String(prod.price ?? ''),
      discount_price: prod.discount_price != null ? String(prod.discount_price) : '',
      tax_rate: String(prod.tax_rate ?? '0'),
      sku: prod.sku ?? '',
      barcode: prod.barcode ?? '',
      stock: String(prod.stock ?? '0'),
      min_stock: String(prod.min_stock ?? '0'),
      low_stock_threshold: String(prod.low_stock_threshold ?? '5'),
      category_id: prod.category_id ?? '',
      brand_id: prod.brand_id ?? '',
      currency_code: prod.currency_code ?? 'SAR',
      is_featured: !!prod.is_featured,
      is_published: !!prod.is_published,
      is_returnable: !!prod.is_returnable,
      is_new_arrival: !!prod.is_new_arrival,
      is_best_seller: !!prod.is_best_seller,
    })
    const imgs: string[] = Array.isArray(prod.images) ? prod.images : []
    setImages(imgs)

    // Load variants
    const { data: vars } = await supabase.from('product_variants').select('*').eq('product_id', pid).order('sort_order')
    if (vars) {
      setVariants(
        vars.map((v: ProductVariant) => ({
          id: v.id,
          name: v.name,
          sku: v.sku ?? '',
          price: Number(v.price),
          stock: v.stock,
          image_url: v.image_url ?? '',
          attributes: (v.attributes as Record<string, string>) ?? {},
        }))
      )
    }

    // Load attribute values
    const { data: pav } = await supabase.from('product_attribute_values').select('*').eq('product_id', pid)
    if (pav) {
      const map: Record<string, AttributeValue> = {}
      for (const r of pav as Array<Record<string, unknown>>) {
        const aid = r.attribute_id as string
        map[aid] = {
          attribute_id: aid,
          value_text: (r.value_text as string) ?? '',
          value_number: r.value_number != null ? String(r.value_number) : '',
          value_boolean: !!r.value_boolean,
          value_date: (r.value_date as string) ?? '',
          value_image: (r.value_image as string) ?? null,
        }
      }
      setAttrValues(map)
    }

    // Also need product_images table sync: if product_images has data, prefer it? Already images array covers.

    setInitialLoading(false)
  }

  const updateForm = (k: keyof typeof form, v: string | boolean) => setForm((prev) => ({ ...prev, [k]: v }))

  const validateStep = (): string | null => {
    if (currentStep === 0) {
      if (!form.name.trim()) return 'اسم المنتج مطلوب'
      if (!form.slug.trim() && !slugify(form.name)) return 'الرابط مطلوب'
    }
    if (currentStep === 1) {
      if (!form.category_id) return 'اختر الفئة'
    }
    if (currentStep === 2) {
      const p = Number(form.price)
      if (isNaN(p) || p < 0) return 'السعر غير صالح'
      if (form.discount_price) {
        const d = Number(form.discount_price)
        if (isNaN(d) || d < 0) return 'سعر الخصم غير صالح'
        if (d >= p) return 'سعر الخصم يجب أن يكون أقل من السعر الأساسي'
      }
    }
    if (currentStep === 3) {
      if (isNaN(Number(form.stock)) || Number(form.stock) < 0) return 'المخزون غير صالح'
    }
    return null
  }

  const next = () => {
    const err = validateStep()
    if (err) return toastError(err)
    if (currentStep < steps.length - 1) setCurrentStep((s) => s + 1)
  }
  const prev = () => setCurrentStep((s) => Math.max(0, s - 1))

  const handleAddVariant = () => {
    setVariants((prev) => [...prev, { name: '', sku: '', price: 0, stock: 0, image_url: '', attributes: {} }])
  }
  const updateVariant = (idx: number, patch: Partial<VariantForm>) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, ...patch } : v)))
  }
  const removeVariant = (idx: number) => setVariants((prev) => prev.filter((_, i) => i !== idx))

  const handleSubmit = async () => {
    // Final validation
    if (!form.name.trim()) return toastError('اسم المنتج مطلوب')
    const finalSlug = form.slug.trim() || slugify(form.name)
    if (!finalSlug) return toastError('الرابط غير صالح')
    const priceNum = Number(form.price)
    if (isNaN(priceNum) || priceNum < 0) return toastError('السعر غير صالح')
    const discountNum = form.discount_price ? Number(form.discount_price) : null
    if (discountNum != null && (isNaN(discountNum) || discountNum < 0 || discountNum >= priceNum)) return toastError('سعر الخصم يجب أن يكون أقل من السعر')
    if (!form.category_id) return toastError('الفئة مطلوبة')

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        slug: finalSlug,
        description: form.description || null,
        short_description: form.short_description || null,
        price: priceNum,
        discount_price: discountNum,
        tax_rate: Number(form.tax_rate) || 0,
        sku: form.sku?.trim() || null,
        barcode: form.barcode?.trim() || null,
        stock: parseInt(form.stock || '0', 10),
        min_stock: parseInt(form.min_stock || '0', 10),
        low_stock_threshold: parseInt(form.low_stock_threshold || '5', 10),
        category_id: form.category_id || null,
        brand_id: form.brand_id || null,
        currency_code: form.currency_code || 'SAR',
        is_featured: form.is_featured,
        is_published: form.is_published,
        is_returnable: form.is_returnable,
        is_new_arrival: form.is_new_arrival,
        is_best_seller: form.is_best_seller,
        images: images,
      }

      let productId = id

      if (isEdit && productId) {
        const { error } = await supabase.from('products').update(payload).eq('id', productId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('products').insert(payload).select('id').single()
        if (error) throw error
        productId = (data as { id: string }).id
      }

      // Sync product_images table
      // For simplicity: delete existing and re-insert
      if (productId) {
        await supabase.from('product_images').delete().eq('product_id', productId)
        if (images.length) {
          const rows = images.map((url, idx) => {
            const storage_path = url.split('/product-images/')[1] ?? url
            return { product_id: productId!, storage_path, public_url: url, sort_order: idx }
          })
          const { error: imgErr } = await supabase.from('product_images').insert(rows)
          if (imgErr) console.warn('product_images insert failed', imgErr.message)
        }

        // Sync variants: delete old, insert new (simpler than diff)
        const { data: existingVars } = await supabase.from('product_variants').select('id').eq('product_id', productId)
        if (existingVars?.length) {
          await supabase.from('product_variants').delete().eq('product_id', productId)
        }
        if (variants.length) {
          const vRows = variants.map((v, idx) => ({
            product_id: productId!,
            name: v.name || `متغير ${idx + 1}`,
            sku: v.sku || null,
            price: Number(v.price) || 0,
            stock: parseInt(String(v.stock) || '0', 10),
            image_url: v.image_url || null,
            attributes: v.attributes || {},
            is_active: true,
            sort_order: idx,
          }))
          const { error: varErr } = await supabase.from('product_variants').insert(vRows)
          if (varErr) throw varErr
        }

        // Sync attribute values
        // Delete existing then insert
        await supabase.from('product_attribute_values').delete().eq('product_id', productId)
        const avRows: Array<Record<string, unknown>> = []
        for (const attr of categoryAttrs) {
          const val = attrValues[attr.id]
          if (!val) continue
          // Only insert if has any value
          const hasValue = val.value_text || val.value_number || val.value_boolean || val.value_date || val.value_image
          if (!hasValue && !attr.is_required) continue
          avRows.push({
            product_id: productId,
            attribute_id: attr.id,
            value_text: val.value_text || null,
            value_number: val.value_number ? Number(val.value_number) : null,
            value_boolean: val.value_boolean ?? null,
            value_date: val.value_date || null,
            value_image: val.value_image || null,
          })
        }
        if (avRows.length) {
          const { error: avErr } = await supabase.from('product_attribute_values').insert(avRows)
          if (avErr) throw avErr
        }
      }

      success(isEdit ? 'تم تحديث المنتج' : 'تم إنشاء المنتج')
      navigate('/admin/products')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'فشل حفظ المنتج'
      // Handle unique violations
      if (msg.includes('duplicate') || msg.includes('23505') || msg.includes('products_slug') || msg.includes('products_sku')) {
        toastError('الرابط أو SKU مكرر — يرجى تغييره')
      } else toastError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading || initialLoading) {
    return (
      <div className="max-w-4xl animate-pulse">
        <div className="h-8 w-48 skeleton rounded mb-6" />
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <PageHeader title={isEdit ? 'تعديل المنتج' : 'إضافة منتج جديد'} description={isEdit ? 'تحديث بيانات المنتج' : 'إنشاء منتج جديد'} backHref="/admin/products" />

      <div className="bg-white rounded-2xl border border-primary-200 p-4 mb-6">
        <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setCurrentStep(i)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border',
                  i === currentStep ? 'bg-gold text-primary-950 border-gold' : i < currentStep ? 'bg-primary-900 text-white border-primary-900' : 'bg-white text-primary-500 border-primary-200'
                )}
              >
                {i + 1}. {s.label}
              </button>
              {i < steps.length - 1 && <div className={cn('w-6 h-0.5', i < currentStep ? 'bg-primary-900' : 'bg-primary-200')} />}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-primary-200 p-6">
        {/* Step 0: Basic */}
        {currentStep === 0 && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>اسم المنتج *</Label>
                <Input value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="مثال: قميص رجالي فاخر" />
              </div>
              <div>
                <Label>الرابط (Slug)</Label>
                <Input value={form.slug} onChange={(e) => updateForm('slug', e.target.value)} placeholder={slugify(form.name) || 'shirt-luxe'} />
                <p className="text-xs text-primary-400 mt-1">يُنشأ تلقائياً من الاسم إذا تُرك فارغاً</p>
              </div>
            </div>
            <div>
              <Label>الوصف الكامل</Label>
              <textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} rows={4} className="textarea" placeholder="وصف تفصيلي..." />
            </div>
            <div>
              <Label>الوصف المختصر</Label>
              <textarea value={form.short_description} onChange={(e) => updateForm('short_description', e.target.value)} rows={2} className="textarea" placeholder="جملة تسويقية قصيرة" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_published} onChange={(e) => updateForm('is_published', e.target.checked)} className="h-4 w-4 rounded border-primary-300 text-gold" />
                <span className="text-sm">منشور</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => updateForm('is_featured', e.target.checked)} className="h-4 w-4 rounded" />
                <span className="text-sm">مميز</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_new_arrival} onChange={(e) => updateForm('is_new_arrival', e.target.checked)} className="h-4 w-4 rounded" />
                <span className="text-sm">وصل حديثاً</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_best_seller} onChange={(e) => updateForm('is_best_seller', e.target.checked)} className="h-4 w-4 rounded" />
                <span className="text-sm">الأكثر مبيعاً</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_returnable} onChange={(e) => updateForm('is_returnable', e.target.checked)} className="h-4 w-4 rounded" />
                <span className="text-sm">قابل للإرجاع</span>
              </label>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>الفئة *</Label>
              <Select value={form.category_id} onChange={(e) => updateForm('category_id', e.target.value)}>
                <option value="">اختر الفئة</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>العلامة التجارية</Label>
              <Select value={form.brand_id} onChange={(e) => updateForm('brand_id', e.target.value)}>
                <option value="">بدون علامة</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>العملة</Label>
              <Select value={form.currency_code} onChange={(e) => updateForm('currency_code', e.target.value)}>
                <option value="SAR">SAR</option>
                <option value="YER">YER</option>
                <option value="USD">USD</option>
                <option value="EGP">EGP</option>
              </Select>
            </div>
            <div>
              <Label>الباركود</Label>
              <Input value={form.barcode} onChange={(e) => updateForm('barcode', e.target.value)} placeholder="اختياري" />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>السعر *</Label>
              <Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => updateForm('price', e.target.value)} />
            </div>
            <div>
              <Label>سعر الخصم</Label>
              <Input type="number" step="0.01" min="0" value={form.discount_price} onChange={(e) => updateForm('discount_price', e.target.value)} placeholder="اختياري" />
            </div>
            <div>
              <Label>الضريبة %</Label>
              <Input type="number" step="0.01" min="0" value={form.tax_rate} onChange={(e) => updateForm('tax_rate', e.target.value)} />
            </div>
            <div>
              <Label>SKU</Label>
              <Input value={form.sku} onChange={(e) => updateForm('sku', e.target.value)} placeholder="مثال: SHIRT-BLK-M-001" />
              <p className="text-xs text-primary-400 mt-1">يجب أن يكون فريداً</p>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>المخزون *</Label>
              <Input type="number" min="0" step="1" value={form.stock} onChange={(e) => updateForm('stock', e.target.value)} />
            </div>
            <div>
              <Label>الحد الأدنى</Label>
              <Input type="number" min="0" step="1" value={form.min_stock} onChange={(e) => updateForm('min_stock', e.target.value)} />
            </div>
            <div>
              <Label>حد التنبيه</Label>
              <Input type="number" min="1" step="1" value={form.low_stock_threshold} onChange={(e) => updateForm('low_stock_threshold', e.target.value)} />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <Label>صور المنتج — متعددة</Label>
            <ImageUploader bucket="product-images" value={images} onChange={setImages} multiple label="اختيار صور المنتج" />
            <p className="text-xs text-primary-400">الصورة الأولى هي الرئيسية. يمكنك حذف أو إضافة صور في أي وقت.</p>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            {!form.category_id ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">اختر الفئة أولاً لعرض سماتها.</div>
            ) : categoryAttrs.length === 0 ? (
              <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl text-primary-600 text-sm">
                لا توجد سمات لهذه الفئة. يمكنك إضافتها من إدارة الفئات.
              </div>
            ) : (
              categoryAttrs.map((attr) => {
                const val = attrValues[attr.id]
                if (!val) return null
                return (
                  <div key={attr.id} className="p-4 border border-primary-200 rounded-xl">
                    <Label>
                      {attr.name} {attr.is_required && <span className="text-danger">*</span>}
                      <span className="text-xs text-primary-400 mr-2">({attr.type})</span>
                    </Label>
                    {attr.type === 'text' && <Input value={val.value_text ?? ''} onChange={(e) => setAttrValues((prev) => ({ ...prev, [attr.id]: { ...val, value_text: e.target.value } }))} />}
                    {attr.type === 'number' && <Input type="number" value={val.value_number} onChange={(e) => setAttrValues((prev) => ({ ...prev, [attr.id]: { ...val, value_number: e.target.value } }))} />}
                    {attr.type === 'select' && (
                      <Select value={val.value_text ?? ''} onChange={(e) => setAttrValues((prev) => ({ ...prev, [attr.id]: { ...val, value_text: e.target.value } }))}>
                        <option value="">اختر</option>
                        {(attr.options as string[]).map((opt: string) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </Select>
                    )}
                    {attr.type === 'boolean' && (
                      <label className="flex items-center gap-2 mt-2">
                        <input type="checkbox" checked={!!val.value_boolean} onChange={(e) => setAttrValues((prev) => ({ ...prev, [attr.id]: { ...val, value_boolean: e.target.checked } }))} className="h-4 w-4" />
                        <span className="text-sm">نعم</span>
                      </label>
                    )}
                    {attr.type === 'date' && <Input type="date" value={val.value_date} onChange={(e) => setAttrValues((prev) => ({ ...prev, [attr.id]: { ...val, value_date: e.target.value } }))} />}
                    {attr.type === 'image' && (
                      <ImageUploader bucket="product-images" value={val.value_image} onChange={(url) => setAttrValues((prev) => ({ ...prev, [attr.id]: { ...val, value_image: url } }))} />
                    )}
                    {attr.type === 'multiselect' && <Input value={val.value_text ?? ''} onChange={(e) => setAttrValues((prev) => ({ ...prev, [attr.id]: { ...val, value_text: e.target.value } }))} placeholder="افصل بفاصلة" />}
                  </div>
                )
              })
            )}
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-primary-900">المتغيرات</h4>
              <Button onClick={handleAddVariant} variant="outline" size="sm">
                <Plus className="h-4 w-4" /> إضافة متغير
              </Button>
            </div>
            {variants.length === 0 ? (
              <div className="p-6 bg-primary-50 border border-dashed border-primary-300 rounded-xl text-center text-primary-500">
                لا يوجد متغيرات. أضف متغيراً مثل: أسود / M
              </div>
            ) : (
              <div className="space-y-4">
                {variants.map((v, idx) => (
                  <div key={idx} className="p-4 border border-primary-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-primary-700">متغير #{idx + 1}</span>
                      <button onClick={() => removeVariant(idx)} className="p-1 text-danger hover:bg-red-50 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label>الاسم</Label>
                        <Input value={v.name} onChange={(e) => updateVariant(idx, { name: e.target.value })} placeholder="أسود / M" />
                      </div>
                      <div>
                        <Label>SKU</Label>
                        <Input value={v.sku} onChange={(e) => updateVariant(idx, { sku: e.target.value })} placeholder="SHIRT-BLK-M" />
                      </div>
                      <div>
                        <Label>السعر</Label>
                        <Input type="number" step="0.01" min="0" value={String(v.price)} onChange={(e) => updateVariant(idx, { price: Number(e.target.value) })} />
                      </div>
                      <div>
                        <Label>المخزون</Label>
                        <Input type="number" min="0" step="1" value={String(v.stock)} onChange={(e) => updateVariant(idx, { stock: Number(e.target.value) })} />
                      </div>
                      <div className="sm:col-span-2">
                        <Label>صورة المتغير</Label>
                        <ImageUploader bucket="product-images" value={v.image_url} onChange={(url) => updateVariant(idx, { image_url: url ?? '' })} />
                      </div>
                      <div className="sm:col-span-2">
                        <Label>خصائص (JSON بسيط: اللون=أسود, المقاس=M)</Label>
                        <Input
                          value={Object.entries(v.attributes)
                            .map(([k, val]) => `${k}=${val}`)
                            .join(', ')}
                          onChange={(e) => {
                            const entries = e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean)
                              .map((s) => s.split('='))
                            const obj: Record<string, string> = {}
                            for (const [k, val] of entries) if (k && val) obj[k.trim()] = val.trim()
                            updateVariant(idx, { attributes: obj })
                          }}
                          placeholder="اللون=أسود, المقاس=M"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between gap-3 mt-8 pt-6 border-t border-primary-200">
          <Button onClick={prev} variant="outline" disabled={currentStep === 0}>
            <ChevronRight className="h-4 w-4" /> السابق
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button onClick={next} variant="gold">
              التالي <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={saving} variant="gold">
              <Save className="h-4 w-4" /> {isEdit ? 'تحديث المنتج' : 'حفظ المنتج'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
