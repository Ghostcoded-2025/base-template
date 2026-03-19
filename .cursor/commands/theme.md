# Theme Audit & Auto-Fix

You are working in the **agri-linq** frontend repo. Your job is to use the existing theme tooling to audit and fix **non–theme-aware UI** so the app is fully theme-aware, following the rules below and the existing theme rule files.

When this command is run (for example via a Cursor command pointing at this file), treat the user’s message as the **high-level intent** (e.g. “make the app theme-aware”) and then follow this playbook.

---

## 1. Refresh the theme audit

From the repo root:

- Run the audit script:

```bash
node scripts/audit-theme-pending.mjs
```

- This regenerates `THEME_PENDING_AUDIT.md` at the repo root.
- Open `THEME_PENDING_AUDIT.md` and use it as the **source of truth** for suspected non–theme-aware lines.

Goal: work through every file/line listed there until either the audit is empty or only intentional exceptions remain.

---

## 2. Load the rules and shared styles

Before changing anything, read and respect these:

- **Theme rule**: `.cursor/rules/theme-aware-ui.mdc`
- **Audit script** (for context): `scripts/audit-theme-pending.mjs`
- **Shared styles**: `src/style.css`

### 2.1 Preferred shared classes

Whenever possible, prefer shared utility classes over ad‑hoc Tailwind:

- **Containers**:
  - `card`
  - `card-elevated`
- **Inputs**:
  - `input-field`
- **Buttons**:
  - `btn-primary`
  - `btn-ghost`
  - `btn-secondary`
  - `btn-danger`

If an element already matches what these utilities are for (e.g. a standard button or input), convert it to use the shared class instead of hand-written Tailwind.

### 2.2 Raw Tailwind: always pair light + dark

When you keep or add raw Tailwind classes, **never** rely on dark-only / white-only styles. Always pair a light theme base with a dark theme override.

Use these as your default patterns (adjust only when a specific design clearly needs it):

- **Text**
  - Primary / headings:
    - `text-gray-900 dark:text-white`
  - Secondary / body:
    - `text-gray-600` or `text-gray-700`
    - `dark:text-white/70` or `dark:text-white/80`
  - Muted / captions:
    - `text-gray-500 dark:text-white/60`

- **Backgrounds (cards, panels, surfaces)**
  - `bg-gray-100` or `bg-gray-200`
  - plus `dark:bg-white/5` or `dark:bg-white/10`

- **Borders & rings**
  - `ring-gray-200 dark:ring-white/20`
  - `border-gray-200 dark:border-white/20`

- **Placeholders**
  - `placeholder-gray-500 dark:placeholder-white/60`

### 2.3 Dynamic / JS class strings

For any of these patterns:

- Helper functions: `getStatusClass`, `getPriorityClass`, etc.
- Inline ternaries: `:class="condition ? '...' : '...'"`
- Arrays/objects passed into `:class`

Make sure the **returned strings themselves** already include both light and dark variants. For example:

```js
const statusClass = (status) => {
  if (status === 'error') {
    return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300';
  }
  return 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white/70';
};
```

---

## 3. Allowed exceptions (do NOT “fix” these)

Some uses of `text-white` on solid brand colors are intentional and acceptable. Treat the following as **allowed**, and generally leave them as-is unless the visual design is clearly broken:

- **Solid primary/danger buttons and solid colored badges** that intentionally use white text on a brand color, such as:

  - `bg-primary-600 text-white`
  - `bg-blue-600 text-white`
  - `bg-red-600 text-white`
  - `bg-green-600 text-white`
  - `bg-yellow-600 text-white`
  - `bg-teal-600 text-white`
  - Similar solid brand/badge colors (e.g. `bg-purple-600 text-white`, `bg-cyan-600 text-white`), especially when used as:
    - Primary actions
    - “Pill” badges or status chips
    - Icon-only circular buttons on brand backgrounds

- Solid colored alert/notification badges that are clearly meant to be high-contrast color blocks with white text.

