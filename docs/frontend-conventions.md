# Frontend conventions

**Vue**: `<script setup lang="ts">` everywhere. **Composition API only** for new code (no Options API). `defineProps` / `defineEmits` with type parameters when needed.

**Pinia**: **Setup stores** only — `defineStore('id', () => { … })`, `ref` / `computed`, functions, single `return { … }`. In components: **`storeToRefs(store)`** for reactive state/getters; call **actions** on the store instance.

**Router**: `RouteRecordRaw[]`, lazy views `() => import('…')`, extend **`RouteMeta`** in `env.d.ts` for new `meta` (e.g. `requiresAdmin`). **`setupRouterGuards(router)`** in `src/router/index.ts` — wired from `ViteSSG` in `main.ts` (vite-ssg owns the router instance). Global **`beforeEach`**: **`/`** and **`/install-app`** are public for everyone (including signed-in users); authenticated users hitting **`/login`** or **`/register`** are redirected to **`/dashboard`** (via `authAPI.getCurrentUser()`). When auth changes **without** a navigation (Supabase listener), **`App.vue`** calls **`replaceWithDashboardIfOnGuestAuthPath`** from **`src/router/index.ts`** so login/register URLs stay aligned with the session.

**Entry**: `ViteSSG` in `src/main.ts` (`export const createApp`), `createPinia`, Font Awesome registration in the setup callback. Production build: `vite-ssg build` (`build-only` script). **SEO / SSG**: adding or changing public routes, meta tags, or pre-render behavior → **`docs/seo.md`** (checklists, path lists, constraints).

**`src/lib/`**: `supabase.ts` (client), `auth.ts` (session + guards), `profile.ts` (reads, owner `profiles` updates, role RPCs), `admin.ts` (Edge Function HTTP), `pwa.ts` (`isRunningAsInstalledPwa`, **`useShowInstallNavLink`** — installed detection + reactive nav flag via **`display-mode`** `matchMedia` `change`, for “open in app” without a full reload).

**Stores**: **`useSessionStore`** — auth snapshot, admin flags, `rolesLoaded`; **`profileAPI` / `authAPI` only** (no direct `supabase`). **`useAccountStore`** — profile row; **`profileAPI`** for reads and owner updates; actions call **`refreshProfile()`** after successful mutations (e.g. `updateFullName`).

**`App.vue`**: `bootstrapAuthenticated` / `clearAuthenticatedState` on sign-in/out; **`TOKEN_REFRESHED`** → refresh **profile only** (not roles). Guards: `authAPI` + `profileAPI.hasRole` (not Pinia). Trust: `docs/security.md`. **Unauthenticated** users on paths in **`publicNavPaths`** (`router/index.ts` — **`/`**, **`/login`**, **`/register`**, **`/install-app`**) use the same top nav shell with **Login** and **Install app** (Install hidden via **`useShowInstallNavLink()`** from `lib/pwa.ts`, same as the signed-in nav).

**Freshness** (after a **successful** mutation): `profiles` → `useAccountStore().refreshProfile()` or `updateFullName()`; own `profile_roles` → `useSessionStore().loadRoles()`; both → `Promise.all([refreshProfile(), loadRoles()])`. Mutations on **other** users’ roles → no session refresh. Sign-in/out bootstrap does **not** replace these after unrelated mutations.

**Styling**: Tailwind. Theme, layout widths, and reusable class patterns → **`docs/styling.md`**.

**PWA**: Manifest-only (no service worker). `public/manifest.webmanifest`, icons in `public/`, linked from `index.html`. **Public and auth URLs**: add marketing paths to **`publicPaths`** in **`router/index.ts`** so they stay reachable when signed in; add **`/install-app`** there (or keep it). For **auth-only** pages that signed-in users should not stay on, add the path to **`guestAuthPathsRedirectWhenAuthenticated`** (same set **`replaceWithDashboardIfOnGuestAuthPath`** uses). Install view: UA-based install steps, optional manual scenario, standalone banner, Chromium `beforeinstallprompt` when available, MDN manifest link + **`siteOrigin`** in copy; instruction screenshots under **`src/assets/`** (`chrome-install-icon.png`, `edge-install-icon.png`, `ios-*.png`); **Font Awesome** `ellipsis-vertical` in Android/Edge steps. Netlify: `Content-Type: application/manifest+json` for `/manifest.webmanifest` in `netlify.toml`.
