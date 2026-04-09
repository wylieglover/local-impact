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
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      {/* Logout Overlay */}
      <div 
        style={{ 
          position: "absolute", 
          top: "calc(env(safe-area-inset-top) + 16px)",
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
      
      <div style={{
        position: "fixed",
        bottom: 100,
        left: 10,
        zIndex: 9999,
        background: "rgba(0,0,0,0.85)",
        color: "white",
        padding: "8px",
        fontSize: "11px",
        borderRadius: "8px",
        fontFamily: "monospace"
      }}>
        <div>innerHeight: {window.innerHeight}</div>
        <div>innerWidth: {window.innerWidth}</div>
        <div>safeTop: {CSS.supports("padding", "env(safe-area-inset-top)") ? "supported" : "no"}</div>
      </div>

      <MapView />
    </div>
  )
}