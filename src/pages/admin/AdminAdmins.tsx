import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/admin'
import { Button, Input, Label, Select, Modal, EmptyState, LoadingSkeleton, Badge } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { cn, formatRelativeTime } from '../../lib/utils'
import { Plus, Search, Edit, Trash2, User, Shield, Loader2, Save, X, Mail, Phone } from 'lucide-react'
import type { Profile } from '../../lib/types'

export function AdminAdmins() {
  const { success, error: toastError } = useToast()
  const [admins, setAdmins] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Profile | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', phone: '', role: 'admin', is_active: true })

  useEffect(() => { loadAdmins() }, [])

  const loadAdmins = async () => {
    const { data } = await supabase.from('profiles').select('*').in('role', ['admin', 'super_admin']).order('created_at', { ascending: false })
    setAdmins(data || [])
    setLoading(false)
  }

  const openModal = (adm?: Profile) => {
    if (adm) {
      setEditingAdmin(adm)
      setFormData({ first_name: adm.first_name || '', last_name: adm.last_name || '', email: adm.email, phone: adm.phone || '', role: adm.role, is_active: adm.is_active })
    } else {
      setEditingAdmin(null)
      setFormData({ first_name: '', last_name: '', email: '', phone: '', role: 'admin', is_active: true })
    }
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditingAdmin(null) }

  const handleSubmit = async () => {
    setSaving(true)
    if (editingAdmin) {
      await supabase.from('profiles').update(formData).eq('id', editingAdmin.id)
    }
    success(editingAdmin ? 'تم تحديث المدير' : 'تم إضافة المدير')
    closeModal()
    loadAdmins()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المدير؟')) return
    await supabase.from('profiles').delete().eq('id', id)
    success('تم حذف المدير')
    loadAdmins()
  }

  if (loading) return <LoadingSkeleton variant="list" count={5} />

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden">
      <PageHeader title="إدارة المديرين" actions={<Button onClick={() => openModal()} variant="gold"><Plus className="h-4 w-4" /> إضافة مدير</Button>} />
      <div className="bg-white rounded-2xl border border-primary-200">
        {admins.length > 0 ? (
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full min-w-[600px]">
              <thead className="bg-primary-50">
                <tr className="text-right">
                  <th className="p-4 font-medium text-primary-500">المدير</th>
                  <th className="p-4 font-medium text-primary-500">البريد</th>
                  <th className="p-4 font-medium text-primary-500">الهاتف</th>
                  <th className="p-4 font-medium text-primary-500">الدور</th>
                  <th className="p-4 font-medium text-primary-500">الحالة</th>
                  <th className="p-4 font-medium text-primary-500">التسجيل</th>
                  <th className="p-4 font-medium text-primary-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100">
                {admins.map(adm => (
                  <tr key={adm.id}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center"><span className="text-gold font-semibold">{adm.first_name?.[0] || adm.email?.[0] || 'م'}</span></div>
                        <div><p className="font-medium text-primary-900">{adm.first_name} {adm.last_name}</p></div>
                      </div>
                    </td>
                    <td className="p-4 text-primary-500">{adm.email}</td>
                    <td className="p-4 text-primary-500">{adm.phone || '—'}</td>
                    <td className="p-4"><span className={cn('badge', adm.role === 'super_admin' ? 'badge-danger' : 'badge-gold')}>{adm.role === 'super_admin' ? 'مدير عام' : 'مدير'}</span></td>
                    <td className="p-4"><span className={cn('badge', adm.is_active ? 'badge-success' : 'badge-danger')}>{adm.is_active ? 'نشط' : 'معطل'}</span></td>
                    <td className="p-4 text-primary-500">{formatRelativeTime(adm.created_at)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button onClick={() => openModal(adm)} variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                        <Button onClick={() => handleDelete(adm.id)} variant="danger" size="sm"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<User className="h-12 w-12" />} title="لا يوجد مديرين" description="أضف مديرين للمساعدة في الإدارة" action={<Button onClick={() => openModal()} variant="gold">إضافة مدير</Button>} />
        )}
      </div>

      <Modal open={showModal} onClose={closeModal} title={editingAdmin ? 'تعديل المدير' : 'إضافة مدير جديد'} size="lg">
        <form onSubmit={e => { e.preventDefault(); handleSubmit() }} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full max-w-full">
            <div><Label>الاسم الأول</Label><Input value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} /></div>
            <div><Label>اسم العائلة</Label><Input value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full max-w-full">
            <div><Label>البريد الإلكتروني</Label><Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required /></div>
            <div><Label>الهاتف</Label><Input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full max-w-full">
            <div><Label>الدور</Label><Select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}><option value="admin">مدير</option><option value="super_admin">مدير عام</option></Select></div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="h-4 w-4 rounded border-primary-300 text-gold focus:ring-gold" />
              <Label htmlFor="is_active" className="mb-0 cursor-pointer">نشط</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-primary-200">
            <Button type="button" onClick={closeModal} variant="outline">إلغاء</Button>
            <Button type="submit" loading={saving} variant="gold"><Save className="h-4 w-4" /> حفظ</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}