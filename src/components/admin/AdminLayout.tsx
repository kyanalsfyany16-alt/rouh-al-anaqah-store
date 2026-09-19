import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, NavLink } from 'react-router-dom'
import {
  Menu,
  X,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Shield,
  BarChart2,
  Settings,
  Bell,
  LogOut,
  User,
  ChevronDown,
  ChevronRight,
  Box,
  Tag,
  Truck,
  DollarSign,
  CreditCard,
  FileText,
  Star,
  Palette,
  Banknote,
} from 'lucide-react'
import { useAuth } from '../../hooks'
import { useSettings } from '../../hooks'
import { SEO } from '../SEO'
import { cn } from '../../lib/utils'

type NavRole = 'employee' | 'admin' | 'super_admin'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles: NavRole[]
}

const navItems: NavItem[] = [
  { label: 'الرئيسية', href: '/admin', icon: LayoutDashboard, roles: ['employee', 'admin', 'super_admin'] },
  { label: 'المنتجات', href: '/admin/products', icon: Package, roles: ['employee', 'admin', 'super_admin'] },
  { label: 'الفئات', href: '/admin/categories', icon: Tag, roles: ['employee', 'admin', 'super_admin'] },
  { label: 'العلامات التجارية', href: '/admin/brands', icon: Box, roles: ['employee', 'admin', 'super_admin'] },
  { label: 'الطلبات', href: '/admin/orders', icon: ShoppingBag, roles: ['employee', 'admin', 'super_admin'] },
  { label: 'العملاء', href: '/admin/customers', icon: Users, roles: ['employee', 'admin', 'super_admin'] },
  { label: 'الموظفون', href: '/admin/employees', icon: Shield, roles: ['admin', 'super_admin'] },
  { label: 'المديرون', href: '/admin/admins', icon: User, roles: ['super_admin'] },
  { label: 'البنرات', href: '/admin/banners', icon: Palette, roles: ['employee', 'admin', 'super_admin'] },
  { label: 'الكوبونات', href: '/admin/coupons', icon: DollarSign, roles: ['employee', 'admin', 'super_admin'] },
  { label: 'التقييمات', href: '/admin/reviews', icon: Star, roles: ['employee', 'admin', 'super_admin'] },
  { label: 'التقارير', href: '/admin/reports', icon: BarChart2, roles: ['employee', 'admin', 'super_admin'] },
  { label: 'العملات', href: '/admin/currencies', icon: CreditCard, roles: ['admin', 'super_admin'] },
  { label: 'الحسابات البنكية', href: '/admin/bank-accounts', icon: Banknote, roles: ['admin', 'super_admin'] },
  { label: 'التحقق من المدفوعات', href: '/admin/payment-verification', icon: Truck, roles: ['employee', 'admin', 'super_admin'] },
  { label: 'الإشعارات', href: '/admin/notifications', icon: Bell, roles: ['employee', 'admin', 'super_admin'] },
  { label: 'التواصل', href: '/admin/contact', icon: FileText, roles: ['admin', 'super_admin'] },
  { label: 'وسائل التواصل', href: '/admin/social-media', icon: Bell, roles: ['admin', 'super_admin'] },
  { label: 'إعدادات المتجر', href: '/admin/settings', icon: Settings, roles: ['admin', 'super_admin'] },
  { label: 'الملف الشخصي', href: '/admin/profile', icon: User, roles: ['employee', 'admin', 'super_admin'] },
]

// Map pathname → title for Topbar
const pathTitle: Record<string, string> = {
  '/admin': 'الرئيسية',
  '/admin/products': 'المنتجات',
  '/admin/categories': 'الفئات',
  '/admin/brands': 'العلامات التجارية',
  '/admin/orders': 'الطلبات',
  '/admin/customers': 'العملاء',
  '/admin/employees': 'الموظفون',
  '/admin/admins': 'المديرون',
  '/admin/banners': 'البنرات',
  '/admin/coupons': 'الكوبونات',
  '/admin/reviews': 'التقييمات',
  '/admin/reports': 'التقارير',
  '/admin/currencies': 'العملات',
  '/admin/bank-accounts': 'الحسابات البنكية',
  '/admin/payments': 'التحقق من المدفوعات',
  '/admin/payment-verification': 'التحقق من المدفوعات',
  '/admin/notifications': 'الإشعارات',
  '/admin/contact': 'التواصل',
  '/admin/social': 'وسائل التواصل',
  '/admin/social-media': 'وسائل التواصل',
  '/admin/settings': 'إعدادات المتجر',
  '/admin/profile': 'الملف الشخصي',
}

