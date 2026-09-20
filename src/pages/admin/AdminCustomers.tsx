import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/admin'
import { Button, Input, Label, Select, Modal, EmptyState, LoadingSkeleton, Badge } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { cn, formatRelativeTime } from '../../lib/utils'
import { Plus, Search, Edit, Trash2, User, Shield, Loader2, Save, X, Mail, Phone } from 'lucide-react'
import type { Profile } from '../../lib/types'

export function AdminCustomers() {
  const { success, error: toastError } = useToast()
  const [customers, setCustomers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Profile | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', phone: '', role: 'customer', is_active: true })

  useEffect(() => { loadCustomers() }, [])

  const loadCustomers = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false })
    setCustomers(data || [])
    setLoading(false)
  }

  const openModal = (cust?: Profile) => {
    if (cust) {
      setEditingCustomer(cust)
      setFormData({ first_name: cust.first_name || '', last_name: cust.last_name || '', email: cust.email, phone: cust.phone || '', role: cust.role, is_active: cust.is_active })
    } else {
      setEditingCustomer(null)
      setFormData({ first_name: '', last_name: '', email: '', phone: '', role: 'customer', is_active: true })
    }
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditingCustomer(null) }

  const handleSubmit = async () => {
    setSaving(true)
    if (editingCustomer) {
      await supabase.from('profiles').update(formData).eq('id', editingCustomer.id)
    }
    success(editingCustomer ? 'تم تحديث العميل' : 'تم إضافة العميل')
    closeModal()
    loadCustomers()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) return
    await supabase.from('profiles').delete().eq('id', id)
    success('تم حذف العميل')
    loadCustomers()
  }

  if (loading) return <LoadingSkeleton variant="list" count={5} />

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden">
      <PageHeader title="إدارة العملاء" />
      <div className="bg-white rounded-2xl border border-primary-200">
        {customers.length > 0 ? (
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full min-w-[600px]">
              <thead className="bg-primary-50">
                <tr className="text-right">
                  <th className="p-4 font-medium text-primary-500">المستخدم</th>
                  <th className="p-4 font-medium text-primary-500">البريد</th>
                  <th className="p-4 font-medium text-primary-500">الهاتف</th>
                  <th className="p-4 font-medium text-primary-500">الحالة</th>
                  <th className="p-4 font-medium text-primary-500">التسجيل</th>
                  <th className="p-4 font-medium text-primary-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100">
                {customers.map(cust => (
                  <tr key={cust.id}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center"><span className="text-gold font-semibold">{cust.first_name?.[0] || cust.email?.[0] || 'م'}</span></div>
                        <div><p className="font-medium text-primary-900">{cust.first_name} {cust.last_name}</p></div>
                      </div>
                    </td>
                    <td className="p-4 text-primary-500">{cust.email}</td>
                    <td className="p-4 text-primary-500">{cust.phone || '—'}</td>
                    <td className="p-4"><span className={cn('badge', cust.is_active ? 'badge-success' : 'badge-danger')}>{cust.is_active ? 'نشط' : 'معطل'}</span></td>
                    <td className="p-4 text-primary-500">{formatRelativeTime(cust.created_at)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button onClick={() => openModal(cust)} variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                        <Button onClick={() => handleDelete(cust.id)} variant="danger" size="sm"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<User className="h-12 w-12" />} title="لا يوجد عملاء" description="سيظهر العملاء هنا عند تسجيلهم" />
        )}
      </div>

      <Modal open={showModal} onClose={closeModal} title={editingCustomer ? 'تعديل العميل' : 'إضافة عميل'} size="lg">
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
            <div><Label>الدور</Label><Select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}><option value="customer">عميل</option><option value="employee">موظف</option><option value="admin">مدير</option></Select></div>
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