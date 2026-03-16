'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const defaultTheme: ThemeContextType = {
  theme: 'light',
  toggleTheme: () => {},
}

const ThemeContext = createContext<ThemeContextType>(defaultTheme)

export function Providers({ children }: any) {
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = (savedTheme || (prefersDark ? 'dark' : 'light')) as Theme
    
    setTheme(initialTheme)
    applyTheme(initialTheme)
    setMounted(true)
  }, [])

  const applyTheme = (newTheme: Theme) => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', newTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    applyTheme(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  return context
}