function getPageTitle(pathname: string): string {
  if (pathTitle[pathname]) return pathTitle[pathname]
  // handle nested like /admin/products/new
  const base = '/' + pathname.split('/').slice(1, 3).join('/')
  return pathTitle[base] ?? 'لوحة التحكم'
}

export function AdminLayout() {
  const { profile, role, isAdmin, isSuperAdmin, signOut, loading } = useAuth()
  const { settings } = useSettings()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  // Close user menu on click outside
  useEffect(() => {
    const handler = () => setUserMenuOpen(false)
    if (userMenuOpen) document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [userMenuOpen])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <div className="text-primary-500">جاري التحميل...</div>
      </div>
    )
  }

  const filteredNavItems = navItems.filter((item) => {
    if (!role) return false
    return item.roles.includes(role as NavRole)
  })

  const storeName = settings?.store_name ?? 'روح الأناقة'
  const roleLabel =
    role === 'super_admin' ? 'مدير عام' : role === 'admin' ? 'مدير' : role === 'employee' ? 'موظف' : '—'

  const topTitle = getPageTitle(location.pathname)

  return (
    <>
      <SEO noindex />
      <div className="min-h-screen bg-primary-50 flex" dir="rtl">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-64 bg-primary-950 flex flex-col transform transition-transform duration-300',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        aria-label="القائمة الجانبية"
      >
        <div className="flex items-center justify-between p-6 border-b border-primary-800">
          <Link to="/admin" className="flex items-center gap-3" aria-label={`${storeName} - لوحة التحكم`}>
            <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center shrink-0">
              <span className="text-xl font-display font-bold text-primary-950">ر</span>
            </div>
            <div className="min-w-0">
              <span className="font-display font-bold text-lg text-white block leading-none">{storeName}</span>
              <span className="text-primary-400 text-xs">لوحة التحكم</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-xl text-primary-400 hover:text-white hover:bg-primary-800"
            aria-label="إغلاق القائمة"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide" aria-label="التنقل الرئيسي">
          {filteredNavItems.map((item) => {
            const active = location.pathname === item.href || (item.href !== '/admin' && location.pathname.startsWith(item.href))
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={() =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                    active
                      ? 'bg-primary-800 text-white shadow-soft'
                      : 'text-primary-300 hover:text-white hover:bg-primary-800/70'
                  )
                }
              >
                <item.icon className={cn('h-5 w-5 shrink-0', active && 'text-gold')} aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="p-3 border-t border-primary-800">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-primary-900/50">
            <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
              <span className="text-gold font-semibold text-sm">{profile?.first_name?.[0] || profile?.email?.[0] || 'م'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {profile?.first_name ? `${profile.first_name} ${profile.last_name ?? ''}`.trim() : profile?.email}
              </p>
              <p className="text-primary-400 text-xs truncate">{roleLabel}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 lg:mr-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-primary-200">
          <div className="flex items-center gap-3 h-16 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-primary-500 hover:bg-primary-100 hover:text-primary-900 transition-colors"
              aria-label="فتح القائمة"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-display font-bold text-primary-900 truncate">{topTitle}</h1>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm text-primary-500 hover:text-gold transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
                عرض المتجر
              </Link>

              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-primary-100 transition-colors"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                    <span className="text-gold font-semibold text-sm">{profile?.first_name?.[0] || profile?.email?.[0] || 'م'}</span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-primary-700 max-w-[120px] truncate">
                    {profile?.first_name || 'المدير'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-primary-400 hidden sm:block" />
                </button>
                {userMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-xl shadow-card border border-primary-200 py-2 animate-scale-in">
                    <div className="px-4 py-2 border-b border-primary-100">
                      <p className="text-sm font-medium text-primary-900 truncate">{profile?.email}</p>
                      <p className="text-xs text-primary-500">{roleLabel}</p>
                    </div>
                    <Link
                      to="/admin/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-primary-700 hover:bg-primary-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="h-4 w-4" /> الملف الشخصي
                    </Link>
                    <Link
                      to="/"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-primary-700 hover:bg-primary-50 lg:hidden"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <ChevronRight className="h-4 w-4" /> عرض المتجر
                    </Link>
                    <hr className="my-1 border-primary-100" />
                    <button
                      onClick={signOut}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-red-50 w-full text-right"
                    >
                      <LogOut className="h-4 w-4" /> تسجيل الخروج
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 bg-primary-50">
          <div className="container-app py-6 sm:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
    </>
  )
}
