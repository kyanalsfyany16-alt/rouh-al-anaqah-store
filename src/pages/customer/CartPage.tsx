import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, LoadingSkeleton } from '../../components/ui'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../contexts/WishlistContext'
import { useSettings } from '../../hooks'
import { useToast } from '../../contexts/ToastContext'
import { cn, formatPrice } from '../../lib/utils'
import { Plus, Minus, Trash2, Heart, ShoppingBag, Tag, AlertTriangle } from 'lucide-react'

export function CartPage() {
  const { items, subtotal, count, updateQuantity, removeItem, clear, loading, validateCart, applyCoupon } = useCart()
  const { toggle, has } = useWishlist()
  const { defaultCurrency } = useSettings()
  const { error: toastError } = useToast()
  const currency = defaultCurrency?.code || 'SAR'

  const [shipping, setShipping] = useState(0)
  const [coupon, setCoupon] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  useEffect(() => {
    document.title = 'سلة التسوق - روح الأناقة'
  }, [])

  useEffect(() => {
    setShipping(subtotal >= 300 ? 0 : items.length ? 30 : 0)
  }, [subtotal, items.length])

  useEffect(() => {
    // Validate stock/availability on load
    if (items.length && !loading) {
      validateCart().then(({ errors }) => setValidationErrors(errors))
    } else setValidationErrors([])
  }, [items, loading])

  const total = Math.max(0, subtotal - discount + shipping)

  const handleUpdateQty = async (productId: string, variantId: string | null | undefined, delta: number) => {
    const item = items.find((i) => i.product_id === productId && (i.variant_id ?? null) === (variantId ?? null))
    if (!item) return
    const newQty = item.quantity + delta
    const stock = item.variant?.stock ?? item.product?.stock ?? 999
    if (newQty > stock) {
      toastError(`الكمية المطلوبة غير متوفرة، المتاح ${stock}`)
      return
    }
    await updateQuantity(productId, newQty, variantId ?? null)
  }

  const handleApplyCoupon = async () => {
    setCouponError('')
    if (!coupon.trim()) return
    setCouponLoading(true)
    const res = await applyCoupon(coupon.trim())
    if (res.error) {
      setCouponError(res.error)
      setDiscount(0)
    } else {
      setDiscount(res.discount)
      setCouponError('')
    }
    setCouponLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton variant="list" count={3} />
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="text-center py-16">
        <EmptyState
          icon={<ShoppingBag className="h-12 w-12" />}
          title="السلة فارغة"
          description="لا توجد منتجات في السلة بعد. ابدأ التسوق الآن!"
          action={
            <Link to="/shop" className="btn-gold">
              تسوق الآن
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <h1 className="page-title">سلة التسوق ({count})</h1>

        {validationErrors.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="font-medium text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> تنبيهات السلة
            </p>
            <ul className="list-disc list-inside text-sm text-amber-700 mt-2">
              {validationErrors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-primary-200 overflow-hidden">
          <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 bg-primary-50 border-b border-primary-200 text-xs font-medium text-primary-500">
            <div className="col-span-5">المنتج</div>
            <div className="col-span-2 text-center">السعر</div>
            <div className="col-span-2 text-center">الكمية</div>
            <div className="col-span-2 text-center">الإجمالي</div>
            <div className="col-span-1"></div>
          </div>
          <div className="divide-y divide-primary-100">
            {items.map((item) => {
              const product = item.product!
              const variant = item.variant
              const price = variant?.price ?? product.discount_price ?? product.price
              const stock = variant?.stock ?? product.stock
              const lowStock = stock <= product.low_stock_threshold
              const isWishlisted = has(product.id)
              const itemTotal = price * item.quantity
              const img = variant?.image_url || product.images?.[0] || '/placeholder.svg'

              return (
                <div key={`${product.id}-${variant?.id ?? 'base'}`} className="p-4 sm:grid sm:grid-cols-12 gap-4 items-center">
                  <Link to={`/product/${product.slug}`} className="flex items-center gap-3 col-span-5">
                    <img src={img} alt={product.name} className="w-20 h-20 rounded-xl object-cover border border-primary-200 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-primary-900 text-sm truncate">{product.name}</h3>
                      {variant && <p className="text-xs text-gold truncate">{variant.name}</p>}
                      {product.brand && <p className="text-xs text-primary-500 truncate">{product.brand.name}</p>}
                      <p className="text-xs text-primary-400">SKU: {variant?.sku || product.sku || '—'}</p>
                      {!product.is_published && <span className="badge-danger text-xs">غير منشور</span>}
                      {stock <= 0 && <span className="badge-danger text-xs">نفذت الكمية</span>}
                      {lowStock && stock > 0 && <span className="badge-warning text-xs">مخزون منخفض</span>}
                    </div>
                  </Link>

                  <div className="flex sm:block items-center justify-between sm:col-span-2 sm:text-center mt-3 sm:mt-0">
                    <span className="sm:hidden text-sm text-primary-500">السعر</span>
                    <div>
                      <p className="font-medium text-primary-900 text-sm">{formatPrice(price, currency)}</p>
                      {product.discount_price && !variant && <p className="text-xs text-primary-400 line-through">{formatPrice(product.price, currency)}</p>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-center gap-2 sm:col-span-2 mt-3 sm:mt-0">
                    <span className="sm:hidden text-sm text-primary-500">الكمية</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleUpdateQty(product.id, variant?.id, -1)} className="p-2 rounded-xl border border-primary-200 hover:bg-primary-50" aria-label="تقليل">
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center font-medium text-sm">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQty(product.id, variant?.id, 1)}
                        disabled={item.quantity >= stock}
                        className="p-2 rounded-xl border border-primary-200 hover:bg-primary-50 disabled:opacity-40"
                        aria-label="زيادة"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex sm:block items-center justify-between sm:col-span-2 sm:text-center mt-3 sm:mt-0">
                    <span className="sm:hidden text-sm text-primary-500">الإجمالي</span>
                    <span className="font-bold text-gold">{formatPrice(itemTotal, currency)}</span>
                  </div>

                  <div className="flex items-center justify-end gap-1 sm:col-span-1 mt-3 sm:mt-0">
                    <button
                      onClick={() => toggle(product)}
                      className={cn('p-2 rounded-xl', isWishlisted ? 'text-danger bg-red-50' : 'text-primary-400 hover:text-danger hover:bg-red-50')}
                      aria-label="مفضلة"
                    >
                      <Heart className={cn('h-4 w-4', isWishlisted && 'fill-current')} />
                    </button>
                    <button onClick={() => removeItem(product.id, variant?.id ?? null)} className="p-2 rounded-xl text-primary-400 hover:text-danger hover:bg-red-50" aria-label="حذف">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex justify-between">
          <Link to="/shop" className="text-sm text-gold hover:underline inline-flex items-center gap-1">
            <Tag className="h-4 w-4" /> متابعة التسوق
          </Link>
          <button onClick={clear} className="btn-outline text-sm" disabled={!items.length}>
            إفراغ السلة
          </button>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl border border-primary-200 p-5 sticky top-20">
          <h2 className="font-semibold text-primary-900 mb-4">ملخص الطلب</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-primary-600">
              <span>المجموع الفرعي ({count} منتج)</span>
              <span className="font-medium">{formatPrice(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-primary-600">
              <span>الشحن</span>
              <span className="font-medium">{shipping === 0 ? <span className="text-success">مجاني</span> : formatPrice(shipping, currency)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-success">
                <span>الخصم ({coupon})</span>
                <span>-{formatPrice(discount, currency)}</span>
              </div>
            )}
            <div className="border-t border-primary-200 pt-3 flex justify-between font-bold">
              <span>الإجمالي</span>
              <span className="text-gold text-lg">{formatPrice(total, currency)}</span>
            </div>
          </div>

          <div className="mt-5 p-3 bg-primary-50 rounded-xl border border-primary-200">
            <p className="text-xs font-medium text-primary-700 mb-2 flex items-center gap-1">
              <Tag className="h-3 w-3" /> كوبون الخصم
            </p>
            <div className="flex gap-2">
              <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="أدخل الكود" className="input flex-1 text-sm" />
              <button onClick={handleApplyCoupon} disabled={couponLoading} className="btn-primary text-sm whitespace-nowrap">
                {couponLoading ? '...' : 'تطبيق'}
              </button>
            </div>
            {couponError && <p className="text-danger text-xs mt-2">{couponError}</p>}
            {discount > 0 && !couponError && <p className="text-success text-xs mt-2">تم تطبيق الخصم</p>}
          </div>

          <Link to="/checkout" className="btn-gold w-full py-3 mt-5 text-center block">
            إتمام الشراء
          </Link>
          <p className="text-center text-xs text-primary-500 mt-3">
            سيتم التحقق من المخزون والسعر عند التأكيد
          </p>
        </div>
      </div>
    </div>
  )
}