When an audit hit appears on one of these patterns:

- Confirm it is indeed a solid brand color background with white text used for a button or badge.
- If yes, treat it as an intentional exception and leave it unchanged.
- If no (e.g. white text directly on `bg-transparent` or on a neutral background), treat it as a real issue and fix it.

---

## 4. Systematically fix audited files

For each `### <file>` section and each `Lxx` entry in `THEME_PENDING_AUDIT.md`:

1. **Open the file** at the reported line.

2. **Classify the line**:

   - **Real issue**:
     - Uses `text-white` or `text-white/NN` without an appropriate `text-gray-XXX` base and dark override.
     - Uses `bg-white/NN`, `ring-white/NN`, `border-white/NN`, or `placeholder-white/NN` with no gray base and dark override.
     - Dark-only text/background like `text-white` on `bg-slate-900` that should be theme-aware.
     - A dynamic class string that only has dark/white styles and no paired light theme styles.
   - **Allowed exception**:
     - Matches the “solid brand button/badge with white text” patterns listed above and is obviously intended as such.

3. **If it’s a real issue, fix it**:

   - For text:

     - Convert to something like:

       - Primary label:

         ```html
         class="text-gray-900 dark:text-white"
         ```

       - Secondary:

         ```html
         class="text-gray-600 dark:text-white/70"
         ```

   - For backgrounds:

     - Replace white-based overlays like:

       ```html
       class="bg-white/10 ..."
       ```

     - With a gray base + dark override:

       ```html
       class="bg-gray-100 dark:bg-white/10 ..."
       ```

   - For borders / rings:

     - Replace:

       ```html
       class="ring-white/20 border-white/20"
       ```

     - With:

       ```html
       class="ring-gray-200 dark:ring-white/20 border-gray-200 dark:border-white/20"
       ```

   - For inputs and buttons:

     - Prefer using `input-field` or `btn-*` where possible instead of duplicating raw Tailwind.

   - For dynamic `:class`:

     - Update the returned strings so that each branch is theme-aware, e.g.:

       ```js
       :class="isDisabled
         ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-slate-800 text-gray-500 dark:text-white/60'
         : 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white'
       "
       ```

4. **If it’s an allowed exception**:

   - Double-check it truly is a solid brand-color button/badge or a similar intentional pattern.
   - Leave it unchanged.

Keep all changes **styling-only**—do not change behavior, data, or logic.

---

## 5. Iterate the audit until clean

After fixing a batch:

- Re-run:

```bash
node scripts/audit-theme-pending.mjs
```

- Re-open `THEME_PENDING_AUDIT.md`.
- Confirm that:
  - The total “lines to review” is decreasing, and
  - Remaining entries are either:
    - Newly introduced issues you still need to fix, or
    - Intentional exceptions as defined above.

Repeat the fix + re-audit loop until:

- The audit is empty, **or**
- The only remaining entries are intentional exceptions you have consciously decided to leave as-is.

---

## 6. Visual sanity check in both themes

At the end, do a light + dark pass on key views, especially those with heavy UI and dark overlays, such as:

- `Dashboard.vue`
- `Settings.vue`
- `SiteDetail.vue`
- `SiteForm.vue`
- `NewReport.vue`
- `Maps.vue`
- Any other views/components you modified

Confirm:

- Text is readable in both themes (no washed-out or invisible UI).
- Buttons, pills, and badges feel consistent with other theme-aware elements in the app.
- Dark overlays/hero sections still look intentional and not accidentally flattened into generic gray panels.

If you find regressions (e.g. icons or text that become too low-contrast in light or dark mode), adjust the classes locally to restore good contrast while staying theme-aware.

---

## 7. Final summary to the user

When you’re done, report back with:

- The final audit summary:
  - `Files with pending items`
  - `Total lines to review`
- A short list of files you modified.
- A note on any **remaining** audited lines that are **intentional exceptions** and why they were left as-is.

Keep the summary high-level (no giant code dumps) and focused on theme-awareness status.

