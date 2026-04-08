import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/context/auth'

export default function AuthGuard() {
  const { user, isLoading } = useAuth()

  if (isLoading) return null

  if (!user) return <Navigate to="/sign-in" replace />

  return <Outlet />
}
