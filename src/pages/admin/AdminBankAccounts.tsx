import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PageHeader, SearchInput, ConfirmDialog, StatusBadge } from '../../components/admin'
import { Button, Input, Label, Select, Modal, EmptyState, LoadingSkeleton, Textarea } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { Plus, Edit, Trash2, Building2, Save } from 'lucide-react'
import type { BankAccount } from '../../lib/types'

export function AdminBankAccounts() {
  const { success, error: toastError } = useToast()
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [filtered, setFiltered] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<BankAccount | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [form, setForm] = useState({ bank_name: '', account_holder: '', account_number: '', iban: '', currency_code: 'SAR', notes: '', is_active: true, sort_order: 0 })

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!search.trim()) setFiltered(accounts)
    else {
      const term = search.toLowerCase()
      setFiltered(accounts.filter((a) => a.bank_name.toLowerCase().includes(term) || a.account_holder.toLowerCase().includes(term) || a.account_number.includes(term)))
    }
  }, [search, accounts])

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('bank_accounts').select('*').order('sort_order').order('created_at')
    if (error) toastError(error.message)
    else setAccounts((data as BankAccount[]) ?? [])
    setLoading(false)
  }

  const openModal = (acc?: BankAccount) => {
    if (acc) {
      setEditing(acc)
      setForm({ bank_name: acc.bank_name, account_holder: acc.account_holder, account_number: acc.account_number, iban: acc.iban ?? '', currency_code: acc.currency_code, notes: acc.notes ?? '', is_active: acc.is_active, sort_order: acc.sort_order })
    } else {
      setEditing(null)
      setForm({ bank_name: '', account_holder: '', account_number: '', iban: '', currency_code: 'SAR', notes: '', is_active: true, sort_order: 0 })
    }
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!form.bank_name.trim() || !form.account_holder.trim() || !form.account_number.trim()) return toastError('الحقول المطلوبة: اسم البنك/صاحب الحساب/رقم الحساب')
    setSaving(true)
    const payload = { bank_name: form.bank_name.trim(), account_holder: form.account_holder.trim(), account_number: form.account_number.trim(), iban: form.iban.trim() || null, currency_code: form.currency_code, notes: form.notes.trim() || null, is_active: form.is_active, sort_order: Number(form.sort_order) || 0 }
    let error
    if (editing) {
      const { error: e } = await supabase.from('bank_accounts').update(payload).eq('id', editing.id)
      error = e
    } else {
      const { error: e } = await supabase.from('bank_accounts').insert(payload)
      error = e
    }
    if (error) toastError(error.message)
    else {
      success(editing ? 'تم تحديث الحساب' : 'تمت إضافة الحساب')
      setShowModal(false)
      setEditing(null)
      load()
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const { error } = await supabase.from('bank_accounts').delete().eq('id', deleteId)
    if (error) toastError(error.message)
    else {
      success('تم حذف الحساب')
      setDeleteId(null)
      load()
    }
  }

  if (loading) return <LoadingSkeleton variant="list" count={5} />

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden">
      <PageHeader
        title="الحسابات البنكية"
        description={`${accounts.length} حساب`}
        actions={
          <Button onClick={() => openModal()} variant="gold">
            <Plus className="h-4 w-4" /> إضافة حساب
          </Button>
        }
      />

      <div className="bg-white rounded-2xl border border-primary-200 p-3 sm:p-4 mb-4 w-full max-w-full">
        <SearchInput value={search} onChange={setSearch} placeholder="بحث باسم البنك أو صاحب الحساب..." />
      </div>

      <div className="bg-white rounded-2xl border border-primary-200 overflow-hidden w-full max-w-full">
        {filtered.length ? (
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full min-w-[600px]">
              <thead className="bg-primary-50">
                <tr className="text-right">
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">البنك</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">صاحب الحساب</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">رقم الحساب</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">IBAN</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">العملة</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">الحالة</th>
                  <th className="px-4 py-3 text-xs font-medium text-primary-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100">
                {filtered.map((acc) => (
                  <tr key={acc.id} className="hover:bg-primary-50/50">
                    <td className="px-4 py-3 font-medium text-primary-900 text-sm">{acc.bank_name}</td>
                    <td className="px-4 py-3 text-sm text-primary-700">{acc.account_holder}</td>
                    <td className="px-4 py-3 font-mono text-sm text-primary-600">{acc.account_number}</td>
                    <td className="px-4 py-3 text-sm text-primary-500">{acc.iban ?? '—'}</td>
                    <td className="px-4 py-3 text-sm">{acc.currency_code}</td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={acc.is_active ? 'success' : 'neutral'}>{acc.is_active ? 'نشط' : 'غير نشط'}</StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button onClick={() => openModal(acc)} variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => setDeleteId(acc.id)} variant="ghost" size="sm" className="text-danger">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <EmptyState
              icon={<Building2 className="h-12 w-12" />}
              title="لا توجد حسابات بنكية"
              description={search ? 'لا نتائج' : 'أضف حسابات التحويل البنكي لعرضها في صفحة الدفع'}
              action={!search ? <Button onClick={() => openModal()} variant="gold">إضافة حساب</Button> : undefined}
            />
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditing(null) }} title={editing ? 'تعديل حساب بنكي' : 'إضافة حساب بنكي'} size="lg">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full max-w-full">
            <div>
              <Label>اسم البنك *</Label>
              <Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} required />
            </div>
            <div>
              <Label>صاحب الحساب *</Label>
              <Input value={form.account_holder} onChange={(e) => setForm({ ...form, account_holder: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full max-w-full">
            <div>
              <Label>رقم الحساب *</Label>
              <Input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} required />
            </div>
            <div>
              <Label>IBAN</Label>
              <Input value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} placeholder="اختياري" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full max-w-full">
            <div>
              <Label>العملة</Label>
              <Select value={form.currency_code} onChange={(e) => setForm({ ...form, currency_code: e.target.value })}>
                <option value="SAR">SAR</option>
                <option value="YER">YER</option>
                <option value="USD">USD</option>
                <option value="EGP">EGP</option>
              </Select>
            </div>
            <div>
              <Label>الترتيب</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <Label>ملاحظات / تعليمات</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="مثال: يرجى كتابة رقم الطلب في الإيصال" />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4 rounded text-gold" />
            <span className="text-sm">نشط (يظهر للعملاء)</span>
          </label>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" onClick={() => { setShowModal(false); setEditing(null) }} variant="outline">
              إلغاء
            </Button>
            <Button type="submit" loading={saving} variant="gold">
              <Save className="h-4 w-4" /> حفظ
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="حذف الحساب" description="سيتم حذف الحساب البنكي نهائياً." confirmLabel="حذف" variant="danger" />
    </div>
  )
}
