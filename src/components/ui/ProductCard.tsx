import { Link } from 'react-router-dom'
import { Heart, ShoppingBag, Tag, Star, Truck } from 'lucide-react'
import { cn, formatPrice } from '../../lib/utils'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../contexts/WishlistContext'
import { useSettings } from '../../hooks'
import type { Product } from '../../lib/types'
import { Badge } from './Badge'
import { RatingStars } from './RatingStars'

interface ProductCardProps {
  product: Product
  variant?: 'default' | 'compact'
  showActions?: boolean
}

export function ProductCard({ product, variant = 'default', showActions = true }: ProductCardProps) {
  const { addItem } = useCart()
  const { toggle, has } = useWishlist()
  const { defaultCurrency } = useSettings()
  const currency = product.currency_code || defaultCurrency?.code || 'SAR'
  const isWishlisted = has(product.id)
  const price = product.discount_price ?? product.price
  const hasDiscount = product.discount_price && product.discount_price < product.price
  const discountPercent = hasDiscount ? Math.round((1 - (product.discount_price! / product.price)) * 100) : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product, 1)
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggle(product)
  }

  if (variant === 'compact') {
    return (
      <Link to={`/product/${product.slug}`} className="flex gap-3 p-2 hover:bg-primary-50 rounded-xl transition-colors group">
        <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-primary-100">
          {product.images[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary-300"><Tag className="h-6 w-6" /></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-primary-900 truncate group-hover:text-gold transition-colors">{product.name}</h4>
          {product.brand && <p className="text-sm text-primary-500 truncate">{product.brand.name}</p>}
          <div className="flex items-center gap-2 mt-1">
            <span className="font-semibold text-gold">{formatPrice(price, currency)}</span>
            {hasDiscount && (
              <>
                <span className="text-sm text-primary-400 line-through">{formatPrice(product.price, currency)}</span>
                <Badge variant="danger">-{discountPercent}%</Badge>
              </>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <article className="card-hover card group relative w-full max-w-full min-w-0 overflow-hidden">
      <Link to={`/product/${product.slug}`} className="block w-full max-w-full">
        <div className="relative aspect-square overflow-hidden bg-primary-50 w-full max-w-full">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary-300"><Tag className="h-12 w-12" /></div>
          )}

          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col gap-1 sm:gap-1.5 max-w-[60%]">
            {hasDiscount && <Badge variant="danger" className="text-[10px] sm:text-xs">-{discountPercent}%</Badge>}
            {product.is_new_arrival && <Badge variant="blue" className="text-[10px] sm:text-xs">جديد</Badge>}
            {product.is_best_seller && <Badge variant="gold" className="text-[10px] sm:text-xs">الأكثر مبيعاً</Badge>}
            {product.is_featured && <Badge variant="primary" className="text-[10px] sm:text-xs">مميز</Badge>}
          </div>

          {showActions && (
            <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
              <button
                onClick={handleToggleWishlist}
                className={cn(
                  'flex-1 p-2 rounded-xl bg-white/90 backdrop-blur-sm shadow-soft transition-all',
                  isWishlisted ? 'text-danger' : 'text-primary-500 hover:text-danger'
                )}
                aria-label={isWishlisted ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
              >
                <Heart className={cn('h-5 w-5 mx-auto', isWishlisted ? 'fill-current' : '')} />
              </button>
              <button
                onClick={handleAddToCart}
                className="flex-1 p-2 rounded-xl bg-gold text-primary-950 font-medium shadow-soft hover:bg-gold-light transition-all"
                aria-label="إضافة للسلة"
              >
                <ShoppingBag className="h-5 w-5 mx-auto" />
              </button>
            </div>
          )}

          {product.rating > 0 && (
            <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full shadow-soft">
              <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gold fill-current" />
              <span className="text-[10px] sm:text-xs font-medium text-primary-700">{product.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-3 sm:p-4 min-w-0">
        {product.brand && (
          <p className="text-xs text-primary-500 mb-1 truncate">{product.brand.name}</p>
        )}
        <Link to={`/product/${product.slug}`} className="block min-w-0">
          <h3 className="font-semibold text-primary-900 mb-1 sm:mb-2 line-clamp-2 group-hover:text-gold transition-colors text-sm sm:text-base leading-tight min-w-0">{product.name}</h3>
        </Link>

        <div className="flex items-center justify-between gap-1 min-w-0">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-wrap">
            <span className="font-bold text-sm sm:text-lg text-gold truncate">{formatPrice(price, currency)}</span>
            {hasDiscount && (
              <span className="text-xs sm:text-sm text-primary-400 line-through truncate">{formatPrice(product.price, currency)}</span>
            )}
          </div>

          {product.stock > 0 && product.stock <= product.low_stock_threshold && (
            <Badge variant="warning" className="text-[10px] sm:text-xs shrink-0">مخزون منخفض</Badge>
          )}
        </div>
      </div>
    </article>
  )
}