# SEO and static generation

**vite-ssg** pre-renders selected routes into static HTML at build time. **`@unhead/vue` v2** (`useSeoMeta`) injects title and social meta into that HTML. Auth-only routes are not pre-rendered; their meta tags apply on client navigation only.

## Stack constraints

- **Build**: `vite-ssg build` (`build-only` script). Pre-render output lands in `dist/*.html`.
- **`@unhead/vue`**: stay on **v2** (match vite-ssg’s peer). v3 breaks head merging into static HTML.
- **`VITE_SITE_URL`**: set in deploy/CI for **absolute** `og:image` URLs at build time. Without it, builds emit relative paths (e.g. `/pwa-512.png`).
- **Site-wide defaults**: `src/lib/seo.ts` — `SEO_SITE_NAME`, default OG image, `SEO_DEFAULTS`.
- **Route inclusion**: `src/lib/ssg-routes.ts` — `SSG_PUBLIC_PATHS`, `fetchDynamicRoutePaths`, `resolveIncludedSsgRoutes` (wired from `vite.config.ts` `ssgOptions.includedRoutes`).
- **Client-only UI**: browser APIs during SSG → `<ClientOnly>` (`src/components/ClientOnly.vue`) or `import.meta.env.SSR` guards. See `App.vue`, `InstallAppView.vue`.

## Three path lists (not one)

| List | File | Purpose |
| --- | --- | --- |
| `SSG_PUBLIC_PATHS` | `src/lib/ssg-routes.ts` | Routes emitted as static `.html` for crawlers |
| `publicPaths` | `src/router/index.ts` | Auth guard: reachable without login; stays available when signed in |
| `publicNavPaths` | `src/router/index.ts` | Guest nav shell (`publicPaths` + login/register) |

New **marketing** URLs usually need updates in **both** `SSG_PUBLIC_PATHS` and `publicPaths`. Login/register-style pages use `guestAuthPathsRedirectWhenAuthenticated` instead of `publicPaths`.

## New public page (checklist)

1. Route + view in `src/router/index.ts`.
2. **`useSeoMeta`** in the view — `title`, `description`, `ogTitle`, `ogDescription`, `ogImage`, `twitterCard` (pattern in `LandingView.vue`; defaults from `src/lib/seo.ts`).
3. Add path to **`SSG_PUBLIC_PATHS`** in `src/lib/ssg-routes.ts`.
4. Add path to **`publicPaths`** if it should stay reachable when signed in.
5. Rebuild and spot-check `dist/<path>.html` for body content and merged meta tags.

## New dynamic route (`/blog/:slug`, etc.)

1. Parameterized route in `src/router/index.ts`.
2. Implement slug/ID fetch in **`fetchDynamicRoutePaths`** (`src/lib/ssg-routes.ts`). Build must reach the data source (API, CMS, files). Empty fetchers → no static pages for those URLs.
3. View: **`useSeoMeta`** with **`computed()`** from loaded page data (title, description, image).
4. Add to **`SSG_PUBLIC_PATHS`** only for static paths; dynamic paths come from the fetcher.

## Auth-only pages

- **`useSeoMeta`** optional for in-app/tab title; not indexed via static HTML unless deliberately added to `SSG_PUBLIC_PATHS` (usually avoid).
- No `SSG_PUBLIC_PATHS` change for dashboard, admin, etc.

## Site branding (occasional)

- `SEO_SITE_NAME` and default OG image in `src/lib/seo.ts`.
- Keep `index.html` title/description roughly aligned (fallback before hydration; pre-rendered pages override via Unhead).

## Operational

Static SEO copy updates only after **rebuild and redeploy**. New blog posts, products, or marketing copy on pre-rendered routes require a new build (or CI SSG step).
