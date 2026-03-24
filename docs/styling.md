# Styling

**Scope**: Theme, layout widths, and **canonical Tailwind class strings** for repeated UI roles. **`main.css`**, Vue templates, PWA view wiring: **`docs/frontend-conventions.md`**.

## Tooling

| Item | Notes |
| --- | --- |
| `tailwind.config.js` | Content globs; **Manrope** as `font-sans`; **`brand.*`**, extended **`gray.*`** (`cloud` … `phantom`) |
| `src/assets/main.css` | `@tailwind` base / components / utilities only |

**Reuse** existing views, shared components, or recipes below before new stacks. Extract a **Vue component** when the same pattern appears **≥3** times.

## Shell and tone

- Light, neutral: cool **gray** chrome, **high-contrast** text (`gray-900` on white / `gray-50` backgrounds).
- **App**: `min-h-screen`, `bg-gray-50`, `text-gray-900`. **Nav**: `h-14`, `bg-white`, `border-b border-gray-200`; inner row `max-w-3xl` + horizontal padding.
- **Type**: Page titles `text-lg font-medium`. Body `text-sm` with `text-gray-600` / `text-gray-700`; strong emphasis in copy `text-gray-900`.
- **`index.html`**: `theme-color` / tile meta **`#111827`** (matches primary filled button).

**Palettes**: Most UI uses **default Tailwind `gray-*`**. Config **brand** / custom **gray** names exist—stick to one approach per surface or migrate deliberately; note here if a whole area switches.

## Layout widths

| Context | Pattern |
| --- | --- |
| Auth | `max-w-sm`, centered `min-h-screen`, `px-4 py-12`, `space-y-6` between major blocks |
| Main app | `max-w-3xl`, `px-4 py-10` (align with nav) |
| Long-form (e.g. install) | `max-w-3xl`, `px-4 py-12` (`sm:px-6 lg:px-8`), `space-y-6` between cards |

## Recipes

**Primary CTA (block)**  
`w-full rounded border border-gray-900 bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-50`

**Primary CTA (inline)**  
`inline-flex items-center gap-2 rounded border border-gray-900 bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-50`

**Ghost / nav / back**  
`text-sm text-gray-600 hover:text-gray-900`

**Form label**  
`block text-sm text-gray-700` (optional `font-medium` for anchor label)

**Text input**  
`mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm`

**Select**  
`mt-1 block w-full max-w-md rounded border border-gray-300 bg-white px-3 py-2 text-sm`

**Inline link row**  
Row: `text-center text-sm text-gray-600`. Separator: `mx-2 text-gray-400` (e.g. `·`). Link: `underline`.

**Card**  
`rounded border border-gray-200 bg-white p-4 shadow-sm`

**Compact notice**  
`space-y-4 rounded border border-gray-200 bg-white p-4 text-sm text-gray-700`

| Feedback | Classes |
| --- | --- |
| Error | `text-sm text-red-600` |
| Success | `rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900` |
| Warning | `rounded-md bg-amber-50 p-3 text-sm text-amber-900` |

**Modal — backdrop**  
`fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4`

**Modal — panel**  
`max-h-[90vh] w-full max-w-md overflow-auto rounded-lg bg-white p-6 shadow-lg`

**Modal — title**  
`text-base font-medium`

**Modal — footer**  
`mt-6 flex justify-end gap-2`

**Modal — cancel**  
`rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50`

**Modal — primary** (currently **indigo**; page forms use **gray-900** fill—known split)  
`rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50`

**Numbered steps (`ol`)**  
`list-decimal space-y-3 pl-5 text-gray-700` — headings in flow: `font-medium text-gray-900`

**Font Awesome solid** (beside `text-sm`)  
`h-4 w-4`, `text-gray-600` / `text-gray-700`

**Loading**  
Full page: `min-h-screen flex items-center justify-center` + `text-sm text-gray-600`. Inline block: `mt-6 text-sm text-gray-600`.

New repeated role → add a **recipe line** (or **one** linked component). Change **`tailwind.config.js`** or **canonical strings** here → update **this file** in the **same change**.
