# Multi-tenancy



Org-scoped data isolation: membership on `profiles.org_id`, domain rows carry `org_id`, RLS and Storage policies enforce boundaries. **Types**: `src/types/supabase.ts` (regenerate after schema changes).



## Where `org_id` lives



| Purpose | Table | `org_id` column? |

| --- | --- | --- |

| Tenant root | `organizations` | No (`storage_bucket_id` = `id::text`) |

| User membership | `profiles` | **Yes, NOT NULL** (immutable after signup) |

| Permissions | `roles` | Yes (nullable); **NULL only for `super_admin`** |

| Permission assignment | `profile_roles` | No (scope via `roles.org_id`; trigger enforces match) |

| Business data | *(future tables)* | **Yes, NOT NULL** + RLS |



**New domain table checklist**: `org_id NOT NULL REFERENCES organizations(id)`, `UNIQUE (id, org_id)`, index, `ENABLE` + `FORCE ROW LEVEL SECURITY`, policies using `user_belongs_to_org(org_id)` on reads/writes.



## Composite FKs



Tenant tables that reference another tenant table must include `org_id` on both sides:



```sql

CREATE TABLE parent (

  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  org_id uuid NOT NULL REFERENCES organizations (id),

  UNIQUE (id, org_id)

);



CREATE TABLE child (

  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  org_id uuid NOT NULL REFERENCES organizations (id),

  parent_id uuid NOT NULL,

  UNIQUE (id, org_id),

  FOREIGN KEY (parent_id, org_id) REFERENCES parent (id, org_id)

);

```



**FK targets**: `profiles` and `roles` have `UNIQUE (id, org_id)`.



**Exceptions**: `profile_roles` (junction, no `org_id` — use `validate_profile_role_membership` trigger), `organizations`.



## Signup



- Client sends `org_id` in auth metadata (`authAPI.signUp`). **No `role_id`** — signup rejects metadata that includes it.

- `handle_new_user` creates `profiles` only. **No** `profile_roles` insert at signup.

- `anon` may `SELECT` `organizations` for the register form.

- Org admins assign roles via **`assign-role`** (service role writes `profile_roles`).



## RBAC



- Each org gets `admin` and `staff` rows in `roles` (bootstrap trigger on `organizations` insert).

- Only **`super_admin`** has `roles.org_id IS NULL` (platform-wide).

- `profile_roles` is `(profile_id, role_id)`; trigger `validate_profile_role_membership` enforces role org = profile org.

- **Org admin**: manage users in own org via Edge Functions. **Super admin**: cross-org + `create-organization`.



## Edge Functions



| Function | Who |

| --- | --- |

| `create-organization` | `super_admin` only (service role insert) |

| `assign-role` | `super_admin` or org `admin` (same org targets only; no granting `super_admin` unless caller is super admin) |

| `list-admin-users` | `super_admin` (optional `org_id` filter) or org `admin` (forced to own org) |



## Storage



- **One private bucket per org** — `organizations.storage_bucket_id` (= org UUID string).

- Provisioned by `bootstrap_organization_storage` trigger on `organizations` INSERT.

- Object paths have **no org prefix** (e.g. `docs/file.pdf`); the bucket id scopes the tenant.

- RLS on `storage.objects`: `bucket_id = current_user_org_id()::text`.

- Client: `src/lib/storage.ts` — `orgBucketId(orgId)`, `storageObjectPath(relativePath)`.



## Negative integration tests



```bash

supabase start

supabase db reset

npm run test:tenancy

```



Vitest suite under `tests/tenancy/`. When adding a tenant-scoped feature, add `tests/tenancy/<feature>.test.ts` with cross-org read/write failure cases. See `tests/tenancy/README.md` and `.cursor/rules/tenancy-integration-tests.mdc`.



## CI linter



```bash

supabase start

supabase db reset

npm run db:lint:tenancy

```



Runs SQL via `docker exec` into `supabase_db_base-template` (override with `SUPABASE_DB_CONTAINER` if needed). Requires Docker and a running local stack.



**Allowlist** (no `org_id` column required): `organizations`, `profile_roles`. **Special**: `profiles` and `roles` must have `org_id` column (roles nullable). Script: `scripts/lint-tenant-policies.sql`.



Update allowlist in that SQL file and this doc together if exemptions change.


