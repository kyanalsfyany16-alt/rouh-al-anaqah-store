import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatPrice(amount: number, currencyCode: string = 'SAR'): string {
  const formatter = new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return formatter.format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-SA').format(num)
}

export function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  }).format(date)
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'الآن'
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`
  if (diffHours < 24) return `منذ ${diffHours} ساعة`
  if (diffDays < 7) return `منذ ${diffDays} يوم`
  return formatDate(dateString)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\u200f\u200e]+/g, '-')
    .replace(/[^\w\-ء-ي]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function generateSKU(prefix: string = 'PRD'): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

export function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.charAt(0) || ''
  const last = lastName?.charAt(0) || ''
  return (first + last).toUpperCase() || 'م'
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length).trim() + '...'
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase()
}

export function isValidImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  const maxSize = 5 * 1024 * 1024

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'نوع الملف غير مدعوم. يرجى اختيار صورة JPEG أو PNG أو WebP' }
  }
  if (file.size > maxSize) {
    return { valid: false, error: 'حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت' }
  }
  return { valid: true }
}

export function getStoragePath(bucket: string, filename: string): string {
  const ext = getFileExtension(filename)
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${bucket}/${timestamp}_${random}.${ext}`
}

export const ROLES: { value: UserRole; label: string; hierarchy: number }[] = [
  { value: 'customer', label: 'عميل', hierarchy: 1 },
  { value: 'employee', label: 'موظف', hierarchy: 2 },
  { value: 'admin', label: 'مدير', hierarchy: 3 },
  { value: 'super_admin', label: 'مدير عام', hierarchy: 4 },
]

export const ORDER_STATUSES: { value: OrderStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'قيد الانتظار', color: 'warning' },
  { value: 'paid', label: 'مدفوع', color: 'info' },
  { value: 'processing', label: 'قيد التجهيز', color: 'primary' },
  { value: 'shipped', label: 'تم الشحن', color: 'blue' },
  { value: 'delivered', label: 'تم التوصيل', color: 'success' },
  { value: 'cancelled', label: 'ملغي', color: 'danger' },
  { value: 'returned', label: 'مرتجع', color: 'neutral' },
]

export const PAYMENT_STATUSES: { value: PaymentStatus; label: string; color: string }[] = [
  { value: 'unpaid', label: 'غير مدفوع', color: 'danger' },
  { value: 'pending_verification', label: 'بانتظار التأكيد', color: 'warning' },
  { value: 'paid', label: 'مدفوع', color: 'success' },
  { value: 'refunded', label: 'مسترد', color: 'info' },
]