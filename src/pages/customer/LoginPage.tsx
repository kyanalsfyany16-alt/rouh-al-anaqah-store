import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Button, Input, Label } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react'
import { cn } from '../../lib/utils'

export function LoginPage() {
  const { signIn } = useAuth()
  const { success, error: toastError } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {}
    if (!email.trim()) newErrors.email = 'البريد الإلكتروني مطلوب'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'بريد إلكتروني غير صالح'
    if (!password) newErrors.password = 'كلمة المرور مطلوبة'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    const { error, role } = await signIn(email, password)
    if (error) {
      toastError(error.message)
    } else {
      success('مرحباً بك!')
      if (role === 'admin' || role === 'super_admin' || role === 'employee') {
        navigate('/admin', { replace: true })
      } else {
        navigate(from, { replace: true })
      }
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
          <h1 className="text-2xl font-display font-bold text-primary-900">تسجيل الدخول</h1>
          <p className="text-primary-500 mt-2">أدخل بياناتك للوصول إلى حسابك</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl border border-primary-200 p-6">
          <div>
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <div className="relative mt-1">
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="pr-12"
                error={!!errors.email}
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="text-danger text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative mt-1">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-12"
                error={!!errors.password}
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="text-danger text-sm mt-1">{errors.password}</p>}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded border-primary-300 text-gold focus:ring-gold" />
              <span className="text-sm text-primary-600">تذكرني</span>
            </label>
            <Link to="/forgot-password" className="text-gold hover:underline text-sm">نسيت كلمة المرور؟</Link>
          </div>

          <Button type="submit" className="w-full py-3" loading={loading} variant="gold">
            دخول
          </Button>
        </form>

        <p className="text-center text-primary-500 mt-6">
          ليس لديك حساب؟ <Link to="/register" className="text-gold hover:underline font-medium">إنشاء حساب جديد</Link>
        </p>
      </div>
    </div>
  )
}