/**
 * @wsxjs/wsx-press/node/search
 * Search index generation
 */

import path from "path";
import fs from "fs-extra";
import type { DocsMetaCollection, SearchIndex, SearchDocument } from "../types";

/**
 * 生成搜索索引
 *
 * @param metadata - 文档元数据集合
 * @param docsRoot - 文档根目录路径
 * @returns 搜索索引
 */
export async function generateSearchIndex(
    metadata: DocsMetaCollection,
    docsRoot: string
): Promise<SearchIndex> {
    const documents: SearchDocument[] = [];

    for (const [key, meta] of Object.entries(metadata)) {
        const filePath = path.join(docsRoot, `${key}.md`);
        const content = await fs.readFile(filePath, "utf-8");
        const textContent = content
            .replace(/^---[\s\S]*?---/, "") // 移除 frontmatter
            .replace(/```[\s\S]*?```/g, "") // 移除代码块
            .replace(/[#*`_[\]()]/g, "") // 移除 Markdown 标记
            .trim();

        documents.push({
            id: key,
            title: meta.title,
            category: meta.category,
            route: meta.route,
            content: textContent.substring(0, 500),
        });
    }

    return {
        documents,
        options: {
            keys: [
                { name: "title", weight: 0.7 },
                { name: "content", weight: 0.3 },
            ],
            threshold: 0.3,
            includeScore: true,
            includeMatches: true,
        },
    };
}
