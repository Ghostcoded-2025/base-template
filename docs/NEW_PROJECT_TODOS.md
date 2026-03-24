# New project checklist

After copying this template for a real app, update the following. Anything listed here is **generic placeholder** configuration, not product-specific.

## Naming and branding

- `**package.json`** — change the `name` field from the placeholder to your package name (currently set to a neutral starter name).
- `**index.html**` — set `<title>` and `meta name="description"` to your product.
- `**src/App.vue**` — replace the nav label `App` with your app name.
- **Search the repo** for any remaining “Base Template” or old template strings (there should be none after a fresh template pass).

## Supabase CLI / local stack

- `**supabase/config.toml`** — set `project_id` to a unique string per repo (helps distinguish local Supabase instances).
- **Port collisions** — if you run **multiple** local Supabase projects on one machine, every port in `config.toml` must be unique per project. Search for `port =` and align related URLs:
  - `[api].port` — REST/Auth API (and match `[studio].api_url` if present).
  - `[db].port`, `[db].shadow_port`, `[db.pooler].port` (if pooler is enabled).
  - `[studio].port`
  - `[inbucket].port` and `smtp_port` (local email testing).
  - `[analytics].port`
  - `[edge_runtime].inspector_port`
- `**[auth].site_url`** and `**[auth].additional_redirect_urls**` — must match your dev server origin (default Vite is `http://localhost:5173`) and production URLs when you deploy.

## Environment variables

- Copy `**.env.example**` to `**.env**` (do not commit `.env`).
- Set `**VITE_SUPABASE_URL**` and `**VITE_SUPABASE_ANON_KEY**` from the Supabase dashboard (Settings → API).

## Auth behavior

- **Email confirmation** — controlled in Supabase (e.g. `[auth.email] enable_confirmations` locally, project settings in hosted Supabase). Adjust signup UX and redirects if you change this.
- **Invite-only apps** — remove or protect the `/register` route, and consider disabling `enable_signup` under `[auth]` / dashboard settings.
- **“Username” login** — this template uses Supabase **email + password**. Username-based sign-in needs a different auth design (custom claims, magic links, or external IdP).

