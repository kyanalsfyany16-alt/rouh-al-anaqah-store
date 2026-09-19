import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ScrollToTop } from './components/customer/ScrollToTop'
import { CustomerRoute, ProtectedRoute, StaffRoute, AdminOnlyRoute, SuperAdminRoute } from './routes/RouteGuards'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { WishlistProvider } from './contexts/WishlistContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { ToastProvider } from './contexts/ToastContext'
import { CustomerLayout } from './components/customer/CustomerLayout'
import { AdminLayout } from './components/admin/AdminLayout'
import { Spinner } from './components/ui/Spinner'
import { isSupabaseConfigured } from './lib/supabase'

// Lazy pages — Customer
const HomePage = lazy(() => import('./pages/customer/HomePage').then(m => ({ default: m.HomePage })))
const ShopPage = lazy(() => import('./pages/customer/ShopPage').then(m => ({ default: m.ShopPage })))
const ProductDetailPage = lazy(() => import('./pages/customer/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })))
const CartPage = lazy(() => import('./pages/customer/CartPage').then(m => ({ default: m.CartPage })))
const CheckoutPage = lazy(() => import('./pages/customer/CheckoutPage').then(m => ({ default: m.CheckoutPage })))
const LoginPage = lazy(() => import('./pages/customer/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('./pages/customer/RegisterPage').then(m => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('./pages/customer/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const WishlistPage = lazy(() => import('./pages/customer/WishlistPage').then(m => ({ default: m.WishlistPage })))
const OrdersPage = lazy(() => import('./pages/customer/OrdersPage').then(m => ({ default: m.OrdersPage })))
const OrderTrackingPage = lazy(() => import('./pages/customer/OrderTrackingPage').then(m => ({ default: m.OrderTrackingPage })))
const AccountPage = lazy(() => import('./pages/customer/AccountPage').then(m => ({ default: m.AccountPage })))
const ContactPage = lazy(() => import('./pages/customer/ContactPage').then(m => ({ default: m.ContactPage })))
const StaticPage = lazy(() => import('./pages/customer/StaticPage').then(m => ({ default: m.StaticPage })))
const NotificationsPage = lazy(() => import('./pages/customer/NotificationsPage').then(m => ({ default: m.NotificationsPage })))

// Lazy pages — Admin
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })))
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts').then(m => ({ default: m.AdminProducts })))
const AdminProductWizard = lazy(() => import('./pages/admin/AdminProductWizard').then(m => ({ default: m.AdminProductWizard })))
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories').then(m => ({ default: m.AdminCategories })))
const AdminBrands = lazy(() => import('./pages/admin/AdminBrands').then(m => ({ default: m.AdminBrands })))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders').then(m => ({ default: m.AdminOrders })))
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers').then(m => ({ default: m.AdminCustomers })))
const AdminEmployees = lazy(() => import('./pages/admin/AdminEmployees').then(m => ({ default: m.AdminEmployees })))
const AdminAdmins = lazy(() => import('./pages/admin/AdminAdmins').then(m => ({ default: m.AdminAdmins })))
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners').then(m => ({ default: m.AdminBanners })))
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons').then(m => ({ default: m.AdminCoupons })))
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews').then(m => ({ default: m.AdminReviews })))
const AdminReports = lazy(() => import('./pages/admin/AdminReports').then(m => ({ default: m.AdminReports })))
const AdminCurrencies = lazy(() => import('./pages/admin/AdminCurrencies').then(m => ({ default: m.AdminCurrencies })))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })))
const AdminContact = lazy(() => import('./pages/admin/AdminContact').then(m => ({ default: m.AdminContact })))
const AdminSocial = lazy(() => import('./pages/admin/AdminSocial').then(m => ({ default: m.AdminSocial })))
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications').then(m => ({ default: m.AdminNotifications })))
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile').then(m => ({ default: m.AdminProfile })))
const AdminBankAccounts = lazy(() => import('./pages/admin/AdminBankAccounts').then(m => ({ default: m.AdminBankAccounts })))
const AdminPaymentVerification = lazy(() => import('./pages/admin/AdminPaymentVerification').then(m => ({ default: m.AdminPaymentVerification })))
const AdminOrderDetails = lazy(() => import('./pages/admin/AdminOrderDetails').then(m => ({ default: m.AdminOrderDetails })))

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Spinner />
  </div>
)

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Customer public + protected */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/page/:slug" element={<StaticPage />} />

          {/* Protected customer routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderTrackingPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>

        {/* Admin — Staff only */}
        <Route element={<AdminLayout />}>
          <Route element={<StaffRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/products/new" element={<AdminProductWizard />} />
            <Route path="/admin/products/:id/edit" element={<AdminProductWizard />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/brands" element={<AdminBrands />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/orders/:id" element={<AdminOrderDetails />} />
            <Route path="/admin/customers" element={<AdminCustomers />} />
            <Route path="/admin/banners" element={<AdminBanners />} />
            <Route path="/admin/coupons" element={<AdminCoupons />} />
            <Route path="/admin/reviews" element={<AdminReviews />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/payments" element={<AdminPaymentVerification />} />
            <Route path="/admin/payment-verification" element={<AdminPaymentVerification />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
            <Route path="/admin/profile" element={<AdminProfile />} />

            {/* Admin-only */}
            <Route element={<AdminOnlyRoute />}>
              <Route path="/admin/employees" element={<AdminEmployees />} />
              <Route path="/admin/currencies" element={<AdminCurrencies />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/contact" element={<AdminContact />} />
              <Route path="/admin/social" element={<AdminSocial />} />
              <Route path="/admin/social-media" element={<AdminSocial />} />
              <Route path="/admin/bank-accounts" element={<AdminBankAccounts />} />

              {/* Super admin only */}
              <Route element={<SuperAdminRoute />}>
                <Route path="/admin/admins" element={<AdminAdmins />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <CartProvider>
          <WishlistProvider>
            <ToastProvider>{children}</ToastProvider>
          </WishlistProvider>
        </CartProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}

export default function App() {
  return (
    <>
      {!isSupabaseConfigured && (
        <div dir="rtl" className="bg-amber-50 border-b border-amber-200 text-amber-900 text-sm text-center px-4 py-3">
          <span className="font-medium">تنبيه:</span> متغيرات البيئة <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> و <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> غير مضبوطة.
          أنشئ ملف <code className="bg-amber-100 px-1 rounded">.env</code> من <code className="bg-amber-100 px-1 rounded">.env.example</code> وعبئ القيم من Supabase Dashboard — الصفحة البيضاء السابقة كانت بسبب <code>throw new Error</code> في <code>src/lib/supabase.ts:7</code>.
        </div>
      )}
      <Providers>
        <ScrollToTop />
        <AppRoutes />
      </Providers>
    </>
  )
}
