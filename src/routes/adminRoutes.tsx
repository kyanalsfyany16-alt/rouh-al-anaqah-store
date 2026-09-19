import { createElement, lazy, Suspense } from 'react'
import { RouteObject } from 'react-router-dom'
import { Spinner } from '../components/ui/Spinner'

const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })))
const AdminProducts = lazy(() => import('../pages/admin/AdminProducts').then(m => ({ default: m.AdminProducts })))
const AdminProductWizard = lazy(() => import('../pages/admin/AdminProductWizard').then(m => ({ default: m.AdminProductWizard })))
const AdminCategories = lazy(() => import('../pages/admin/AdminCategories').then(m => ({ default: m.AdminCategories })))
const AdminBrands = lazy(() => import('../pages/admin/AdminBrands').then(m => ({ default: m.AdminBrands })))
const AdminOrders = lazy(() => import('../pages/admin/AdminOrders').then(m => ({ default: m.AdminOrders })))
const AdminCustomers = lazy(() => import('../pages/admin/AdminCustomers').then(m => ({ default: m.AdminCustomers })))
const AdminEmployees = lazy(() => import('../pages/admin/AdminEmployees').then(m => ({ default: m.AdminEmployees })))
const AdminAdmins = lazy(() => import('../pages/admin/AdminAdmins').then(m => ({ default: m.AdminAdmins })))
const AdminBanners = lazy(() => import('../pages/admin/AdminBanners').then(m => ({ default: m.AdminBanners })))
const AdminCoupons = lazy(() => import('../pages/admin/AdminCoupons').then(m => ({ default: m.AdminCoupons })))
const AdminReviews = lazy(() => import('../pages/admin/AdminReviews').then(m => ({ default: m.AdminReviews })))
const AdminReports = lazy(() => import('../pages/admin/AdminReports').then(m => ({ default: m.AdminReports })))
const AdminCurrencies = lazy(() => import('../pages/admin/AdminCurrencies').then(m => ({ default: m.AdminCurrencies })))
const AdminSettings = lazy(() => import('../pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })))
const AdminContact = lazy(() => import('../pages/admin/AdminContact').then(m => ({ default: m.AdminContact })))
const AdminSocial = lazy(() => import('../pages/admin/AdminSocial').then(m => ({ default: m.AdminSocial })))
const AdminNotifications = lazy(() => import('../pages/admin/AdminNotifications').then(m => ({ default: m.AdminNotifications })))
const AdminProfile = lazy(() => import('../pages/admin/AdminProfile').then(m => ({ default: m.AdminProfile })))
const AdminBankAccounts = lazy(() => import('../pages/admin/AdminBankAccounts').then(m => ({ default: m.AdminBankAccounts })))
const AdminPaymentVerification = lazy(() => import('../pages/admin/AdminPaymentVerification').then(m => ({ default: m.AdminPaymentVerification })))

const LoadingFallback = () => <div className="min-h-screen flex items-center justify-center"><Spinner /></div>

function withSuspense(Component: React.ComponentType) {
  return () => (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  )
}

export const adminRoutes: RouteObject[] = [
  { path: '/admin', element: withSuspense(AdminDashboard) },
  { path: '/admin/products', element: withSuspense(AdminProducts) },
  { path: '/admin/products/new', element: withSuspense(AdminProductWizard) },
  { path: '/admin/products/:id/edit', element: withSuspense(AdminProductWizard) },
  { path: '/admin/categories', element: withSuspense(AdminCategories) },
  { path: '/admin/brands', element: withSuspense(AdminBrands) },
  { path: '/admin/orders', element: withSuspense(AdminOrders) },
  { path: '/admin/customers', element: withSuspense(AdminCustomers) },
  { path: '/admin/employees', element: withSuspense(AdminEmployees) },
  { path: '/admin/admins', element: withSuspense(AdminAdmins) },
  { path: '/admin/banners', element: withSuspense(AdminBanners) },
  { path: '/admin/coupons', element: withSuspense(AdminCoupons) },
  { path: '/admin/reviews', element: withSuspense(AdminReviews) },
  { path: '/admin/reports', element: withSuspense(AdminReports) },
  { path: '/admin/currencies', element: withSuspense(AdminCurrencies) },
  { path: '/admin/settings', element: withSuspense(AdminSettings) },
  { path: '/admin/contact', element: withSuspense(AdminContact) },
  { path: '/admin/social', element: withSuspense(AdminSocial) },
  { path: '/admin/notifications', element: withSuspense(AdminNotifications) },
  { path: '/admin/profile', element: withSuspense(AdminProfile) },
  { path: '/admin/bank-accounts', element: withSuspense(AdminBankAccounts) },
  { path: '/admin/payments', element: withSuspense(AdminPaymentVerification) },
]