# Architecture

Wiring between **layers**, **where work runs** (browser client vs server), and integration boundaries—at that level of abstraction, with **pointers** to topic docs instead of restating structure that already lives in the repo.

**Trust / authorization**: `docs/security.md`. **Vue/Pinia/router/libs**: `docs/frontend-conventions.md`. **RLS, RBAC, aliases**: `docs/database.md`.

## Layer diagram

Typical dependency flow: UI and routing call into **stores** and **`lib`** helpers; **`lib`** owns the Supabase client and talks to remote services. **`types/`** is shared typing (generated schema + app aliases), not a runtime layer.

```mermaid
flowchart TB
  subgraph presentation["Presentation"]
    V["views/"]
    A["App.vue"]
    R["router/"]
  end
  subgraph state["State"]
    ST["stores/"]
  end
  subgraph integrations["Integrations & typing"]
    L["lib/"]
    T["types/"]
  end
  subgraph remote["Remote"]
    SB[("Supabase<br/>PostgREST & RPC")]
    EF["Edge Functions"]
  end
  V --> ST
  V --> L
  A --> ST
  A --> L
  R -.-> V
  ST --> L
  L --> T
  L --> SB
  L --> EF
```

- **`src/views/`** — Route-level UI; keep thin. Public vs authenticated flows and route-level UI conventions → **`docs/frontend-conventions.md`**.
- **`src/router/`** — Route table, `meta`, and global navigation guards (`beforeEach`).
- **`src/App.vue`** — Layout; authenticated session lifecycle (bootstrap / clear) lives here—details in `docs/frontend-conventions.md`.
- **`src/lib/`** — Shared integrations: `supabase.ts`, `auth.ts`, `profile.ts`, `admin.ts`, `pwa.ts`.
- **`src/types/`** — `supabase.ts` generated (do not hand-edit); `database.ts` app aliases—see `docs/database.md`.

**Data access**: Single browser client in `src/lib/supabase.ts`, typed with `Database` from `src/types/database.ts`, env `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Flow: PostgREST and RPCs under **RLS** where appropriate; work that must not depend on the client alone uses **Edge Functions** (verify caller, then elevated access such as service role).

**ESLint import boundaries**: `@typescript-eslint/no-restricted-imports` blocks `import … from '@/lib/supabase'` outside the integration layer. **Allowed** importers today: `src/lib/auth.ts`, `src/lib/profile.ts`, `src/lib/admin.ts`, plus `src/lib/supabase.ts` itself. Everything else should use `auth` / `profile` / `admin` helpers, Pinia actions, or Edge-backed APIs—not a new direct client import. **When you add a new `src/lib/` module that must use the client**, extend the `ignores` list on the `app/restrict-supabase-client-import` block in `eslint.config.ts` and update this paragraph so the doc and linter stay aligned.

**Decisions**: Two Pinia stores for signed-in UX; route guards must not rely on Pinia alone—**`docs/frontend-conventions.md`**.
