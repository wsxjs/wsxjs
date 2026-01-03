/**
 * @wsxjs/wsx-press/node/metadata
 * Document metadata scanning and processing
 */

import { glob } from "glob";
import path from "path";
import fs from "fs-extra";
import type { DocsMetaCollection, DocMetadata } from "../types";

/**
 * 扫描文档目录，生成元数据集合
 *
 * @param docsRoot - 文档根目录路径
 * @returns 文档元数据集合
 */
export async function scanDocsMetadata(docsRoot: string): Promise<DocsMetaCollection> {
    const files = await glob("**/*.md", { cwd: docsRoot, absolute: true });
    const metadata: DocsMetaCollection = {};

    for (const file of files) {
        const relativePath = path.relative(docsRoot, file);
        const content = await fs.readFile(file, "utf-8");
        const frontmatter = extractFrontmatter(content);
        const key = relativePath.replace(/\.md$/, "");

        const dirname = path.dirname(relativePath);
        metadata[key] = {
            title: frontmatter.title || path.basename(file, ".md"),
            // 优先使用 frontmatter 中的 category，如果没有则使用 dirname
            category: frontmatter.category || (dirname === "." ? "." : dirname),
            route: `/docs/${key}`,
            ...frontmatter,
        };
    }

    return addPrevNextLinks(metadata);
}

/**
 * 从 Markdown 中提取 frontmatter
 * 返回部分 DocMetadata，因为不是所有字段都在 frontmatter 中
 *
 * @param markdown - Markdown 内容
 * @returns 提取的 frontmatter 数据
 */
export function extractFrontmatter(markdown: string): Partial<DocMetadata> {
    const match = markdown.match(/^---\n([\s\S]*?)\n---/);
    if (!match) {
        return {};
    }

    const yaml = match[1];
    const meta: Partial<DocMetadata> = {};

    yaml.split("\n").forEach((line) => {
        const colonIndex = line.indexOf(":");
        if (colonIndex === -1) {
            return;
        }

        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();

        if (key && value) {
            // 类型安全的属性赋值
            if (key === "title" || key === "description" || key === "category") {
                // 移除值两端的引号（如果存在）
                let cleanValue = value.replace(/^["']|["']$/g, "");
                // 解码 HTML 实体（如 &quot; -> "）
                // 使用 Node.js 兼容的方法
                if (cleanValue.includes("&")) {
                    cleanValue = cleanValue
                        .replace(/&quot;/g, '"')
                        .replace(/&apos;/g, "'")
                        .replace(/&lt;/g, "<")
                        .replace(/&gt;/g, ">")
                        .replace(/&amp;/g, "&");
                }
                (meta as Record<string, string>)[key] = cleanValue;
            } else if (key === "order") {
                // 解析 order 字段为数字
                const orderNum = Number.parseInt(value, 10);
                if (!Number.isNaN(orderNum)) {
                    meta.order = orderNum;
                }
            } else if (key === "tags") {
                // 简单的数组解析（实际应使用 YAML 解析器）
                meta.tags = value
                    .replace(/[[\]]/g, "")
                    .split(",")
                    .map((t) => t.trim());
            } else {
                // 其他扩展字段
                (meta as Record<string, unknown>)[key] = value;
            }
        }
    });

    return meta;
}

/**
 * 为元数据集合添加上一页/下一页链接
 *
 * @param metadata - 元数据集合
 * @returns 添加了导航链接的元数据集合
 */
export function addPrevNextLinks(metadata: DocsMetaCollection): DocsMetaCollection {
    const categories = new Map<string, string[]>();

    // 按类别分组
    for (const [key, meta] of Object.entries(metadata)) {
        const category = meta.category;
        if (!categories.has(category)) {
            categories.set(category, []);
        }
        categories.get(category)!.push(key);
    }

    // 为每个类别添加 prev/next
    for (const [_category, keys] of categories) {
        // 按 order 字段排序（如果存在），然后按 key 排序
        keys.sort((a, b) => {
            const orderA = metadata[a].order ?? Number.MAX_SAFE_INTEGER;
            const orderB = metadata[b].order ?? Number.MAX_SAFE_INTEGER;
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            return a.localeCompare(b);
        });
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            metadata[key].prev = i > 0 ? `/docs/${keys[i - 1]}` : null;
            metadata[key].next = i < keys.length - 1 ? `/docs/${keys[i + 1]}` : null;
        }
    }

    return metadata;
}
