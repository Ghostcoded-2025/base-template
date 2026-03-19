import { ref, computed, onMounted, onUnmounted } from 'vue'

const STORAGE_KEY = 'theme'

export type Theme = 'light' | 'dark' | 'system'

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null
  const v = localStorage.getItem(STORAGE_KEY)
  if (v === 'light' || v === 'dark' || v === 'system') return v
  return null
}

function getSystemDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(dark: boolean): void {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  if (dark) html.classList.add('dark')
  else html.classList.remove('dark')
}

/**
 * Resolve current effective dark state from stored preference (or system).
 */
export function resolveEffectiveDark(): boolean {
  const stored = getStoredTheme()
  if (stored === 'dark') return true
  if (stored === 'light') return false
  return getSystemDark()
}

/**
 * Initialize theme from localStorage (and system if theme is 'system').
 * Call once at app startup (e.g. in main.ts).
 */
export function initTheme(): void {
  applyTheme(resolveEffectiveDark())
}

export function useTheme() {
  const theme = ref<Theme>(getStoredTheme() ?? 'system')
  const systemDark = ref(getSystemDark())
  let mediaQuery: MediaQueryList | null = null
  let mediaListener: (() => void) | null = null

  const isDark = computed(() => {
    if (theme.value === 'dark') return true
    if (theme.value === 'light') return false
    return systemDark.value
  })

  function setTheme(next: Theme) {
    theme.value = next
    localStorage.setItem(STORAGE_KEY, next)
    const dark = next === 'dark' || (next === 'system' && systemDark.value)
    applyTheme(dark)
  }

  function toggleTheme() {
    const dark = theme.value === 'dark' || (theme.value === 'system' && systemDark.value)
    setTheme(dark ? 'light' : 'dark')
  }

  onMounted(() => {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemDark.value = mediaQuery.matches
    mediaListener = () => {
      systemDark.value = mediaQuery!.matches
      if (theme.value === 'system') applyTheme(mediaQuery!.matches)
    }
    mediaQuery.addEventListener('change', mediaListener)
  })

  onUnmounted(() => {
    if (mediaQuery && mediaListener) {
      mediaQuery.removeEventListener('change', mediaListener)
    }
  })

  return { theme, isDark, setTheme, toggleTheme }
}
