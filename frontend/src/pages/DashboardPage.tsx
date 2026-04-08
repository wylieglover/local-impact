import MapView from "../components/Map/MapView"
import { authApi } from "../api/auth.api"
import { useNavigate } from "react-router-dom"

export default function DashboardPage() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await authApi.logout()
      navigate("/login") 
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    // changed to fixed inset-0 to ensure it fills the literal screen height
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-slate-900">
      
      {/* Logout Overlay */}
      <div 
        style={{ 
          position: "absolute", 
          // This tells iOS: "Start at the bottom of the notch, then add 10px"
          top: "calc(env(safe-area-inset-top) + 15px)", 
          right: "45px", 
          zIndex: 1000 
        }}
      >
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white border-none rounded-md cursor-pointer font-semibold shadow-md active:opacity-80 transition-opacity"
        >
          Logout
        </button>
      </div>

      <MapView />
    </div>
  )
}