#!/usr/bin/env node
/**
 * 文档重组脚本
 * 将文档从旧结构迁移到新结构，添加 frontmatter 并重命名文件
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.join(__dirname, "../site/public/docs/guide");

// 文档映射：旧文件名 -> [新路径, order, title]
const docMappings = [
    // Essentials
    ["QUICK_START.md", "essentials/getting-started.md", 1, "快速开始"],
    ["TYPESCRIPT_SETUP.md", "essentials/typescript-setup.md", 2, "TypeScript 配置"],

    // Core Concepts
    ["WEB_COMPONENT_GUIDE.md", "core-concepts/web-components.md", 1, "WebComponent 使用指南"],
    ["LIGHT_COMPONENT_GUIDE.md", "core-concepts/light-components.md", 2, "LightComponent 使用指南"],
    ["JSX_SUPPORT.md", "core-concepts/jsx-support.md", 3, "JSX 支持"],
    ["DESIGN_PHILOSOPHY.md", "core-concepts/design-philosophy.md", 4, "设计理念"],
    ["WSX_DESIGN.md", "core-concepts/wsx-design.md", 5, "WSX 设计说明"],

    // Advanced
    ["DOM_CACHE_GUIDE.md", "advanced/dom-cache.md", 1, "DOM 缓存指南"],
    ["TYPESCRIPT_WSX_TYPES.md", "advanced/typescript-wsx-types.md", 2, "TypeScript WSX 类型"],
    ["I18NEXT_GUIDE.md", "advanced/i18next-integration.md", 3, "i18next 集成指南"],
    ["PUBLISH_GUIDE.md", "advanced/publishing.md", 4, "发布指南"],
];

// 提取标题（从文件第一行）
function extractTitle(content) {
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : "";
}

// 提取描述（从概述或第一段）
function extractDescription(content) {
    // 移除 frontmatter（如果存在）
    let text = content.replace(/^---[\s\S]*?---\n\n?/, "");

    // 尝试从 "## 概述" 部分提取
    const overviewMatch = text.match(/##\s+概述\s*\n\n(.+?)(?:\n\n|$)/);
    if (overviewMatch) {
        const desc = overviewMatch[1].trim().replace(/\n/g, " ").substring(0, 150);
        return desc ? `"${desc}"` : "";
    }
    // 尝试从第一段提取（跳过 H1）
    const firstParaMatch = text.match(/^#.+\n\n(.+?)(?:\n\n|$)/);
    if (firstParaMatch) {
        const desc = firstParaMatch[1].trim().replace(/\n/g, " ").substring(0, 150);
        return desc ? `"${desc}"` : "";
    }
    return "";
}

// 添加 frontmatter
function addFrontmatter(content, title, order, category, description) {
    const frontmatter = `---
title: ${title}
order: ${order}
category: ${category}
${description ? `description: ${description}` : ""}
---

`;

    // 移除原有的 H1 标题（如果存在）
    const withoutH1 = content.replace(/^#\s+.+\n\n?/, "");

    return frontmatter + withoutH1;
}

// 检查文件是否存在
async function pathExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

// 确保目录存在
async function ensureDir(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        // 目录已存在，忽略错误
    }
}

// 主函数
async function migrateDocs() {
    console.log("开始文档重组...\n");

    // 创建目标目录
    await ensureDir(path.join(docsRoot, "essentials"));
    await ensureDir(path.join(docsRoot, "core-concepts"));
    await ensureDir(path.join(docsRoot, "advanced"));

    for (const [oldFile, newPath, order, defaultTitle] of docMappings) {
        const oldPath = path.join(docsRoot, oldFile);
        const newFullPath = path.join(docsRoot, newPath);

        if (!(await pathExists(oldPath))) {
            console.log(`⚠️  跳过：${oldFile} 不存在`);
            continue;
        }

        try {
            // 读取原文件
            const content = await fs.readFile(oldPath, "utf-8");

            // 提取元数据
            const title = extractTitle(content) || defaultTitle;
            const description = extractDescription(content);
            const category = `guide/${path.dirname(newPath)}`;

            // 添加 frontmatter
            const newContent = addFrontmatter(content, title, order, category, description);

            // 确保目标目录存在
            await ensureDir(path.dirname(newFullPath));

            // 写入新文件
            await fs.writeFile(newFullPath, newContent, "utf-8");
            console.log(`✅ ${oldFile} → ${newPath}`);

            // 可选：删除旧文件（注释掉，保留备份）
            // await fs.unlink(oldPath);
        } catch (error) {
            console.error(`❌ 处理 ${oldFile} 时出错:`, error.message);
        }
    }

    console.log("\n文档重组完成！");
    console.log("注意：旧文件已保留，请手动删除或移动到备份目录。");
}

migrateDocs().catch(console.error);
