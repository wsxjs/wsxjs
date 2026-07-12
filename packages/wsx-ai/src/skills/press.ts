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
// GitHub Pages 子路径: base: "/repo-name/"
// build 后复制 .wsx-press 到 dist（若同站托管文档）`;

const MAIN_SNIPPET = `// src/press-init.ts — main.ts 第一行 import
import { configurePressBase } from "@wsxjs/wsx-press/client/paths";
configurePressBase(import.meta.env.BASE_URL);

// main.ts
import "./press-init";
import "@wsxjs/wsx-press/client";
// 再 mount app；router 注册 sitePath("/docs/*")`;

export function applyPress(): ApplyResult {
    return {
        packageJsonAdditions: { "@wsxjs/wsx-press": "workspace:*" },
        viteConfigSnippet: VITE_SNIPPET,
        instructions: [
            "添加依赖 @wsxjs/wsx-press 并执行 pnpm install",
            "在 Vite 配置中注册 wsxPress({ docsRoot, outputDir })",
            "子路径部署时设置 Vite base（如 /productivity/）",
            "新增 press-init.ts 调用 configurePressBase(import.meta.env.BASE_URL)，main.ts 首行 import",
            'import @wsxjs/wsx-press/client；router 用 sitePath("/docs/*")',
            "build 后复制 .wsx-press 到 dist",
            "文档 UI 放在 wsx-branding 内以继承 --ds-* 与 data-theme",
            `Main 入口示例:\n${MAIN_SNIPPET}`,
        ],
    };
}
