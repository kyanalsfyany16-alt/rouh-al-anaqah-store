import { createElement, lazy, Suspense } from 'react'
import { RouteObject } from 'react-router-dom'
import { Spinner } from '../components/ui/Spinner'

const HomePage = lazy(() => import('../pages/customer/HomePage').then(m => ({ default: m.HomePage })))
const ShopPage = lazy(() => import('../pages/customer/ShopPage').then(m => ({ default: m.ShopPage })))
const ProductDetailPage = lazy(() => import('../pages/customer/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })))
const CartPage = lazy(() => import('../pages/customer/CartPage').then(m => ({ default: m.CartPage })))
const CheckoutPage = lazy(() => import('../pages/customer/CheckoutPage').then(m => ({ default: m.CheckoutPage })))
const LoginPage = lazy(() => import('../pages/customer/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('../pages/customer/RegisterPage').then(m => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('../pages/customer/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const WishlistPage = lazy(() => import('../pages/customer/WishlistPage').then(m => ({ default: m.WishlistPage })))
const OrdersPage = lazy(() => import('../pages/customer/OrdersPage').then(m => ({ default: m.OrdersPage })))
const OrderTrackingPage = lazy(() => import('../pages/customer/OrderTrackingPage').then(m => ({ default: m.OrderTrackingPage })))
const AccountPage = lazy(() => import('../pages/customer/AccountPage').then(m => ({ default: m.AccountPage })))
const ContactPage = lazy(() => import('../pages/customer/ContactPage').then(m => ({ default: m.ContactPage })))
const StaticPage = lazy(() => import('../pages/customer/StaticPage').then(m => ({ default: m.StaticPage })))

const LoadingFallback = () => <div className="min-h-screen flex items-center justify-center"><Spinner /></div>

function withSuspense(Component: React.ComponentType) {
  return () => (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  )
}

export const customerRoutes: RouteObject[] = [
  {
    path: '/',
    element: withSuspense(HomePage),
  },
  {
    path: '/shop',
    element: withSuspense(ShopPage),
  },
  {
    path: '/product/:slug',
    element: withSuspense(ProductDetailPage),
  },
  {
    path: '/cart',
    element: withSuspense(CartPage),
  },
  {
    path: '/checkout',
    element: withSuspense(CheckoutPage),
  },
  {
    path: '/login',
    element: withSuspense(LoginPage),
  },
  {
    path: '/register',
    element: withSuspense(RegisterPage),
  },
  {
    path: '/forgot-password',
    element: withSuspense(ForgotPasswordPage),
  },
  {
    path: '/wishlist',
    element: withSuspense(WishlistPage),
  },
  {
    path: '/orders',
    element: withSuspense(OrdersPage),
  },
  {
    path: '/orders/:id',
    element: withSuspense(OrderTrackingPage),
  },
  {
    path: '/account',
    element: withSuspense(AccountPage),
  },
  {
    path: '/contact',
    element: withSuspense(ContactPage),
  },
  {
    path: '/page/:slug',
    element: withSuspense(StaticPage),
  },
]