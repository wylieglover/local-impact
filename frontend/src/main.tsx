import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

function setRealViewportHeight() {
  // Measure env(safe-area-inset-top) as actual pixels
  const el = document.createElement('div')
  el.style.position = 'fixed'
  el.style.top = '0'
  el.style.paddingTop = 'env(safe-area-inset-top)'
  document.body.appendChild(el)
  const safeTop = parseFloat(getComputedStyle(el).paddingTop) || 0
  document.body.removeChild(el)

  // 894 + 62 = 956 = full physical screen
  document.documentElement.style.setProperty('--real-height', `${window.innerHeight + safeTop}px`)
  document.documentElement.style.setProperty('--safe-top', `${safeTop}px`)
}
setRealViewportHeight()
window.addEventListener('resize', setRealViewportHeight)

createRoot(document.getElementById('root')!).render(<App />)