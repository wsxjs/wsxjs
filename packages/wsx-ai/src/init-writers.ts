/**
 * Write WSX apply skill config for Claude, Cursor, Antigravity
 */
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { WSX_APPLY_SKILL_MD } from "./skill-content.js";

export const AI_TARGETS = ["claude", "cursor", "antigravity"] as const;
export type AITarget = (typeof AI_TARGETS)[number];

function ensureDir(dir: string): void {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

/**
 * Write skill for Claude (.claude/skills/wsx-apply/SKILL.md)
 */
export function writeForClaude(cwd: string): { path: string } {
    const dir = join(cwd, ".claude", "skills", "wsx-apply");
    ensureDir(dir);
    const path = join(dir, "SKILL.md");
    writeFileSync(path, WSX_APPLY_SKILL_MD, "utf8");
    return { path };
}

/**
 * Write rule/command for Cursor (.cursor/commands/wsx-ai-apply.md)
 */
export function writeForCursor(cwd: string): { path: string } {
    const dir = join(cwd, ".cursor", "commands");
    ensureDir(dir);
    const path = join(dir, "wsx-ai-apply.md");
    const content = `# wsx-ai apply

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
    writeFileSync(path, content, "utf8");
    return { path };
}

/**
 * Write instructions for Antigravity (.antigravity/wsx-apply.md)
 */
export function writeForAntigravity(cwd: string): { path: string } {
    const dir = join(cwd, ".antigravity");
    ensureDir(dir);
    const path = join(dir, "wsx-apply.md");
    writeFileSync(path, WSX_APPLY_SKILL_MD, "utf8");
    return { path };
}

export function writeFor(cwd: string, target: AITarget): { path: string } {
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
