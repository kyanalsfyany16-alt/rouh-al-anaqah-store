import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks'
import { EmptyState } from '../../components/ui'
import { Bell, CheckCheck } from 'lucide-react'
import type { Notification } from '../../lib/types'

export function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = 'الإشعارات - روح الأناقة'
    if (user) load()
  }, [user])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${user!.id},user_id.is.null`)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications((data as Notification[]) ?? [])
    setLoading(false)
  }

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user!.id).eq('is_read', false)
    load()
  }

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
  }

  if (loading) return <div className="space-y-3 p-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-primary-900">الإشعارات</h1>
        {notifications.some((n) => !n.is_read) && (
          <button onClick={markAllRead} className="btn-outline text-sm inline-flex items-center gap-1">
            <CheckCheck className="h-4 w-4" /> تحديد الكل مقروء
          </button>
        )}
      </div>

      {notifications.length ? (
        <div className="bg-white rounded-2xl border border-primary-200 divide-y divide-primary-100">
          {notifications.map((n) => (
            <div key={n.id} className={`p-4 flex gap-3 ${!n.is_read ? 'bg-gold/5' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.is_read ? 'bg-primary-100 text-primary-400' : 'bg-gold/20 text-gold'}`}>
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-primary-900 text-sm truncate">{n.title}</p>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-gold shrink-0" />}
                </div>
                {n.message && <p className="text-sm text-primary-600 mt-1">{n.message}</p>}
                <p className="text-xs text-primary-400 mt-1">{new Date(n.created_at).toLocaleString('ar-SA')}</p>
              </div>
              {!n.is_read && (
                <button onClick={() => markRead(n.id)} className="text-xs text-gold hover:underline shrink-0">
                  مقروء
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={<Bell className="h-12 w-12" />} title="لا توجد إشعارات" description="ستظهر إشعارات طلباتك هنا" action={<Link to="/shop" className="btn-gold">تسوق الآن</Link>} />
      )}
    </div>
  )
}
