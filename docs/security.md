# Security

**Authorization** — not UX hints:

| Untrusted (hints only) | Trusted (enforcement) |
| --- | --- |
| Pinia `useSessionStore`, `useAccountStore` | Postgres **RLS** on tables the anon/authenticated role can use |
| Vue Router `beforeEach` | **Edge Functions** (or equivalent) that validate the caller before service role / sensitive work |
| UI hidden by store getters alone | **No** sensitive mutation relying only on “the UI checked the store” |

Assume a **hostile client** (devtools, forged requests).

**RPC `current_user_has_role`**: Executes with the user JWT; **result** is server-derived, **whether to call** is client-controlled. Use for navigation UX; **not** a substitute for RLS + server checks on **writes** and **sensitive reads**.

**New feature**: Still safe if the SPA is skipped and only HTTP is used? If not, tighten **RLS** and/or **server verification**.

Per-table RLS/RBAC: `docs/database.md`. Store refresh after mutations: `docs/frontend-conventions.md`.
