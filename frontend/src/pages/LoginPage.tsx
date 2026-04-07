import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { authApi } from "../api/auth.api"

type FormState = {
  identifier: string
  password: string
}

type ErrorState = Partial<Record<keyof FormState, string>>

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>({
    identifier: "",
    password: "",
  })
  const [errors, setErrors] = useState<ErrorState>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const update =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
      setErrors((prev) => ({ ...prev, [field]: undefined }))
      setServerError(null)
    }

  const validate = (): boolean => {
    const next: ErrorState = {}

    if (!form.identifier.trim()) {
      next.identifier = "Username, email or phone is required"
    }

    if (!form.password) {
      next.password = "Password is required"
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
      await authApi.login({
        identifier: form.identifier,
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
          onClick={() => navigate("/register")}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          Create account
        </button>
      </nav>

      {/* Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-gray-400 mb-8">
            Sign in to keep making an impact.
          </p>

          {serverError && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Identifier */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Username, email or phone
              </label>
              <input
                type="text"
                value={form.identifier}
                onChange={update("identifier")}
                placeholder="yourname"
                autoComplete="username"
                autoFocus
                className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${
                  errors.identifier
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-white"
                }`}
              />
              {errors.identifier && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.identifier}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={update("password")}
                placeholder="Your password"
                autoComplete="current-password"
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3.5 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-blue-500 hover:underline"
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}