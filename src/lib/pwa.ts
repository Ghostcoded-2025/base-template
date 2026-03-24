/** True when the user is running the app as an installed PWA (standalone window, minimal-ui, or iOS “Add to Home Screen”), not a normal browser tab. */
export function isRunningAsInstalledPwa(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return true
  }
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true
}
