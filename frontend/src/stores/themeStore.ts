import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: () => 'light' | 'dark'
}

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  const resolved = theme === 'system' ? getSystemTheme() : theme
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',

      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },

      resolvedTheme: () => {
        const { theme } = get()
        return theme === 'system' ? getSystemTheme() : theme
      },
    }),
    {
      name: 'devhelp-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme)
      },
    },
  ),
)

// Apply theme immediately on module load (avoids FOUC)
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('devhelp-theme')
  const theme: Theme = stored ? (JSON.parse(stored)?.state?.theme ?? 'system') : 'system'
  applyTheme(theme)
}
