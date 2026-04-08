import MapView from "../components/Map/MapView"
import { authApi } from "../api/auth.api" // Adjust path as needed
import { useNavigate } from "react-router-dom"

export default function DashboardPage() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await authApi.logout()
      // Redirect to login or home after successful logout
      navigate("/login") 
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Logout Overlay - Adjusted for Safe Area */}
      <div 
        style={{ 
          position: "absolute", 
          // Use env() here to push the button down past the Dynamic Island
          top: "calc(env(safe-area-inset-top) + 10px)", 
          right: "50px", 
          zIndex: 1000 
        }}
      >
        <button onClick={handleLogout} className="bg-red-500 text-white p-2 rounded-md font-semibold">
          Logout
        </button>
      </div>

      <MapView />
    </div>
  )
}