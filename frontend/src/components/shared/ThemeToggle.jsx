import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light'
  return localStorage.getItem('bden_theme') || 'light'
}

export default function ThemeToggle({ compact = false, className = '' }) {
  const [theme, setTheme] = useState(getInitialTheme)
  const dark = theme === 'dark'

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('bden_theme', theme)
  }, [dark, theme])

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-warm-200 bg-white px-3 py-2 text-xs font-semibold text-warm-700 shadow-sm transition-colors hover:bg-warm-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 ${compact ? 'h-10 w-10 px-0' : ''} ${className}`}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? <Sun size={15} /> : <Moon size={15} />}
      {!compact && <span>{dark ? 'Light' : 'Dark'}</span>}
    </button>
  )
}
