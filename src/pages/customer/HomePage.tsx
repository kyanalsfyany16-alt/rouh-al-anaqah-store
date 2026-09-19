import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Product, Category, Banner, Brand } from '../../lib/types'
import { ProductCard, ProductGrid, LoadingSkeleton } from '../../components/ui'
import { useSettings } from '../../hooks'
import { SEO, buildOrganizationJsonLd, buildWebsiteJsonLd, getSiteUrl } from '../../components/SEO'
import { Tag, Zap, Shield, Truck, ArrowLeft } from 'lucide-react'

export function HomePage() {
  const { settings, defaultCurrency } = useSettings()
  const currency = defaultCurrency?.code || 'SAR'
  const [heroBanner, setHeroBanner] = useState<Banner | null>(null)
  const [discountBanner, setDiscountBanner] = useState<Banner | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [bestSellers, setBestSellers] = useState<Product[]>([])
  const [newArrivals, setNewArrivals] = useState<Product[]>([])
  const [discountedProducts, setDiscountedProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const siteUrl = getSiteUrl()

  useEffect(() => {
    loadHomeData()
  }, [])

  const loadHomeData = async () => {
    try {
      const [
        { data: banners },
        { data: cats },
        { data: featured },
        { data: best },
        { data: newArr },
        { data: discounted },
        { data: brandData },
      ] = await Promise.all([
        supabase.from('banners').select('*').eq('is_active', true).order('sort_order').limit(2),
        supabase.from('categories').select('*').eq('is_active', true).is('parent_id', null).order('sort_order').limit(8),
        supabase.from('products').select('*, brand:brands(*)').eq('is_published', true).eq('is_featured', true).order('created_at', { ascending: false }).limit(8),
        supabase.from('products').select('*, brand:brands(*)').eq('is_published', true).eq('is_best_seller', true).order('created_at', { ascending: false }).limit(8),
        supabase.from('products').select('*, brand:brands(*)').eq('is_published', true).eq('is_new_arrival', true).order('created_at', { ascending: false }).limit(8),
        supabase.from('products').select('*, brand:brands(*)').eq('is_published', true).not('discount_price', 'is', null).order('created_at', { ascending: false }).limit(8),
        supabase.from('brands').select('*').eq('is_active', true).order('name').limit(10),
      ])

      if (banners) {
        setHeroBanner(banners[0] || null)
        setDiscountBanner(banners[1] || null)
      }
      setCategories(cats || [])
      setFeaturedProducts(featured || [])
      setBestSellers(best || [])
      setNewArrivals(newArr || [])
      setDiscountedProducts(discounted || [])
      setBrands(brandData || [])
    } catch (error) {
      console.error('Failed to load home data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-12">
        <div className="aspect-[16/9] skeleton rounded-2xl" />
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square skeleton rounded-xl" />
          ))}
        </div>
        <div className="space-y-8">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 w-32 skeleton rounded" />
              </div>
              <ProductGrid><LoadingSkeleton variant="product" count={4} /></ProductGrid>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const features = [
    { icon: Truck, title: 'شحن سريع', desc: 'توصيل خلال 24-48 ساعة' },
    { icon: Shield, title: 'دفع آمن', desc: 'حماية كاملة لبياناتك' },
    { icon: Tag, title: 'إرجاع مجاني', desc: 'خلال 14 يوم من الاستلام' },
    { icon: Zap, title: 'دعم 24/7', desc: 'فريق دعم متاح دائماً' },
  ]

  const renderSection = (title: string, products: Product[], href: string, showViewAll = true) => {
    if (!products.length) return null
    return (
      <section className="py-4" aria-labelledby={title}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">{title}</h2>
          {showViewAll && <Link to={href} className="text-gold hover:underline text-sm font-medium">عرض الكل <ArrowLeft className="h-4 w-4 ml-1" /></Link>}
        </div>
        <ProductGrid>
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </ProductGrid>
      </section>
    )
  }

  return (
    <div className="space-y-16 pb-16">
      <SEO
        description={settings?.about_us?.slice(0, 160)}
        canonical="/"
        image={settings?.logo_url || heroBanner?.image_url || undefined}
        structuredData={[buildOrganizationJsonLd(settings, siteUrl), buildWebsiteJsonLd(siteUrl)]}
      />
      {heroBanner && (
        <section className="relative rounded-2xl overflow-hidden" aria-label="بانر رئيسي">
          <img src={heroBanner.image_url} alt={heroBanner.title || `بانر ${settings?.store_name || 'روح الأناقة'}`} className="w-full h-[420px] sm:h-[520px] object-cover" fetchPriority="high" />
          <div className="absolute inset-0 bg-gradient-to-l from-primary-950/80 via-primary-950/40 to-transparent" />
          <div className="absolute inset-0 container-app flex items-center">
            <div className="max-w-2xl animate-fade-in">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4">{heroBanner.title}</h1>
              {heroBanner.subtitle && <p className="text-lg text-primary-100 mb-6">{heroBanner.subtitle}</p>}
              {heroBanner.link_url && (
                <Link to={heroBanner.link_url} className="btn-gold text-lg px-8 py-3">تسوق الآن</Link>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-4 grid-cols-2 sm:grid-cols-4" aria-label="المميزات">
        {features.map((f, i) => (
          <div key={i} className="p-6 bg-white rounded-2xl border border-primary-200 text-center hover:border-gold hover:shadow-soft transition-all">
            <div className="mx-auto mb-3 p-3 bg-gold/10 rounded-xl w-fit text-gold">{f.icon && <f.icon className="h-6 w-6" />}</div>
            <h3 className="font-semibold text-primary-900">{f.title}</h3>
            <p className="text-sm text-primary-500 mt-1">{f.desc}</p>
          </div>
        ))}
      </section>

      {categories.length > 0 && (
        <section aria-labelledby="الفئات">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">الفئات</h2>
            <Link to="/shop" className="text-gold hover:underline text-sm font-medium">
              عرض الكل <ArrowLeft className="h-4 w-4 ml-1 inline" />
            </Link>
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((c) => (
              <Link key={c.id} to={`/shop?category=${c.slug}`} className="group relative rounded-2xl overflow-hidden bg-white border border-primary-200 hover:border-gold hover:shadow-soft transition-all">
                <div className="aspect-[4/3] overflow-hidden bg-primary-50">
                  {c.image_url ? <img src={c.image_url} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-primary-300"><Tag className="h-10 w-10" /></div>}
                </div>
                <div className="p-3 text-center">
                  <h3 className="font-semibold text-primary-900 group-hover:text-gold transition-colors">{c.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {renderSection('منتجات مميزة', featuredProducts, '/shop?featured=true')}

      {discountBanner && (
        <section className="relative rounded-2xl overflow-hidden" aria-label="بانر العروض">
          <img src={discountBanner.image_url} alt={discountBanner.title || ''} className="w-full h-64 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-950/70 to-primary-950/30" />
          <div className="absolute inset-0 container-app flex items-center">
            <div className="max-w-md animate-slide-in">
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3">{discountBanner.title}</h2>
              {discountBanner.subtitle && <p className="text-primary-100 mb-4">{discountBanner.subtitle}</p>}
              {discountBanner.link_url && <Link to={discountBanner.link_url} className="btn-gold">اكتشف العروض</Link>}
            </div>
          </div>
        </section>
      )}

      {renderSection('الأكثر مبيعاً', bestSellers, '/shop?sort=best_seller')}
      {renderSection('وصل حديثاً', newArrivals, '/shop?sort=newest')}
      {renderSection('منتجات بخصم', discountedProducts, '/shop?sort=discount')}

      {brands.length > 0 && (
        <section aria-label="العلامات التجارية">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">العلامات التجارية</h2>
          </div>
          <div className="grid gap-4 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {brands.map(b => (
              <Link key={b.id} to={`/shop?brand=${b.slug}`} className="p-4 bg-white rounded-2xl border border-primary-200 hover:border-gold hover:shadow-soft transition-all text-center">
                {b.logo_url ? (
                  <img src={b.logo_url} alt={b.name} className="mx-auto h-12 object-contain" />
                ) : (
                  <div className="h-12 flex items-center justify-center text-primary-300">🏷️</div>
                )}
                <p className="mt-2 text-sm font-medium text-primary-700 truncate">{b.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}