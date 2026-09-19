import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Address, BankAccount } from '../../lib/types'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../hooks'
import { useToast } from '../../contexts/ToastContext'
import { cn, formatPrice } from '../../lib/utils'
import { Button, Input, Label, Select, Textarea, Modal } from '../../components/ui'
import { Truck, Building2, FileText, Plus, MapPin, X, AlertTriangle, CheckCircle, Tag } from 'lucide-react'

export function CheckoutPage() {
  const { items, subtotal, clear, validateCart, applyCoupon } = useCart()
  const { user, profile } = useAuth()
  const { defaultCurrency } = useSettings()
  const currency = defaultCurrency?.code || 'SAR'
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'bank_transfer'>('cash_on_delivery')
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [addrForm, setAddrForm] = useState({ full_name: '', phone: '', line1: '', line2: '', city: '', state: '', postal_code: '', country: 'السعودية', is_default: false })
  const [addrSaving, setAddrSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const shipping = subtotal >= 300 ? 0 : items.length ? 30 : 0
  const total = Math.max(0, subtotal - discount + shipping)

  useEffect(() => {
    document.title = 'إتمام الطلب - روح الأناقة'
    if (user) {
      loadAddresses()
      loadBankAccounts()
    }
  }, [user?.id])

  useEffect(() => {
    // Validate cart on mount
    if (items.length) validateCart().then(({ errors }) => setValidationErrors(errors))
  }, [items])

  const loadAddresses = async () => {
    const { data } = await supabase.from('addresses').select('*').eq('user_id', user!.id).order('is_default', { ascending: false }).order('created_at')
    const list = (data as Address[]) ?? []
    setAddresses(list)
    if (list.length && !selectedAddressId) {
      const def = list.find((a) => a.is_default) ?? list[0]
      setSelectedAddressId(def.id)
    }
  }

  const loadBankAccounts = async () => {
    const { data } = await supabase.from('bank_accounts').select('*').eq('is_active', true).order('sort_order')
    setBankAccounts((data as BankAccount[]) ?? [])
    if (data && data.length && !selectedBankId) setSelectedBankId(data[0].id)
  }

  const openAddressModal = (addr?: Address) => {
    if (addr) {
      setEditingAddress(addr)
      setAddrForm({ full_name: addr.full_name, phone: addr.phone, line1: addr.line1, line2: addr.line2 ?? '', city: addr.city, state: addr.state ?? '', postal_code: addr.postal_code ?? '', country: addr.country, is_default: addr.is_default })
    } else {
      setEditingAddress(null)
      setAddrForm({ full_name: profile?.first_name ? `${profile.first_name} ${profile.last_name ?? ''}`.trim() : '', phone: profile?.phone ?? '', line1: '', line2: '', city: '', state: '', postal_code: '', country: 'السعودية', is_default: addresses.length === 0 })
    }
    setShowAddressModal(true)
  }

  const handleAddressSave = async () => {
    if (!addrForm.full_name.trim() || !addrForm.phone.trim() || !addrForm.line1.trim() || !addrForm.city.trim()) {
      toastError('يرجى ملء الحقول المطلوبة')
      return
    }
    setAddrSaving(true)
    const payload = {
      user_id: user!.id,
      full_name: addrForm.full_name.trim(),
      phone: addrForm.phone.trim(),
      line1: addrForm.line1.trim(),
      line2: addrForm.line2.trim() || null,
      city: addrForm.city.trim(),
      state: addrForm.state.trim() || null,
      postal_code: addrForm.postal_code.trim() || null,
      country: addrForm.country.trim(),
      is_default: addrForm.is_default,
    }
    if (addrForm.is_default) {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', user!.id)
    }
    let error
    if (editingAddress) {
      const { error: e } = await supabase.from('addresses').update(payload).eq('id', editingAddress.id)
      error = e
    } else {
      const { error: e } = await supabase.from('addresses').insert(payload)
      error = e
    }
    if (error) toastError(error.message)
    else {
      success(editingAddress ? 'تم تحديث العنوان' : 'تمت إضافة العنوان')
      setShowAddressModal(false)
      setEditingAddress(null)
      loadAddresses()
    }
    setAddrSaving(false)
  }

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('حذف العنوان؟')) return
    await supabase.from('addresses').delete().eq('id', id)
    success('تم حذف العنوان')
    if (selectedAddressId === id) setSelectedAddressId(null)
    loadAddresses()
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')
    const res = await applyCoupon(couponCode.trim())
    if (res.error) {
      setCouponError(res.error)
      setDiscount(0)
    } else {
      setDiscount(res.discount)
    }
    setCouponLoading(false)
  }

  const handleReceiptChange = (file: File | null) => {
    if (!file) {
      setReceiptFile(null)
      setReceiptPreview(null)
      return
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type)) {
      toastError('نوع الملف غير مدعوم — JPG/PNG/WebP/PDF فقط')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toastError('حجم الملف يتجاوز 5MB')
      return
    }
    setReceiptFile(file)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setReceiptPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setReceiptPreview(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return toastError('يرجى تسجيل الدخول')
    if (!items.length) return toastError('السلة فارغة')
    if (validationErrors.length) return toastError(validationErrors[0])
    if (!selectedAddressId) return toastError('اختر عنوان التوصيل')
    if (paymentMethod === 'bank_transfer' && !selectedBankId) return toastError('اختر الحساب البنكي')
    if (paymentMethod === 'bank_transfer' && !receiptFile) return toastError('يرجى رفع إيصال التحويل')

    const selectedAddress = addresses.find((a) => a.id === selectedAddressId)
    if (!selectedAddress) return toastError('العنوان غير موجود')

    const { valid, errors } = await validateCart()
    if (!valid) {
      setValidationErrors(errors)
      return toastError(errors[0])
    }

    setLoading(true)
    try {
      const shippingAddress = {
        full_name: selectedAddress.full_name,
        phone: selectedAddress.phone,
        line1: selectedAddress.line1,
        line2: selectedAddress.line2 ?? undefined,
        city: selectedAddress.city,
        state: selectedAddress.state ?? undefined,
        postal_code: selectedAddress.postal_code ?? undefined,
        country: selectedAddress.country,
      }

      const pItems = items.map((i) => ({ product_id: i.product_id, variant_id: i.variant_id ?? null, quantity: i.quantity }))

      const { data, error } = await supabase.rpc('create_order_atomic', {
        p_user_id: user.id,
        p_shipping_address: shippingAddress,
        p_payment_method: paymentMethod,
        p_bank_account_id: paymentMethod === 'bank_transfer' ? selectedBankId : null,
        p_coupon_code: couponCode.trim() || null,
        p_notes: notes.trim() || null,
        p_items: pItems,
      })

      if (error) throw new Error(error.message)
      const res = data as { order_id: string; total: number }
      const orderId = res.order_id

      // Handle receipt upload for bank transfer
      if (paymentMethod === 'bank_transfer' && receiptFile && orderId) {
        const ext = receiptFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
        const path = `${user.id}/${orderId}/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`
        const { error: upErr } = await supabase.storage.from('payment-receipts').upload(path, receiptFile, { cacheControl: '3600', upsert: false })
        if (upErr) {
          toastError('تم إنشاء الطلب لكن فشل رفع الإيصال — يمكنك رفعه من صفحة الطلب')
        } else {
          const { data: urlData } = supabase.storage.from('payment-receipts').getPublicUrl(path)
          // Public URL not used for private, but store for reference; storage_path is needed
          const { error: recErr } = await supabase.from('payment_receipts').insert({
            order_id: orderId,
            user_id: user.id,
            bank_account_id: selectedBankId,
            storage_path: path,
            public_url: urlData.publicUrl,
            amount: total,
            currency_code: currency,
            status: 'pending_verification',
          })
          if (!recErr) {
            await supabase.from('orders').update({ receipt_id: (await supabase.from('payment_receipts').select('id').eq('order_id', orderId).single()).data?.id }).eq('id', orderId)
          }
        }
      }

      // Clear cart only on success
      await clear()
      success('تم إنشاء الطلب بنجاح')
      navigate(`/orders/${orderId}`, { replace: true })
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'فشل إنشاء الطلب')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-primary-900 mb-2">يرجى تسجيل الدخول</h1>
        <p className="text-primary-500 mb-6">يجب تسجيل الدخول لإتمام الشراء</p>
        <div className="flex gap-3 justify-center">
          <Link to="/login" className="btn-gold">
            تسجيل الدخول
          </Link>
          <Link to="/register" className="btn-outline">
            إنشاء حساب
          </Link>
        </div>
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="text-center py-16">
        <p className="text-primary-500">سلتك فارغة</p>
        <Link to="/shop" className="btn-gold mt-4 inline-block">
          تسوق الآن
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        {/* Addresses */}
        <section className="bg-white rounded-2xl border border-primary-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-primary-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gold" /> عنوان التوصيل
            </h2>
            <Button type="button" onClick={() => openAddressModal()} variant="outline" size="sm">
              <Plus className="h-4 w-4" /> إضافة عنوان
            </Button>
          </div>
          {addresses.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={cn(
                    'relative p-4 border-2 rounded-xl cursor-pointer flex flex-col gap-1',
                    selectedAddressId === addr.id ? 'border-gold bg-gold/5' : 'border-primary-200 hover:border-gold'
                  )}
                >
                  <input type="radio" name="address" checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} className="absolute top-3 left-3 h-4 w-4 text-gold" />
                  <p className="font-medium text-primary-900 pr-6">{addr.full_name}</p>
                  <p className="text-sm text-primary-500">{addr.phone}</p>
                  <p className="text-sm text-primary-600">
                    {addr.line1}
                    {addr.line2 ? `، ${addr.line2}` : ''} — {addr.city}
                  </p>
                  <p className="text-xs text-primary-400">
                    {addr.state ?? ''} {addr.postal_code ?? ''} • {addr.country}
                  </p>
                  {addr.is_default && <span className="absolute top-2 right-2 text-[10px] bg-gold text-primary-950 px-1.5 py-0.5 rounded-full">افتراضي</span>}
                  <div className="flex gap-2 mt-2">
                    <button type="button" onClick={() => openAddressModal(addr)} className="text-xs text-primary-500 hover:text-gold">
                      تعديل
                    </button>
                    <button type="button" onClick={() => handleDeleteAddress(addr.id)} className="text-xs text-danger hover:underline">
                      حذف
                    </button>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-primary-500">لا توجد عناوين — أضف عنواناً للمتابعة</p>
          )}
        </section>

        {/* Payment */}
        <section className="bg-white rounded-2xl border border-primary-200 p-5">
          <h2 className="font-semibold text-primary-900 mb-4">طريقة الدفع</h2>
          <div className="grid gap-3">
            <label className={cn('p-4 border-2 rounded-xl flex items-center gap-3 cursor-pointer', paymentMethod === 'cash_on_delivery' ? 'border-gold bg-gold/5' : 'border-primary-200')}>
              <input type="radio" checked={paymentMethod === 'cash_on_delivery'} onChange={() => setPaymentMethod('cash_on_delivery')} className="h-4 w-4 text-gold" />
              <Truck className="h-5 w-5 text-gold" />
              <div>
                <p className="font-medium text-primary-900">الدفع عند الاستلام</p>
                <p className="text-xs text-primary-500">ادفع نقداً عند وصول الطلب</p>
              </div>
            </label>
            <label className={cn('p-4 border-2 rounded-xl flex items-center gap-3 cursor-pointer', paymentMethod === 'bank_transfer' ? 'border-gold bg-gold/5' : 'border-primary-200')}>
              <input type="radio" checked={paymentMethod === 'bank_transfer'} onChange={() => setPaymentMethod('bank_transfer')} className="h-4 w-4 text-gold" />
              <Building2 className="h-5 w-5 text-gold" />
              <div>
                <p className="font-medium text-primary-900">تحويل بنكي</p>
                <p className="text-xs text-primary-500">حوّل المبلغ وارفع الإيصال</p>
              </div>
            </label>
          </div>

          {paymentMethod === 'bank_transfer' && (
            <div className="mt-4 space-y-4">
              {bankAccounts.length ? (
                <div className="grid gap-2">
                  {bankAccounts.map((acc) => (
                    <label key={acc.id} className={cn('p-3 border-2 rounded-xl flex items-center gap-3 cursor-pointer', selectedBankId === acc.id ? 'border-gold bg-gold/5' : 'border-primary-200')}>
                      <input type="radio" checked={selectedBankId === acc.id} onChange={() => setSelectedBankId(acc.id)} className="h-4 w-4 text-gold" />
                      <div className="flex-1">
                        <p className="font-medium text-primary-900 text-sm">{acc.bank_name} — {acc.account_holder}</p>
                        <p className="text-xs text-primary-500">{acc.account_number} {acc.iban ? `• IBAN ${acc.iban}` : ''}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">لا توجد حسابات بنكية نشطة حالياً</p>
              )}

              <div className="p-4 bg-primary-50 rounded-xl border border-primary-200">
                <p className="text-sm font-medium text-primary-900 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> رفع إيصال التحويل *
                </p>
                <p className="text-xs text-primary-500 mt-1">الملفات المسموحة: JPG/PNG/WebP/PDF حتى 5MB — سيُحفظ بشكل خاص</p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => handleReceiptChange(e.target.files?.[0] ?? null)}
                  className="mt-3 block w-full text-sm text-primary-700 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-gold file:text-primary-950 file:font-medium hover:file:bg-gold-light"
                />
                {receiptFile && (
                  <div className="mt-3 flex items-center gap-3 p-2 bg-white rounded-xl border">
                    {receiptPreview ? <img src={receiptPreview} alt="إيصال" className="w-16 h-16 rounded-lg object-cover" /> : <FileText className="h-8 w-8 text-primary-400" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{receiptFile.name}</p>
                      <p className="text-xs text-primary-500">{(receiptFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button type="button" onClick={() => handleReceiptChange(null)} className="p-1 text-danger hover:bg-red-50 rounded-full">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-primary-200 p-5">
          <Label>ملاحظات الطلب (اختياري)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="مثال: التوصيل بعد 5 مساءً" rows={3} />
        </section>

        {validationErrors.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> تنبيهات
            </p>
            <ul className="list-disc list-inside mt-2">
              {validationErrors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl border border-primary-200 p-5 sticky top-20">
          <h3 className="font-semibold text-primary-900 mb-4">ملخص الطلب</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {items.map((item) => {
              const price = item.variant?.price ?? item.product?.discount_price ?? item.product?.price ?? 0
              return (
                <div key={`${item.product_id}-${item.variant_id ?? 'base'}`} className="flex gap-3 text-sm">
                  <img src={item.variant?.image_url || item.product?.images?.[0] || '/placeholder.svg'} alt="" className="w-12 h-12 rounded-lg object-cover border" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.product?.name}</p>
                    {item.variant && <p className="text-xs text-gold">{item.variant.name}</p>}
                    <p className="text-xs text-primary-500">
                      {formatPrice(price, currency)} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-medium">{formatPrice(price * item.quantity, currency)}</span>
                </div>
              )
            })}
          </div>
          <div className="border-t border-primary-200 mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-primary-600">
              <span>المجموع</span>
              <span>{formatPrice(subtotal, currency)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-success">
                <span>الخصم ({couponCode})</span>
                <span>-{formatPrice(discount, currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-primary-600">
              <span>الشحن</span>
              <span>{shipping === 0 ? <span className="text-success">مجاني</span> : formatPrice(shipping, currency)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t border-primary-200 pt-2">
              <span>الإجمالي</span>
              <span className="text-gold">{formatPrice(total, currency)}</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-primary-50 rounded-xl border border-primary-200">
            <p className="text-xs font-medium text-primary-700 mb-2 flex items-center gap-1">
              <Tag className="h-3 w-3" /> كوبون
            </p>
            <div className="flex gap-2">
              <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="كود" className="flex-1 text-sm" />
              <Button type="button" onClick={handleApplyCoupon} loading={couponLoading} variant="outline" size="sm">
                تطبيق
              </Button>
            </div>
            {couponError && <p className="text-danger text-xs mt-2">{couponError}</p>}
            {discount > 0 && !couponError && <p className="text-success text-xs mt-2 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> تم التطبيق</p>}
          </div>

          <Button type="submit" loading={loading} variant="gold" className="w-full mt-5 py-3">
            تأكيد الطلب
          </Button>
          <p className="text-xs text-primary-400 text-center mt-2">سيتم التحقق من السعر والمخزون قبل الإنشاء</p>
        </div>
      </div>

      <Modal open={showAddressModal} onClose={() => setShowAddressModal(false)} title={editingAddress ? 'تعديل العنوان' : 'إضافة عنوان'} size="lg">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>الاسم الكامل *</Label>
              <Input value={addrForm.full_name} onChange={(e) => setAddrForm({ ...addrForm, full_name: e.target.value })} />
            </div>
            <div>
              <Label>الجوال *</Label>
              <Input value={addrForm.phone} onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>العنوان *</Label>
            <Input value={addrForm.line1} onChange={(e) => setAddrForm({ ...addrForm, line1: e.target.value })} placeholder="الشارع، الحي" />
          </div>
          <div>
            <Label>تفاصيل إضافية</Label>
            <Input value={addrForm.line2} onChange={(e) => setAddrForm({ ...addrForm, line2: e.target.value })} placeholder="شقة، طابق..." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>المدينة *</Label>
              <Input value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} />
            </div>
            <div>
              <Label>المنطقة</Label>
              <Input value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>الرمز البريدي</Label>
              <Input value={addrForm.postal_code} onChange={(e) => setAddrForm({ ...addrForm, postal_code: e.target.value })} />
            </div>
            <div>
              <Label>الدولة</Label>
              <Input value={addrForm.country} onChange={(e) => setAddrForm({ ...addrForm, country: e.target.value })} />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={addrForm.is_default} onChange={(e) => setAddrForm({ ...addrForm, is_default: e.target.checked })} className="h-4 w-4 rounded text-gold" />
            <span className="text-sm">افتراضي</span>
          </label>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" onClick={() => setShowAddressModal(false)} variant="outline">
              إلغاء
            </Button>
            <Button type="button" onClick={handleAddressSave} loading={addrSaving} variant="gold">
              حفظ
            </Button>
          </div>
        </div>
      </Modal>
    </form>
  )
}
