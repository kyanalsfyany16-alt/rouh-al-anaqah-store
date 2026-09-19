import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PageHeader, SearchInput, ConfirmDialog, StatusBadge } from '../../components/admin'
import { Button, Input, Label, Select, Modal, EmptyState, LoadingSkeleton, Textarea } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../hooks'
import { Bell, Plus, Trash2, Send, CheckCheck } from 'lucide-react'
import type { Notification } from '../../lib/types'

export function AdminNotifications() {
  const { user } = useAuth()
  const { success, error: toastError } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filtered, setFiltered] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [form, setForm] = useState({ title: '', message: '', type: 'info', user_email: '' })

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!search.trim()) setFiltered(notifications)
    else {
      const term = search.toLowerCase()
      setFiltered(notifications.filter((n) => n.title.toLowerCase().includes(term) || (n.message ?? '').toLowerCase().includes(term)))
    }
  }, [search, notifications])

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100)
    if (error) toastError(error.message)
    else setNotifications((data as Notification[]) ?? [])
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!form.title.trim()) return toastError('العنوان مطلوب')
    setSaving(true)
    let user_id: string | null = null
    if (form.user_email.trim()) {
      const { data: prof } = await supabase.from('profiles').select('id').eq('email', form.user_email.trim()).maybeSingle()
      if (!prof) {
        toastError('البريد غير موجود')
        setSaving(false)
        return
      }
      user_id = prof.id
    }
    const { error } = await supabase.from('notifications').insert({ title: form.title.trim(), message: form.message.trim() || null, type: form.type, user_id })
    if (error) toastError(error.message)
    else {
      success(form.user_email ? 'تم إرسال الإشعار للمستخدم' : 'تم إرسال الإشعار للجميع')
      setShowModal(false)
      setForm({ title: '', message: '', type: 'info', user_email: '' })
      load()
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const { error } = await supabase.from('notifications').delete().eq('id', deleteId)
    if (error) toastError(error.message)
    else {
      success('تم حذف الإشعار')
      setDeleteId(null)
      load()
    }
  }

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false)
    load()
  }

  if (loading) return <LoadingSkeleton variant="list" count={5} />

  return (
    <div>
      <PageHeader
        title="الإشعارات"
        description={`${notifications.length} إشعار`}
        actions={
          <div className="flex gap-2">
            <Button onClick={markAllRead} variant="outline" size="sm">
              <CheckCheck className="h-4 w-4" /> تحديد الكل مقروء
            </Button>
            <Button onClick={() => setShowModal(true)} variant="gold">
              <Plus className="h-4 w-4" /> إنشاء إشعار
            </Button>
          </div>
        }
      />

      <div className="bg-white rounded-2xl border border-primary-200 p-4 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="بحث في الإشعارات..." />
      </div>

      <div className="bg-white rounded-2xl border border-primary-200 overflow-hidden">
        {filtered.length ? (
          <div className="divide-y divide-primary-100">
            {filtered.map((n) => (
              <div key={n.id} className="p-4 flex items-start justify-between gap-3 hover:bg-primary-50/50">
                <div className="flex gap-3 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.is_read ? 'bg-primary-100 text-primary-400' : 'bg-gold/20 text-gold'}`}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-primary-900 text-sm truncate">{n.title}</p>
                    {n.message && <p className="text-sm text-primary-600 mt-1 line-clamp-2">{n.message}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <StatusBadge variant={n.type === 'success' ? 'success' : n.type === 'warning' ? 'warning' : n.type === 'error' ? 'danger' : 'info'}>{n.type}</StatusBadge>
                      {n.user_id ? <span className="text-xs text-primary-400">مخصص</span> : <span className="text-xs text-primary-400">عام</span>}
                      <span className="text-xs text-primary-400">{new Date(n.created_at).toLocaleString('ar-SA')}</span>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-gold" />}
                    </div>
                  </div>
                </div>
                <Button onClick={() => setDeleteId(n.id)} variant="ghost" size="sm" className="text-danger shrink-0">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <EmptyState
              icon={<Bell className="h-12 w-12" />}
              title="لا توجد إشعارات"
              description="أرسل إشعارات للعملاء عند تغير حالة الطلب أو للتواصل"
              action={
                <Button onClick={() => setShowModal(true)} variant="gold">
                  إنشاء إشعار
                </Button>
              }
            />
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="إنشاء إشعار" size="lg">
        <div className="space-y-4">
          <div>
            <Label>العنوان *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: تم تأكيد طلبك" />
          </div>
          <div>
            <Label>الرسالة</Label>
            <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} placeholder="نص الإشعار..." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>النوع</Label>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="info">معلومة</option>
                <option value="success">نجاح</option>
                <option value="warning">تحذير</option>
                <option value="error">خطأ</option>
              </Select>
            </div>
            <div>
              <Label>مستخدم محدد (اختياري - اتركه فارغاً للجميع)</Label>
              <Input value={form.user_email} onChange={(e) => setForm({ ...form, user_email: e.target.value })} placeholder="email@example.com" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button onClick={() => setShowModal(false)} variant="outline">
              إلغاء
            </Button>
            <Button onClick={handleCreate} loading={saving} variant="gold">
              <Send className="h-4 w-4" /> إرسال
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="حذف الإشعار" description="سيتم حذف الإشعار نهائياً." confirmLabel="حذف" variant="danger" />
    </div>
  )
}
