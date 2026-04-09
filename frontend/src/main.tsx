import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// iOS PWA: measure the REAL screen height and store it as a CSS var.
// window.innerHeight in standalone mode with viewport-fit=cover returns
// the true physical pixel height, which CSS units can't always match.
function setRealViewportHeight() {
  document.documentElement.style.setProperty(
    '--real-height', 
    `${window.innerHeight}px`
  )
}
setRealViewportHeight()
window.addEventListener('resize', setRealViewportHeight)

createRoot(document.getElementById('root')!).render(<App />)