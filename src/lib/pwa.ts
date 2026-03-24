import { onMounted, onUnmounted, ref, type Ref } from 'vue'

/** CSS display modes that mean the app is installed / app-like, not a normal browser tab. */
const installedPwaDisplayModeQueries = [
  '(display-mode: standalone)',
  '(display-mode: minimal-ui)',
  '(display-mode: window-controls-overlay)',
] as const

/** True when the user is running the app as an installed PWA (standalone window, minimal-ui, window-controls-overlay, or iOS “Add to Home Screen”), not a normal browser tab. */
export function isRunningAsInstalledPwa(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  for (const query of installedPwaDisplayModeQueries) {
    if (window.matchMedia(query).matches) {
      return true
    }
  }
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true
}

/**
 * Reactive “show Install app in nav”: stays in sync when display mode changes without a full
 * reload (e.g. Chromium “Open in app”).
 */
export function useShowInstallNavLink(): Ref<boolean> {
  const show = ref(!isRunningAsInstalledPwa())

  function sync() {
    show.value = !isRunningAsInstalledPwa()
  }

  let detachDisplayModeListeners: (() => void) | undefined

  onMounted(() => {
    sync()
    if (typeof window === 'undefined') {
      return
    }
    const mqs = installedPwaDisplayModeQueries.map((q) =>
      window.matchMedia(q),
    )
    const onChange = () => {
      sync()
    }
    mqs.forEach((mq) => { mq.addEventListener('change', onChange); })
    detachDisplayModeListeners = () => {
      mqs.forEach((mq) => { mq.removeEventListener('change', onChange); })
    }
  })

  onUnmounted(() => {
    detachDisplayModeListeners?.()
  })

  return show
}
