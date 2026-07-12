/**
 * Shared skill content for Claude / Cursor / Antigravity
 */

/** Skill names and short descriptions for per-skill files */
export const SKILL_DESCRIPTIONS: Record<string, { when: string; title: string }> = {
    press: {
        when: "add wsx-press, documentation, VitePress-like docs, doc site",
        title: "Apply Press (docs)",
    },
    theme: {
        when: "add wsx-theme, wsx-branding, design tokens, theme package",
        title: "Apply Theme (branding)",
    },
    components: {
        when: "add base components, button, dropdown, card, language-switcher",
        title: "Apply Components (base UI)",
    },
    site: {
        when: "add wsx-router, routing, wsx-view, SPA routes",
        title: "Apply Site (router)",
    },
};

/** One-skill Cursor command body (use with applySkill(name)) */
export function getSkillCommandMd(name: string): string {
    const d = SKILL_DESCRIPTIONS[name];
    if (!d) return "";
    return `# wsx-ai: ${d.title}

When the user asks to **${d.when}**, use \`applySkill("${name}")\` from \`@wsxjs/wsx-ai\` and apply the result.

\`\`\`ts
import { applySkill } from "@wsxjs/wsx-ai";
const out = applySkill("${name}");
\`\`\`

Use \`out.packageJsonAdditions\`, \`out.viteConfigSnippet\`, \`out.codeSnippets\`, \`out.instructions\` to update the project.
`;
}

/** One-skill frontmatter only (--- ... ---) for Claude/Antigravity SKILL.md */
export function getSkillFrontmatter(name: string): string {
    const d = SKILL_DESCRIPTIONS[name];
    if (!d) return "";
    return `---
name: wsx-apply-${name}
description: "Apply @wsxjs/wsx-ai skill '${name}'. Use when: ${d.when}."
---
`;
}

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
