import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Button, Input, Label } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { User, Mail, Lock, Phone, MapPin, Shield, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

interface Address {
  id: string
  full_name: string
  phone: string
  line1: string
  line2?: string
  city: string
  state?: string
  postal_code?: string
  country: string
  is_default: boolean
}

export function AccountPage() {
  const { profile, refreshProfile, session } = useAuth()
  const { success, error: toastError } = useToast()
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'password'>('profile')
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
  })

  const [addresses, setAddresses] = useState<Address[]>([])
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [addressForm, setAddressForm] = useState({
    full_name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'السعودية',
    is_default: false,
  })

  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  useEffect(() => {
    if (session?.user) loadAddresses()
  }, [session])

  const loadAddresses = async () => {
    const { data } = await supabase.from('addresses').select('*').eq('user_id', session!.user.id).order('is_default', { ascending: false })
    setAddresses(data || [])
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('profiles').update(formData).eq('id', session!.user.id)
    if (error) toastError(error.message)
    else {
      success('تم تحديث الملف الشخصي')
      refreshProfile()
    }
    setLoading(false)
  }

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const payload = { ...addressForm, user_id: session!.user.id }
    if (editingAddress) {
      await supabase.from('addresses').update(payload).eq('id', editingAddress.id)
    } else {
      await supabase.from('addresses').insert(payload)
    }
    success(editingAddress ? 'تم تحديث العنوان' : 'تم إضافة العنوان')
    setShowAddressForm(false)
    setEditingAddress(null)
    setAddressForm({ full_name: '', phone: '', line1: '', line2: '', city: '', state: '', postal_code: '', country: 'السعودية', is_default: false })
    loadAddresses()
    setLoading(false)
  }

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنوان؟')) return
    await supabase.from('addresses').delete().eq('id', id)
    success('تم حذف العنوان')
    loadAddresses()
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.new !== passwordData.confirm) return toastError('كلمات المرور غير متطابقة')
    if (passwordData.new.length < 6) return toastError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: passwordData.new })
    if (error) toastError(error.message)
    else {
      success('تم تغيير كلمة المرور بنجاح')
      setPasswordData({ current: '', new: '', confirm: '' })
    }
    setLoading(false)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="page-title">حسابي</h1>
      </div>

      <div className="flex border-b border-primary-200" role="tablist">
        {[
          { id: 'profile', label: 'الملف الشخصي', icon: User },
          { id: 'addresses', label: 'العناوين', icon: MapPin },
          { id: 'password', label: 'كلمة المرور', icon: Lock },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'px-6 py-4 font-medium border-b-2 transition-colors',
              activeTab === tab.id ? 'border-gold text-gold' : 'border-transparent text-primary-500 hover:text-primary-900'
            )}
            role="tab"
            aria-selected={activeTab === tab.id}
          >
            {tab.icon && <tab.icon className="h-5 w-5 inline ml-2" />}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <form onSubmit={handleProfileUpdate} className="bg-white rounded-2xl border border-primary-200 p-6 max-w-2xl space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-gold">{profile?.first_name?.[0] || profile?.email?.[0] || 'م'}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary-900">{profile?.first_name} {profile?.last_name}</h3>
              <p className="text-primary-500">{profile?.email}</p>
              <span className="badge-gold capitalize">{profile?.role}</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="first_name">الاسم الأول</Label>
              <Input id="first_name" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="last_name">اسم العائلة</Label>
              <Input id="last_name" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} required />
            </div>
          </div>

          <div>
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
          </div>

          <div>
            <Label htmlFor="phone">رقم الجوال</Label>
            <Input id="phone" type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          </div>

          <Button type="submit" loading={loading} variant="gold">حفظ التغييرات</Button>
        </form>
      )}

      {activeTab === 'addresses' && (
        <div className="bg-white rounded-2xl border border-primary-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-primary-900 flex items-center gap-2"><MapPin className="h-5 w-5" /> عناويني</h2>
            <Button onClick={() => { setEditingAddress(null); setAddressForm({ full_name: '', phone: '', line1: '', line2: '', city: '', state: '', postal_code: '', country: 'السعودية', is_default: false }); setShowAddressForm(true) }} variant="gold">
              <Plus className="h-4 w-4" /> إضافة عنوان
            </Button>
          </div>

          {addresses.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {addresses.map(addr => (
                <div key={addr.id} className={cn('p-4 border rounded-xl', addr.is_default ? 'border-gold bg-gold/5' : 'border-primary-200')}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-primary-900">{addr.full_name}</p>
                      <p className="text-sm text-primary-500">{addr.phone}</p>
                      <p className="text-sm text-primary-500 mt-1">{addr.line1}{addr.line2 ? `، ${addr.line2}` : ''}</p>
                      <p className="text-sm text-primary-500">{addr.city}{addr.state ? `، ${addr.state}` : ''} {addr.postal_code ? `، ${addr.postal_code}` : ''}</p>
                      {addr.is_default && <span className="badge-gold text-xs mt-2 inline-block">العنوان الافتراضي</span>}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => { setEditingAddress(addr); setAddressForm(addr); setShowAddressForm(true) }} variant="outline" size="sm">تعديل</Button>
                      <Button onClick={() => handleDeleteAddress(addr.id)} variant="danger" size="sm">حذف</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-primary-500">
              <MapPin className="h-12 w-12 mx-auto text-primary-300 mb-4" />
              <p>لا توجد عناوين محفوظة</p>
              <Button onClick={() => { setEditingAddress(null); setAddressForm({ full_name: '', phone: '', line1: '', line2: '', city: '', state: '', postal_code: '', country: 'السعودية', is_default: false }); setShowAddressForm(true) }} variant="gold" className="mt-4">
                إضافة أول عنوان
              </Button>
            </div>
          )}

          {showAddressForm && (
            <form onSubmit={handleAddressSubmit} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-primary-900">{editingAddress ? 'تعديل العنوان' : 'إضافة عنوان جديد'}</h3>
                  <button onClick={() => { setShowAddressForm(false); setEditingAddress(null) }} className="text-primary-400 hover:text-primary-600">×</button>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>الاسم الكامل</Label>
                    <Input value={addressForm.full_name} onChange={e => setAddressForm({ ...addressForm, full_name: e.target.value })} required />
                  </div>
                  <div>
                    <Label>رقم الجوال</Label>
                    <Input type="tel" value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} required />
                  </div>
                  <div>
                    <Label>العنوان (السطر الأول)</Label>
                    <Input value={addressForm.line1} onChange={e => setAddressForm({ ...addressForm, line1: e.target.value })} required />
                  </div>
                  <div>
                    <Label>العنوان (السطر الثاني) - اختياري</Label>
                    <Input value={addressForm.line2} onChange={e => setAddressForm({ ...addressForm, line2: e.target.value })} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>المدينة</Label>
                      <Input value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} required />
                    </div>
                    <div>
                      <Label>المنطقة/الولاية</Label>
                      <Input value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>الرمز البريدي</Label>
                      <Input value={addressForm.postal_code} onChange={e => setAddressForm({ ...addressForm, postal_code: e.target.value })} />
                    </div>
                    <div>
                      <Label>الدولة</Label>
                      <Input value={addressForm.country} onChange={e => setAddressForm({ ...addressForm, country: e.target.value })} required />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={addressForm.is_default} onChange={e => setAddressForm({ ...addressForm, is_default: e.target.checked })} className="h-4 w-4 rounded border-primary-300 text-gold focus:ring-gold" />
                    <span className="text-sm text-primary-600">جعل هذا العنوان افتراضياً</span>
                  </label>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1" loading={loading} variant="gold">حفظ</Button>
                    <Button type="button" onClick={() => { setShowAddressForm(false); setEditingAddress(null) }} variant="outline" className="flex-1">إلغاء</Button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {activeTab === 'password' && (
        <form onSubmit={handlePasswordChange} className="bg-white rounded-2xl border border-primary-200 p-6 max-w-2xl space-y-6">
          <div>
            <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
            <div className="relative mt-1">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-400" />
              <Input id="currentPassword" type={showCurrentPassword ? 'text' : 'password'} value={passwordData.current} onChange={e => setPasswordData({ ...passwordData, current: e.target.value })} className="pr-12" autoComplete="current-password" />
              <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400">{showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
            </div>
          </div>
          <div>
            <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
            <div className="relative mt-1">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-400" />
              <Input id="newPassword" type={showNewPassword ? 'text' : 'password'} value={passwordData.new} onChange={e => setPasswordData({ ...passwordData, new: e.target.value })} className="pr-12" autoComplete="new-password" minLength={6} />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400">{showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
            </div>
          </div>
          <div>
            <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
            <div className="relative mt-1">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-400" />
              <Input id="confirmPassword" type={showNewPassword ? 'text' : 'password'} value={passwordData.confirm} onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })} className="pr-12" autoComplete="new-password" />
            </div>
          </div>
          <Button type="submit" loading={loading} variant="gold">تغيير كلمة المرور</Button>
        </form>
      )}
    </div>
  )
}