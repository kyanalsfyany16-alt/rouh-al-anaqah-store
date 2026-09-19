import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import type { Product, WishlistItem } from '../lib/types'

interface WishlistContextType {
  ids: Set<string>
  products: Product[]
  loading: boolean
  toggle: (product: Product) => Promise<void>
  has: (productId: string) => boolean
  loadServer: () => Promise<void>
}

const WishlistContext = createContext<WishlistContextType | null>(null)
const GUEST_WISHLIST_KEY = 'raa_wishlist_guest'

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [ids, setIds] = useState<Set<string>>(new Set())
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session?.user) {
      loadServer()
    } else {
      loadGuest()
    }
  }, [session])

  const loadServer = async () => {
    if (!session?.user) return
    setLoading(true)
    const { data } = await supabase
      .from('wishlists')
      .select('product_id, product:products(*)')
      .eq('user_id', session.user.id)
    const productIds = data?.map(d => d.product_id).filter(Boolean) || []
    const productData = data?.map(d => d.product).filter(Boolean) as Product[] || []
    setIds(new Set(productIds))
    setProducts(productData)
    setLoading(false)
  }

  const loadGuest = async () => {
    const stored = localStorage.getItem(GUEST_WISHLIST_KEY)
    if (stored) {
      try {
        const parsed: string[] = JSON.parse(stored)
        const productData = await Promise.all(
          parsed.map(async (id) => {
            const { data } = await supabase.from('products').select('*').eq('id', id).single()
            return data
          })
        )
        setIds(new Set(parsed))
        setProducts(productData.filter(Boolean) as Product[])
      } catch {
        localStorage.removeItem(GUEST_WISHLIST_KEY)
      }
    }
  }

  const saveGuest = (newIds: Set<string>) => {
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify([...newIds]))
  }

  const toggle = async (product: Product) => {
    const newIds = new Set(ids)
    if (newIds.has(product.id)) {
      newIds.delete(product.id)
      setProducts(products.filter(p => p.id !== product.id))
    } else {
      newIds.add(product.id)
      setProducts([...products, product])
    }
    setIds(newIds)

    if (session?.user) {
      if (ids.has(product.id)) {
        await supabase.from('wishlists').delete().eq('user_id', session.user.id).eq('product_id', product.id)
      } else {
        await supabase.from('wishlists').insert({ user_id: session.user.id, product_id: product.id })
      }
    } else {
      saveGuest(newIds)
    }
  }

  const has = (productId: string) => ids.has(productId)

  return (
    <WishlistContext.Provider value={{ ids, products, loading, toggle, has, loadServer }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) throw new Error('useWishlist must be used within WishlistProvider')
  return context
}