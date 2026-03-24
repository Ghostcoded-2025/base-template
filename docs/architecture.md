# Architecture

Vue 3 SPA built with Vite. TypeScript throughout; ESLint with Vue and strict type-checked TypeScript rules.

## Boundaries

- **Views** (`src/views/`) — route-level UI; keep them thin; delegate logic to composables or APIs where it grows.
- **Router** (`src/router/`) — navigation and route meta only.
- **App shell** (`src/App.vue`) — global layout and cross-cutting UI concerns (for example session-aware chrome).
- **Libraries** (`src/lib/`) — integrations and feature-oriented modules that are not tied to a single view. The Supabase browser client and auth/profile table helpers live in `src/lib/supabase.ts`. Role checks (`current_user_has_role` RPC) live in `src/lib/profile.ts`. Admin-only HTTP calls to Edge Functions live in `src/lib/admin.ts`.
- **Types** (`src/types/`) — generated Supabase schema types in `supabase.ts` (regenerated, not edited by hand) and application-facing aliases in `database.ts` (see `docs/database.md` for schema notes and alias conventions).

## Data access

- **Supabase** — single shared client from `src/lib/supabase.ts`, typed with `Database` from `src/types/database.ts`, configured with env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **Auth and profiles** — `authAPI` and `userAPI` in `src/lib/supabase.ts` encapsulate `auth` calls and `profiles` table access used by login, registration, and dashboard flows.
- **RBAC** — Database tables `roles` and `profile_roles`, RPC `current_user_has_role`, and Edge Functions `assign-role` / `list-admin-users` implement the pattern: browser uses RPC for navigation UX; **mutations and sensitive reads** use Edge Functions that verify the caller’s role then perform work with the service role. New admin features should follow the same pattern (verify `admin` or `super_admin` in the function, then service-role DB access). See `docs/database.md` for RLS and bootstrap notes.

## Major decisions

- **State** — Pinia is available for shared client state; route-level data can stay local to views/composables when that stays simpler.
- **Styling** — Tailwind CSS for utility-first styling.
