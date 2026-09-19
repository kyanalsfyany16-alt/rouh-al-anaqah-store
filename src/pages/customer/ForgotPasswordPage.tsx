import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Button, Input, Label } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { Mail, ArrowRight } from 'lucide-react'
import { cn } from '../../lib/utils'

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const { success, error: toastError } = useToast()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [errors, setErrors] = useState<{ email?: string }>({})

  const validate = () => {
    const newErrors: { email?: string } = {}
    if (!email.trim()) newErrors.email = 'البريد الإلكتروني مطلوب'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'بريد إلكتروني غير صالح'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    const { error } = await resetPassword(email)
    if (error) {
      toastError(error.message)
    } else {
      setSent(true)
      success('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني')
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
          <h1 className="text-2xl font-display font-bold text-primary-900">استعادة كلمة المرور</h1>
          <p className="text-primary-500 mt-2">أدخل بريدك الإلكتروني لتلقي رابط إعادة التعيين</p>
        </div>

        {sent ? (
          <div className="bg-white rounded-2xl border border-primary-200 p-8 text-center">
            <div className="mx-auto mb-4 p-4 bg-green-100 rounded-full w-fit text-green-600">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold text-primary-900 mb-2">تم إرسال الرابط</h2>
            <p className="text-primary-500 mb-6">تحقق من بريدك الإلكتروني <strong>{email}</strong> واتبع التعليمات لإعادة تعيين كلمة المرور.</p>
            <Link to="/login" className="btn-primary">العودة لتسجيل الدخول</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl border border-primary-200 p-6">
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative mt-1">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-400" />
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" className="pr-12" error={!!errors.email} autoComplete="email" />
              </div>
              {errors.email && <p className="text-danger text-sm mt-1">{errors.email}</p>}
            </div>

            <Button type="submit" className="w-full py-3" loading={loading} variant="gold">
              إرسال رابط الاستعادة
            </Button>
          </form>
        )}

        <p className="text-center text-primary-500 mt-6">
          تذكرت كلمة المرور؟ <Link to="/login" className="text-gold hover:underline font-medium">تسجيل الدخول</Link>
        </p>
      </div>
    </div>
  )
}