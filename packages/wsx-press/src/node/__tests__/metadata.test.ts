import { describe, it, expect, beforeEach, vi } from "vitest";
import { vol } from "memfs";
import path from "path";
import { scanDocsMetadata, extractFrontmatter, addPrevNextLinks } from "../metadata";
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

// Mock glob to use memfs
vi.mock("glob", () => {
    return {
        glob: async (
            pattern: string,
            options: { cwd: string; absolute: boolean }
        ): Promise<string[]> => {
            const files: string[] = [];
            const cwd = options.cwd;

            const walkDir = (dir: string): void => {
                try {
                    const entries = vol.readdirSync(dir, { withFileTypes: true }) as Array<{
                        name: string;
                        isDirectory(): boolean;
                    }>;
                    for (const entry of entries) {
                        const fullPath = path.join(dir, entry.name);
                        if (entry.isDirectory()) {
                            walkDir(fullPath);
                        } else if (entry.name.endsWith(".md")) {
                            files.push(options.absolute ? fullPath : path.relative(cwd, fullPath));
                        }
                    }
                } catch {
                    // Directory doesn't exist, skip
                }
            };

            walkDir(cwd);
            return files;
        },
    };
});

describe("元数据扫描", () => {
    beforeEach(() => {
        vol.reset();
    });

    describe("extractFrontmatter", () => {
        it("应该正确解析 YAML frontmatter", () => {
            const markdown = `---
title: 测试文档
description: 这是描述
tags: [test, demo]
---
# 正文内容`;

            const result = extractFrontmatter(markdown);
            expect(result.title).toBe("测试文档");
            expect(result.description).toBe("这是描述");
            expect(result.tags).toEqual(["test", "demo"]);
        });

        it("应该处理无 frontmatter 的情况", () => {
            const markdown = "# 标题\n正文";
            const result = extractFrontmatter(markdown);
            expect(result).toEqual({});
        });

        it("应该处理格式错误的 frontmatter", () => {
            const markdown = `---
invalid yaml::
---`;
            const result = extractFrontmatter(markdown);
            // 应该返回空对象或部分解析的结果
            expect(result).toBeDefined();
        });

        it("应该处理没有冒号的行", () => {
            const markdown = `---
title: 测试
这是没有冒号的行
description: 描述
---`;
            const result = extractFrontmatter(markdown);
            expect(result.title).toBe("测试");
            expect(result.description).toBe("描述");
        });

        it("应该处理空值的字段", () => {
            const markdown = `---
title: 测试
emptyField:
description: 描述
---`;
            const result = extractFrontmatter(markdown);
            expect(result.title).toBe("测试");
            expect(result.description).toBe("描述");
            // 空值字段不应该被添加
            expect((result as Record<string, unknown>).emptyField).toBeUndefined();
        });

        it("应该处理空 frontmatter", () => {
            const markdown = `---
---
# 正文`;
            const result = extractFrontmatter(markdown);
            expect(result).toEqual({});
        });

        it("应该处理只有 title 的 frontmatter", () => {
            const markdown = `---
title: 简单标题
---
# 正文`;
            const result = extractFrontmatter(markdown);
            expect(result.title).toBe("简单标题");
        });

        it("应该处理带空格的 tags", () => {
            const markdown = `---
tags: [tag1, tag2, tag3]
---`;
            const result = extractFrontmatter(markdown);
            expect(result.tags).toEqual(["tag1", "tag2", "tag3"]);
        });

        it("应该处理扩展字段", () => {
            const markdown = `---
title: 测试
customField: custom value
anotherField: 123
---`;
            const result = extractFrontmatter(markdown);
            expect(result.title).toBe("测试");
            expect((result as Record<string, unknown>).customField).toBe("custom value");
            expect((result as Record<string, unknown>).anotherField).toBe("123");
        });
    });

    describe("scanDocsMetadata", () => {
        it("应该扫描所有 Markdown 文件", async () => {
            vol.fromJSON({
                "/docs/guide/intro.md": "---\ntitle: 介绍\n---\n内容",
                "/docs/guide/advanced.md": "---\ntitle: 高级\n---\n内容",
                "/docs/api/core.md": "---\ntitle: 核心 API\n---\n内容",
            });

            const result = await scanDocsMetadata("/docs");
            expect(Object.keys(result)).toHaveLength(3);
            expect(result["guide/intro"].title).toBe("介绍");
            expect(result["guide/advanced"].title).toBe("高级");
            expect(result["api/core"].title).toBe("核心 API");
        });

        it("应该正确提取类别", async () => {
            vol.fromJSON({
                "/docs/tutorial/step1.md": "# Step 1",
            });

            const result = await scanDocsMetadata("/docs");
            expect(result["tutorial/step1"].category).toBe("tutorial");
        });

        it("应该生成正确的路由", async () => {
            vol.fromJSON({
                "/docs/guide/test.md": "# Test",
            });

            const result = await scanDocsMetadata("/docs");
            expect(result["guide/test"].route).toBe("/docs/guide/test");
        });

        it("应该处理根目录下的文件", async () => {
            vol.fromJSON({
                "/docs/index.md": "---\ntitle: 首页\n---\n内容",
            });

            const result = await scanDocsMetadata("/docs");
            expect(result["index"].category).toBe(".");
            expect(result["index"].route).toBe("/docs/index");
        });

        it("应该处理空类别的情况（根目录文件）", async () => {
            vol.fromJSON({
                "/docs/root-file.md": "# Root File",
            });

            const result = await scanDocsMetadata("/docs");
            expect(result["root-file"].category).toBe(".");
        });

        it("应该使用文件名作为默认标题", async () => {
            vol.fromJSON({
                "/docs/guide/no-title.md": "# 内容",
            });

            const result = await scanDocsMetadata("/docs");
            expect(result["guide/no-title"].title).toBe("no-title");
        });
    });

    describe("addPrevNextLinks", () => {
        it("应该为同类别文档添加导航链接", () => {
            const metadata: DocsMetaCollection = {
                "guide/intro": { title: "介绍", category: "guide", route: "/docs/guide/intro" },
                "guide/basics": { title: "基础", category: "guide", route: "/docs/guide/basics" },
                "guide/advanced": {
                    title: "高级",
                    category: "guide",
                    route: "/docs/guide/advanced",
                },
            };

            const result = addPrevNextLinks(metadata);
            // 排序后顺序：advanced, basics, intro
            expect(result["guide/advanced"].prev).toBeNull();
            expect(result["guide/advanced"].next).toBe("/docs/guide/basics");
            expect(result["guide/basics"].prev).toBe("/docs/guide/advanced");
            expect(result["guide/basics"].next).toBe("/docs/guide/intro");
            expect(result["guide/intro"].prev).toBe("/docs/guide/basics");
            expect(result["guide/intro"].next).toBeNull();
        });

        it("首尾文档应该有 null 链接", () => {
            const metadata: DocsMetaCollection = {
                "guide/first": { title: "第一", category: "guide", route: "/docs/guide/first" },
                "guide/last": { title: "最后", category: "guide", route: "/docs/guide/last" },
            };

            const result = addPrevNextLinks(metadata);
            expect(result["guide/first"].prev).toBeNull();
            expect(result["guide/first"].next).toBe("/docs/guide/last");
            expect(result["guide/last"].prev).toBe("/docs/guide/first");
            expect(result["guide/last"].next).toBeNull();
        });

        it("不同类别的文档不应该互相链接", () => {
            const metadata: DocsMetaCollection = {
                "guide/intro": { title: "指南", category: "guide", route: "/docs/guide/intro" },
                "api/core": { title: "API", category: "api", route: "/docs/api/core" },
            };

            const result = addPrevNextLinks(metadata);
            expect(result["guide/intro"].prev).toBeNull();
            expect(result["guide/intro"].next).toBeNull();
            expect(result["api/core"].prev).toBeNull();
            expect(result["api/core"].next).toBeNull();
        });

        it("应该按字母顺序排序", () => {
            const metadata: DocsMetaCollection = {
                "guide/zebra": { title: "Z", category: "guide", route: "/docs/guide/zebra" },
                "guide/apple": { title: "A", category: "guide", route: "/docs/guide/apple" },
                "guide/banana": { title: "B", category: "guide", route: "/docs/guide/banana" },
            };

            const result = addPrevNextLinks(metadata);
            expect(result["guide/apple"].next).toBe("/docs/guide/banana");
            expect(result["guide/banana"].prev).toBe("/docs/guide/apple");
            expect(result["guide/banana"].next).toBe("/docs/guide/zebra");
            expect(result["guide/zebra"].prev).toBe("/docs/guide/banana");
        });

        it("应该处理单个文档", () => {
            const metadata: DocsMetaCollection = {
                "guide/alone": { title: "单独", category: "guide", route: "/docs/guide/alone" },
            };

            const result = addPrevNextLinks(metadata);
            expect(result["guide/alone"].prev).toBeNull();
            expect(result["guide/alone"].next).toBeNull();
        });
    });
});
