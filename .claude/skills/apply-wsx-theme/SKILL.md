---
name: apply-wsx-theme
description: "Apply @wsxjs/wsx-theme (wsx-branding) and clarify design tokens. Use when: add theme package, brand a WSXJS app, unify tokens, design system, light/dark, tokens-host."
---

# Apply WSX-Theme and Clarify Tokens Skill

Use this skill when the user wants to **apply `@wsxjs/wsx-theme`** (the branding/theme package) and **clarify how design tokens work** (primitives, semantic, compatibility layer, light/dark).

## When to Use

- "Apply wsx-theme to this project"
- "Use wsx-branding and follow design tokens"
- "Clarify tokens for the design system"
- "Add theme package and explain tokens"
- Unifying branding across site and docs

---

## 1. Add the Package

```json
"dependencies": {
  "@wsxjs/wsx-theme": "workspace:*"
}
```

Then:

```bash
pnpm install
```

---

## 2. Use wsx-branding in the App

The theme package exposes the **`<wsx-branding>`** custom element (class `WsxBranding`). It provides design tokens on its host; slotted content inherits CSS variables.

### 2.1 Where to mount

- **Recommended**: Wrap the **root app content** (e.g. in the root component’s `render()`) so the whole app and any doc UI sit inside one theme context.

Example (in `App.wsx` or root component):

```jsx
import "@wsxjs/wsx-theme";

render() {
  return (
    <wsx-branding>
      <div class="app-container">
        {/* nav, main, docs, etc. */}
      </div>
    </wsx-branding>
  );
}
```

- **Do not** mount it only in `main.ts` via `createElement` and `appendChild` as a sibling of the app root; the app content must be **inside** the element so it inherits tokens.

### 2.2 Theme (light/dark)

- `wsx-branding` syncs with `document.documentElement`: it sets `data-theme="light"` or `data-theme="dark"` on itself based on your logic (e.g. a theme switcher that sets the attribute on `<html>`).
- Tokens for dark mode are defined in `tokens-host.css` under `:host([data-theme="dark"])`. No extra app code is required beyond setting `data-theme` on the document (or on the component) as your app already does.

---

## 3. Token Layers (Clarified)

The package ships **`tokens-host.css`** inside the component, scoped to **`:host`**. Three logical layers:

### 3.1 Primitives (do not change with theme)

- **Colors**: `--ds-color-brand-50` … `--ds-color-brand-900`
- **Spacing**: `--ds-space-0` … `--ds-space-40` (4px base)
- **Radius**: `--ds-radius-sm` … `--ds-radius-2xl`
- **Typography**: `--ds-font-sans`, `--ds-font-mono`, `--ds-font-size-*`, `--ds-font-weight-*`, `--ds-line-height-*`
- **Motion**: `--ds-duration-fast/base/slow`, `--ds-ease`
- **Shadows (neutral)**: `--ds-shadow-sm/md/lg/xl`
- **Layout**: `--ds-nav-height`, `--ds-container-max`, `--ds-content-max`

Use these for spacing, radius, font size, etc., so only semantic tokens need to switch for light/dark.

### 3.2 Semantic tokens (change with light/dark)

Defined on `:host` (light default) and overridden in `:host([data-theme="dark"])`:

- **Primary / CTA**: `--ds-color-primary`, `--ds-color-primary-hover`, `--ds-color-primary-muted`, `--ds-color-accent`, `--ds-color-accent-light`
- **Backgrounds**: `--ds-color-bg-primary`, `--ds-color-bg-secondary`, `--ds-color-bg-elevated`
- **Text**: `--ds-color-text-primary`, `--ds-color-text-secondary`, `--ds-color-text-muted`
- **Borders**: `--ds-color-border`, `--ds-color-border-strong`
- **Links**: `--ds-color-link`, `--ds-color-link-hover`
- **Focus**: `--ds-color-focus-ring`, `--ds-color-focus-ring-offset`
- **Themed shadows**: `--ds-shadow-card`, `--ds-shadow-card-hover`, `--ds-shadow-button`, `--ds-shadow-button-hover`

