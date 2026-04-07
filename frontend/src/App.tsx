import Router from "./router"
import AuthInitializer from "./components/AuthInitializer"

export default function App() {
  return (
    <AuthInitializer>
      <Router />
    </AuthInitializer>
  )
}