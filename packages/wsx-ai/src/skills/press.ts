/**
 * Apply WSX-Press skill: 添加文档系统、Vite 插件与设计对齐说明
 */
import type { ApplyResult } from "../types.js";

const VITE_SNIPPET = `// plugins 中加入
import { wsxPress } from "@wsxjs/wsx-press/node";
wsxPress({
  docsRoot: path.resolve(__dirname, "public/docs"),
  outputDir: path.resolve(__dirname, ".wsx-press"),
}),
// resolve.alias 开发时指向源码（按需）
// build 后复制 .wsx-press 到 dist 的插件（若同站托管文档）`;

export function applyPress(): ApplyResult {
    return {
        packageJsonAdditions: { "@wsxjs/wsx-press": "workspace:*" },
        viteConfigSnippet: VITE_SNIPPET,
        instructions: [
            "添加依赖 @wsxjs/wsx-press 并执行 pnpm install",
            "在 Vite 配置中注册 wsxPress({ docsRoot, outputDir })",
            "如需同站托管文档，在 build 后复制 .wsx-press 到 dist",
            "将文档内容放在 wsx-branding 内以继承 --ds-* 与 data-theme",
        ],
    };
}
