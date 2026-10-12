import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

type ThemeState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

// Check if user prefers dark mode
const getSystemTheme = (): Theme => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

// Apply theme to document
const applyTheme = (theme: Theme) => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }
}

// Apply persisted or system theme before React paints (avoids light flash / stale class).
if (typeof window !== 'undefined') {
  const readPersistedTheme = (): Theme | null => {
    try {
      const raw = localStorage.getItem('endplan-theme')
      if (!raw) return null
      const parsed = JSON.parse(raw) as { state?: { theme?: Theme } }
      return parsed.state?.theme ?? null
    } catch {
      return null
    }
  }

  applyTheme(readPersistedTheme() ?? getSystemTheme())
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: getSystemTheme(),
      setTheme: (theme: Theme) => {
        applyTheme(theme)
        set({ theme })
      },
      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light'
        applyTheme(newTheme)
        set({ theme: newTheme })
      },
    }),
    {
      name: 'endplan-theme',
      onRehydrateStorage: () => (state) => {
        // Apply theme on rehydration
        if (state) {
          applyTheme(state.theme)
        }
      },
    }
  )
)

// Selectors
export const selectTheme = (state: ThemeState) => state.theme
export const selectIsDark = (state: ThemeState) => state.theme === 'dark'
