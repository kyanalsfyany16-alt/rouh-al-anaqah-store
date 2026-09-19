import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import type { Product, ProductVariant, CartItem } from '../lib/types'

interface CartContextType {
  items: CartItem[]
  count: number
  subtotal: number
  loading: boolean
  addItem: (product: Product, variant?: ProductVariant | null, quantity?: number) => Promise<void>
  updateQuantity: (productId: string, quantity: number, variantId?: string | null) => Promise<void>
  removeItem: (productId: string, variantId?: string | null) => Promise<void>
  clear: () => Promise<void>
  loadServer: () => Promise<void>
  validateCart: () => Promise<{ valid: boolean; errors: string[] }>
  applyCoupon: (code: string) => Promise<{ discount: number; couponId?: string; error?: string }>
  mergeGuestCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | null>(null)
const GUEST_CART_KEY = 'raa_cart_guest'

type GuestItem = { product_id: string; variant_id?: string | null; quantity: number }

export function CartProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)

  const count = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = items.reduce((sum, i) => {
    const price = i.variant?.price ?? i.product?.discount_price ?? i.product?.price ?? 0
    return sum + price * i.quantity
  }, 0)

  // Load on auth change with merge
  useEffect(() => {
    if (session?.user) {
      // If guest cart exists, merge first
      const guestRaw = localStorage.getItem(GUEST_CART_KEY)
      if (guestRaw) {
        mergeGuestCart().then(() => loadServer())
      } else {
        loadServer()
      }
    } else {
      loadGuest()
    }
  }, [session?.user?.id])

  const loadServer = async () => {
    if (!session?.user) return
    setLoading(true)
    const { data } = await supabase
      .from('cart_items')
      .select('*, product:products(*), variant:product_variants(*)')
      .eq('user_id', session.user.id)
      .order('created_at')
    setItems((data as CartItem[]) ?? [])
    setLoading(false)
  }

  const loadGuest = async () => {
    const stored = localStorage.getItem(GUEST_CART_KEY)
    if (!stored) {
      setItems([])
      return
    }
    try {
      const parsed: GuestItem[] = JSON.parse(stored)
      if (!parsed.length) {
        setItems([])
        return
      }
      const enriched = await Promise.all(
        parsed.map(async (g) => {
          const { data: prod } = await supabase.from('products').select('*').eq('id', g.product_id).single()
          let variant: ProductVariant | null = null
          if (g.variant_id) {
            const { data: v } = await supabase.from('product_variants').select('*').eq('id', g.variant_id).single()
            variant = (v as ProductVariant) ?? null
          }
          return {
            id: `guest-${g.product_id}-${g.variant_id ?? 'base'}`,
            user_id: '',
            product_id: g.product_id,
            variant_id: g.variant_id ?? null,
            quantity: g.quantity,
            created_at: new Date().toISOString(),
            product: prod as Product,
            variant,
          } as CartItem
        })
      )
      // Filter out deleted/unpublished
      const valid = enriched.filter((i) => i.product && i.product.is_published)
      setItems(valid)
    } catch {
      localStorage.removeItem(GUEST_CART_KEY)
      setItems([])
    }
  }

  const saveGuest = (newItems: CartItem[]) => {
    const toStore: GuestItem[] = newItems.map((i) => ({ product_id: i.product_id, variant_id: i.variant_id ?? null, quantity: i.quantity }))
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(toStore))
  }

  const mergeGuestCart = async () => {
    const raw = localStorage.getItem(GUEST_CART_KEY)
    if (!raw || !session?.user) return
    try {
      const guestItems: GuestItem[] = JSON.parse(raw)
      for (const g of guestItems) {
        // Check if already exists
        const { data: existing } = await supabase
          .from('cart_items')
          .select('quantity')
          .eq('user_id', session.user.id)
          .eq('product_id', g.product_id)
          .eq('variant_id', g.variant_id ?? null)
          .maybeSingle()
        if (existing) {
          await supabase
            .from('cart_items')
            .update({ quantity: existing.quantity + g.quantity })
            .eq('user_id', session.user.id)
            .eq('product_id', g.product_id)
            .eq('variant_id', g.variant_id ?? null)
        } else {
          await supabase.from('cart_items').insert({ user_id: session.user.id, product_id: g.product_id, variant_id: g.variant_id ?? null, quantity: g.quantity })
        }
      }
      localStorage.removeItem(GUEST_CART_KEY)
    } catch {
      // ignore
    }
  }

  const addItem = async (product: Product, variant: ProductVariant | null = null, quantity = 1) => {
    const variantId = variant?.id ?? null
    const existingIdx = items.findIndex((i) => i.product_id === product.id && (i.variant_id ?? null) === variantId)
    let newItems: CartItem[]
    if (existingIdx >= 0) {
      newItems = [...items]
      newItems[existingIdx] = { ...newItems[existingIdx], quantity: newItems[existingIdx].quantity + quantity }
    } else {
      newItems = [
        ...items,
        {
          id: `temp-${Date.now()}-${Math.random()}`,
          user_id: session?.user?.id ?? '',
          product_id: product.id,
          variant_id: variantId,
          quantity,
          created_at: new Date().toISOString(),
          product,
          variant: variant ?? null,
        },
      ]
    }
    setItems(newItems)
    if (session?.user) {
      const qty = newItems[existingIdx >= 0 ? existingIdx : newItems.length - 1].quantity
      const { error } = await supabase.from('cart_items').upsert(
        { user_id: session.user.id, product_id: product.id, variant_id: variantId, quantity: qty },
        { onConflict: 'user_id,product_id,variant_id' }
      )
      if (error) await loadServer()
    } else {
      saveGuest(newItems)
    }
  }

  const updateQuantity = async (productId: string, quantity: number, variantId: string | null = null) => {
    if (quantity < 1) return removeItem(productId, variantId)
    const newItems = items.map((i) => (i.product_id === productId && (i.variant_id ?? null) === (variantId ?? null) ? { ...i, quantity } : i))
    setItems(newItems)
    if (session?.user) {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('user_id', session.user.id)
        .eq('product_id', productId)
        .eq('variant_id', variantId ?? null)
      if (error) await loadServer()
    } else {
      saveGuest(newItems)
    }
  }

  const removeItem = async (productId: string, variantId: string | null = null) => {
    const newItems = items.filter((i) => !(i.product_id === productId && (i.variant_id ?? null) === (variantId ?? null)))
    setItems(newItems)
    if (session?.user) {
      await supabase.from('cart_items').delete().eq('user_id', session.user.id).eq('product_id', productId).eq('variant_id', variantId ?? null)
    } else {
      saveGuest(newItems)
    }
  }

  const clear = async () => {
    setItems([])
    if (session?.user) {
      await supabase.from('cart_items').delete().eq('user_id', session.user.id)
    } else {
      localStorage.removeItem(GUEST_CART_KEY)
    }
  }

  const validateCart = async (): Promise<{ valid: boolean; errors: string[] }> => {
    const errors: string[] = []
    for (const item of items) {
      const { data: prod } = await supabase.from('products').select('is_published, stock, price, discount_price, name').eq('id', item.product_id).single()
      if (!prod || prod.is_published === false) {
        errors.push(`المنتج ${item.product?.name ?? ''} غير متاح`)
        continue
      }
      if (item.variant_id) {
        const { data: v } = await supabase.from('product_variants').select('stock, is_active, name').eq('id', item.variant_id).single()
        if (!v || v.is_active === false) errors.push(`المتغير غير متاح لـ ${item.product?.name}`)
        else if (v.stock < item.quantity) errors.push(`المخزون غير كافٍ لـ ${item.product?.name} - ${v.name} (متوفر ${v.stock})`)
      } else {
        if (prod.stock < item.quantity) errors.push(`المخزون غير كافٍ لـ ${prod.name} (متوفر ${prod.stock})`)
      }
    }
    return { valid: errors.length === 0, errors }
  }

  const applyCoupon = async (code: string) => {
    const { data, error } = await supabase.rpc('validate_coupon', { p_code: code, p_user_id: session?.user?.id ?? null, p_subtotal: subtotal })
    if (error) return { discount: 0, error: error.message }
    const res = data as { valid: boolean; discount: number; coupon_id: string; message?: string }
    if (!res.valid) return { discount: 0, error: res.message || 'كوبون غير صالح' }
    return { discount: res.discount, couponId: res.coupon_id }
  }

  return (
    <CartContext.Provider value={{ items, count, subtotal, loading, addItem, updateQuantity, removeItem, clear, loadServer, validateCart, applyCoupon, mergeGuestCart } as unknown as CartContextType}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
