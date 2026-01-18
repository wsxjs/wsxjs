import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
// @ts-expect-error - .wsx files are handled by Vite plugin at build time
import DocPage, { metadataCache } from "../DocPage.wsx";
import { RouterUtils } from "@wsxjs/wsx-router";

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
        // 重置 RouterUtils 的路由信息
        RouterUtils._setCurrentRoute({
            path: "/",
            params: {},
            query: {},
            hash: "",
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("应该正确加载文档", async () => {
        // Mock fetch to handle both metadata and markdown requests
        mockFetch.mockImplementation((url: string) => {
            if (url === "/.wsx-press/docs-meta.json") {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            "guide/intro": {
                                title: "介绍",
                                category: "guide",
                                route: "/docs/guide/intro",
                            },
                        }),
                } as Response);
            } else if (url === "/docs/guide/intro.md") {
                return Promise.resolve({
                    ok: true,
                    text: () => Promise.resolve("# 介绍\n内容"),
                } as Response);
            }
            return Promise.reject(new Error(`Unexpected URL: ${url}`));
        });

        // 设置路由信息
        RouterUtils._setCurrentRoute({
            path: "/docs/guide/intro",
            params: { category: "guide", page: "intro" },
            query: {},
            hash: "",
        });

        const page = document.createElement("wsx-doc-page") as DocPage;
        document.body.appendChild(page);

        // 触发 route-changed 事件以触发加载
        document.dispatchEvent(
            new CustomEvent("route-changed", {
                detail: {
                    path: "/docs/guide/intro",
                    params: { category: "guide", page: "intro" },
                    query: {},
                    hash: "",
                },
            })
        );

        // 等待加载完成（需要更长时间，因为有两个 requestAnimationFrame）
        await new Promise((resolve) => setTimeout(resolve, 500));

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

        // 设置路由信息
        RouterUtils._setCurrentRoute({
            path: "/docs/guide/notfound",
            params: { category: "guide", page: "notfound" },
            query: {},
            hash: "",
        });

        const page = document.createElement("wsx-doc-page") as DocPage;
        document.body.appendChild(page);

        // 触发 route-changed 事件以触发加载
        document.dispatchEvent(
            new CustomEvent("route-changed", {
                detail: {
                    path: "/docs/guide/notfound",
                    params: { category: "guide", page: "notfound" },
                    query: {},
                    hash: "",
                },
            })
        );

        await new Promise((resolve) => setTimeout(resolve, 300));

        // @ts-expect-error - 访问私有状态用于测试
        expect(page.loadingState).toBe("error");
        // @ts-expect-error - 访问私有状态用于测试
        expect(page.error?.code).toBe("NOT_FOUND");
        document.body.removeChild(page);
    });

    it("应该处理 404 错误（文件不存在）", async () => {
        // Mock fetch to handle both metadata and markdown requests
        mockFetch.mockImplementation((url: string) => {
            if (url === "/.wsx-press/docs-meta.json") {
                return Promise.resolve({
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
            } else if (url === "/docs/guide/test.md") {
                return Promise.resolve({
                    ok: false,
                    status: 404,
                    statusText: "Not Found",
                } as Response);
            }
            return Promise.reject(new Error(`Unexpected URL: ${url}`));
        });

        // 设置路由信息
        RouterUtils._setCurrentRoute({
            path: "/docs/guide/test",
            params: { category: "guide", page: "test" },
            query: {},
            hash: "",
        });

        const page = document.createElement("wsx-doc-page") as DocPage;
        document.body.appendChild(page);

        // 触发 route-changed 事件以触发加载
        document.dispatchEvent(
            new CustomEvent("route-changed", {
                detail: {
                    path: "/docs/guide/test",
                    params: { category: "guide", page: "test" },
                    query: {},
                    hash: "",
                },
            })
        );

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

        // 设置路由信息
        RouterUtils._setCurrentRoute({
            path: "/docs/guide/test",
            params: { category: "guide", page: "test" },
            query: {},
            hash: "",
        });

        const page = document.createElement("wsx-doc-page") as DocPage;
        document.body.appendChild(page);

        // 触发 route-changed 事件以触发加载
        document.dispatchEvent(
            new CustomEvent("route-changed", {
                detail: {
                    path: "/docs/guide/test",
                    params: { category: "guide", page: "test" },
                    query: {},
                    hash: "",
                },
            })
        );

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

        // 快速切换两次路由
        RouterUtils._setCurrentRoute({
            path: "/docs/guide/doc1",
            params: { category: "guide", page: "doc1" },
            query: {},
            hash: "",
        });
        document.dispatchEvent(
            new CustomEvent("route-changed", {
                detail: {
                    path: "/docs/guide/doc1",
                    params: { category: "guide", page: "doc1" },
                    query: {},
                    hash: "",
                },
            })
        );

        RouterUtils._setCurrentRoute({
            path: "/docs/guide/doc2",
            params: { category: "guide", page: "doc2" },
            query: {},
            hash: "",
        });
        document.dispatchEvent(
            new CustomEvent("route-changed", {
                detail: {
                    path: "/docs/guide/doc2",
                    params: { category: "guide", page: "doc2" },
                    query: {},
                    hash: "",
                },
            })
        );

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

        // 设置路由信息
        RouterUtils._setCurrentRoute({
            path: "/docs/guide/test",
            params: { category: "guide", page: "test" },
            query: {},
            hash: "",
        });

        const page1 = document.createElement("wsx-doc-page") as DocPage;
        const page2 = document.createElement("wsx-doc-page") as DocPage;
        document.body.appendChild(page1);
        document.body.appendChild(page2);

        // 触发 route-changed 事件以触发加载
        document.dispatchEvent(
            new CustomEvent("route-changed", {
                detail: {
                    path: "/docs/guide/test",
                    params: { category: "guide", page: "test" },
                    query: {},
                    hash: "",
                },
            })
        );

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

        // 设置路由信息
        RouterUtils._setCurrentRoute({
            path: "/docs/guide/test",
            params: { category: "guide", page: "test" },
            query: {},
            hash: "",
        });

        const page = document.createElement("wsx-doc-page") as DocPage;
        document.body.appendChild(page);

        // 触发 route-changed 事件以触发加载
        document.dispatchEvent(
            new CustomEvent("route-changed", {
                detail: {
                    path: "/docs/guide/test",
                    params: { category: "guide", page: "test" },
                    query: {},
                    hash: "",
                },
            })
        );

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
