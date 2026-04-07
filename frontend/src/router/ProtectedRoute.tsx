import { Navigate } from "react-router-dom"
import { useAuthStore } from "../stores/auth.store"

type Props = {
  children: React.ReactNode
  allowedRoles?: ("reporter" | "moderator" | "admin")[]
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}