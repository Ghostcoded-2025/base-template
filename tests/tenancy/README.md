# Tenancy integration tests

Negative tests: authenticated users in org A must not read or write org B data.

## Prerequisites

```bash
supabase start
supabase db reset
# Wait for auth to be ready if sign-in fails immediately after reset.
```

## Run

```bash
npm run test:tenancy
```

CI sets `SUPABASE_API_URL` and `SUPABASE_ANON_KEY` after `supabase start`.

## Adding tests for a new feature

1. Copy `_template.feature.test.ts.example` to `<feature>.test.ts`.
2. Use seed users (`admin@test.com`, `staff@test.com` → Acme; `GLOBEX_ORG_ID` for cross-org targets).
3. Assert **failure or empty** for cross-org access — never only “no error”.
4. Run `npm run test:tenancy` before opening a PR.

See **`docs/multi-tenancy.md`** and **`.cursor/rules/tenancy-integration-tests.mdc`**.
