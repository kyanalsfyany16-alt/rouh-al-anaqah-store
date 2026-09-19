import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Product, Category, Brand } from '../../lib/types'
import { ProductCard } from '../../components/ui/ProductCard'
import { ProductGrid } from '../../components/ui/ProductGrid'
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { Pagination } from '../../components/admin/Pagination'
import { SearchInput } from '../../components/admin/SearchInput'
import { SEO, buildBreadcrumbJsonLd, getSiteUrl } from '../../components/SEO'
import { useSettings } from '../../hooks'
import { cn } from '../../lib/utils'
import { Filter, X, SlidersHorizontal } from 'lucide-react'

const PAGE_SIZE = 12

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Derived from URL
  const q = searchParams.get('q') ?? ''
  const categorySlug = searchParams.get('category') ?? ''
  const brandSlug = searchParams.get('brand') ?? ''
  const minParam = searchParams.get('min')
  const maxParam = searchParams.get('max')
  const sort = searchParams.get('sort') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))

  // Local search input with debounce
  const [searchInput, setSearchInput] = useState(q)
  useEffect(() => setSearchInput(q), [q])
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== q) {
        const next = new URLSearchParams(searchParams)
        if (searchInput.trim()) next.set('q', searchInput.trim())
        else next.delete('q')
        next.set('page', '1')
        setSearchParams(next)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const { settings: shopSettings } = useSettings()
  const activeCategory = categories.find((c) => c.slug === categorySlug)
  const activeBrand = brands.find((b) => b.slug === brandSlug)
  const seoTitle = activeCategory ? activeCategory.name : activeBrand ? activeBrand.name : q ? `بحث: ${q}` : 'المتجر'
  const seoDescription = activeCategory?.description || activeBrand?.description || shopSettings?.about_us?.slice(0, 160) || 'تسوق أفضل المنتجات الرجالية في روح الأناقة'

  // Load categories/brands once
  useEffect(() => {
    const loadMeta = async () => {
      const [{ data: cats }, { data: brs }] = await Promise.all([
        supabase.from('categories').select('id,name,slug').eq('is_active', true).order('sort_order').limit(50),
        supabase.from('brands').select('id,name,slug').eq('is_active', true).order('name').limit(50),
      ])
      setCategories((cats as Category[]) ?? [])
      setBrands((brs as Brand[]) ?? [])
    }
    loadMeta()
  }, [])

  // Resolve slugs to ids for filtering
  const categoryId = useMemo(() => categories.find((c) => c.slug === categorySlug)?.id ?? '', [categories, categorySlug])
  const brandId = useMemo(() => brands.find((b) => b.slug === brandSlug)?.id ?? '', [brands, brandSlug])

  useEffect(() => {
    loadProducts()
  }, [q, categorySlug, brandSlug, minParam, maxParam, sort, page, categories.length, brands.length])

  const loadProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase.from('products').select('*, brand:brands(id,name,slug), category:categories(id,name,slug)', { count: 'exact' }).eq('is_published', true)

      if (q.trim()) {
        const term = `%${q.trim()}%`
        query = query.or(`name.ilike.${term},slug.ilike.${term},sku.ilike.${term}`)
      }
      if (categorySlug && categoryId) query = query.eq('category_id', categoryId)
      else if (categorySlug && !categoryId && categories.length) {
        // Unknown category slug -> no results
        setProducts([])
        setTotal(0)
        setLoading(false)
        return
      }
      if (brandSlug && brandId) query = query.eq('brand_id', brandId)
      else if (brandSlug && !brandId && brands.length) {
        setProducts([])
        setTotal(0)
        setLoading(false)
        return
      }
      if (minParam) {
        const min = Number(minParam)
        if (!isNaN(min)) query = query.gte('price', min)
      }
      if (maxParam) {
        const max = Number(maxParam)
        if (!isNaN(max)) query = query.lte('price', max)
      }

      switch (sort) {
        case 'price_asc':
          query = query.order('price', { ascending: true })
          break
        case 'price_desc':
          query = query.order('price', { ascending: false })
          break
        case 'best_seller':
          query = query.order('rating', { ascending: false })
          break
        case 'discount':
          query = query.not('discount_price', 'is', null).order('discount_price', { ascending: true })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

      const { data, count, error: qErr } = await query
      if (qErr) throw qErr
      setProducts((data as Product[]) ?? [])
      setTotal(count ?? 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحميل المنتجات')
    } finally {
      setLoading(false)
    }
  }

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (value && value.trim()) next.set(key, value.trim())
    else next.delete(key)
    if (key !== 'page') next.set('page', '1')
    setSearchParams(next)
  }

  const clearFilters = () => {
    setSearchParams(new URLSearchParams())
    setSearchInput('')
  }

  const activeCount = [q, categorySlug, brandSlug, minParam, maxParam, sort].filter(Boolean).length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical="/shop"
        structuredData={buildBreadcrumbJsonLd([
          { name: 'الرئيسية', url: `${getSiteUrl()}/` },
          { name: 'المتجر', url: `${getSiteUrl()}/shop` },
          ...(activeCategory ? [{ name: activeCategory.name, url: `${getSiteUrl()}/shop?category=${activeCategory.slug}` } as const] : []),
        ])}
      />
      <div className="min-h-[60vh]">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Sidebar */}
        <aside className={cn('lg:w-64 shrink-0', showFilters ? 'block' : 'hidden lg:block')} aria-label="الفلاتر">
          <div className="bg-white rounded-2xl border border-primary-200 p-5 sticky top-20">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-primary-900 flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" /> الفلاتر
              </h3>
              <button onClick={() => setShowFilters(false)} className="lg:hidden p-1 text-primary-400 hover:text-primary-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="label">الفئة</label>
                <select value={categorySlug} onChange={(e) => updateParam('category', e.target.value || null)} className="select">
                  <option value="">جميع الفئات</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">العلامة التجارية</label>
                <select value={brandSlug} onChange={(e) => updateParam('brand', e.target.value || null)} className="select">
                  <option value="">جميع العلامات</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.slug}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">السعر</label>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="من" value={minParam ?? ''} onChange={(e) => updateParam('min', e.target.value || null)} className="input" min={0} />
                  <span className="text-primary-400">-</span>
                  <input type="number" placeholder="إلى" value={maxParam ?? ''} onChange={(e) => updateParam('max', e.target.value || null)} className="input" min={0} />
                </div>
              </div>

              <div>
                <label className="label">الترتيب</label>
                <select value={sort} onChange={(e) => updateParam('sort', e.target.value || null)} className="select">
                  <option value="">الأحدث</option>
                  <option value="price_asc">السعر: الأقل → الأعلى</option>
                  <option value="price_desc">السعر: الأعلى → الأقل</option>
                  <option value="best_seller">الأعلى تقييماً</option>
                  <option value="discount">الأكثر خصماً</option>
                </select>
              </div>

              {activeCount > 0 && (
                <button onClick={clearFilters} className="w-full btn-outline text-sm">
                  <X className="h-4 w-4" /> مسح الفلاتر ({activeCount})
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-primary-200 p-4 mb-4">
            <SearchInput value={searchInput} onChange={setSearchInput} placeholder="بحث بالاسم أو SKU أو الرابط..." />
          </div>

          <div className="flex items-center justify-between mb-4 gap-3">
            <div>
              <h1 className="text-xl font-display font-bold text-primary-900">المتجر</h1>
              <p className="text-sm text-primary-500">{loading ? 'جاري التحميل...' : `${total} منتج`}</p>
            </div>
            <button onClick={() => setShowFilters(true)} className="lg:hidden btn-outline inline-flex items-center gap-2">
              <Filter className="h-4 w-4" /> فلاتر {activeCount > 0 && `(${activeCount})`}
            </button>
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700">{error}</div>
          ) : loading ? (
            <ProductGrid>
              <LoadingSkeleton variant="product" count={8} />
            </ProductGrid>
          ) : products.length ? (
            <>
              <ProductGrid>
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </ProductGrid>
              <div className="mt-6">
                <Pagination page={page} totalPages={totalPages} onPageChange={(p) => updateParam('page', String(p))} />
              </div>
            </>
          ) : (
            <EmptyState
              icon={<Filter className="h-12 w-12" />}
              title="لا توجد منتجات"
              description="لم نجد منتجات تطابق بحثك أو فلاترك. جرب تغيير الكلمات أو مسح الفلاتر."
              action={
                <button onClick={clearFilters} className="btn-gold">
                  مسح الفلاتر
                </button>
              }
            />
          )}
        </div>
      </div>
    </div>
    </>
  )
}
