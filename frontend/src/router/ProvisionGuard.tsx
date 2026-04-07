import { Navigate } from "react-router-dom"
import { useAuthStore } from "../stores/auth.store"

type Props = {
  children: React.ReactNode
}

export default function ProvisionGuard({ children }: Props) {
  const user = useAuthStore((state) => state.user)

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}