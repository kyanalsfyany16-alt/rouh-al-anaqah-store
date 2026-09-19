import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Product } from '../../lib/types'
import { ProductCard, ProductGrid, EmptyState, LoadingSkeleton } from '../../components/ui'
import { useWishlist } from '../../contexts/WishlistContext'
import { useSettings } from '../../hooks'
import { cn, formatPrice } from '../../lib/utils'
import { Heart, ShoppingBag, Trash2 } from 'lucide-react'

export function WishlistPage() {
  const { products, loading, toggle, has } = useWishlist()
  const { defaultCurrency } = useSettings()
  const currency = defaultCurrency?.code || 'SAR'

  if (loading) {
    return <ProductGrid><LoadingSkeleton variant="product" count={8} /></ProductGrid>
  }

  return (
    <div className="space-y-8">
      <h1 className="page-title">المفضلة ({products.length})</h1>

      {products.length > 0 ? (
        <>
          <ProductGrid>
            {products.map(product => {
              const price = product.discount_price ?? product.price
              const hasDiscount = product.discount_price && product.discount_price < product.price
              const discountPercent = hasDiscount ? Math.round((1 - (product.discount_price! / product.price)) * 100) : 0
              const isWishlisted = has(product.id)

              return (
                <ProductCard key={product.id} product={product} />
              )
            })}
          </ProductGrid>
        </>
      ) : (
        <EmptyState
          icon={<Heart className="h-12 w-12" />}
          title="قائمة المفضلة فارغة"
          description="لم تقم بإضافة أي منتجات إلى المفضلة بعد. ابدأ التسوق وأضف ما يعجبك!"
          action={<Link to="/shop" className="btn-gold">تسوق الآن</Link>}
        />
      )}
    </div>
  )
}