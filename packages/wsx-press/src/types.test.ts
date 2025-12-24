import { describe, it, expect } from "vitest";
import { DocumentLoadError } from "./types";
import type { DocMetadata, SearchDocument, DocsMetaCollection } from "./types";

describe("类型定义", () => {
    describe("DocumentLoadError", () => {
        it("应该正确创建 NOT_FOUND 错误", () => {
            const error = new DocumentLoadError("文档未找到", "NOT_FOUND");
            expect(error.message).toBe("文档未找到");
            expect(error.code).toBe("NOT_FOUND");
            expect(error.name).toBe("DocumentLoadError");
            expect(error.details).toBeUndefined();
        });

        it("应该正确创建 NETWORK_ERROR 错误", () => {
            const error = new DocumentLoadError("网络错误", "NETWORK_ERROR", { status: 500 });
            expect(error.code).toBe("NETWORK_ERROR");
            expect(error.details).toEqual({ status: 500 });
        });

        it("应该正确创建 PARSE_ERROR 错误", () => {
            const error = new DocumentLoadError("解析错误", "PARSE_ERROR");
            expect(error.code).toBe("PARSE_ERROR");
        });

        it("应该正确继承 Error", () => {
            const error = new DocumentLoadError("测试错误", "NOT_FOUND");
            expect(error).toBeInstanceOf(Error);
            expect(error.stack).toBeDefined();
        });
    });

    describe("类型兼容性", () => {
        it("DocMetadata 应该符合接口定义", () => {
            const metadata: DocMetadata = {
                title: "测试文档",
                category: "guide",
                route: "/docs/guide/test",
            };
            expect(metadata.title).toBe("测试文档");
            expect(metadata.category).toBe("guide");
            expect(metadata.route).toBe("/docs/guide/test");
        });

        it("DocMetadata 应该支持可选字段", () => {
            const metadata: DocMetadata = {
                title: "测试",
                category: "guide",
                route: "/docs/guide/test",
                prev: "/docs/guide/prev",
                next: "/docs/guide/next",
                description: "描述",
                tags: ["tag1", "tag2"],
            };
            expect(metadata.prev).toBe("/docs/guide/prev");
            expect(metadata.next).toBe("/docs/guide/next");
            expect(metadata.description).toBe("描述");
            expect(metadata.tags).toEqual(["tag1", "tag2"]);
        });

        it("DocMetadata 应该支持 null 值", () => {
            const metadata: DocMetadata = {
                title: "测试",
                category: "guide",
                route: "/docs/guide/test",
                prev: null,
                next: null,
            };
            expect(metadata.prev).toBeNull();
            expect(metadata.next).toBeNull();
        });

        it("SearchDocument 应该符合接口定义", () => {
            const doc: SearchDocument = {
                id: "test",
                title: "测试",
                category: "guide",
                route: "/docs/guide/test",
                content: "内容",
            };
            expect(doc.id).toBe("test");
            expect(doc.title).toBe("测试");
            expect(doc.category).toBe("guide");
            expect(doc.route).toBe("/docs/guide/test");
            expect(doc.content).toBe("内容");
        });

        it("DocsMetaCollection 应该符合类型定义", () => {
            const collection: DocsMetaCollection = {
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
            };
            expect(Object.keys(collection)).toHaveLength(2);
            expect(collection["guide/intro"].title).toBe("介绍");
            expect(collection["guide/advanced"].title).toBe("高级");
        });

        it("DocMetadata 应该支持扩展字段", () => {
            const metadata: DocMetadata = {
                title: "测试",
                category: "guide",
                route: "/docs/guide/test",
                customField: "custom value",
                anotherField: 123,
            };
            expect((metadata as Record<string, unknown>).customField).toBe("custom value");
            expect((metadata as Record<string, unknown>).anotherField).toBe(123);
        });
    });
});
