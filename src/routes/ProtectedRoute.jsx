import { Navigate, Outlet } from 'react-router-dom'
import { useAuth, homeFor } from '../context/AuthContext.jsx'

// Frontend-only guard for UX. Real authorization must be enforced by Firebase rules / Cloud Functions.
export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center text-sm text-muted">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />
  return <Outlet />
}
