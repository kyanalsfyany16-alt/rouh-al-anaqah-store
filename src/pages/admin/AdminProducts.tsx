import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { PageHeader, StatusBadge, SearchInput, Pagination, ConfirmDialog } from '../../components/admin'
import { EmptyState } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { cn, formatPrice } from '../../lib/utils'
import { Plus, Edit, Trash2, Package, AlertTriangle } from 'lucide-react'
import type { Product, Category, Brand } from '../../lib/types'

const PAGE_SIZE = 10

export function AdminProducts() {
  const { success, error: toastError } = useToast()
  const [products, setProducts] = useState<(Product & { category: Category | null; brand: Brand | null })[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterBrand, setFilterBrand] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadFilters()
  }, [])

  useEffect(() => {
    loadProducts()
  }, [page, search, filterCategory, filterBrand, filterStatus])

  const loadFilters = async () => {
    const [{ data: cats }, { data: brs }] = await Promise.all([
      supabase.from('categories').select('id,name,slug').order('name'),
      supabase.from('brands').select('id,name,slug').order('name'),
    ])
    setCategories((cats as Category[]) ?? [])
    setBrands((brs as Brand[]) ?? [])
  }

  const loadProducts = async () => {
    setLoading(true)
    let query = supabase
      .from('products')
      .select('*, category:categories(id,name,slug), brand:brands(id,name,slug)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (search.trim()) {
      const term = `%${search.trim()}%`
      query = query.or(`name.ilike.${term},slug.ilike.${term},sku.ilike.${term}`)
    }
    if (filterCategory) query = query.eq('category_id', filterCategory)
    if (filterBrand) query = query.eq('brand_id', filterBrand)
    if (filterStatus === 'published') query = query.eq('is_published', true)
    if (filterStatus === 'draft') query = query.eq('is_published', false)

    const { data, count, error } = await query
    if (error) toastError(error.message)
    else {
      setProducts((data as typeof products) ?? [])
      setTotal(count ?? 0)
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    // Storage cleanup: product_images
    const { data: imgs } = await supabase.from('product_images').select('storage_path').eq('product_id', deleteId)
    if (imgs?.length) {
      const paths = imgs.map((i) => i.storage_path).filter(Boolean) as string[]
      if (paths.length) await supabase.storage.from('product-images').remove(paths)
    }
    // Storage cleanup: variant images
    const { data: vars } = await supabase.from('product_variants').select('image_url').eq('product_id', deleteId)
    if (vars?.length) {
      const varPaths = vars
        .map((v) => {
          const url = (v as { image_url: string | null }).image_url
          if (!url) return null
          const marker = '/object/public/product-images/'
          const idx = url.indexOf(marker)
          return idx !== -1 ? url.substring(idx + marker.length) : null
        })
        .filter(Boolean) as string[]
      if (varPaths.length) await supabase.storage.from('product-images').remove(varPaths)
    }
    // Also attribute image values
    const { data: pavImgs } = await supabase.from('product_attribute_values').select('value_image').eq('product_id', deleteId)
    if (pavImgs?.length) {
      const pavPaths = pavImgs
        .map((r) => {
          const url = (r as { value_image: string | null }).value_image
          if (!url) return null
          const marker = '/object/public/product-images/'
          const idx = url.indexOf(marker)
          return idx !== -1 ? url.substring(idx + marker.length) : null
        })
        .filter(Boolean) as string[]
      if (pavPaths.length) await supabase.storage.from('product-images').remove(pavPaths)
    }
    const { error } = await supabase.from('products').delete().eq('id', deleteId)
    if (error) toastError(error.message)
    else {
      success('تم حذف المنتج')
      setDeleteId(null)
      loadProducts()
    }
    setDeleting(false)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden">
      <PageHeader
        title="إدارة المنتجات"
        description={`${total} منتج`}
        actions={
          <Link to="/admin/products/new" className="btn-gold inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> إضافة منتج
          </Link>
        }
      />

      <div className="bg-white rounded-2xl border border-primary-200 p-3 sm:p-4 mb-4 w-full max-w-full">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="بحث بالاسم أو SKU أو slug..." className="lg:col-span-2" />
          <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1) }} className="select">
            <option value="">كل الفئات</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select value={filterBrand} onChange={(e) => { setFilterBrand(e.target.value); setPage(1) }} className="select">
            <option value="">كل العلامات</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as typeof filterStatus); setPage(1) }} className="select">
            <option value="all">كل الحالات</option>
            <option value="published">منشور</option>
            <option value="draft">مسودة</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-primary-200 overflow-hidden w-full max-w-full">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 skeleton rounded-xl" />
            ))}
          </div>
        ) : products.length ? (
          <>
            <div className="overflow-x-auto w-full max-w-full">
              <table className="w-full min-w-[600px]">
                <thead className="bg-primary-50">
                  <tr className="text-right">
                    <th className="px-4 py-3 text-xs font-medium text-primary-500">الصورة</th>
                    <th className="px-4 py-3 text-xs font-medium text-primary-500">الاسم</th>
                    <th className="px-4 py-3 text-xs font-medium text-primary-500">SKU</th>
                    <th className="px-4 py-3 text-xs font-medium text-primary-500">الفئة</th>
                    <th className="px-4 py-3 text-xs font-medium text-primary-500">العلامة</th>
                    <th className="px-4 py-3 text-xs font-medium text-primary-500">السعر</th>
                    <th className="px-4 py-3 text-xs font-medium text-primary-500">المخزون</th>
                    <th className="px-4 py-3 text-xs font-medium text-primary-500">الحالة</th>
                    <th className="px-4 py-3 text-xs font-medium text-primary-500">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-primary-50/50">
                      <td className="px-4 py-3">
                        <img
                          src={p.images?.[0] || '/placeholder.svg'}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover border border-primary-200"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-primary-900 text-sm truncate max-w-[180px]">{p.name}</p>
                        <p className="text-xs text-primary-500 truncate max-w-[180px]">{p.slug}</p>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-primary-700">{p.sku || '—'}</td>
                      <td className="px-4 py-3 text-sm text-primary-700">{p.category?.name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-primary-700">{p.brand?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-primary-900 text-sm">{formatPrice(p.price)}</span>
                        {p.discount_price ? <span className="block text-xs text-success">{formatPrice(p.discount_price)} خصم</span> : null}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-sm font-medium', p.stock <= p.low_stock_threshold ? 'text-amber-600 flex items-center gap-1' : 'text-primary-700')}>
                          {p.stock <= p.low_stock_threshold && <AlertTriangle className="h-3 w-3" />}
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge variant={p.is_published ? 'success' : 'neutral'}>{p.is_published ? 'منشور' : 'مسودة'}</StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link to={`/admin/products/${p.id}/edit`} className="p-2 rounded-xl text-primary-500 hover:bg-primary-100 hover:text-gold">
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button onClick={() => setDeleteId(p.id)} className="p-2 rounded-xl text-primary-400 hover:bg-red-50 hover:text-danger">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 border-t border-primary-100">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <EmptyState
              icon={<Package className="h-12 w-12" />}
              title="لا توجد منتجات"
              description="ابدأ بإضافة أول منتج لمتجرك"
              action={
                <Link to="/admin/products/new" className="btn-gold">
                  إضافة منتج
                </Link>
              }
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف المنتج"
        description="هل أنت متأكد من حذف هذا المنتج؟ سيتم حذف صوره ومتغيراته وسماته. لا يمكن التراجع."
        confirmLabel="حذف"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}
