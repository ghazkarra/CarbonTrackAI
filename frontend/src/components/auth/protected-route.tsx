import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getStoredToken, getStoredUser } from '@/lib/auth'

type ProtectedRouteProps = {
  role?: 'operator' | 'superadmin'
}

export function ProtectedRoute({ role }: ProtectedRouteProps) {
  const location = useLocation()
  const token = getStoredToken()
  const user = getStoredUser()

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'operator' ? '/dashboard' : '/dashboard/superadmin'} replace />
  }

  return <Outlet />
}
