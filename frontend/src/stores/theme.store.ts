import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemeState = {
  mode: 'dark' | 'light'
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'dark', // Start in dark mode by default
      toggleTheme: () => set((state) => ({ 
        mode: state.mode === 'dark' ? 'light' : 'dark' 
      })),
    }),
    { name: 'theme-storage' }
  )
)