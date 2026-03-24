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


Add subsections below as the schema and behaviors grow.
