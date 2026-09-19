import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Button, Input, Label } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { Eye, EyeOff, Mail, Lock, User, Shield } from 'lucide-react'
import { cn } from '../../lib/utils'

export function RegisterPage() {
  const { signUp } = useAuth()
  const { success, error: toastError } = useToast()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.first_name.trim()) newErrors.first_name = 'الاسم الأول مطلوب'
    if (!formData.last_name.trim()) newErrors.last_name = 'اسم العائلة مطلوب'
    if (!formData.email.trim()) newErrors.email = 'البريد الإلكتروني مطلوب'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'بريد إلكتروني غير صالح'
    if (!formData.phone.trim()) newErrors.phone = 'رقم الجوال مطلوب'
    if (!formData.password) newErrors.password = 'كلمة المرور مطلوبة'
    else if (formData.password.length < 6) newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'كلمات المرور غير متطابقة'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    const { error } = await signUp(formData.email, formData.password, formData.first_name, formData.last_name, formData.phone)
    if (error) {
      toastError(error.message)
    } else {
      success('تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني.')
      navigate('/login')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary-900 flex items-center justify-center">
              <span className="text-3xl font-display font-bold text-gold">ر</span>
            </div>
            <span className="font-display font-bold text-2xl text-primary-900">روح الأناقة</span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-primary-900">إنشاء حساب جديد</h1>
          <p className="text-primary-500 mt-2">انضم إلينا واستمتع بتجربة تسوق فاخرة</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-2xl border border-primary-200 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="first_name">الاسم الأول</Label>
              <Input id="first_name" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} placeholder="أحمد" error={!!errors.first_name} autoComplete="given-name" />
              {errors.first_name && <p className="text-danger text-sm mt-1">{errors.first_name}</p>}
            </div>
            <div>
              <Label htmlFor="last_name">اسم العائلة</Label>
              <Input id="last_name" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} placeholder="محمد" error={!!errors.last_name} autoComplete="family-name" />
              {errors.last_name && <p className="text-danger text-sm mt-1">{errors.last_name}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <div className="relative mt-1">
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-400" />
              <Input id="email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="example@email.com" className="pr-12" error={!!errors.email} autoComplete="email" />
            </div>
            {errors.email && <p className="text-danger text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <Label htmlFor="phone">رقم الجوال</Label>
            <Input id="phone" type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="05XXXXXXXX" error={!!errors.phone} autoComplete="tel" />
            {errors.phone && <p className="text-danger text-sm mt-1">{errors.phone}</p>}
          </div>

          <div>
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative mt-1">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-400" />
              <Input id="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" className="pr-12" error={!!errors.password} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="text-danger text-sm mt-1">{errors.password}</p>}
          </div>

          <div>
            <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
            <div className="relative mt-1">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-400" />
              <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} placeholder="••••••••" className="pr-12" error={!!errors.confirmPassword} autoComplete="new-password" />
            </div>
            {errors.confirmPassword && <p className="text-danger text-sm mt-1">{errors.confirmPassword}</p>}
          </div>

          <Button type="submit" className="w-full py-3" loading={loading} variant="gold">
            إنشاء الحساب
          </Button>
        </form>

        <p className="text-center text-primary-500 mt-6">
          لديك حساب بالفعل؟ <Link to="/login" className="text-gold hover:underline font-medium">تسجيل الدخول</Link>
        </p>
      </div>
    </div>
  )
}