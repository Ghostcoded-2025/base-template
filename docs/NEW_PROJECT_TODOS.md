# New project checklist

After copying this template for a real app, update the following. Anything listed here is **generic placeholder** configuration, not product-specific.

**When every item below is done, delete this file** (`docs/NEW_PROJECT_TODOS.md`). It is setup-only—not product documentation—and must not stay in the repo.

## Naming and branding

- `**package.json`** — change the `name` field from the placeholder to your package name (currently set to a neutral starter name).
- `**index.html**` — set `<title>` and `meta name="description"` to your product.
- `**src/App.vue**` — replace the nav label `App` with your app name.
- **Search the repo** for any remaining “Base Template” or old template strings (there should be none after a fresh template pass).

## PWA (manifest + install page)

This template uses a **manifest-only** PWA (no service worker). When you ship a real product, replace or align the following.

- **`public/manifest.webmanifest`** — Set `name`, `short_name`, and `description` to your product. Match `theme_color` and `background_color` to your brand (keep them in sync with `index.html` meta tile/theme colors). **`start_url`** and **`scope`** use `/`; if you deploy under a subpath, set Vite **`base`**, then update `start_url` / `scope` (and static asset paths) accordingly.
- **`public/pwa-192.png`** and **`public/pwa-512.png`** — Replace the placeholder icons with your own **192×192** and **512×512** PNGs (required for install prompts on common browsers). Optionally add separate **maskable** icons and extra `icons[]` entries with `"purpose": "maskable"` (or `"any maskable"`).
- **`index.html`** — `meta name="theme-color"`, `meta name="msapplication-TileColor"`, and `link rel="apple-touch-icon"` should match your manifest colors and touch icon asset (change `href` if you rename files).
- **`src/views/InstallAppView.vue`** — Replace the hard-coded **“Base Template”** strings in headings and body copy with your product name. Step text uses the current **hostname** automatically where the old template used a fixed domain.
- **Hosting** — **`netlify.toml`** already serves `/manifest.webmanifest` as `application/manifest+json`. On **another** host (Vercel, Cloudflare, nginx, etc.), configure the same MIME type for the manifest path.

## Styling

- **`docs/styling.md`** — replace or rewrite with **your** theme, layout choices, and component class recipes. The template file documents the starter look (Tailwind defaults, example patterns); a real product should own its own styling doc so reuse and agent context match your brand.

## Supabase CLI / local stack

- `**supabase/config.toml`** — set `project_id` to a unique string per repo (helps distinguish local Supabase instances).
- **Local ports** — **randomize** every port in `supabase/config.toml` when you copy the template (do not keep the template’s `5473x` / `8083` values). Pick unused high ports (e.g. random values in `40000–60000`) so multiple local Supabase stacks on one machine are unlikely to collide. Within one project, each `port =` must still be unique; align related URLs (e.g. `[studio].api_url` must use `[api].port`). Search for `port =` and update:
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

