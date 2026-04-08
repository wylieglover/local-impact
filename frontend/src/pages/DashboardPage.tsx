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
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      {/* Logout Overlay */}
      <div 
        style={{ 
          position: "absolute", 
          top: "62px", 
          right: "45px", 
          zIndex: 1000
        }}
      >
        <button
          onClick={handleLogout}
          style={{
            padding: "8px 16px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
          }}
        >
          Logout
        </button>
      </div>

      <MapView />
    </div>
  )
}