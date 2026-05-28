# Documentation

**Why this exists**: Persistent context for AI agents; humans approve what is recorded. Capture **stable decisions and hard constraints** that are easy to miss from code alone or lose across sessions. Omit tutorial prose, repetition across files, and anything already obvious from reading the repo.

## Index

**Inventory** — All Markdown files in `docs/` are listed below (**flat** layout today). Add a new row **in the same change** when you add a file; if you introduce subfolders, extend this inventory to cover them.

| Doc | When to read / update |
| --- | --- |
| **`docs/architecture.md`** | Layers, boundaries, where data flows (browser vs server paths). |
| **`docs/database.md`** | `supabase.ts` vs migrations, behavior not in types, RLS/RBAC, `database.ts` aliases. |
| **`docs/multi-tenancy.md`** | Organizations, `profiles.org_id`, per-org `roles`, Storage paths, signup, CI tenancy lint. |
| **`docs/documentation.md`** | Changing how docs work; this index; ownership disputes. |
| **`docs/frontend-conventions.md`** | Vue, Pinia, router, `lib/` usage, stores, freshness, Tailwind. |
| **`docs/NEW_PROJECT_TODOS.md`** | One-time checklist when cloning this template (not product canon). |
| **`docs/security.md`** | Authorization vs UX; what may be treated as proof of privilege. |
| **`docs/styling.md`** | Theme, layout widths, canonical Tailwind recipes; reuse vs extract component (≥3×). |

**Maintenance**: Before work, read the row that matches the task. When code changes **documented behavior**, **update that doc in the same change**. One fact → one owner; if two apply, use the **narrower** doc (policy story → `security.md`; table policies → `database.md`; Vue/router/Pinia → `frontend-conventions.md`; **look, feel, Tailwind recipes** → `styling.md`). New topic → new file under `docs/` + add a row here.
