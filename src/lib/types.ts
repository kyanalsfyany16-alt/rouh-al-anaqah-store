export type UserRole = 'customer' | 'employee' | 'admin' | 'super_admin'
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
export type PaymentStatus = 'unpaid' | 'pending_verification' | 'paid' | 'refunded'
export type PaymentMethod = 'cash_on_delivery' | 'bank_transfer'
export type CouponType = 'percentage' | 'fixed'
export type BannerPosition = 'home' | 'shop' | 'category' | 'product'
export type AttributeType = 'text' | 'number' | 'boolean' | 'date' | 'image' | 'select' | 'multiselect'

export interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  parent_id: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  children?: Category[]
}

export interface Brand {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  is_active: boolean
  created_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  specifications: Record<string, unknown> | null
  price: number
  discount_price: number | null
  tax_rate: number
  sku: string | null
  barcode: string | null
  stock: number
  min_stock: number
  low_stock_threshold: number
  brand_id: string | null
  category_id: string | null
  images: string[]
  currency_code: string
  is_featured: boolean
  is_published: boolean
  is_returnable: boolean
  is_new_arrival: boolean
  is_best_seller: boolean
  rating: number
  review_count: number
  created_at: string
  updated_at: string
  brand?: Brand | null
  category?: Category | null
  variants?: ProductVariant[]
  attribute_values?: ProductAttributeValue[]
}

export interface ProductVariant {
  id: string
  product_id: string
  name: string
  sku: string | null
  price: number
  stock: number
  image_url: string | null
  attributes: Record<string, string>
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface CategoryAttribute {
  id: string
  category_id: string
  name: string
  slug: string
  type: AttributeType
  options: unknown[]
  is_required: boolean
  sort_order: number
  created_at: string
}

export interface ProductAttributeValue {
  id: string
  product_id: string
  attribute_id: string
  value_text: string | null
  value_number: number | null
  value_boolean: boolean | null
  value_date: string | null
  value_image: string | null
  created_at: string
  attribute?: CategoryAttribute
}

export interface ProductImage {
  id: string
  product_id: string
  storage_path: string
  public_url: string
  sort_order: number
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  status: OrderStatus
  subtotal: number
  discount: number
  shipping: number
  total: number
  coupon_id: string | null
  shipping_address: ShippingAddress
  payment_method: PaymentMethod
  notes: string | null
  payment_status: PaymentStatus
  bank_account_id: string | null
  receipt_id: string | null
  created_at: string
  updated_at: string
  user?: Profile
  items?: OrderItem[]
  coupon?: Coupon | null
  bank_account?: BankAccount | null
  receipt?: PaymentReceipt | null
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  variant_id?: string | null
  variant_name?: string | null
  variant_attributes?: Record<string, string> | null
  name: string
  price: number
  quantity: number
  image_url: string | null
  product?: Product | null
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  variant_id?: string | null
  quantity: number
  created_at: string
  product?: Product
  variant?: ProductVariant | null
}

export interface WishlistItem {
  id: string
  user_id: string
  product_id: string
  created_at: string
  product?: Product
}

export interface Coupon {
  id: string
  code: string
  type: CouponType
  value: number
  min_order: number
  max_uses: number | null
  used_count: number
  is_active: boolean
  valid_from: string | null
  valid_until: string | null
  created_at: string
}

export interface Address {
  id: string
  user_id: string
  full_name: string
  phone: string
  line1: string
  line2: string | null
  city: string
  state: string | null
  postal_code: string | null
  country: string
  is_default: boolean
  created_at: string
}

export interface ShippingAddress {
  full_name: string
  phone: string
  line1: string
  line2?: string
  city: string
  state?: string
  postal_code?: string
  country: string
}

export interface Banner {
  id: string
  title: string | null
  subtitle: string | null
  image_url: string
  link_url: string | null
  position: BannerPosition
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface Settings {
  id: number
  store_name: string
  logo_url: string | null
  favicon_url: string | null
  email: string | null
  phone: string | null
  address: string | null
  about_us: string | null
  privacy_policy: string | null
  terms: string | null
  shipping_policy: string | null
  return_policy: string | null
  tax_rate: number
  default_currency_code: string | null
  created_at: string
  updated_at: string
}

export interface SocialMedia {
  id: string
  platform: string
  url: string
  icon: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  rate: number
  is_default: boolean
  is_active: boolean
  created_at: string
}

export interface BankAccount {
  id: string
  bank_name: string
  account_holder: string
  account_number: string
  iban: string | null
  currency_code: string
  notes: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface PaymentReceipt {
  id: string
  order_id: string
  user_id: string
  bank_account_id: string | null
  storage_path: string
  public_url: string
  amount: number
  currency_code: string
  status: PaymentStatus
  admin_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface Review {
  id: string
  product_id: string
  user_id: string
  rating: number
  comment: string | null
  is_approved: boolean
  created_at: string
  user?: Profile
  product?: Product
}

export interface Notification {
  id: string
  user_id: string | null
  title: string
  message: string | null
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  created_at: string
}

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}