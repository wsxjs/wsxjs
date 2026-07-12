# @wsxjs/wsx-ai

Apply WSXJS skills in code or via your AI assistant: **Press** (docs), **Theme** (branding), **Components** (base UI), **Site** (router). Includes a CLI that adds **all skills** for **Claude**, **Cursor**, and **Antigravity**.

## Quick start (CLI)

Run once in your project root — no install required:

```bash
# 1) Add all skills to all AIs (one command)
npx @wsxjs/wsx-ai init
npx @wsxjs/wsx-ai init --all
npx @wsxjs/wsx-ai init --all-ais

# 2) Add all skills for one AI only
npx @wsxjs/wsx-ai init --cursor
npx @wsxjs/wsx-ai init --claude
npx @wsxjs/wsx-ai init --antigravity
```

---

## CLI

### What init adds (all skills)

For each chosen AI, `init` writes **5 items**:

| Item | Purpose |
|------|--------|
| **apply** (combined) | Use `applySkill(name)` or `applyAll()` for any skill |
| **press** | Docs / wsx-press |
| **theme** | Branding / wsx-theme |
| **components** | Base UI / wsx-base-components |
| **site** | Router / wsx-router |

### Commands

| Command | Description |
|--------|-------------|
| `wsx-ai init` | Add **all** WSX skills (apply + press, theme, components, site) for the chosen AI(s). Default: all AIs. |

### Options (init)

| Option | Description |
|--------|-------------|
| `--all`, `--all-ais` | Add all skills to **all AIs** (Claude + Cursor + Antigravity). Default when no option given. |
| `--claude` | Add all skills for **Claude** only |
| `--cursor` | Add all skills for **Cursor** only |
| `--antigravity` | Add all skills for **Antigravity** only |
| `-a, --ai <target>` | Same as above: `claude` \| `cursor` \| `antigravity` \| `all` |
| `-c, --cwd <dir>` | Project directory (default: current directory) |

### One command: all skills → all AIs

```bash
npx @wsxjs/wsx-ai init
# or
npx @wsxjs/wsx-ai init --all
npx @wsxjs/wsx-ai init --all-ais
```

Adds all 5 skills (apply, press, theme, components, site) to Claude, Cursor, and Antigravity in one go.

### Dedicated AI (one AI only)

```bash
npx @wsxjs/wsx-ai init --cursor
npx @wsxjs/wsx-ai init --claude
npx @wsxjs/wsx-ai init --antigravity
npx @wsxjs/wsx-ai init --ai cursor
```

### Run with npx

```bash
npx @wsxjs/wsx-ai init
npx @wsxjs/wsx-ai init --all-ais
npx @wsxjs/wsx-ai init --cursor
npx @wsxjs/wsx-ai init --claude
npx @wsxjs/wsx-ai init --antigravity
npx @wsxjs/wsx-ai init --ai cursor
npx @wsxjs/wsx-ai init --cwd ./my-app
```

With yarn: `yarn dlx @wsxjs/wsx-ai init`.

### Files written by init (per AI)

| AI | Files (5 per AI) |
|----|-------------------|
| **Cursor** | `.cursor/commands/wsx-ai-apply.md`, `wsx-ai-press.md`, `wsx-ai-theme.md`, `wsx-ai-components.md`, `wsx-ai-site.md` |
| **Claude** | `.claude/skills/wsx-apply/SKILL.md`, `wsx-apply-press/SKILL.md`, `wsx-apply-theme/SKILL.md`, `wsx-apply-components/SKILL.md`, `wsx-apply-site/SKILL.md` |
| **Antigravity** | `.antigravity/wsx-apply.md`, `wsx-apply-press.md`, `wsx-apply-theme.md`, `wsx-apply-components.md`, `wsx-apply-site.md` |

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
