# Architecture

Layers and **where work runs** (browser client vs server). **Trust / authorization**: `docs/security.md`. **Vue/Pinia/router/libs**: `docs/frontend-conventions.md`. **RLS, RBAC, aliases**: `docs/database.md`.

- **`src/views/`** — Route-level UI; keep thin.
- **`src/router/`** — Routes and `meta` only.
- **`src/App.vue`** — Layout; authenticated session lifecycle (bootstrap / clear) lives here—details in `docs/frontend-conventions.md`.
- **`src/lib/`** — Shared integrations: `supabase.ts`, `auth.ts`, `profile.ts`, `admin.ts`.
- **`src/types/`** — `supabase.ts` generated (do not hand-edit); `database.ts` app aliases—see `docs/database.md`.

**Data access**: Single browser client in `src/lib/supabase.ts`, typed with `Database` from `src/types/database.ts`, env `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Flow: PostgREST and RPCs under **RLS** where appropriate; work that must not depend on the client alone uses **Edge Functions** (verify caller, then elevated access such as service role).

**Decisions**: Two Pinia stores for signed-in UX; route guards must not rely on Pinia alone—**`docs/frontend-conventions.md`**.
