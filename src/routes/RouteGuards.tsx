import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks'
import { Spinner } from '../components/ui/Spinner'

// Public wrapper — no auth required (used for CustomerLayout)
export function CustomerRoute() {
  return <Outlet />
}

// Requires authentication (customer+)
export function ProtectedRoute() {
  const { profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Inactive account is already signed out in AuthContext, but guard anyway
  if (profile.is_active === false) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

// Requires staff: employee, admin, super_admin
export function StaffRoute() {
  const { isStaff, loading, profile } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!profile || !isStaff) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

// Alias kept for backward compatibility (AdminRoute = StaffRoute)
export const AdminRoute = StaffRoute

// Requires admin or super_admin
export function AdminOnlyRoute() {
  const { isAdmin, loading, profile } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!profile || !isAdmin) {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}

// Alias for previous name
export const AdminRouteRequireAdmin = AdminOnlyRoute

// Requires super_admin only
export function SuperAdminRoute() {
  const { isSuperAdmin, loading, profile } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!profile || !isSuperAdmin) {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}
