# Architecture

Vue 3 SPA built with Vite. TypeScript throughout; ESLint with Vue and strict type-checked TypeScript rules.

## Boundaries

- **Views** (`src/views/`) — route-level UI; keep them thin; delegate logic to composables or APIs where it grows.
- **Router** (`src/router/`) — navigation and route meta only.
- **App shell** (`src/App.vue`) — global layout and cross-cutting UI concerns (for example session-aware chrome).
- **Libraries** (`src/lib/`) — integrations and feature-oriented modules that are not tied to a single view. The Supabase browser client and auth/profile helpers live in `src/lib/supabase.ts`.
- **Types** (`src/types/`) — generated Supabase schema types (`supabase.ts`, do not edit by hand) and application-facing aliases in `database.ts` (see the database schema Cursor rule).

## Data access

- **Supabase** — single shared client from `src/lib/supabase.ts`, configured with env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **Typing** — the client is typed with the `Database` shape from `src/types/database.ts` (which re-exports generated types). Prefer row/insert/update aliases from `database.ts` in application code rather than importing raw helpers from `supabase.ts` where aliases exist.
- **Auth and profiles** — `authAPI` and `userAPI` in `src/lib/supabase.ts` encapsulate `auth` calls and `profiles` table access used by login, registration, and dashboard flows.

## Major decisions

- **State** — Pinia is available for shared client state; route-level data can stay local to views/composables when that stays simpler.
- **Styling** — Tailwind CSS for utility-first styling.
- **Documentation** — Schema subtleties and invariants that are not obvious from generated types belong in `docs/database.md` and should be updated when behavior changes.
