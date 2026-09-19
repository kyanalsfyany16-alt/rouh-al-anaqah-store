import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Search, ShoppingBag, Heart, User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Modal } from '../ui/Modal'
import { formatPrice } from '../../lib/utils'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../contexts/WishlistContext'
import { useSettings } from '../../contexts/SettingsContext'
import { classNames } from '../../lib/utils'

export function Navbar() {
  const location = useLocation()
  const { profile, isStaff, signOut } = useAuth()
  const { count: cartCount } = useCart()
  const { ids: wishlistIds } = useWishlist()
  const { settings, defaultCurrency } = useSettings()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  const debouncedSearch = debouncedSearchProducts

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      debouncedSearch(searchQuery)
    } else {
      setSearchResults([])
      setShowSearchResults(false)
    }
  }, [searchQuery])

  async function debouncedSearchProducts(query: string) {
    setSearchLoading(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, images, price, discount_price, brand:brands(name)')
        .ilike('name', `%${query}%`)
        .eq('is_published', true)
        .limit(5)

      if (!error && data) {
        setSearchResults(data)
        setShowSearchResults(true)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/shop?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const wishlistCount = wishlistIds.size

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-primary-100 shadow-soft">
      <div className="container-app">
        <div className="flex items-center justify-between h-16 lg:h-20 gap-4">
          <Link to="/" className="flex items-center gap-3 flex-shrink-0" aria-label="الصفحة الرئيسية">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-primary-900 flex items-center justify-center">
              <span className="text-2xl lg:text-3xl font-bold text-gold">ر</span>
            </div>
            <span className="hidden lg:block font-display font-bold text-xl lg:text-2xl text-primary-900">
              {settings?.store_name || 'روح الأناقة'}
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 flex-1 justify-center" aria-label="القائمة الرئيسية">
            <Link to="/" className={classNames('font-medium text-sm transition-colors', location.pathname === '/' ? 'text-gold' : 'text-primary-600 hover:text-gold')}>
              الرئيسية
            </Link>
            <Link to="/shop" className={classNames('font-medium text-sm transition-colors', location.pathname.startsWith('/shop') ? 'text-gold' : 'text-primary-600 hover:text-gold')}>
              المتجر
            </Link>
            <Link to="/contact" className={classNames('font-medium text-sm transition-colors', location.pathname === '/contact' ? 'text-gold' : 'text-primary-600 hover:text-gold')}>
              تواصل معنا
            </Link>
          </nav>

          <div className="hidden lg:flex items-center gap-3 flex-1 justify-end">
            <form onSubmit={handleSearchSubmit} className="relative w-72" role="search">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 w-5 h-5" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                placeholder="ابحث عن منتج..."
                className="w-full pl-10 pr-10 py-2 rounded-xl bg-primary-50 border border-primary-200 focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none text-sm text-primary-900 placeholder:text-primary-400"
                aria-label="البحث عن المنتجات"
                autoComplete="off"
              />
              {searchLoading && <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gold animate-spin w-5 h-5" />}
            </form>

            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-card border border-primary-100 overflow-hidden z-50 animate-fade-in">
                {searchResults.map(product => (
                  <Link
                    key={product.id}
                    to={`/product/${product.slug}`}
                    className="flex items-center gap-3 p-3 hover:bg-primary-50 transition-colors"
                    onClick={() => { setSearchQuery(''); setShowSearchResults(false); }}
                  >
                    <img src={product.images?.[0] || '/placeholder.svg'} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-primary-900 truncate">{product.name}</p>
                      <p className="text-xs text-primary-500 truncate">{product.brand?.name}</p>
                    </div>
                    <span className="font-bold text-gold text-sm">
                      {formatPrice(product.discount_price ?? product.price, defaultCurrency || undefined)}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            <Link to="/wishlist" className="relative p-2 rounded-xl text-primary-600 hover:bg-primary-100 hover:text-gold transition-colors" aria-label="المفضلة">
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -left-1 w-5 h-5 bg-danger text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            <Link to="/cart" className="relative p-2 rounded-xl text-primary-600 hover:bg-primary-100 hover:text-gold transition-colors" aria-label="السلة">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -left-1 w-5 h-5 bg-gold text-primary-950 text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-xl text-primary-600 hover:bg-primary-100 hover:text-gold transition-colors"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  {profile ? (
                    <span className="text-sm font-bold text-primary-700">{getInitials(profile.first_name, profile.last_name)}</span>
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>

              {userMenuOpen && (
                <Modal open={userMenuOpen} onClose={() => setUserMenuOpen(false)} size="sm" closeOnOverlayClick>
                  <div className="py-2">
                    {profile ? (
                      <>
                        <div className="px-4 py-3 border-b border-primary-100">
                          <p className="font-medium text-primary-900">{profile.first_name} {profile.last_name}</p>
                          <p className="text-sm text-primary-500">{profile.email}</p>
                          <Badge variant="gold" className="mt-1 inline-block">{getRoleLabel(profile.role)}</Badge>
                        </div>
                        <Link to="/account" className="block px-4 py-3 hover:bg-primary-50 flex items-center gap-3" onClick={() => setUserMenuOpen(false)}>
                          <User className="w-5 h-5 text-primary-500" />
                          حسابي
                        </Link>
                        <Link to="/orders" className="block px-4 py-3 hover:bg-primary-50 flex items-center gap-3" onClick={() => setUserMenuOpen(false)}>
                          <ShoppingBag className="w-5 h-5 text-primary-500" />
                          طلباتي
                        </Link>
                        {isStaff && (
                          <Link to="/admin" className="block px-4 py-3 hover:bg-primary-50 flex items-center gap-3" onClick={() => setUserMenuOpen(false)}>
                            <LayoutDashboard className="w-5 h-5 text-primary-500" />
                            لوحة التحكم
                          </Link>
                        )}
                        <hr className="my-2 border-primary-100" />
                        <button onClick={async () => { await signOut(); setUserMenuOpen(false); }} className="w-full px-4 py-3 hover:bg-primary-50 flex items-center gap-3 text-danger">
                          <LogOut className="w-5 h-5" />
                          تسجيل الخروج
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="px-4 py-3 border-b border-primary-100 text-center text-primary-600">
                          لم تسجل دخولك بعد
                        </div>
                        <Link to="/login" className="block px-4 py-3 hover:bg-primary-50 flex items-center gap-3 justify-center" onClick={() => setUserMenuOpen(false)}>
                          <LogOut className="w-5 h-5 text-primary-500" />
                          تسجيل الدخول
                        </Link>
                        <Link to="/register" className="block px-4 py-3 hover:bg-primary-50 flex items-center gap-3 justify-center" onClick={() => setUserMenuOpen(false)}>
                          <User className="w-5 h-5 text-primary-500" />
                          إنشاء حساب
                        </Link>
                      </>
                    )}
                  </div>
                </Modal>
              )}
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-primary-600 hover:bg-primary-100 transition-colors"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label="القائمة"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div id="mobile-menu" className="lg:hidden py-4 border-t border-primary-100 animate-slide-in">
            <nav className="flex flex-col gap-2" aria-label="قائمة الموبايل">
              <Link to="/" className="px-3 py-2 rounded-xl text-primary-700 hover:bg-primary-50" onClick={() => setMobileMenuOpen(false)}>الرئيسية</Link>
              <Link to="/shop" className="px-3 py-2 rounded-xl text-primary-700 hover:bg-primary-50" onClick={() => setMobileMenuOpen(false)}>المتجر</Link>
              <Link to="/contact" className="px-3 py-2 rounded-xl text-primary-700 hover:bg-primary-50" onClick={() => setMobileMenuOpen(false)}>تواصل معنا</Link>
              <hr className="my-2 border-primary-100" />
              <Link to="/cart" className="px-3 py-2 rounded-xl text-primary-700 hover:bg-primary-50 flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                <ShoppingBag className="w-5 h-5" /> السلة
              </Link>
              <Link to="/wishlist" className="px-3 py-2 rounded-xl text-primary-700 hover:bg-primary-50 flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                <Heart className="w-5 h-5" /> المفضلة
              </Link>
              {profile ? (
                <>
                  <Link to="/account" className="px-3 py-2 rounded-xl text-primary-700 hover:bg-primary-50 flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                    <User className="w-5 h-5" /> حسابي
                  </Link>
                  <Link to="/orders" className="px-3 py-2 rounded-xl text-primary-700 hover:bg-primary-50 flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                    <ShoppingBag className="w-5 h-5" /> طلباتي
                  </Link>
                  {isStaff && (
                    <Link to="/admin" className="px-3 py-2 rounded-xl text-primary-700 hover:bg-primary-50 flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                      <LayoutDashboard className="w-5 h-5" /> لوحة التحكم
                    </Link>
                  )}
                  <button onClick={async () => { await signOut(); setMobileMenuOpen(false); }} className="px-3 py-2 rounded-xl text-danger hover:bg-primary-50 flex items-center gap-3 w-full text-right">
                    <LogOut className="w-5 h-5" /> تسجيل الخروج
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link to="/login" className="flex-1 px-3 py-2 rounded-xl bg-primary-100 text-primary-700 text-center hover:bg-primary-200" onClick={() => setMobileMenuOpen(false)}>تسجيل الدخول</Link>
                  <Link to="/register" className="flex-1 px-3 py-2 rounded-xl bg-gold text-primary-950 text-center hover:bg-gold-light" onClick={() => setMobileMenuOpen(false)}>إنشاء حساب</Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

import { Loader2 } from 'lucide-react'
import { getInitials, getRoleLabel } from '../../lib/utils'