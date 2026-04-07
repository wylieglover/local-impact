import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { authApi } from "../api/auth.api"

type Field = "username" | "email" | "phone" | "password" | "confirmPassword"

type FormState = Record<Field, string>
type ErrorState = Partial<Record<Field, string>>

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<ErrorState>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const update = (field: Field) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setServerError(null)
  }

  const validate = (): boolean => {
    const next: ErrorState = {}

    if (!form.username.trim()) {
      next.username = "Username is required"
    } else if (form.username.length < 3) {
      next.username = "Username must be at least 3 characters"
    }

    if (!form.email && !form.phone) {
      next.email = "Email or phone is required"
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Invalid email address"
    }

    if (!form.password) {
      next.password = "Password is required"
    } else if (form.password.length < 8) {
      next.password = "Password must be at least 8 characters"
    }

    if (form.password !== form.confirmPassword) {
      next.confirmPassword = "Passwords do not match"
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setServerError(null)

    try {
      await authApi.register({
        username: form.username,
        email: form.email || undefined,
        phone: form.phone || undefined,
        password: form.password,
      })
      navigate("/dashboard", { replace: true })
    } catch (err: any) {
      const message =
        err.response?.data?.message ?? "Something went wrong. Please try again."
      setServerError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate("/")}
          className="text-lg font-medium text-gray-900"
        >
          🗺️ LocalImpact
        </button>
        <button
          onClick={() => navigate("/login")}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          Sign in instead
        </button>
      </nav>

      {/* Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Create your account
          </h1>
          <p className="text-sm text-gray-400 mb-8">
            Start making your neighborhood better today.
          </p>

          {serverError && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={form.username}
                onChange={update("username")}
                placeholder="yourname"
                autoComplete="username"
                className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${
                  errors.username
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-white"
                }`}
              />
              {errors.username && (
                <p className="mt-1.5 text-xs text-red-500">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Email{" "}
                <span className="text-gray-300 font-normal">
                  (or phone below)
                </span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="you@example.com"
                autoComplete="email"
                className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${
                  errors.email
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-white"
                }`}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Phone{" "}
                <span className="text-gray-300 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={update("phone")}
                placeholder="+1 (555) 000-0000"
                autoComplete="tel"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={update("password")}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${
                  errors.password
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-white"
                }`}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Confirm password
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={update("confirmPassword")}
                placeholder="Repeat your password"
                autoComplete="new-password"
                className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${
                  errors.confirmPassword
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-white"
                }`}
              />
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3.5 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            By registering you agree to report real issues responsibly.
          </p>
        </div>
      </div>
    </div>
  )
}