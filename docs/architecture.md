# Architecture

Vue 3 SPA built with Vite. TypeScript throughout; ESLint with Vue and strict type-checked TypeScript rules.

## Boundaries

- **Views** (`src/views/`) — route-level UI; keep them thin; delegate logic to composables or APIs where it grows.
- **Router** (`src/router/`) — navigation and route meta only.
- **App shell** (`src/App.vue`) — global layout and cross-cutting UI concerns (for example session-aware chrome).
- **Libraries** (`src/lib/`) — integrations and feature-oriented modules that are not tied to a single view. The Supabase browser client and auth/profile helpers live in `src/lib/supabase.ts`.
- **Types** (`src/types/`) — generated Supabase schema types in `supabase.ts` (regenerated, not edited by hand) and application-facing aliases in `database.ts` (see `docs/database.md` for schema notes and alias conventions).

## Data access

- **Supabase** — single shared client from `src/lib/supabase.ts`, typed with `Database` from `src/types/database.ts`, configured with env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **Auth and profiles** — `authAPI` and `userAPI` in `src/lib/supabase.ts` encapsulate `auth` calls and `profiles` table access used by login, registration, and dashboard flows.

## Major decisions

- **State** — Pinia is available for shared client state; route-level data can stay local to views/composables when that stays simpler.
- **Styling** — Tailwind CSS for utility-first styling.
