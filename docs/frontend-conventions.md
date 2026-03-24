# Frontend conventions

**Vue**: `<script setup lang="ts">` everywhere. **Composition API only** for new code (no Options API). `defineProps` / `defineEmits` with type parameters when needed.

**Pinia**: **Setup stores** only — `defineStore('id', () => { … })`, `ref` / `computed`, functions, single `return { … }`. In components: **`storeToRefs(store)`** for reactive state/getters; call **actions** on the store instance.

**Router**: `RouteRecordRaw[]`, lazy views `() => import('…')`, extend **`RouteMeta`** in `env.d.ts` for new `meta` (e.g. `requiresAdmin`).

**Entry**: `createApp`, `createPinia`, `app.use(router)`.

**`src/lib/`**: `supabase.ts` (client), `auth.ts` (session + guards), `profile.ts` (reads, role RPCs), `admin.ts` (Edge Function HTTP). Owner **`profiles`** writes that must stay aligned with Pinia → **`useAccountStore`** actions, not `profileAPI`.

**Stores**: **`useSessionStore`** — auth snapshot, admin flags, `rolesLoaded`; **`profileAPI` only** (no direct `supabase` for profile writes). **`useAccountStore`** — profile row; reads via `profileAPI`; owner `profiles` updates via **`supabase`** only when followed immediately by **`refreshProfile()`** (e.g. `updateFullName`).

**`App.vue`**: `bootstrapAuthenticated` / `clearAuthenticatedState` on sign-in/out; **`TOKEN_REFRESHED`** → refresh **profile only** (not roles). Guards: `authAPI` + `profileAPI.hasRole` (not Pinia). Trust: `docs/security.md`.

**Freshness** (after a **successful** mutation): `profiles` → `useAccountStore().refreshProfile()` or `updateFullName()`; own `profile_roles` → `useSessionStore().loadRoles()`; both → `Promise.all([refreshProfile(), loadRoles()])`. Mutations on **other** users’ roles → no session refresh. Sign-in/out bootstrap does **not** replace these after unrelated mutations.

**Styling**: Tailwind.
