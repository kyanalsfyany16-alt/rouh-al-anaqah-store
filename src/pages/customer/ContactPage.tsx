import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useSettings } from '../../hooks'
import { Button, Input, Label, Textarea } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { Mail, Phone, MapPin, Clock, Send, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export function ContactPage() {
  const { settings } = useSettings()
  const { success, error: toastError } = useToast()
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: null,
        title: `رسالة تواصل: ${formData.subject}`,
        message: `من: ${formData.name} (${formData.email}, ${formData.phone})\n\n${formData.message}`,
        type: 'info',
      })
      if (error) throw error
      success('تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.')
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch {
      toastError('فشل إرسال الرسالة، يرجى المحاولة لاحقاً')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-12">
      <h1 className="page-title">تواصل معنا</h1>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          { icon: MapPin, title: 'عنواننا', content: settings?.address || 'غير محدد' },
          { icon: Phone, title: 'الهاتف', content: settings?.phone || 'غير محدد' },
          { icon: Mail, title: 'البريد الإلكتروني', content: settings?.email || 'غير محدد' },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-2xl border border-primary-200 p-6 text-center">
            <div className="mx-auto mb-4 p-3 bg-gold/10 rounded-xl w-fit text-gold"><item.icon className="h-6 w-6" /></div>
            <h3 className="font-semibold text-primary-900 mb-2">{item.title}</h3>
            <p className="text-primary-600">{item.content}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-primary-200 p-6">
        <h2 className="section-title mb-6">أرسل لنا رسالة</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">الاسم الكامل</Label>
              <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="phone">رقم الجوال</Label>
              <Input id="phone" type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="subject">الموضوع</Label>
              <Input id="subject" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} required />
            </div>
          </div>
          <div>
            <Label htmlFor="message">الرسالة</Label>
            <Textarea id="message" value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} rows={6} required />
          </div>
          <Button type="submit" loading={loading} variant="gold" className="w-full sm:w-auto">
            <Send className="h-5 w-5" /> إرسال الرسالة
          </Button>
        </form>
      </div>

      <div className="bg-primary-50 rounded-2xl border border-primary-200 p-6">
        <h3 className="font-semibold text-primary-900 mb-4 flex items-center gap-2"><Clock className="h-5 w-5" /> أوقات العمل</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex justify-between"><span className="text-primary-600">الأحد - الخميس</span><span className="font-medium text-primary-900">9:00 ص - 10:00 م</span></div>
          <div className="flex justify-between"><span className="text-primary-600">الجمعة</span><span className="font-medium text-primary-900">2:00 م - 10:00 م</span></div>
          <div className="flex justify-between"><span className="text-primary-600">السبت</span><span className="font-medium text-primary-900">10:00 ص - 10:00 م</span></div>
        </div>
      </div>
    </div>
  )
}