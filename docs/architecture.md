# Architecture

Vue 3 SPA built with Vite. TypeScript throughout; ESLint with Vue and strict type-checked TypeScript rules. **How** we write Vue and Pinia in this repo is fixed in **Vue 3 and Pinia conventions** below—follow that for new views, components, and stores.

## Vue 3 and Pinia conventions

Use current **Composition API** patterns everywhere in app UI and shared state; do not introduce Options API (`export default { data, methods, … }`) for new code.

- **Single-file components** — Every `.vue` file uses **`<script setup lang="ts">`**. Use `ref`, `reactive` (sparingly), `computed`, and lifecycle hooks from **`vue`**. Prefer **typed** `defineProps<{ … }>()` and **`defineEmits<{ … }>()`** (type-parameter form) for components that declare props or events.
- **Pinia** — Stores use **setup stores**: `defineStore('id', () => { … })` with **`ref` / `computed`** for state and derived values, plain **`function`** declarations for actions, and a single **`return { … }`** of everything that should be public. Do **not** use the options-store shape (`state: () => ({})`, `getters: {}`, `actions: {}`).
- **Stores in components** — Use **`storeToRefs(store)`** when you need reactive state or computed getters from a store inside `<script setup>` (e.g. for `watch` or passing refs around). Call **actions** on the store instance (`store.loadRoles()`). Templates auto-unwrap refs returned from `storeToRefs`.
- **Router** — Define the route table as **`RouteRecordRaw[]`** and pass it to **`createRouter`**. Use **dynamic imports** for lazy views: `component: () => import('../views/ExampleView.vue')`. Extend **`RouteMeta`** in `env.d.ts` when you add new `meta` flags (see existing `requiresAdmin` / `requiresSuperAdmin`).
- **Entry** — `main.ts` uses **`createApp`**, **`createPinia`**, and **`app.use(router)`**—no legacy global Vue APIs.

## Boundaries

- **Views** (`src/views/`) — route-level UI; keep them thin; delegate logic to composables or APIs where it grows.
- **Router** (`src/router/`) — navigation and route meta only.
- **App shell** (`src/App.vue`) — global layout and cross-cutting UI concerns (for example session-aware chrome).
- **Libraries** (`src/lib/`) — integrations and feature-oriented modules that are not tied to a single view. The shared Supabase client is `src/lib/supabase.ts`. Auth helpers are `authAPI` in `src/lib/auth.ts`. Role checks and profile reads (`current_user_has_role`, `getCurrentProfile`) live in `src/lib/profile.ts`. Owner **writes** to the current user’s `profiles` row that must stay aligned with Pinia (e.g. `full_name`) live in **`useAccountStore`** actions, not `profileAPI`. Admin-only HTTP calls to Edge Functions live in `src/lib/admin.ts`.
- **Types** (`src/types/`) — generated Supabase schema types in `supabase.ts` (regenerated, not edited by hand) and application-facing aliases in `database.ts` (see `docs/database.md` for schema notes and alias conventions).

## Data access

- **Supabase** — single shared client from `src/lib/supabase.ts`, typed with `Database` from `src/types/database.ts`, configured with env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **Auth and profiles** — `authAPI` (`src/lib/auth.ts`) covers sign-up, sign-in, and session events. **`profileAPI`** in `src/lib/profile.ts` is the shared path for reads and role RPCs. UI uses **`useAccountStore().updateFullName()`** (and similar actions as you add them) for owner `profiles` updates so the account store stays accurate (see **Pinia store freshness** below).
- **RBAC** — Database tables `roles` and `profile_roles`, RPC `current_user_has_role`, and Edge Functions `assign-role` / `list-admin-users` implement the pattern: browser uses RPC for navigation UX; **mutations and sensitive reads** use Edge Functions that verify the caller’s role then perform work with the service role. New admin features should follow the same pattern (verify `admin` or `super_admin` in the function, then service-role DB access). See `docs/database.md` for RLS and bootstrap notes.

## Authorization: client UX vs server enforcement

