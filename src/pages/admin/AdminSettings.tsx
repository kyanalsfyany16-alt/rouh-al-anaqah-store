import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/admin'
import { Button, Input, Label, Textarea, ImageUploader } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { useSettings } from '../../hooks'
import { cn } from '../../lib/utils'
import { Loader2, Save, Image, MapPin, Phone, Mail, Globe, Shield, Key } from 'lucide-react'

export function AdminSettings() {
  const { settings, refresh } = useSettings()
  const { success, error: toastError } = useToast()
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    store_name: settings?.store_name || 'روح الأناقة',
    email: settings?.email || '',
    phone: settings?.phone || '',
    address: settings?.address || '',
    about_us: settings?.about_us || '',
    privacy_policy: settings?.privacy_policy || '',
    terms: settings?.terms || '',
    shipping_policy: settings?.shipping_policy || '',
    return_policy: settings?.return_policy || '',
    tax_rate: settings?.tax_rate || 0,
    logo_url: settings?.logo_url || '',
    favicon_url: settings?.favicon_url || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('settings').upsert({ id: 1, ...formData })
    if (error) toastError(error.message)
    else { success('تم حفظ الإعدادات'); refresh() }
    setSaving(false)
  }

  return (
    <div className="max-w-4xl">
      <PageHeader title="إعدادات المتجر" description="إعدادات عامة ومعلومات المتجر" />
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-primary-200 p-6 space-y-8">
        <section>
          <h3 className="font-semibold text-primary-900 mb-4 flex items-center gap-2"><Image className="h-5 w-5" /> المعلومات الأساسية</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>اسم المتجر *</Label><Input value={formData.store_name} onChange={e => setFormData({ ...formData, store_name: e.target.value })} required /></div>
            <div><Label>البريد الإلكتروني</Label><Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
            <div><Label>الهاتف</Label><Input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
            <div><Label>معدل الضريبة %</Label><Input type="number" step="0.01" min="0" value={formData.tax_rate} onChange={e => setFormData({ ...formData, tax_rate: Number(e.target.value) })} /></div>
          </div>
          <div><Label>العنوان</Label><Textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} rows={2} /></div>
        </section>

        <section>
          <h3 className="font-semibold text-primary-900 mb-4 flex items-center gap-2"><Shield className="h-5 w-5" /> الشعار والأيقونة</h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <div><Label>الشعار (الشاشة الرئيسية)</Label><ImageUploader bucket="store-assets" value={formData.logo_url} onChange={url => setFormData({ ...formData, logo_url: url || '' })} path="logo" /></div>
            <div><Label>Favicon (أيقونة المتصفح)</Label><ImageUploader bucket="store-assets" value={formData.favicon_url} onChange={url => setFormData({ ...formData, favicon_url: url || '' })} path="favicon" accept="image/png,image/svg+xml,image/x-icon" /></div>
          </div>
        </section>

        <section>
          <h3 className="font-semibold text-primary-900 mb-4 flex items-center gap-2"><Globe className="h-5 w-5" /> الصفحات القانونية</h3>
          <div className="space-y-4">
            <div><Label>من نحن</Label><Textarea value={formData.about_us} onChange={e => setFormData({ ...formData, about_us: e.target.value })} rows={4} /></div>
            <div><Label>سياسة الخصوصية</Label><Textarea value={formData.privacy_policy} onChange={e => setFormData({ ...formData, privacy_policy: e.target.value })} rows={4} /></div>
            <div><Label>الشروط والأحكام</Label><Textarea value={formData.terms} onChange={e => setFormData({ ...formData, terms: e.target.value })} rows={4} /></div>
            <div><Label>سياسة الشحن</Label><Textarea value={formData.shipping_policy} onChange={e => setFormData({ ...formData, shipping_policy: e.target.value })} rows={4} /></div>
            <div><Label>سياسة الإرجاع</Label><Textarea value={formData.return_policy} onChange={e => setFormData({ ...formData, return_policy: e.target.value })} rows={4} /></div>
          </div>
        </section>

        <div className="flex justify-end gap-2 pt-6 border-t border-primary-200">
          <Button type="submit" loading={saving} variant="gold"><Save className="h-4 w-4" /> حفظ الإعدادات</Button>
        </div>
      </form>
    </div>
  )
}