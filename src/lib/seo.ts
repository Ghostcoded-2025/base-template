export const SEO_SITE_NAME = 'Base Template'

const DEFAULT_OG_IMAGE_PATH = '/pwa-512.png'

/** Canonical site origin for absolute Open Graph URLs during SSG and in the browser. */
export function resolveSiteOrigin(): string {
  const configured = import.meta.env.VITE_SITE_URL
  if (configured) {
    return configured.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return ''
}

export function resolveOgImageUrl(path = DEFAULT_OG_IMAGE_PATH): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  const origin = resolveSiteOrigin()
  return origin ? `${origin}${path}` : path
}

export const SEO_DEFAULTS = {
  siteName: SEO_SITE_NAME,
  ogImage: resolveOgImageUrl(),
  twitterCard: 'summary_large_image' as const,
}
