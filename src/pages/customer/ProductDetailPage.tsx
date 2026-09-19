import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Product, Review, ProductVariant, CategoryAttribute, ProductAttributeValue } from '../../lib/types'
import { ProductCard } from '../../components/ui/ProductCard'
import { ProductGrid } from '../../components/ui/ProductGrid'
import { RatingStars } from '../../components/ui/RatingStars'
import { EmptyState } from '../../components/ui/EmptyState'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../contexts/WishlistContext'
import { useSettings, useAuth } from '../../hooks'
import { useToast } from '../../contexts/ToastContext'
import { SEO, buildProductJsonLd, buildBreadcrumbJsonLd, getSiteUrl } from '../../components/SEO'
import { cn, formatPrice } from '../../lib/utils'
import { Tag, Truck, Star, Heart, ShoppingBag, Share2 } from 'lucide-react'

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { defaultCurrency } = useSettings()
  const currency = defaultCurrency?.code || 'SAR'
  const { addItem } = useCart()
  const { toggle, has } = useWishlist()
  const { success, error: toastError } = useToast()

  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [attrValues, setAttrValues] = useState<(ProductAttributeValue & { attribute: CategoryAttribute })[]>([])
  const [images, setImages] = useState<string[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description')
  const { user } = useAuth()
  const [newRating, setNewRating] = useState(5)
  const [newComment, setNewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  const handleSubmitReview = async () => {
    if (!user || !product) return toastError('يرجى تسجيل الدخول')
    if (newRating < 1 || newRating > 5) return toastError('التقييم يجب أن يكون بين 1 و 5')
    setSubmittingReview(true)
    const { error } = await supabase.from('reviews').insert({ product_id: product.id, user_id: user.id, rating: newRating, comment: newComment.trim() || null, is_approved: false })
    if (error) toastError(error.message)
    else {
      success('تم إرسال التقييم وسيظهر بعد المراجعة')
      setNewComment('')
      setNewRating(5)
    }
    setSubmittingReview(false)
  }

  useEffect(() => {
    if (slug) loadProduct()
  }, [slug])

  useEffect(() => {
    if (product) {
      document.title = `${product.name} - روح الأناقة`
      const meta = document.querySelector('meta[name="description"]')
      if (meta) meta.setAttribute('content', product.short_description || product.description?.slice(0, 150) || product.name)
    }
  }, [product])

  const loadProduct = async () => {
    setLoading(true)
    setSelectedVariant(null)
    setSelectedImage(0)
    try {
      const { data: prod, error: prodErr } = await supabase.from('products').select('*, brand:brands(*), category:categories(*)').eq('slug', slug).eq('is_published', true).single()
      if (prodErr || !prod) {
        setProduct(null)
        setLoading(false)
        return
      }
      setProduct(prod as Product)

      // Gallery: prefer product_images ordered, fallback to prod.images
      const { data: pImgs } = await supabase.from('product_images').select('public_url,sort_order').eq('product_id', (prod as Product).id).order('sort_order')
      if (pImgs && pImgs.length) setImages(pImgs.map((r) => r.public_url))
      else setImages(Array.isArray((prod as Product).images) && (prod as Product).images.length ? (prod as Product).images : ['/placeholder.svg'])

      // Variants
      const { data: vars } = await supabase.from('product_variants').select('*').eq('product_id', (prod as Product).id).eq('is_active', true).order('sort_order')
      setVariants((vars as ProductVariant[]) ?? [])

      // Attributes
      const { data: pav } = await supabase
        .from('product_attribute_values')
        .select('*, attribute:category_attributes(*)')
        .eq('product_id', (prod as Product).id)
      setAttrValues((pav as unknown as typeof attrValues) ?? [])

      // Reviews + related in parallel (now prod known)
      const [{ data: revs }, { data: rel }] = await Promise.all([
        supabase.from('reviews').select('*, user:profiles(first_name,last_name)').eq('product_id', (prod as Product).id).eq('is_approved', true).order('created_at', { ascending: false }).limit(10),
        supabase.from('products').select('*, brand:brands(*)').eq('category_id', (prod as Product).category_id).neq('id', (prod as Product).id).eq('is_published', true).limit(4),
      ])
      setReviews((revs as Review[]) ?? [])
      setRelated((rel as Product[]) ?? [])
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'فشل تحميل المنتج')
    } finally {
      setLoading(false)
    }
  }

  const displayPrice = useMemo(() => {
    if (selectedVariant) return selectedVariant.price
    return product?.discount_price ?? product?.price ?? 0
  }, [selectedVariant, product])

  const displayStock = useMemo(() => {
    if (selectedVariant) return selectedVariant.stock
    return product?.stock ?? 0
  }, [selectedVariant, product])

  const displayImage = useMemo(() => {
    if (selectedVariant?.image_url) return selectedVariant.image_url
    return images[selectedImage] ?? images[0] ?? '/placeholder.svg'
  }, [selectedVariant, images, selectedImage])

  const isWishlisted = product ? has(product.id) : false
  const hasDiscount = product?.discount_price != null && product.discount_price < (product?.price ?? Infinity)
  const discountPercent = hasDiscount ? Math.round((1 - (product!.discount_price! / product!.price)) * 100) : 0
  const inStock = displayStock > 0
  const siteUrl = getSiteUrl()
  const productUrl = product ? `${siteUrl}/product/${product.slug}` : ''

  const handleAddToCart = () => {
    if (!product) return
    if (variants.length && !selectedVariant) {
      toastError('يرجى اختيار المتغير أولاً')
      return
    }
    if (!inStock) return toastError('المنتج غير متوفر')
    // For variant, we add base product but variant price/stock is shown; full variant cart handled in Phase 8
    addItem(product, quantity)
    success('تمت الإضافة للسلة')
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      success('تم نسخ الرابط')
    } catch {
      toastError('تعذر النسخ')
    }
  }

  if (loading) {
    return (
      <div>
        <div className="grid gap-8 lg:grid-cols-2 mb-12">
          <div className="aspect-square skeleton rounded-2xl" />
          <div className="space-y-4">
            <div className="h-6 w-1/3 skeleton rounded" />
            <div className="h-8 w-1/2 skeleton rounded" />
            <div className="h-10 w-1/3 skeleton rounded" />
            <div className="h-32 skeleton rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <EmptyState icon={<Tag className="h-12 w-12" />} title="المنتج غير موجود" description="المنتج غير متاح أو تم إزالته." action={<Link to="/shop" className="btn-gold">العودة للمتجر</Link>} />
      </div>
    )
  }

  return (
    <>
      {product && (
        <SEO
          title={product.name}
          description={product.short_description || product.description?.slice(0, 160) || undefined}
          canonical={`/product/${product.slug}`}
          image={displayImage}
          type="product"
          structuredData={[
            buildProductJsonLd({ name: product.name, description: product.description, images, sku: product.sku, brand: product.brand, price: product.price, discount_price: product.discount_price, currency_code: product.currency_code, stock: displayStock, is_published: product.is_published, rating: product.rating, review_count: product.review_count }, productUrl),
            buildBreadcrumbJsonLd([
              { name: 'الرئيسية', url: `${siteUrl}/` },
              { name: 'المتجر', url: `${siteUrl}/shop` },
              ...(product.category ? [{ name: product.category.name, url: `${siteUrl}/shop?category=${product.category.slug}` } as const] : []),
              { name: product.name, url: productUrl },
            ]),
          ]}
        />
      )}
      <div className="space-y-10">
        <nav className="flex items-center gap-2 text-sm text-primary-500 flex-wrap" aria-label="مسار التنقل">
        <Link to="/" className="hover:text-gold">الرئيسية</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-gold">المتجر</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link to={`/shop?category=${product.category.slug}`} className="hover:text-gold">{product.category.name}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-primary-900 font-medium truncate max-w-[180px]">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-primary-50 border border-primary-200">
            <img src={displayImage} alt={product.name} className="w-full h-full object-cover" loading="eager" />
            {hasDiscount && <span className="absolute top-3 right-3 bg-danger text-white px-2.5 py-1 rounded-full text-xs font-bold">-{discountPercent}%</span>}
            {product.is_new_arrival && <span className="absolute top-3 left-3 bg-blue-500 text-white px-2.5 py-1 rounded-full text-xs font-bold">جديد</span>}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedImage(i)
                    setSelectedVariant(null)
                  }}
                  className={cn('shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2', i === selectedImage && !selectedVariant?.image_url ? 'border-gold' : 'border-transparent hover:border-primary-300')}
                  aria-label={`صورة ${i + 1}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          {product.brand && (
            <Link to={`/shop?brand=${product.brand.slug}`} className="inline-flex items-center gap-1 text-sm text-primary-500 hover:text-gold">
              <Tag className="h-4 w-4" /> {product.brand.name}
            </Link>
          )}
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary-900 leading-tight">{product.name}</h1>

          <div className="flex items-center gap-3">
            <RatingStars rating={product.rating} showValue size="sm" />
            <span className="text-sm text-primary-500">({product.review_count} تقييم)</span>
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl font-bold text-gold">{formatPrice(displayPrice, currency)}</span>
            {hasDiscount && !selectedVariant && <span className="text-lg text-primary-400 line-through">{formatPrice(product.price, currency)}</span>}
          </div>

          {product.short_description && <p className="text-primary-600 leading-relaxed border-y border-primary-100 py-4">{product.short_description}</p>}

          {/* Variants */}
          {variants.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-primary-900">المتغيرات</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {variants.map((v) => {
                  const active = selectedVariant?.id === v.id
                  const out = v.stock <= 0
                  return (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVariant(v)
                        setQuantity(1)
                      }}
                      disabled={out}
                      className={cn(
                        'p-3 rounded-xl border text-right flex items-center gap-3 transition-colors',
                        active ? 'border-gold bg-gold/10' : 'border-primary-200 hover:border-gold bg-white',
                        out && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {v.image_url && <img src={v.image_url} alt={v.name} className="w-10 h-10 rounded-lg object-cover" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-primary-900 text-sm truncate">{v.name}</p>
                        <p className="text-xs text-primary-500">{formatPrice(v.price, currency)} • {v.stock > 0 ? `${v.stock} متوفر` : 'نفذت الكمية'}</p>
                        {Object.keys(v.attributes).length > 0 && <p className="text-xs text-primary-400 truncate">{Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(' • ')}</p>}
                      </div>
                    </button>
                  )
                })}
              </div>
              {selectedVariant && <button onClick={() => setSelectedVariant(null)} className="text-xs text-primary-500 hover:text-gold">إلغاء اختيار المتغير</button>}
            </div>
          )}

          {/* Attributes */}
          {attrValues.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-primary-900">المواصفات</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {attrValues.map((av) => (
                  <div key={av.id} className="flex justify-between p-2.5 bg-primary-50 rounded-xl text-sm">
                    <span className="text-primary-500">{av.attribute.name}</span>
                    <span className="font-medium text-primary-900">
                      {av.value_text || av.value_number || (av.value_boolean ? 'نعم' : av.value_boolean === false ? 'لا' : '') || av.value_date || (av.value_image ? 'صورة' : '—')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border border-primary-200 rounded-xl px-2 py-1">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="p-2 hover:bg-primary-100 rounded-lg" aria-label="تقليل">
                -
              </button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button onClick={() => setQuantity((q) => Math.min(displayStock || 99, q + 1))} disabled={quantity >= displayStock} className="p-2 hover:bg-primary-100 rounded-lg disabled:opacity-40" aria-label="زيادة">
                +
              </button>
            </div>
            <span className="text-sm text-primary-500">{inStock ? `${displayStock} متوفر` : 'نفذت الكمية'}</span>
          </div>

          <div className="flex gap-3">
            <button onClick={handleAddToCart} disabled={!inStock} className="flex-1 btn-gold py-3 text-base disabled:opacity-50">
              <ShoppingBag className="h-5 w-5" /> إضافة للسلة
            </button>
            <button
              onClick={() => {
                toggle(product)
                if (!isWishlisted) success('أضيف للمفضلة')
              }}
              className={cn('p-3 rounded-xl border', isWishlisted ? 'bg-red-50 border-red-200 text-danger' : 'border-primary-200 text-primary-500 hover:bg-primary-50')}
              aria-label="مفضلة"
            >
              <Heart className={cn('h-6 w-6', isWishlisted && 'fill-current')} />
            </button>
            <button onClick={handleShare} className="p-3 rounded-xl border border-primary-200 text-primary-500 hover:bg-primary-50" aria-label="مشاركة">
              <Share2 className="h-6 w-6" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            <div className="flex items-center gap-2 p-3 bg-white border border-primary-200 rounded-xl">
              <Truck className="h-5 w-5 text-gold" /> شحن سريع 24-48 ساعة
            </div>
            <div className="flex items-center gap-2 p-3 bg-white border border-primary-200 rounded-xl">
              <Star className="h-5 w-5 text-gold" /> أصلي 100%
            </div>
            <div className="flex items-center gap-2 p-3 bg-white border border-primary-200 rounded-xl">
              <Heart className="h-5 w-5 text-gold" /> إرجاع 14 يوم
            </div>
          </div>

          {product.sku && <p className="text-xs text-primary-400">SKU: {product.sku} {selectedVariant?.sku && `• المتغير: ${selectedVariant.sku}`}</p>}
        </div>
      </div>

      <div className="border-t border-primary-200 pt-6">
        <div className="flex gap-2 border-b border-primary-200 mb-6 overflow-x-auto scrollbar-hide" role="tablist">
          {[
            { id: 'description', label: 'الوصف' },
            { id: 'specs', label: 'المواصفات' },
            { id: 'reviews', label: `التقييمات (${product.review_count})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn('px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap', activeTab === tab.id ? 'border-gold text-gold' : 'border-transparent text-primary-500')}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'description' && (
          <div className="prose prose-sm max-w-none text-primary-700 leading-relaxed">{product.description ? <div dangerouslySetInnerHTML={{ __html: product.description }} /> : <p>لا يوجد وصف.</p>}</div>
        )}
        {activeTab === 'specs' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {product.specifications && Object.keys(product.specifications).length ? (
              Object.entries(product.specifications).map(([k, v]) => (
                <div key={k} className="p-3 bg-primary-50 rounded-xl flex justify-between">
                  <span className="text-primary-500 text-sm">{k}</span>
                  <span className="font-medium text-primary-900 text-sm">{String(v)}</span>
                </div>
              ))
            ) : (
              <p className="text-primary-500 text-sm col-span-2 text-center py-8">لا توجد مواصفات.</p>
            )}
            {attrValues.length > 0 && attrValues.map((av) => (
              <div key={`spec-${av.id}`} className="p-3 bg-white border border-primary-200 rounded-xl flex justify-between">
                <span className="text-primary-500 text-sm">{av.attribute.name}</span>
                <span className="font-medium text-primary-900 text-sm">{av.value_text || av.value_number || String(av.value_boolean ?? '—')}</span>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {user ? (
              <div className="p-4 bg-white border border-primary-200 rounded-xl">
                <h4 className="font-medium text-primary-900 mb-3">أضف تقييمك</h4>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-primary-600">التقييم:</span>
                  <RatingStars rating={newRating} size="sm" interactive onChange={setNewRating} />
                </div>
                <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="اكتب تعليقك (اختياري)" rows={3} className="textarea w-full" />
                <button onClick={handleSubmitReview} disabled={submittingReview} className="btn-gold mt-3">
                  {submittingReview ? 'جاري الإرسال...' : 'إرسال التقييم'}
                </button>
                <p className="text-xs text-primary-400 mt-2">سيظهر تقييمك بعد المراجعة</p>
              </div>
            ) : (
              <p className="text-sm text-primary-500 bg-primary-50 border border-primary-200 rounded-xl p-3">
                <Link to="/login" className="text-gold hover:underline">
                  سجل دخول
                </Link>{' '}
                لتتمكن من تقييم المنتج
              </p>
            )}
            {reviews.length ? (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="p-4 bg-white border border-primary-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-primary-900 text-sm">{r.user?.first_name || 'مستخدم'}</span>
                      <RatingStars rating={r.rating} size="sm" />
                    </div>
                    {r.comment && <p className="text-sm text-primary-700">{r.comment}</p>}
                    <p className="text-xs text-primary-400 mt-1">{new Date(r.created_at).toLocaleDateString('ar-SA')}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Star className="h-12 w-12" />} title="لا توجد تقييمات" description="كن أول من يقيم هذا المنتج" />
            )}
          </div>
        )}
      </div>

      {related.length > 0 && (
        <section>
          <h2 className="section-title mb-4">منتجات ذات صلة</h2>
          <ProductGrid>
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ProductGrid>
        </section>
      )}
    </div>
    </>
  )
}
