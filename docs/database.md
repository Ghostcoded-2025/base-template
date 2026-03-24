# Database

Written notes for rules, relationships, conventions, and invariants that are **not** obvious from:

- `src/types/supabase.ts` (exact shapes; regenerated)
- `docs/architecture.md` (app boundaries and data-access overview)

## What belongs here

- Composite or implicit constraints not obvious from column types alone
- Soft-delete, archival, versioning, or “effective row” conventions
- Cross-table invariants enforced in triggers, RPCs, or application code
- RLS or security behavior described in plain language when policy code is easy to misread
- Enum or naming conventions that affect how queries or joins must be written

## Typing conventions

Use row, insert, and update aliases exported from `src/types/database.ts` in application code instead of importing equivalent shapes directly from `src/types/supabase.ts` when those aliases exist. Add new aliases in `database.ts` as more tables matter to the app.

## Project notes

### RBAC (`roles`, `profile_roles`, `current_user_has_role`)

- **Model**: `roles` is a global catalog (`name` is unique). `profile_roles` links `profiles.id` to `roles.id` (composite primary key). `profiles.id` matches `auth.users.id`.
- **RLS**: Authenticated users can `SELECT` all `roles` rows (for display). They can `SELECT` only their own `profile_roles` rows. There are **no** client policies that insert/update/delete `profile_roles`; changes go through Edge Functions using the **service role**, after server-side role checks.
- **RPC**: `current_user_has_role(role_name text)` is `SECURITY DEFINER` and returns whether the JWT subject (`auth.uid()`) has that role. The Vue app uses it for UX and route guards; **admin actions must still be enforced in Edge Functions** (or other server code), not only in the browser.
- **Bootstrap**: Seed inserts `admin` and `super_admin` role names. The **first** privileged user must be granted roles manually (SQL against `profile_roles`, or temporary service-role script) until at least one `super_admin` exists to use `assign-role`. See comments in `supabase/migrations/20260324120000_roles_and_profile_roles.sql`.

Add subsections below as the schema and behaviors grow.
