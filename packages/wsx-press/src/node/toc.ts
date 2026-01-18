/**
 * @wsxjs/wsx-press/node/toc
 * Table of Contents generation from markdown files
 */

import path from "path";
import fs from "fs-extra";
import { marked, type Tokens } from "marked";
import type { Token } from "marked";
import type { DocsMetaCollection } from "../types";

/**
 * TOC 项接口
 */
export interface TOCItem {
    /** 标题级别 (1-6) */
    level: number;
    /** 标题文本 */
    text: string;
    /** 锚点 ID */
    id: string;
    /** 子项 */
    children: TOCItem[];
}

/**
 * 文档 TOC 数据
 */
export interface DocTOC {
    /** 文档路径（相对于 docsRoot） */
    docPath: string;
    /** TOC 项列表 */
    items: TOCItem[];
}

/**
 * TOC 数据集合（按文档路径索引）
 */
export type TOCCollection = Record<string, TOCItem[]>;

/**
 * 从 Markdown 内容中提取标题并生成 TOC
 *
 * @param markdown - Markdown 内容
 * @returns TOC 项列表
 */
export function extractTOCFromMarkdown(markdown: string): TOCItem[] {
    // 移除 frontmatter
    const contentWithoutFrontmatter = markdown.replace(/^---[\s\S]*?---\n/, "");

    try {
        // 使用 marked 解析 markdown
        const tokens = marked.lexer(contentWithoutFrontmatter);
        const tocItems: TOCItem[] = [];
        const stack: TOCItem[] = [];

        // 遍历 tokens，提取标题
        for (const token of tokens) {
            if (token.type === "heading") {
                const headingToken = token as Tokens.Heading;
                const level = headingToken.depth;
                const text = extractTextFromTokens(headingToken.tokens);
                const id = generateId(text);

                const item: TOCItem = {
                    level,
                    text: text.trim(),
                    id,
                    children: [],
                };

                // 构建层级结构
                while (stack.length > 0 && stack[stack.length - 1].level >= level) {
                    stack.pop();
                }

                if (stack.length === 0) {
                    tocItems.push(item);
                } else {
                    stack[stack.length - 1].children.push(item);
                }

                stack.push(item);
            }
        }

        return tocItems;
    } catch (error) {
        console.warn("Failed to extract TOC from markdown:", error);
        return [];
    }
}

/**
 * 从 tokens 中提取纯文本
 */
function extractTextFromTokens(tokens: Token[]): string {
    return tokens
        .map((token) => {
            if (token.type === "text") {
                return (token as Tokens.Text).text;
            } else if (token.type === "strong" || token.type === "em") {
                const inlineToken = token as Tokens.Generic;
                if ("tokens" in inlineToken && Array.isArray(inlineToken.tokens)) {
                    return extractTextFromTokens(inlineToken.tokens);
                }
            }
            return "";
        })
        .join("");
}

/**
 * 生成锚点 ID
 * 保留中文等 Unicode 字符，只移除特殊符号
 */
function generateId(text: string): string {
    return text
        .toLowerCase()
        .replace(/\s+/g, "-") // 空格转连字符
        .replace(/[^\p{L}\p{N}-]/gu, "") // 保留字母、数字、连字符（Unicode-aware）
        .replace(/-+/g, "-") // 合并多个连字符
        .replace(/^-+|-+$/g, ""); // 移除首尾连字符
}

/**
 * 为所有文档生成 TOC 数据
 *
 * @param metadata - 文档元数据集合
 * @param docsRoot - 文档根目录路径
 * @returns TOC 数据集合
 */
export async function generateTOCCollection(
    metadata: DocsMetaCollection,
    docsRoot: string
): Promise<TOCCollection> {
    const tocCollection: TOCCollection = {};

    for (const [key, _meta] of Object.entries(metadata)) {
        const filePath = path.join(docsRoot, `${key}.md`);
        if (await fs.pathExists(filePath)) {
            const content = await fs.readFile(filePath, "utf-8");
            const tocItems = extractTOCFromMarkdown(content);
            tocCollection[key] = tocItems;
        }
    }

    return tocCollection;
}
