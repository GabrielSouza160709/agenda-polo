import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        background: 'var(--bg-primary)',
        foreground: 'var(--text-primary)',
        muted: 'var(--bg-surface-2)',
        'muted-foreground': 'var(--text-secondary)',
        card: 'var(--bg-surface)',
        'card-foreground': 'var(--text-primary)',
        primary: 'var(--brand)',
        'primary-foreground': 'var(--text-on-brand)',
        destructive: 'var(--error)',
        'destructive-foreground': 'var(--text-on-error)',
        ring: 'var(--border-focus)',
      },
    },
  },
  plugins: [],
}

export default config
