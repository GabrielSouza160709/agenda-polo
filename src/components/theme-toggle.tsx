import { cn } from '@/lib/utils'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'polo-agenda-theme'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY)
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  window.dispatchEvent(new CustomEvent('polo-theme-change', { detail: theme }))
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const initialTheme = getInitialTheme()
    setTheme(initialTheme)
    applyTheme(initialTheme)
  }, [])

  const isDark = theme === 'dark'
  const label = isDark ? 'Modo claro' : 'Modo escuro'
  const Icon = isDark ? Sun : Moon

  return (
    <button
      type="button"
      title={label}
      aria-label="Alternar tema"
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-transparent text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      onClick={() => {
        const nextTheme = isDark ? 'light' : 'dark'
        window.localStorage.setItem(STORAGE_KEY, nextTheme)
        applyTheme(nextTheme)
        setTheme(nextTheme)
      }}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}
