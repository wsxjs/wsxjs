/**
 * Write WSX apply skill config for Claude, Cursor, Antigravity
 * Writes one combined "apply" file plus four per-skill files (press, theme, components, site).
 */
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import {
    WSX_APPLY_SKILL_MD,
    getSkillCommandMd,
    getSkillFrontmatter,
    SKILL_DESCRIPTIONS,
} from "./skill-content.js";

export const AI_TARGETS = ["claude", "cursor", "antigravity"] as const;
export type AITarget = (typeof AI_TARGETS)[number];

/** Per-skill names for init (same order as applyAll) */
export const INIT_SKILL_NAMES = ["press", "theme", "components", "site"] as const;

function ensureDir(dir: string): void {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function writeAllForClaude(cwd: string): { path: string } {
    const dir = join(cwd, ".claude", "skills", "wsx-apply");
    ensureDir(dir);
    const path = join(dir, "SKILL.md");
    writeFileSync(path, WSX_APPLY_SKILL_MD, "utf8");
    return { path };
}

function writeOneForClaude(cwd: string, name: string): { path: string } {
    const dir = join(cwd, ".claude", "skills", `wsx-apply-${name}`);
    ensureDir(dir);
    const path = join(dir, "SKILL.md");
    const content = getSkillFrontmatter(name) + "\n" + getSkillCommandMd(name);
    writeFileSync(path, content, "utf8");
    return { path };
}

/**
 * Write skills for Claude: .claude/skills/wsx-apply (all) + wsx-apply-press, wsx-apply-theme, wsx-apply-components, wsx-apply-site
 */
export function writeForClaude(cwd: string): { path: string }[] {
    const paths: { path: string }[] = [];
    paths.push(writeAllForClaude(cwd));
    for (const name of Object.keys(SKILL_DESCRIPTIONS)) {
        paths.push(writeOneForClaude(cwd, name));
    }
    return paths;
}

const CURSOR_APPLY_ALL_MD = `# wsx-ai apply (all skills)

When the user asks to add **wsx-press**, **wsx-theme**, **wsx-branding**, **base components**, or **router/site** to a WSXJS project, use \`@wsxjs/wsx-ai\` and apply the right skill.

## Usage

\`\`\`ts
import { applyAll, applySkill } from "@wsxjs/wsx-ai";

// Apply one: "press" | "theme" | "components" | "site"
const out = applySkill("theme");

// Apply all four (1 press, 2 theme, 3 components, 4 site)
const out = applyAll();
\`\`\`

Then use \`out.packageJsonAdditions\`, \`out.viteConfigSnippet\`, \`out.codeSnippets\`, \`out.instructions\` to update the project.
`;

/**
 * Write commands for Cursor: .cursor/commands/wsx-ai-apply.md (all) + wsx-ai-press, wsx-ai-theme, wsx-ai-components, wsx-ai-site
 */
export function writeForCursor(cwd: string): { path: string }[] {
    const dir = join(cwd, ".cursor", "commands");
    ensureDir(dir);
    const paths: { path: string }[] = [];
    writeFileSync(join(dir, "wsx-ai-apply.md"), CURSOR_APPLY_ALL_MD, "utf8");
    paths.push({ path: join(dir, "wsx-ai-apply.md") });
    for (const name of Object.keys(SKILL_DESCRIPTIONS)) {
        const path = join(dir, `wsx-ai-${name}.md`);
        writeFileSync(path, getSkillCommandMd(name), "utf8");
        paths.push({ path });
    }
    return paths;
}

function writeAllForAntigravity(cwd: string): { path: string } {
    const dir = join(cwd, ".antigravity");
    ensureDir(dir);
    const path = join(dir, "wsx-apply.md");
    writeFileSync(path, WSX_APPLY_SKILL_MD, "utf8");
    return { path };
}

function writeOneForAntigravity(cwd: string, name: string): { path: string } {
    const dir = join(cwd, ".antigravity");
    ensureDir(dir);
    const path = join(dir, `wsx-apply-${name}.md`);
    const content = getSkillFrontmatter(name) + "\n" + getSkillCommandMd(name);
    writeFileSync(path, content, "utf8");
    return { path };
}

/**
 * Write instructions for Antigravity: .antigravity/wsx-apply.md (all) + wsx-apply-press, -theme, -components, -site
 */
export function writeForAntigravity(cwd: string): { path: string }[] {
    const paths: { path: string }[] = [];
    paths.push(writeAllForAntigravity(cwd));
    for (const name of Object.keys(SKILL_DESCRIPTIONS)) {
        paths.push(writeOneForAntigravity(cwd, name));
    }
    return paths;
}

/** Write all skill files for the given AI target; returns list of written paths. */
export function writeFor(cwd: string, target: AITarget): { path: string }[] {
    switch (target) {
        case "claude":
            return writeForClaude(cwd);
        case "cursor":
            return writeForCursor(cwd);
        case "antigravity":
            return writeForAntigravity(cwd);
        default:
            throw new Error(`Unknown AI target: ${target}`);
    }
}
