import { describe, it, expect, beforeEach, vi } from "vitest";
import { vol } from "memfs";
import { generateSearchIndex } from "../search";
import type { DocsMetaCollection } from "../../types";

// Mock fs-extra to use memfs
vi.mock("fs-extra", () => {
    return {
        default: {
            readFile: async (filePath: string): Promise<string> => {
                try {
                    const content = vol.readFileSync(filePath, "utf-8") as string;
                    return content;
                } catch {
                    throw new Error(`File not found: ${filePath}`);
                }
            },
        },
        readFile: async (filePath: string): Promise<string> => {
            try {
                const content = vol.readFileSync(filePath, "utf-8") as string;
                return content;
            } catch {
                throw new Error(`File not found: ${filePath}`);
            }
        },
    };
});

describe("搜索索引生成", () => {
    beforeEach(() => {
        vol.reset();
    });

    it("应该生成正确的搜索索引结构", async () => {
        const metadata: DocsMetaCollection = {
            "guide/intro": {
                title: "介绍",
                category: "guide",
                route: "/docs/guide/intro",
            },
        };

        vol.fromJSON({
            "/docs/guide/intro.md": "---\ntitle: 介绍\n---\n这是介绍文档",
        });

        const index = await generateSearchIndex(metadata, "/docs");
        expect(index.documents).toHaveLength(1);
        expect(index.documents[0].title).toBe("介绍");
        expect(index.documents[0].id).toBe("guide/intro");
        expect(index.documents[0].category).toBe("guide");
        expect(index.documents[0].route).toBe("/docs/guide/intro");
        expect(index.options.keys).toBeDefined();
        expect(index.options.keys).toHaveLength(2);
        expect(index.options.threshold).toBe(0.3);
        expect(index.options.includeScore).toBe(true);
        expect(index.options.includeMatches).toBe(true);
    });

    it("应该移除 Markdown 标记", async () => {
        const metadata: DocsMetaCollection = {
            "test/doc": { title: "Test", category: "test", route: "/docs/test/doc" },
        };

        vol.fromJSON({
            "/docs/test/doc.md": "# 标题\n**粗体** *斜体* `代码` [链接](url)",
        });

        const index = await generateSearchIndex(metadata, "/docs");
        const content = index.documents[0].content;
        expect(content).not.toContain("#");
        expect(content).not.toContain("**");
        expect(content).not.toContain("*");
        expect(content).not.toContain("`");
        expect(content).not.toContain("[");
        expect(content).not.toContain("]");
        expect(content).not.toContain("(");
        expect(content).not.toContain(")");
    });

    it("应该移除 frontmatter", async () => {
        const metadata: DocsMetaCollection = {
            "test/doc": { title: "Test", category: "test", route: "/docs/test/doc" },
        };

        vol.fromJSON({
            "/docs/test/doc.md": "---\ntitle: Test\ndescription: Description\n---\n这是正文内容",
        });

        const index = await generateSearchIndex(metadata, "/docs");
        const content = index.documents[0].content;
        expect(content).not.toContain("title: Test");
        expect(content).not.toContain("description: Description");
        expect(content).toContain("这是正文内容");
    });

    it("应该移除代码块", async () => {
        const metadata: DocsMetaCollection = {
            "test/doc": { title: "Test", category: "test", route: "/docs/test/doc" },
        };

        vol.fromJSON({
            "/docs/test/doc.md": "正文\n```js\nconst code = 'test';\n```\n更多正文",
        });

        const index = await generateSearchIndex(metadata, "/docs");
        const content = index.documents[0].content;
        expect(content).not.toContain("const code");
        expect(content).toContain("正文");
        expect(content).toContain("更多正文");
    });

    it("应该限制内容长度", async () => {
        const longContent = "a".repeat(1000);
        const metadata: DocsMetaCollection = {
            "test/long": { title: "Long", category: "test", route: "/docs/test/long" },
        };

        vol.fromJSON({
            "/docs/test/long.md": longContent,
        });

        const index = await generateSearchIndex(metadata, "/docs");
        expect(index.documents[0].content.length).toBeLessThanOrEqual(500);
    });

    it("应该处理多个文档", async () => {
        const metadata: DocsMetaCollection = {
            "guide/intro": {
                title: "介绍",
                category: "guide",
                route: "/docs/guide/intro",
            },
            "guide/advanced": {
                title: "高级",
                category: "guide",
                route: "/docs/guide/advanced",
            },
            "api/core": {
                title: "核心 API",
                category: "api",
                route: "/docs/api/core",
            },
        };

        vol.fromJSON({
            "/docs/guide/intro.md": "介绍内容",
            "/docs/guide/advanced.md": "高级内容",
            "/docs/api/core.md": "API 内容",
        });

        const index = await generateSearchIndex(metadata, "/docs");
        expect(index.documents).toHaveLength(3);
        expect(index.documents.map((d) => d.title)).toEqual(["介绍", "高级", "核心 API"]);
    });

    it("应该处理空内容", async () => {
        const metadata: DocsMetaCollection = {
            "test/empty": { title: "Empty", category: "test", route: "/docs/test/empty" },
        };

        vol.fromJSON({
            "/docs/test/empty.md": "---\ntitle: Empty\n---\n",
        });

        const index = await generateSearchIndex(metadata, "/docs");
        expect(index.documents[0].content).toBe("");
    });

    it("应该处理只有 frontmatter 的文档", async () => {
        const metadata: DocsMetaCollection = {
            "test/frontmatter-only": {
                title: "Frontmatter Only",
                category: "test",
                route: "/docs/test/frontmatter-only",
            },
        };

        vol.fromJSON({
            "/docs/test/frontmatter-only.md": "---\ntitle: Frontmatter Only\n---",
        });

        const index = await generateSearchIndex(metadata, "/docs");
        expect(index.documents[0].content.trim()).toBe("");
    });

    it("应该正确设置搜索选项", async () => {
        const metadata: DocsMetaCollection = {
            "test/doc": { title: "Test", category: "test", route: "/docs/test/doc" },
        };

        vol.fromJSON({
            "/docs/test/doc.md": "内容",
        });

        const index = await generateSearchIndex(metadata, "/docs");
        expect(index.options.keys).toEqual([
            { name: "title", weight: 0.7 },
            { name: "content", weight: 0.3 },
        ]);
        expect(index.options.threshold).toBe(0.3);
        expect(index.options.includeScore).toBe(true);
        expect(index.options.includeMatches).toBe(true);
    });
});
