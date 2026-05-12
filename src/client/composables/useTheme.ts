import { ref } from 'vue'

type Theme = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'packy-theme'
const theme = ref<Theme>((localStorage.getItem(STORAGE_KEY) as Theme) ?? 'system')
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

function apply() {
  const isDark = theme.value === 'dark' || (theme.value === 'system' && mediaQuery.matches)
  document.documentElement.classList.toggle('dark', isDark)
}

mediaQuery.addEventListener('change', apply)
apply()

export function useTheme() {
  function setTheme(value: Theme) {
    theme.value = value
    localStorage.setItem(STORAGE_KEY, value)
    apply()
  }

  function toggleTheme() {
    const cycle: Theme[] = ['light', 'dark', 'system']
    setTheme(cycle[(cycle.indexOf(theme.value) + 1) % cycle.length])
  }

  return { theme, setTheme, toggleTheme }
}
