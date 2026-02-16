/**
 * @wsxjs/wsx-ai — 应用 WSXJS 技能：press、theme、components、site (router)
 * 供 CLI 或工具链调用，返回依赖、配置片段与说明
 */
export type { ApplyResult } from "./types.js";
export { applyPress } from "./skills/press.js";
export { applyTheme } from "./skills/theme.js";
export { applyComponents } from "./skills/components.js";
export { applySite } from "./skills/site.js";

import { applyPress } from "./skills/press.js";
import { applyTheme } from "./skills/theme.js";
import { applyComponents } from "./skills/components.js";
import { applySite } from "./skills/site.js";
import type { ApplyResult } from "./types.js";

/** 技能名称 */
export const SKILL_NAMES = ["press", "theme", "components", "site"] as const;
export type SkillName = (typeof SKILL_NAMES)[number];

/**
 * 应用单个技能
 */
export function applySkill(name: SkillName): ApplyResult {
    switch (name) {
        case "press":
            return applyPress();
        case "theme":
            return applyTheme();
        case "components":
            return applyComponents();
        case "site":
            return applySite();
        default:
            throw new Error(`Unknown skill: ${name}`);
    }
}

/**
 * 按顺序应用四个技能：1 press, 2 theme, 3 components, 4 site (router)
 * 合并 packageJsonAdditions；合并 codeSnippets；合并 instructions
 */
export function applyAll(): ApplyResult {
    const press = applyPress();
    const theme = applyTheme();
    const components = applyComponents();
    const site = applySite();

    const packageJsonAdditions: Record<string, string> = {
        ...press.packageJsonAdditions,
        ...theme.packageJsonAdditions,
        ...components.packageJsonAdditions,
        ...site.packageJsonAdditions,
    };

    const codeSnippets: Record<string, string> = {
        ...(press.codeSnippets ?? {}),
        ...(theme.codeSnippets ?? {}),
        ...(components.codeSnippets ?? {}),
        ...(site.codeSnippets ?? {}),
    };

    const instructions: string[] = [
        "=== 1. Press ===",
        ...press.instructions,
        "=== 2. Theme ===",
        ...theme.instructions,
        "=== 3. Components ===",
        ...components.instructions,
        "=== 4. Site (Router) ===",
        ...site.instructions,
    ];

    const viteConfigSnippet = [
        press.viteConfigSnippet,
        theme.viteConfigSnippet,
        components.viteConfigSnippet,
        site.viteConfigSnippet,
    ]
        .filter(Boolean)
        .join("\n\n");

    return {
        packageJsonAdditions,
        viteConfigSnippet: viteConfigSnippet || undefined,
        codeSnippets: Object.keys(codeSnippets).length > 0 ? codeSnippets : undefined,
        instructions,
    };
}
