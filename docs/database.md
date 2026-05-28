# Database

**Shapes**: Tables/columns/enums → **`src/types/supabase.ts`** only; regenerate with `npm run db:types` (remote project) or `npm run db:types:local` (local Supabase, requires `supabase start`); do not hand-edit. **Do not infer** shapes from migrations. **Reasoning order**: `supabase.ts` → this file → migrations (**history only**).

**App typing**: Prefer row/insert/update aliases from **`src/types/database.ts`** when present; add aliases in `database.ts` as more tables matter.

**Multi-tenancy** (orgs, membership, domain `org_id`, Storage): **`docs/multi-tenancy.md`**.

## RBAC (`roles`, `profile_roles`, `current_user_has_role`)

- **`roles`**: per-org permission definitions (`admin`, `staff`, …) with `org_id NOT NULL`; **`super_admin`** is the only row with `org_id IS NULL`. Unique per org: `(org_id, name)`. New orgs get default roles via `bootstrap_organization_roles` trigger.
- **`profile_roles`**: junction `(profile_id, role_id)`; no `org_id`. Trigger `validate_profile_role_membership` ensures role org matches `profiles.org_id` (or global `super_admin`).
- **RLS**: `authenticated` reads in-tenant `roles` only. Users read own `profile_roles` when linked role is in-tenant. **No** client IUD on `profile_roles` — **`assign-role`** Edge Function (service role) only.
- **RPC** `current_user_has_role(role_name text)`: matches role name where `roles.org_id IS NULL` (super_admin) or `roles.org_id = current_user_org_id()`.
- **Composite FK targets**: `profiles` and `roles` have `UNIQUE (id, org_id)` for tenant-safe references (see **`docs/multi-tenancy.md`**).
- **Seed**: `supabase/seed.sql` — Acme/Globex orgs, test users with metadata via `handle_new_user`, extra `super_admin` row for `super_admin@test.com`.
