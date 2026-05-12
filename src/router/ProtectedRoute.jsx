// src/router/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-blood-200 border-t-blood-600 animate-spin" />
          <p className="text-sm text-warm-500 font-body">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to the user's correct portal
    const roleRedirects = { donor: '/donor', hospital: '/hospital', admin: '/admin' }
    return <Navigate to={roleRedirects[user.role] || '/'} replace />
  }

  return <Outlet />
}
