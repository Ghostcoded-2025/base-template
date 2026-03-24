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

## Project notes

Row and write shapes for `public.profiles` are generated in `src/types/supabase.ts`. Application code should use the aliases `Profile`, `ProfileInsert`, and `ProfileUpdate` from `src/types/database.ts` when working with that table; add similar aliases there as new tables matter to the app.

Add subsections below as the schema and behaviors grow.
