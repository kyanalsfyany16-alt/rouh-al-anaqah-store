import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/admin'
import { Button, Input, Label, Select, Modal, EmptyState, LoadingSkeleton, Badge } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { cn, formatRelativeTime } from '../../lib/utils'
import { Plus, Search, Edit, Trash2, User, Shield, Loader2, Save, X, Mail, Phone } from 'lucide-react'
import type { Profile } from '../../lib/types'

export function AdminEmployees() {
  const { success, error: toastError } = useToast()
  const [employees, setEmployees] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Profile | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', phone: '', role: 'employee', is_active: true })

  useEffect(() => { loadEmployees() }, [])

  const loadEmployees = async () => {
    const { data } = await supabase.from('profiles').select('*').in('role', ['employee', 'admin']).order('created_at', { ascending: false })
    setEmployees(data || [])
    setLoading(false)
  }

  const openModal = (emp?: Profile) => {
    if (emp) {
      setEditingEmployee(emp)
      setFormData({ first_name: emp.first_name || '', last_name: emp.last_name || '', email: emp.email, phone: emp.phone || '', role: emp.role, is_active: emp.is_active })
    } else {
      setEditingEmployee(null)
      setFormData({ first_name: '', last_name: '', email: '', phone: '', role: 'employee', is_active: true })
    }
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditingEmployee(null) }

  const handleSubmit = async () => {
    setSaving(true)
    if (editingEmployee) {
      await supabase.from('profiles').update(formData).eq('id', editingEmployee.id)
    }
    success(editingEmployee ? 'تم تحديث الموظف' : 'تم إضافة الموظف')
    closeModal()
    loadEmployees()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟')) return
    await supabase.from('profiles').delete().eq('id', id)
    success('تم حذف الموظف')
    loadEmployees()
  }

  if (loading) return <LoadingSkeleton variant="list" count={5} />

  return (
    <div>
      <PageHeader title="إدارة الموظفين" actions={<Button onClick={() => openModal()} variant="gold"><Plus className="h-4 w-4" /> إضافة موظف</Button>} />
      <div className="bg-white rounded-2xl border border-primary-200">
        {employees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-50">
                <tr className="text-right">
                  <th className="p-4 font-medium text-primary-500">الموظف</th>
                  <th className="p-4 font-medium text-primary-500">البريد</th>
                  <th className="p-4 font-medium text-primary-500">الهاتف</th>
                  <th className="p-4 font-medium text-primary-500">الدور</th>
                  <th className="p-4 font-medium text-primary-500">الحالة</th>
                  <th className="p-4 font-medium text-primary-500">التسجيل</th>
                  <th className="p-4 font-medium text-primary-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100">
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center"><span className="text-gold font-semibold">{emp.first_name?.[0] || emp.email?.[0] || 'م'}</span></div>
                        <div><p className="font-medium text-primary-900">{emp.first_name} {emp.last_name}</p></div>
                      </div>
                    </td>
                    <td className="p-4 text-primary-500">{emp.email}</td>
                    <td className="p-4 text-primary-500">{emp.phone || '—'}</td>
                    <td className="p-4"><span className={cn('badge', emp.role === 'admin' ? 'badge-gold' : 'badge-primary')}>{emp.role === 'admin' ? 'مدير' : 'موظف'}</span></td>
                    <td className="p-4"><span className={cn('badge', emp.is_active ? 'badge-success' : 'badge-danger')}>{emp.is_active ? 'نشط' : 'معطل'}</span></td>
                    <td className="p-4 text-primary-500">{formatRelativeTime(emp.created_at)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button onClick={() => openModal(emp)} variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                        <Button onClick={() => handleDelete(emp.id)} variant="danger" size="sm"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<User className="h-12 w-12" />} title="لا يوجد موظفين" description="أضف موظفين لمساعدتك في إدارة المتجر" action={<Button onClick={() => openModal()} variant="gold">إضافة موظف</Button>} />
        )}
      </div>

      <Modal open={showModal} onClose={closeModal} title={editingEmployee ? 'تعديل الموظف' : 'إضافة موظف جديد'} size="lg">
        <form onSubmit={e => { e.preventDefault(); handleSubmit() }} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>الاسم الأول</Label><Input value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} /></div>
            <div><Label>اسم العائلة</Label><Input value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>البريد الإلكتروني</Label><Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required /></div>
            <div><Label>الهاتف</Label><Input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>الدور</Label><Select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}><option value="employee">موظف</option><option value="admin">مدير</option></Select></div>
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