import type { RouteRecordRaw } from 'vue-router'

/** Public paths pre-rendered into static HTML at build time. */
export const SSG_PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/register',
  '/install-app',
])

function isDynamicSegment(path: string): boolean {
  return path.includes(':')
}

/**
 * Resolve paths for dynamic route params (e.g. `/blog/:slug`).
 * Extend when new parameterized routes are added.
 */
function fetchDynamicRoutePaths(
  routes: readonly RouteRecordRaw[],
): string[] {
  const paths: string[] = []

  const hasBlogSlugRoute = routes.some((route) => route.path === '/blog/:slug')
  if (hasBlogSlugRoute) {
    const slugs = fetchPublishedBlogSlugs()
    paths.push(...slugs.map((slug) => `/blog/${slug}`))
  }

  const hasProductIdRoute = routes.some((route) => route.path === '/products/:id')
  if (hasProductIdRoute) {
    const ids = fetchActiveProductIds()
    paths.push(...ids.map((id) => `/products/${id}`))
  }

  return paths
}

/** Data source for `/blog/:slug` when that route exists. */
function fetchPublishedBlogSlugs(): string[] {
  return []
}

/** Data source for `/products/:id` when that route exists. */
function fetchActiveProductIds(): string[] {
  return []
}

/**
 * Filters vite-ssg route paths to the set we want as static HTML.
 * Called from `ssgOptions.includedRoutes` in `vite.config.ts`.
 */
export function resolveIncludedSsgRoutes(
  paths: string[],
  routes: readonly RouteRecordRaw[],
): string[] {
  const staticPublic = paths.filter(
    (path) => !isDynamicSegment(path) && SSG_PUBLIC_PATHS.has(path),
  )
  const dynamic = fetchDynamicRoutePaths(routes)
  return [...new Set([...staticPublic, ...dynamic])]
}
