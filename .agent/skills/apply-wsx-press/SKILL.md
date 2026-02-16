---
name: apply-wsx-press
description: "Apply WSX-Press documentation system to a project. Add package, create Vite config, align with current site design (tokens, theme, layout). Use when: setup docs, add wsx-press, doc site, VitePress-like."
---

# Apply WSX-Press Skill

Use this skill when the user wants to **add or properly configure WSX-Press** in a project (new app or existing site). WSX-Press is the VitePress-like documentation system for WSXJS (markdown docs, sidebar, search, theme).

## When to Use

- "Add wsx-press to this project"
- "Setup documentation with wsx-press"
- "Apply wsx-press and follow current site design"
- "Create config for wsx-press with Vite"
- Integrating docs into an existing WSXJS site

## Prerequisites

- Project uses **Vite** and **WSX** (e.g. `@wsxjs/wsx-vite-plugin`).
- Optional: existing design tokens (e.g. `design-system/tokens.css` or `@wsxjs/wsx-theme`) to align doc theme with the main site.

---

## Step 1: Add the Package

Add `@wsxjs/wsx-press` as a dependency (workspace or npm):

```json
"dependencies": {
  "@wsxjs/wsx-press": "workspace:*"
}
```

Then install:

```bash
pnpm install
```

---

## Step 2: Create / Update Vite Config

### 2.1 Plugins

- Use **`wsxPress`** from `@wsxjs/wsx-press/node`:
  - **`docsRoot`**: path to the folder containing markdown docs (e.g. `public/docs` or `docs`).
  - **`outputDir`**: build output for generated doc data (e.g. `.wsx-press`).

Example:

```ts
import { wsxPress } from "@wsxjs/wsx-press/node";

export default defineConfig({
  plugins: [
    wsx(), // @wsxjs/wsx-vite-plugin
    wsxPress({
      docsRoot: path.resolve(__dirname, "public/docs"),
      outputDir: path.resolve(__dirname, ".wsx-press"),
    }),
    // If deploying to GitHub Pages SPA: copy .wsx-press to dist in build
  ],
});
```

### 2.2 Resolve Aliases (development)

So that dev uses source instead of built dist:

```ts
resolve: {
  alias: [
    {
      find: "@wsxjs/wsx-press/client",
      replacement: path.resolve(__dirname, "../packages/wsx-press/src/client/index.ts"),
    },
    {
      find: "@wsxjs/wsx-press/node",
      replacement: path.resolve(__dirname, "../packages/wsx-press/src/node/index.ts"),
    },
    {
      find: "@wsxjs/wsx-press",
      replacement: path.resolve(__dirname, "../packages/wsx-press/src/index.ts"),
    },
    // ... other workspace packages as needed
  ],
}
```

Adjust `../packages/wsx-press` if the app lives in a different path (e.g. `node_modules/@wsxjs/wsx-press` when not in monorepo).

### 2.3 Build: Copy doc output to dist (if docs are served from same app)

If the site serves the generated docs (e.g. from `/.wsx-press/`), add a Vite plugin to copy `.wsx-press` to `dist` after build:

```ts
const copyWsxPressPlugin = () => ({
  name: "copy-wsx-press",
  apply: "build",
  closeBundle() {
    const wsxPressPath = path.resolve(__dirname, ".wsx-press");
    const distWsxPressPath = path.resolve(__dirname, "dist/.wsx-press");
    cpSync(wsxPressPath, distWsxPressPath, { recursive: true });
  },
});
```

---

## Step 3: Follow Current Site Design

To make the doc theme match the main site:

### 3.1 Design tokens source

- If the site uses **`@wsxjs/wsx-theme`** (wsx-branding): ensure the doc tree is **inside** `<wsx-branding>` so it inherits `--ds-*` and `--wsx-press-*` can use `var(--ds-color-primary, …)`.
- If the site uses a **local design system** (e.g. `site/src/design-system/tokens.css`):
  - Load that tokens file **before** or with the doc layout so `:root` (or the doc container) has `--ds-color-primary`, `--ds-color-primary-hover`, etc.
  - WSX-Press `theme.css` already uses `var(--ds-color-primary, #dc2626)` and `var(--ds-color-primary-hover, #b91c1c)` so it will follow the site palette when tokens are present.

### 3.2 What to read from the current site

- **Token file**: e.g. `site/src/design-system/tokens.css` — note `--ds-*` and any `--wsx-press-*` or doc-specific variables.
- **Main CSS**: e.g. `site/src/main.css` — `@layer` order and where tokens are imported.
- **Root component**: e.g. `App.wsx` — whether `<wsx-branding>` wraps the app (and thus docs); where doc route/content is mounted.

### 3.3 Aligning doc theme with site

- **Primary / accent**: WSX-Press uses `--wsx-press-accent` and `--wsx-press-accent-hover`; in `theme.css` they default to `var(--ds-color-primary, …)`. No change needed if the site already sets `--ds-color-primary` on a parent (e.g. wsx-branding).
- **Fonts / spacing**: WSX-Press has its own `--wsx-press-font-*` and `--wsx-press-spacing-*`. To mirror the site, you can override these in the site’s CSS (e.g. in `main.css` or a doc wrapper) to use `var(--ds-font-sans)`, `var(--ds-space-*)`, etc., if the design system defines them.
- **Dark mode**: If the site uses `data-theme="dark"` on a root or wrapper, ensure the doc content lives under that wrapper so WSX-Press’s `[data-theme="dark"]` overrides in `theme.css` apply.

---

## Step 4: Doc Content and Routing

- **Docs root**: Put markdown under the path given as `docsRoot` (e.g. `public/docs`).
- **Routing**: The app must serve doc pages (e.g. via `@wsxjs/wsx-router` or similar) and load the WSX-Press client component with the current path so sidebar and content resolve correctly.
- **Base path**: If the app is deployed under a subpath (e.g. GitHub Pages `base: "/wsxjs/"`), ensure the doc client and asset paths use the same `base`.

---

## Checklist (Apply WSX-Press)

- [ ] Add `@wsxjs/wsx-press` to dependencies and run install.
- [ ] Add `wsxPress({ docsRoot, outputDir })` to Vite plugins.
- [ ] Add resolve aliases for `@wsxjs/wsx-press`, `@wsxjs/wsx-press/client`, `@wsxjs/wsx-press/node` (or correct paths for the repo).
- [ ] If docs are served from the same build: add build plugin to copy `.wsx-press` to `dist`.
- [ ] Read site design: tokens file, main CSS, root component (wsx-branding vs local tokens).
- [ ] Ensure doc content is inside the same theme container as the site (e.g. inside `<wsx-branding>`) so `--ds-*` and `data-theme` apply.
- [ ] Optionally override `--wsx-press-*` in site CSS to match `--ds-*` (fonts, spacing) for consistency.

---

## Reference (current site example)

- **Vite config**: `site/vite.config.ts` — `wsxPress`, copy plugin, aliases.
- **Docs root**: `site/public/docs`.
- **Output**: `site/.wsx-press` → copied to `dist/.wsx-press` on build.
- **Design**: Site uses `@wsxjs/wsx-theme` and `site/src/design-system/tokens.css`; `main.css` imports tokens and defines layers.
