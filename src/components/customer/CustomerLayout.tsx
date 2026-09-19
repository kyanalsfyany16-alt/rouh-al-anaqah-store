import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom'
import { Menu, X, ShoppingBag, Heart, User, LogOut, LayoutDashboard, Search, ChevronDown, Bell, CheckCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../contexts/WishlistContext'
import { useSettings } from '../../hooks'
import { Search as SearchComponent } from '../ui/Search'
import { cn } from '../../lib/utils'
import type { Category } from '../../lib/types'

export function CustomerLayout() {
  const { profile, isStaff, signOut, loading: authLoading } = useAuth()
  const { count: cartCount } = useCart()
  const { count: wishlistCount } = useWishlist()
  const { settings, social, currencies } = useSettings()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [online, setOnline] = useState(true)
  const location = useLocation()

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!online) return <OfflinePage />

  const storeName = settings?.store_name || 'روح الأناقة'

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        storeName={storeName}
        profile={profile}
        isStaff={isStaff}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        userMenuOpen={userMenuOpen}
        setUserMenuOpen={setUserMenuOpen}
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
        onSignOut={signOut}
        authLoading={authLoading}
      />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer social={social} settings={settings} currencies={currencies} />
    </div>
  )
}

function Navbar({
  storeName,
  profile,
  isStaff,
  cartCount,
  wishlistCount,
  mobileMenuOpen,
  setMobileMenuOpen,
  userMenuOpen,
  setUserMenuOpen,
  searchOpen,
  setSearchOpen,
  onSignOut,
  authLoading,
}: {
  storeName: string
  profile: any
  isStaff: boolean
  cartCount: number
  wishlistCount: number
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  userMenuOpen: boolean
  setUserMenuOpen: (open: boolean) => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  onSignOut: () => Promise<void>
  authLoading: boolean
}) {
  const [navCategories, setNavCategories] = useState<Category[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)
  useEffect(() => {
    supabase.from('categories').select('id,name,slug,image_url').eq('is_active', true).is('parent_id', null).order('sort_order').limit(6).then(({ data }) => setNavCategories((data as Category[]) ?? []))
  }, [])
  useEffect(() => {
    if (!profile) {
      setNotifications([])
      setUnreadCount(0)
      return
    }
    const loadNotifs = async () => {
      const { data } = await supabase.from('notifications').select('*').or(`user_id.eq.${profile.id},user_id.is.null`).order('created_at', { ascending: false }).limit(5)
      setNotifications(data ?? [])
      const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).or(`user_id.eq.${profile.id},user_id.is.null`).eq('is_read', false)
      setUnreadCount(count ?? 0)
    }
    loadNotifs()
    const interval = setInterval(loadNotifs, 30000)
    return () => clearInterval(interval)
  }, [profile?.id])
  const markNotifRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    setUnreadCount((c) => Math.max(0, c - 1))
  }
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-primary-200">
      <div className="container-app">
        <div className="flex items-center justify-between h-16 lg:h-20 gap-4">
          <Link to="/" className="flex items-center gap-3" aria-label={storeName}>
            <div className="w-10 h-10 rounded-xl bg-primary-900 flex items-center justify-center">
              <span className="text-2xl font-display font-bold text-gold">ر</span>
            </div>
            <span className="hidden sm:block font-display font-bold text-xl text-primary-900">{storeName}</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-5" aria-label="القائمة الرئيسية">
            <Link to="/" className="text-primary-600 hover:text-gold transition-colors font-medium">الرئيسية</Link>
            <Link to="/shop" className="text-primary-600 hover:text-gold transition-colors font-medium">المتجر</Link>
            {navCategories.slice(0, 4).map((c) => (
              <Link key={c.id} to={`/shop?category=${c.slug}`} className="text-primary-600 hover:text-gold transition-colors text-sm">
                {c.name}
              </Link>
            ))}
            <Link to="/contact" className="text-primary-600 hover:text-gold transition-colors font-medium">تواصل معنا</Link>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-xl text-primary-500 hover:bg-primary-100 hover:text-gold transition-colors lg:hidden"
              aria-label="البحث"
            >
              <Search className="h-5 w-5" />
            </button>

            <div className="relative hidden sm:block">
              <SearchComponent />
            </div>

            <Link to="/wishlist" className="relative p-2 rounded-xl text-primary-500 hover:bg-primary-100 hover:text-gold transition-colors" aria-label="المفضلة">
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -left-1 h-5 w-5 rounded-full bg-danger text-white text-xs flex items-center justify-center">{wishlistCount}</span>
              )}
            </Link>

            {profile && (
              <div className="relative">
                <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 rounded-xl text-primary-500 hover:bg-primary-100 hover:text-gold transition-colors" aria-label="الإشعارات">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && <span className="absolute -top-1 -left-1 h-5 w-5 rounded-full bg-gold text-primary-950 text-xs flex items-center justify-center font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>
                {notifOpen && (
                  <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-card border border-primary-200 overflow-hidden z-50">
                    <div className="p-3 border-b border-primary-100 flex items-center justify-between">
                      <span className="font-medium text-primary-900 text-sm">الإشعارات</span>
                      <Link to="/notifications" onClick={() => setNotifOpen(false)} className="text-xs text-gold hover:underline">
                        عرض الكل
                      </Link>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length ? (
                        notifications.map((n) => (
                          <div key={n.id} className={`p-3 flex gap-2 hover:bg-primary-50 ${!n.is_read ? 'bg-gold/5' : ''}`}>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-primary-900 truncate">{n.title}</p>
                              {n.message && <p className="text-xs text-primary-600 line-clamp-2">{n.message}</p>}
                              <p className="text-xs text-primary-400 mt-1">{new Date(n.created_at).toLocaleDateString('ar-SA')}</p>
                            </div>
                            {!n.is_read && (
                              <button onClick={() => markNotifRead(n.id)} className="text-xs text-gold hover:underline shrink-0">
                                مقروء
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="p-6 text-center text-sm text-primary-500">لا توجد إشعارات</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Link to="/cart" className="relative p-2 rounded-xl text-primary-500 hover:bg-primary-100 hover:text-gold transition-colors" aria-label="السلة">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -left-1 h-5 w-5 rounded-full bg-gold text-primary-950 text-xs flex items-center justify-center font-bold">{cartCount}</span>
              )}
            </Link>

            {authLoading ? (
              <div className="w-10 h-10 rounded-full bg-primary-100 animate-pulse" />
            ) : profile ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-xl hover:bg-primary-100 transition-colors"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                    <span className="text-gold font-semibold text-sm">{profile.first_name?.[0] || profile.email?.[0] || 'م'}</span>
                  </div>
                  <span className="hidden sm:block font-medium text-primary-700">{profile.first_name || 'حسابي'}</span>
                  <ChevronDown className="h-4 w-4 text-primary-400" />
                </button>
                {userMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-xl shadow-card border border-primary-200 py-2 animate-scale-in">
                    <Link to="/account" className="flex items-center gap-2 px-4 py-2 text-primary-700 hover:bg-primary-50" onClick={() => setUserMenuOpen(false)}>
                      <User className="h-5 w-5" /> حسابي
                    </Link>
                    <Link to="/orders" className="flex items-center gap-2 px-4 py-2 text-primary-700 hover:bg-primary-50" onClick={() => setUserMenuOpen(false)}>
                      <ShoppingBag className="h-5 w-5" /> طلباتي
                    </Link>
                    {isStaff && (
                      <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-primary-700 hover:bg-primary-50" onClick={() => setUserMenuOpen(false)}>
                        <LayoutDashboard className="h-5 w-5" /> لوحة التحكم
                      </Link>
                    )}
                    <hr className="my-2 border-primary-200" />
                    <button onClick={onSignOut} className="flex items-center gap-2 px-4 py-2 text-danger hover:bg-red-50 w-full text-right">
                      <LogOut className="h-5 w-5" /> خروج
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-primary-600 hover:text-gold font-medium">دخول</Link>
                <Link to="/register" className="btn-gold px-4 py-2">تسجيل</Link>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-primary-500 hover:bg-primary-100 transition-colors"
              aria-label="القائمة"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="lg:hidden pb-4 animate-slide-in">
            <SearchComponent />
          </div>
        )}
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-primary-200 bg-white animate-slide-in">
          <nav className="container-app py-4 space-y-3" aria-label="قائمة الجوال">
            <Link to="/" className="block px-4 py-2 rounded-xl text-primary-700 hover:bg-primary-50" onClick={() => setMobileMenuOpen(false)}>الرئيسية</Link>
            <Link to="/shop" className="block px-4 py-2 rounded-xl text-primary-700 hover:bg-primary-50" onClick={() => setMobileMenuOpen(false)}>المتجر</Link>
            {navCategories.map((c) => (
              <Link key={c.id} to={`/shop?category=${c.slug}`} className="block px-4 py-2 rounded-xl text-primary-700 hover:bg-primary-50" onClick={() => setMobileMenuOpen(false)}>
                {c.name}
              </Link>
            ))}
            <Link to="/contact" className="block px-4 py-2 rounded-xl text-primary-700 hover:bg-primary-50" onClick={() => setMobileMenuOpen(false)}>تواصل معنا</Link>
            {profile ? (
              <>
                <Link to="/account" className="block px-4 py-2 rounded-xl text-primary-700 hover:bg-primary-50" onClick={() => setMobileMenuOpen(false)}>حسابي</Link>
                <Link to="/orders" className="block px-4 py-2 rounded-xl text-primary-700 hover:bg-primary-50" onClick={() => setMobileMenuOpen(false)}>طلباتي</Link>
                <Link to="/notifications" className="block px-4 py-2 rounded-xl text-primary-700 hover:bg-primary-50 flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <Bell className="h-5 w-5" /> الإشعارات {unreadCount > 0 && `(${unreadCount})`}
                </Link>
                {isStaff && <Link to="/admin" className="block px-4 py-2 rounded-xl text-primary-700 hover:bg-primary-50" onClick={() => setMobileMenuOpen(false)}>لوحة التحكم</Link>}
                <button onClick={onSignOut} className="block w-full text-right px-4 py-2 rounded-xl text-danger hover:bg-red-50">خروج</button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-4">
                <Link to="/login" className="btn-outline w-full" onClick={() => setMobileMenuOpen(false)}>دخول</Link>
                <Link to="/register" className="btn-gold w-full" onClick={() => setMobileMenuOpen(false)}>تسجيل</Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

function Footer({ social, settings, currencies }: { social: any[]; settings: any; currencies: any[] }) {
  const defaultCurrency = currencies.find(c => c.is_default) || currencies[0]
  return (
    <footer className="bg-primary-950 text-primary-100 mt-auto">
      <div className="container-app py-12 lg:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary-900 flex items-center justify-center">
                <span className="text-3xl font-display font-bold text-gold">ر</span>
              </div>
              <span className="font-display font-bold text-2xl text-white">{settings?.store_name || 'روح الأناقة'}</span>
            </Link>
            <p className="text-primary-400 mb-6 max-w-xs">{settings?.about_us || 'متجر إلكتروني رجالي فاخر يقدم أفضل المنتجات بأعلى جودة'}</p>
            <div className="flex gap-4">
              {social.slice(0, 4).map(s => (
                <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-primary-800 rounded-xl text-primary-300 hover:text-gold hover:bg-primary-700 transition-colors" aria-label={s.platform}>
                  {s.icon || '🔗'}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">روابط سريعة</h4>
            <ul className="space-y-2 text-primary-400">
              <li><Link to="/shop" className="hover:text-gold transition-colors">المتجر</Link></li>
              <li><Link to="/contact" className="hover:text-gold transition-colors">تواصل معنا</Link></li>
              <li><Link to="/page/shipping" className="hover:text-gold transition-colors">سياسة الشحن</Link></li>
              <li><Link to="/page/returns" className="hover:text-gold transition-colors">سياسة الإرجاع</Link></li>
              <li><Link to="/page/privacy" className="hover:text-gold transition-colors">الخصوصية</Link></li>
              <li><Link to="/page/terms" className="hover:text-gold transition-colors">الشروط والأحكام</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">معلومات التواصل</h4>
            <ul className="space-y-2 text-primary-400">
              {settings?.phone && <li className="flex items-center gap-2">📞 {settings.phone}</li>}
              {settings?.email && <li className="flex items-center gap-2">✉️ {settings.email}</li>}
              {settings?.address && <li className="flex items-center gap-2">📍 {settings.address}</li>}
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-800 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-primary-500 text-sm">&copy; {new Date().getFullYear()} {settings?.store_name || 'روح الأناقة'}. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-2">
            <select className="bg-primary-800 border border-primary-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold">
              {currencies.map(c => <option key={c.id} value={c.code}>{c.code} {c.symbol}</option>)}
            </select>
          </div>
        </div>
      </div>
    </footer>
  )
}

function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-50 px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 p-4 bg-yellow-100 rounded-2xl w-fit text-yellow-600">
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        </div>
        <h1 className="text-2xl font-bold text-primary-900 mb-2">أنت غير متصل بالإنترنت</h1>
        <p className="text-primary-500 mb-6">يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.</p>
        <button onClick={() => window.location.reload()} className="btn-gold">إعادة المحاولة</button>
      </div>
    </div>
  )
}