import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
// @ts-expect-error - .wsx files are handled by Vite plugin at build time
import DocPage, { metadataCache } from "../DocPage.wsx";

describe("DocPage 组件", () => {
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockFetch = vi.fn();
        global.fetch = mockFetch;
        // 重置元数据缓存
        if (metadataCache) {
            metadataCache.data = null;
            metadataCache.promise = null;
        }
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("应该正确加载文档", async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve({
                        "guide/intro": {
                            title: "介绍",
                            category: "guide",
                            route: "/docs/guide/intro",
                        },
                    }),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve("# 介绍\n内容"),
            } as Response);

        const page = document.createElement("wsx-doc-page") as DocPage;
        document.body.appendChild(page);
        page.setAttribute("params", JSON.stringify({ category: "guide", page: "intro" }));

        // 等待加载完成
        await new Promise((resolve) => setTimeout(resolve, 300));

        // @ts-expect-error - 访问私有状态用于测试
        expect(page.loadingState).toBe("success");
        // @ts-expect-error - 访问私有状态用于测试
        expect(page.markdown).toBe("# 介绍\n内容");
        // @ts-expect-error - 访问私有状态用于测试
        expect(page.metadata?.title).toBe("介绍");
        document.body.removeChild(page);
    });

    it("应该处理 404 错误（元数据不存在）", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({}),
        } as Response);

        const page = document.createElement("wsx-doc-page") as DocPage;
        document.body.appendChild(page);
        page.setAttribute("params", JSON.stringify({ category: "guide", page: "notfound" }));

        await new Promise((resolve) => setTimeout(resolve, 300));

        // @ts-expect-error - 访问私有状态用于测试
        expect(page.loadingState).toBe("error");
        // @ts-expect-error - 访问私有状态用于测试
        expect(page.error?.code).toBe("NOT_FOUND");
        document.body.removeChild(page);
    });

    it("应该处理 404 错误（文件不存在）", async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve({
                        "guide/test": {
                            title: "Test",
                            category: "guide",
                            route: "/docs/guide/test",
                        },
                    }),
            } as Response)
            .mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: "Not Found",
            } as Response);

        const page = document.createElement("wsx-doc-page") as DocPage;
        document.body.appendChild(page);
        page.setAttribute("params", JSON.stringify({ category: "guide", page: "test" }));

        await new Promise((resolve) => setTimeout(resolve, 300));

        // @ts-expect-error - 访问私有状态用于测试
        expect(page.loadingState).toBe("error");
        // @ts-expect-error - 访问私有状态用于测试
        expect(page.error?.code).toBe("NOT_FOUND");
        document.body.removeChild(page);
    });

    it("应该处理网络错误", async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve({
                        "guide/test": {
                            title: "Test",
                            category: "guide",
                            route: "/docs/guide/test",
                        },
                    }),
            } as Response)
            .mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: "Internal Server Error",
            } as Response);

        const page = document.createElement("wsx-doc-page") as DocPage;
        document.body.appendChild(page);
        page.setAttribute("params", JSON.stringify({ category: "guide", page: "test" }));

        await new Promise((resolve) => setTimeout(resolve, 300));

        // @ts-expect-error - 访问私有状态用于测试
        expect(page.loadingState).toBe("error");
        // @ts-expect-error - 访问私有状态用于测试
        expect(page.error?.code).toBe("NETWORK_ERROR");
        document.body.removeChild(page);
    });

    it("应该防止竞态条件", async () => {
        let resolve1: () => void;
        let resolve2: () => void;
        const promise1 = new Promise<Response>((resolve) => {
            resolve1 = () => {
                resolve({
                    ok: true,
                    text: () => Promise.resolve("# Doc1\nContent"),
                } as Response);
            };
        });
        const promise2 = new Promise<Response>((resolve) => {
            resolve2 = () => {
                resolve({
                    ok: true,
                    text: () => Promise.resolve("# Doc2\nContent"),
                } as Response);
            };
        });

        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve({
                        "guide/doc1": {
                            title: "Doc1",
                            category: "guide",
                            route: "/docs/guide/doc1",
                        },
                        "guide/doc2": {
                            title: "Doc2",
                            category: "guide",
                            route: "/docs/guide/doc2",
                        },
                    }),
            } as Response)
            .mockReturnValueOnce(promise1)
            .mockReturnValueOnce(promise2);

        const page = document.createElement("wsx-doc-page") as DocPage;
        document.body.appendChild(page);

        // 快速切换两次
        page.setAttribute("params", JSON.stringify({ category: "guide", page: "doc1" }));
        page.setAttribute("params", JSON.stringify({ category: "guide", page: "doc2" }));

        // 解析第二个请求
        resolve2!();
        await promise2;

        // 解析第一个请求（应该被忽略）
        resolve1!();
        await promise1;

        await new Promise((resolve) => setTimeout(resolve, 200));

        // 应该只加载最后一个文档
        // @ts-expect-error - 访问私有状态用于测试
        expect(page.metadata?.title).toBe("Doc2");
        document.body.removeChild(page);
    });

    it("应该缓存元数据", async () => {
        const metaResponse = {
            ok: true,
            json: () =>
                Promise.resolve({
                    "guide/test": {
                        title: "Test",
                        category: "guide",
                        route: "/docs/guide/test",
                    },
                }),
        };

        mockFetch
            .mockResolvedValueOnce(metaResponse as Response)
            .mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve("# Test\nContent"),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve("# Test\nContent"),
            } as Response);

        const page1 = document.createElement("wsx-doc-page") as DocPage;
        const page2 = document.createElement("wsx-doc-page") as DocPage;
        document.body.appendChild(page1);
        document.body.appendChild(page2);

        page1.setAttribute("params", JSON.stringify({ category: "guide", page: "test" }));
        page2.setAttribute("params", JSON.stringify({ category: "guide", page: "test" }));

        await new Promise((resolve) => setTimeout(resolve, 300));

        // 元数据只应该加载一次
        const metaCalls = mockFetch.mock.calls.filter(
            (call) => call[0] === "/.wsx-press/docs-meta.json"
        );
        expect(metaCalls.length).toBe(1);

        document.body.removeChild(page1);
        document.body.removeChild(page2);
    });

    it("应该显示加载状态", async () => {
        let resolveFetch: () => void;
        const fetchPromise = new Promise<Response>((resolve) => {
            resolveFetch = () => {
                resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            "guide/test": {
                                title: "Test",
                                category: "guide",
                                route: "/docs/guide/test",
                            },
                        }),
                } as Response);
            };
        });

        mockFetch.mockReturnValueOnce(fetchPromise);

        const page = document.createElement("wsx-doc-page") as DocPage;
        document.body.appendChild(page);
        page.setAttribute("params", JSON.stringify({ category: "guide", page: "test" }));

        // 在加载过程中
        await new Promise((resolve) => setTimeout(resolve, 50));
        // @ts-expect-error - 访问私有状态用于测试
        expect(page.loadingState).toBe("loading");

        resolveFetch!();
        await fetchPromise;
        await new Promise((resolve) => setTimeout(resolve, 100));

        document.body.removeChild(page);
    });

    it("应该处理空状态", () => {
        const page = document.createElement("wsx-doc-page") as DocPage;
        document.body.appendChild(page);

        // @ts-expect-error - 访问私有状态用于测试
        expect(page.loadingState).toBe("idle");
        // @ts-expect-error - 访问私有状态用于测试
        expect(page.markdown).toBe("");

        document.body.removeChild(page);
    });
});