This section is the **source of truth** for how much to trust browser-side state and checks. The goal is to avoid gradually treating Pinia or router logic as “real” security.

- **UX hints (untrusted for authorization)** — Anything that runs only in the browser and can be changed or bypassed by the user is a **hint** for product experience, not proof of privilege:
  - Pinia **`useSessionStore`** and **`useAccountStore`** (e.g. `isAdmin`, `isSuperAdmin`, `rolesLoaded`, `profile`).
  - **Vue Router** `beforeEach` guards: they improve redirects and reduce flashes, but the user can skip or race them; do not assume they ran.
  - Optional: hiding buttons or routes based only on store getters without the server rejecting forbidden actions anyway.

- **Enforcement (trusted)** — Assume the client is hostile. Decisions that matter must hold even if Pinia is edited in devtools or requests are forged:
  - **Postgres RLS** on tables the anon/authenticated role can reach.
  - **Edge Functions** (and any other server paths) that validate the caller (JWT + role checks) before using the **service role** or performing sensitive work.
  - **No sensitive mutation** should rely solely on “the UI already checked `sessionStore`.” The API or database must reject unauthorized calls.

- **RPC `current_user_has_role` in the browser** — The RPC executes on the server with the caller’s JWT, so the **result** is server-derived, but the **decision to call it** is still client-controlled. Use it for **navigation UX** and guards as today; do not treat “we called the RPC in the router” as a substitute for RLS and Edge Function checks on **writes** and **sensitive reads**.

- **Practical rule for new features** — Ask: “If someone bypassed the SPA entirely and sent HTTP requests with a stolen or crafted session, would this still be safe?” If not, add or tighten **RLS** and/or **server-side verification** (Edge Functions, etc.). Pinia stays in sync for UX only (see **Pinia store freshness** below).

## Major decisions

- **State** — Pinia uses two **setup** stores (see **Vue 3 and Pinia conventions**): **session** (`useSessionStore`) for auth presence, a small auth user snapshot, and admin/super-admin flags (`rolesLoaded` avoids flashing the wrong nav); **account** (`useAccountStore`) for the current user’s profile row. These stores are **UX hints only** for authorization; see **Authorization: client UX vs server enforcement** above. The app shell (`App.vue`) runs **`bootstrapAuthenticated`** (refresh profile + load roles) and **`clearAuthenticatedState`** when signing in or out; on `TOKEN_REFRESHED` it refreshes the account profile only (not roles). Router guards keep using `authAPI` and `profileAPI.hasRole` so route gating does not depend on Pinia (guards are still browser-side UX; server enforcement is separate). **`useSessionStore`** uses `profileAPI` only. **`useAccountStore`** uses `profileAPI` for reads and **`supabase`** only for owner `profiles` writes that are immediately followed by `refreshProfile()` (e.g. `updateFullName`). `authAPI` lives in `src/lib/auth.ts` for the app shell only.
- **Pinia store freshness (mandatory)** — After any **successful** mutation that changes data reflected in a store, refresh that store (or use a store action that performs the mutation and refresh together). Concretely:
  - **Current user’s profile row** (`profiles`): call `useAccountStore().refreshProfile()` after the mutation, or use **`useAccountStore().updateFullName()`** (it performs the update then refreshes via `profileAPI.getCurrentProfile()`). Do not update `profiles` for the signed-in user from random call sites without refreshing the account store afterward.
  - **Current user’s roles** (`profile_roles`, e.g. after `assign-role` or similar for the signed-in user): call **`useSessionStore().loadRoles()`**. Mutations that only change **another** user’s roles do not require refreshing the session store. If both profile and roles might change in one flow, run `await Promise.all([useAccountStore().refreshProfile(), useSessionStore().loadRoles()])` (same pattern as bootstrap).
  - **Auth sign-in / sign-out** is handled in `App.vue` (`bootstrapAuthenticated` / `clearAuthenticatedState`); application code must not assume that replaces explicit refresh after its own mutations.
- **Styling** — Tailwind CSS for utility-first styling.
