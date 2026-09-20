import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PageHeader, StatusBadge } from '../../components/admin'
import { Button, Input, Label } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { Save, User, Lock, Eye, EyeOff } from 'lucide-react'

export function AdminProfile() {
  const { profile, session, refreshProfile } = useAuth()
  const { success, error: toastError } = useToast()
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        first_name: profile.first_name ?? '',
        last_name: profile.last_name ?? '',
        email: profile.email ?? '',
        phone: profile.phone ?? '',
      }))
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase.from('profiles').update({ first_name: formData.first_name, last_name: formData.last_name, phone: formData.phone }).eq('id', session!.user.id)
      if (error) throw error
      if (formData.new_password) {
        if (formData.new_password !== formData.confirm_password) throw new Error('كلمات المرور غير متطابقة')
        const { error: passError } = await supabase.auth.updateUser({ password: formData.new_password })
        if (passError) throw passError
      }
      success('تم تحديث الملف الشخصي')
      refreshProfile()
      setFormData(prev => ({ ...prev, current_password: '', new_password: '', confirm_password: '' }))
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'فشل التحديث')
    }
    setSaving(false)
  }

  const roleLabel = profile?.role === 'super_admin' ? 'مدير عام' : profile?.role === 'admin' ? 'مدير' : profile?.role === 'employee' ? 'موظف' : profile?.role ?? '—'

  return (
    <div className="max-w-2xl">
      <PageHeader title="ملفي الشخصي" description="إدارة بيانات حسابك" />

      <div className="bg-white rounded-2xl border border-primary-200 p-4 flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-primary-500">الدور:</span>
          <StatusBadge variant={profile?.role === 'super_admin' ? 'danger' : profile?.role === 'admin' ? 'gold' : 'primary'}>{roleLabel}</StatusBadge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-primary-500">الحالة:</span>
          <StatusBadge variant={profile?.is_active ? 'success' : 'danger'}>{profile?.is_active ? 'نشط' : 'معطل'}</StatusBadge>
        </div>
        <span className="text-xs text-primary-400 mr-auto">لا يمكن تغيير الدور من هنا</span>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-primary-200 p-6 space-y-8">
        <section>
          <h3 className="font-semibold text-primary-900 mb-4 flex items-center gap-2"><User className="h-5 w-5" /> المعلومات الشخصية</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full max-w-full">
            <div><Label>الاسم الأول</Label><Input value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} /></div>
            <div><Label>اسم العائلة</Label><Input value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} /></div>
            <div><Label>البريد الإلكتروني</Label><Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled /></div>
            <div><Label>الهاتف</Label><Input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
          </div>
          <p className="text-sm text-primary-500">لا يمكن تغيير البريد الإلكتروني من هنا. تواصل مع مدير عام لتغييره.</p>
        </section>

        <section>
          <h3 className="font-semibold text-primary-900 mb-4 flex items-center gap-2"><Lock className="h-5 w-5" /> تغيير كلمة المرور</h3>
          <div className="space-y-4">
            <div><Label>كلمة المرور الحالية</Label><div className="relative"><Input type={showPassword ? 'text' : 'password'} value={formData.current_password} onChange={e => setFormData({ ...formData, current_password: e.target.value })} className="pr-12" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full max-w-full">
              <div><Label>كلمة المرور الجديدة</Label><Input type="password" value={formData.new_password} onChange={e => setFormData({ ...formData, new_password: e.target.value })} minLength={6} /></div>
              <div><Label>تأكيد كلمة المرور الجديدة</Label><Input type="password" value={formData.confirm_password} onChange={e => setFormData({ ...formData, confirm_password: e.target.value })} /></div>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-2 pt-6 border-t border-primary-200">
          <Button type="submit" loading={saving} variant="gold"><Save className="h-4 w-4" /> حفظ التغييرات</Button>
        </div>
      </form>
    </div>
  )
}