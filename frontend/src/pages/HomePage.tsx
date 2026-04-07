import { useNavigate } from "react-router-dom"

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-medium text-gray-900">🗺️ LocalImpact</span>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Sign in
          </button>
          <button
            onClick={() => navigate("/register")}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            Get started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="text-6xl mb-6">📍</div>
        <h1 className="text-4xl font-semibold text-gray-900 mb-4 max-w-md leading-tight">
          Fix your neighborhood, one pin at a time
        </h1>
        <p className="text-gray-500 text-lg max-w-sm mb-8 leading-relaxed">
          Spot a problem. Drop a pin. Earn points. 
          Make your community better — together.
        </p>
        <button
          onClick={() => navigate("/register")}
          className="px-8 py-4 bg-blue-500 text-white rounded-2xl text-base font-medium hover:bg-blue-600 active:scale-95 transition-all"
        >
          Start reporting
        </button>
        <p className="mt-4 text-sm text-gray-400">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-blue-500 hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>

      {/* Feature strip */}
      <div className="grid grid-cols-3 border-t border-gray-100 divide-x divide-gray-100">
        {[
          { icon: "🗑️", label: "Report issues" },
          { icon: "🏆", label: "Earn points" },
          { icon: "🌍", label: "Real impact" },
        ].map(({ icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-2 py-6">
            <span className="text-2xl">{icon}</span>
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}