Use these in app and component CSS so light/dark is consistent without touching primitives.

### 3.3 Compatibility layer (legacy names → ds-*)

So existing CSS keeps working, the package also defines on `:host`:

- `--primary-red`, `--secondary-red`, `--accent-orange`, `--dark-red`, `--light-orange`
- `--hero-gradient-start`, `--hero-gradient-end`
- `--btn-primary-bg`, `--btn-primary-hover`, `--btn-primary-shadow`, `--btn-primary-shadow-hover`
- `--text-primary`, `--text-secondary`, `--bg-primary`, `--bg-secondary`, `--border-color`
- `--card-shadow`, `--card-shadow-hover`
- `--nav-height`
- `--wsx-theme-focus-color`, `--wsx-theme-link-focus-color`, `--wsx-theme-dropdown-focus-color`, `--wsx-theme-language-switcher-focus-color`, `--wsx-theme-combobox-focus-border`, `--wsx-theme-combobox-focus-outline`
- Doc/layout: `--doc-section-padding`, `--doc-section-padding-top`, `--doc-layout-main-padding-*`, `--doc-page-padding-*`
- Button/Card/ThemeSwitcher: `--wsx-theme-btn-*`, `--wsx-theme-card-*`, `--theme-switcher-*`

All point to the corresponding `--ds-*` or semantic tokens. New styles should prefer `--ds-*`; keep compatibility layer only for legacy or shared components.

---

## 4. Overriding Tokens (Preset / API)

The package uses **`@layer theme-default`** so that:

- **Preset**: You can load a second stylesheet that overrides these variables in a higher layer or with higher specificity (e.g. on `:root` or a wrapper class) to implement a preset theme.
- **API**: If the component later supports custom properties set via attributes or properties, those can override the same variable names.

No code change is required for override mechanism; just ensure your overrides are not inside `@layer theme-default` or are in a later layer / more specific selector.

---

## 5. Relation to Site design-system and WSX-Press

- **Site `design-system/tokens.css`**: Can be **replaced** by wsx-branding for the default look: use `<wsx-branding>` and import only `@wsxjs/wsx-theme` (which pulls in the component and its tokens). If the site still needs extra variables (e.g. doc-only), it can add a small extra file that defines only those, or overrides specific tokens.
- **WSX-Press**: Its `theme.css` uses `var(--ds-color-primary, …)` etc. If the doc is rendered **inside** `<wsx-branding>`, it automatically gets the same primary/accent and dark mode as the rest of the site. No duplicate token definitions are required in the doc app.

---

## Checklist (Apply WSX-Theme and Tokens)

- [ ] Add `@wsxjs/wsx-theme` and run install.
- [ ] Import `@wsxjs/wsx-theme` once (e.g. in root component or main entry).
- [ ] Wrap app content in `<wsx-branding>` in the root component’s `render()` (not as a sibling in main.ts).
- [ ] Ensure theme switcher sets `data-theme` on `document.documentElement` (or as your app already does) so `:host([data-theme="dark"])` applies.
- [ ] Use **primitive** tokens (`--ds-space-*`, `--ds-radius-*`, etc.) for layout and typography; use **semantic** tokens (`--ds-color-*`, `--ds-shadow-*`) for colors and shadows.
- [ ] Prefer `--ds-*` in new CSS; use compatibility names only where needed for existing components.
- [ ] If the site had its own `tokens.css`, consider removing duplicate definitions and relying on wsx-branding, or keep a small override file for project-specific tokens.

---

## Reference

- **Package**: `packages/theme` — `WsxBranding.wsx`, `tokens-host.css`, `index.ts`.
- **Docs**: `docs/design-system/DESIGN_SYSTEM.md` — high-level token list and usage.
- **RFC**: `docs/rfcs/0064-theme-package-and-branding-override-api.md` — default vs preset vs API override.
