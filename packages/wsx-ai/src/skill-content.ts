/**
 * Shared skill content for Claude / Cursor / Antigravity
 */
export const WSX_APPLY_SKILL_MD = `---
name: wsx-apply
description: "Apply WSXJS skills (press, theme, components, site) via @wsxjs/wsx-ai. Use when: add wsx-press, wsx-theme, wsx-branding, base components, router, or setup full WSX app."
---

# WSX Apply Skill

When the user asks to add or configure any of the following in a WSX/WSXJS project, use @wsxjs/wsx-ai and apply the corresponding skill.

## Skills (order: 1 press, 2 theme, 3 components, 4 site)

| Skill        | Use when |
|-------------|----------|
| press   | Add docs (wsx-press), VitePress-like, documentation site |
| theme   | Add theme/branding (wsx-theme, wsx-branding), design tokens |
| components | Add base UI (wsx-base-components: button, dropdown, card, language-switcher) |
| site    | Add routing (wsx-router), wsx-view, SPA routes |

## How to apply

Use applySkill(name) or applyAll() from @wsxjs/wsx-ai. name is one of: press, theme, components, site.

Use the returned packageJsonAdditions to add dependencies, viteConfigSnippet to update Vite config, codeSnippets in app code, and instructions as steps.

## Optional

If the project has .agent/skills/apply-wsx-press/SKILL.md, apply-wsx-theme/SKILL.md, or apply-wsx-site/SKILL.md, read them for detailed steps before applying.
`;
