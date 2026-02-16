# @wsxjs/wsx-ai

Apply WSXJS skills in code or via your AI assistant: **Press** (docs), **Theme** (branding), **Components** (base UI), **Site** (router). Includes a CLI to add the apply skill for **Claude**, **Cursor**, and **Antigravity**.

## Quick start (CLI)

Run once in your project root — no install required:

```bash
npx @wsxjs/wsx-ai init --ai all
```

Or target one AI: `claude` | `cursor` | `antigravity`.

---

## CLI

### Commands

| Command | Description |
|--------|-------------|
| `wsx-ai init` | Add WSX apply skill for the chosen AI. Creates the config file(s) so the AI can apply press/theme/components/site when you ask. |

### Options (init)

| Option | Description |
|--------|-------------|
| `-a, --ai <target>` | `claude` \| `cursor` \| `antigravity` \| `all` (default: `all`) |
| `-c, --cwd <dir>` | Project directory (default: current directory) |

### Run with npx

```bash
npx @wsxjs/wsx-ai init --ai claude
npx @wsxjs/wsx-ai init --ai cursor
npx @wsxjs/wsx-ai init --ai antigravity
npx @wsxjs/wsx-ai init --ai all
npx @wsxjs/wsx-ai init --cwd ./my-app
```

With npm: `npx @wsxjs/wsx-ai init`. With yarn: `yarn dlx @wsxjs/wsx-ai init`.

### Run after install

```bash
pnpm add -D @wsxjs/wsx-ai
pnpm exec wsx-ai init --ai all
```

Or: `pnpm dlx @wsxjs/wsx-ai init --ai all` (one-off, no install).

### Files written by init

| Target | File |
|--------|------|
| `claude` | `.claude/skills/wsx-apply/SKILL.md` |
| `cursor` | `.cursor/commands/wsx-ai-apply.md` |
| `antigravity` | `.antigravity/wsx-apply.md` |
| `all` | All three |

After `init`, your AI will use these to apply press, theme, components, and site via `@wsxjs/wsx-ai` when you ask to add docs, theme, components, or routing.

---

## Library usage

```ts
import {
    applyPress,
    applyTheme,
    applyComponents,
    applySite,
    applySkill,
    applyAll,
    SKILL_NAMES,
    type ApplyResult,
    type SkillName,
} from "@wsxjs/wsx-ai";

// Single skill
const out = applySkill("theme"); // "press" | "theme" | "components" | "site"

// All four (1 press, 2 theme, 3 components, 4 site)
const out = applyAll();

// Use result
out.packageJsonAdditions; // add to dependencies
out.viteConfigSnippet;    // merge into Vite config
out.codeSnippets;        // copy into app
out.instructions;        // step-by-step text
```

## Skills

| Skill | Package | Output |
|-------|---------|--------|
| `press` | @wsxjs/wsx-press | deps, Vite plugin snippet, instructions |
| `theme` | @wsxjs/wsx-theme | deps, wsx-branding wrapper snippet |
| `components` | @wsxjs/wsx-base-components | deps, usage snippet |
| `site` | @wsxjs/wsx-router | deps, wsx-router + wsx-view snippet, instructions |

## ApplyResult

- **packageJsonAdditions** — `Record<string, string>` to add to `dependencies`
- **viteConfigSnippet** — optional string for Vite config
- **codeSnippets** — optional `Record<string, string>` for app code
- **instructions** — `string[]` of human-readable steps

## Related

- Skill docs: `.agent/skills/apply-wsx-press/`, `apply-wsx-theme/`, `apply-wsx-site/`
