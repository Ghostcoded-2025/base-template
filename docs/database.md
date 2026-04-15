# Database

**Shapes**: Tables/columns/enums → **`src/types/supabase.ts`** only; regenerate with `npm run db:types` (remote project) or `npm run db:types:local` (local Supabase, requires `supabase start`); do not hand-edit. **Do not infer** shapes from migrations. **Reasoning order**: `supabase.ts` → this file → migrations (**history only**).

**App typing**: Prefer row/insert/update aliases from **`src/types/database.ts`** when present; add aliases in `database.ts` as more tables matter.

Everything below is behavior and conventions **not** obvious from types alone.

## RBAC (`roles`, `profile_roles`, `current_user_has_role`)

- **`roles`**: global catalog, `name` unique.
- **`profile_roles`**: `profiles.id` ↔ `roles.id`, composite PK; `profiles.id` = `auth.users.id`.
- **RLS**: Authenticated may `SELECT` all `roles`; own `profile_roles` rows only. **No** client policies for IUD on `profile_roles` — changes via Edge Functions + **service role** after server-side role checks.
- **RPC** `current_user_has_role(role_name text)`: **`SECURITY DEFINER`**, evaluates role for `auth.uid()`.
- **Bootstrap**: Seed `admin`, `super_admin`; first privileged user granted manually until a `super_admin` can use `assign-role`. Details in `supabase/migrations/20260324120000_roles_and_profile_roles.sql`.

Add sections for other non-obvious schema behavior as it appears.
