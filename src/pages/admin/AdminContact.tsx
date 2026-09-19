import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/admin'
import { Button, Input, Label, Textarea, ImageUploader } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { useSettings } from '../../hooks'
import { cn } from '../../lib/utils'
import { Loader2, Save, MapPin, Phone, Mail, Globe } from 'lucide-react'

export function AdminContact() {
  const { settings, refresh } = useSettings()
  const { success, error: toastError } = useToast()
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    email: settings?.email || '',
    phone: settings?.phone || '',
    address: settings?.address || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('settings').upsert({ id: 1, ...formData })
    if (error) toastError(error.message)
    else { success('تم حفظ معلومات التواصل'); refresh() }
    setSaving(false)
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="معلومات التواصل" description="تحديث بيانات التواصل مع العملاء" />
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-primary-200 p-6 space-y-6">
        <div><Label>البريد الإلكتروني</Label><Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
        <div><Label>رقم الهاتف</Label><Input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
        <div><Label>العنوان</Label><Textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} rows={3} /></div>
        <div className="flex justify-end gap-2 pt-4 border-t border-primary-200">
          <Button type="submit" loading={saving} variant="gold"><Save className="h-4 w-4" /> حفظ</Button>
        </div>
      </form>
    </div>
  )
}