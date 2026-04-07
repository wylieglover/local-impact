import { BrowserRouter, Routes, Route } from "react-router-dom"
import ProvisionGuard from "./ProvisionGuard"
import ProtectedRoute from "./ProtectedRoute"
import HomePage from "../pages/HomePage"
import LoginPage from "../pages/LoginPage"
import RegisterPage from "../pages/RegisterPage"
import DashboardPage from "../pages/DashboardPage"

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes — redirect to dashboard if already logged in */}
        <Route
          path="/"
          element={
            <ProvisionGuard>
              <HomePage />
            </ProvisionGuard>
          }
        />
        <Route
          path="/login"
          element={
            <ProvisionGuard>
              <LoginPage />
            </ProvisionGuard>
          }
        />
        <Route
          path="/register"
          element={
            <ProvisionGuard>
              <RegisterPage />
            </ProvisionGuard>
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}