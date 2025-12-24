import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
// @ts-expect-error - .wsx files are handled by Vite plugin at build time
import DocSearch, { searchIndexCache } from "../DocSearch.wsx";
import type { SearchIndex } from "../../../types";

// 注册组件
if (!customElements.get("wsx-doc-search")) {
    customElements.define("wsx-doc-search", DocSearch);
}

describe("DocSearch 组件", () => {
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockFetch = vi.fn();
        global.fetch = mockFetch;
        // 重置搜索索引缓存
        if (searchIndexCache) {
            searchIndexCache.data = null;
            searchIndexCache.promise = null;
        }
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("应该加载搜索索引", async () => {
        const mockIndex: SearchIndex = {
            documents: [
                {
                    id: "guide/test",
                    title: "Test Document",
                    category: "guide",
                    route: "/docs/guide/test",
                    content: "test content",
                },
            ],
            options: {
                keys: [{ name: "title", weight: 0.7 }],
                threshold: 0.3,
                includeScore: true,
                includeMatches: true,
            },
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockIndex),
        } as Response);

        const search = document.createElement("wsx-doc-search") as DocSearch;
        document.body.appendChild(search);

        await new Promise((resolve) => setTimeout(resolve, 300));

        // @ts-expect-error - 访问私有状态用于测试
        expect(search.isLoading).toBe(false);
        document.body.removeChild(search);
    });

    it("应该正确搜索文档", async () => {
        const mockIndex: SearchIndex = {
            documents: [
                {
                    id: "guide/test",
                    title: "Test Document",
                    category: "guide",
                    route: "/docs/guide/test",
                    content: "test content",
                },
                {
                    id: "guide/other",
                    title: "Other Document",
                    category: "guide",
                    route: "/docs/guide/other",
                    content: "other content",
                },
            ],
            options: {
                keys: [{ name: "title", weight: 0.7 }],
                threshold: 0.3,
                includeScore: true,
                includeMatches: true,
            },
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockIndex),
        } as Response);

        const search = document.createElement("wsx-doc-search") as DocSearch;
        document.body.appendChild(search);

        // 等待索引加载
        await new Promise((resolve) => setTimeout(resolve, 300));

        // 设置查询
        const input = search.querySelector(".search-input") as HTMLInputElement;
        if (input) {
            input.value = "Test";
            input.dispatchEvent(new Event("input"));
        }

        // 等待防抖
        await new Promise((resolve) => setTimeout(resolve, 400));

        // @ts-expect-error - 访问私有状态用于测试
        expect(search.results.length).toBeGreaterThan(0);
        // @ts-expect-error - 访问私有状态用于测试
        expect(search.results[0].item.title).toContain("Test");
        document.body.removeChild(search);
    });

    it("应该响应键盘导航（ArrowDown）", async () => {
        const search = document.createElement("wsx-doc-search") as DocSearch;
        document.body.appendChild(search);

        const input = search.querySelector(".search-input") as HTMLInputElement;
        if (input) {
            // 打开搜索结果
            // @ts-expect-error - 访问私有状态用于测试
            search.isOpen = true;
            // @ts-expect-error - 访问私有状态用于测试
            search.results = [
                {
                    item: {
                        id: "guide/test1",
                        title: "Test 1",
                        category: "guide",
                        route: "/docs/guide/test1",
                        content: "content 1",
                    },
                    score: 0.1,
                },
                {
                    item: {
                        id: "guide/test2",
                        title: "Test 2",
                        category: "guide",
                        route: "/docs/guide/test2",
                        content: "content 2",
                    },
                    score: 0.2,
                },
            ];

            // 按下 ArrowDown
            input.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "ArrowDown",
                    bubbles: true,
                })
            );

            // @ts-expect-error - 访问私有状态用于测试
            expect(search.selectedIndex).toBe(0);
        }

        document.body.removeChild(search);
    });

    it("应该响应键盘导航（ArrowUp）", async () => {
        const search = document.createElement("wsx-doc-search") as DocSearch;
        document.body.appendChild(search);

        const input = search.querySelector(".search-input") as HTMLInputElement;
        if (input) {
            // @ts-expect-error - 访问私有状态用于测试
            search.isOpen = true;
            // @ts-expect-error - 访问私有状态用于测试
            search.results = [
                {
                    item: {
                        id: "guide/test1",
                        title: "Test 1",
                        category: "guide",
                        route: "/docs/guide/test1",
                        content: "content 1",
                    },
                    score: 0.1,
                },
            ];
            // @ts-expect-error - 访问私有状态用于测试
            search.selectedIndex = 1;

            input.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "ArrowUp",
                    bubbles: true,
                })
            );

            // @ts-expect-error - 访问私有状态用于测试
            expect(search.selectedIndex).toBe(0);
        }

        document.body.removeChild(search);
    });

    it("应该响应 Enter 键选择结果", async () => {
        const search = document.createElement("wsx-doc-search") as DocSearch;
        document.body.appendChild(search);

        const input = search.querySelector(".search-input") as HTMLInputElement;
        if (input) {
            // @ts-expect-error - 访问私有状态用于测试
            search.isOpen = true;
            // @ts-expect-error - 访问私有状态用于测试
            search.results = [
                {
                    item: {
                        id: "guide/test",
                        title: "Test",
                        category: "guide",
                        route: "/docs/guide/test",
                        content: "content",
                    },
                    score: 0.1,
                },
            ];

            let eventDispatched = false;
            search.addEventListener("doc-search-select", () => {
                eventDispatched = true;
            });

            input.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "Enter",
                    bubbles: true,
                })
            );

            expect(eventDispatched).toBe(true);
            // @ts-expect-error - 访问私有状态用于测试
            expect(search.isOpen).toBe(false);
        }

        document.body.removeChild(search);
    });

    it("应该响应 Escape 键关闭搜索", async () => {
        const search = document.createElement("wsx-doc-search") as DocSearch;
        document.body.appendChild(search);

        const input = search.querySelector(".search-input") as HTMLInputElement;
        if (input) {
            // @ts-expect-error - 访问私有状态用于测试
            search.isOpen = true;
            // @ts-expect-error - 访问私有状态用于测试
            search.query = "test";
            // @ts-expect-error - 访问私有状态用于测试
            search.results = [
                {
                    item: {
                        id: "test",
                        title: "Test",
                        category: "guide",
                        route: "/docs/guide/test",
                        content: "content",
                    },
                    score: 0.1,
                },
            ];

            input.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "Escape",
                    bubbles: true,
                })
            );

            // @ts-expect-error - 访问私有状态用于测试
            expect(search.isOpen).toBe(false);
            // @ts-expect-error - 访问私有状态用于测试
            expect(search.query).toBe("");
            // @ts-expect-error - 访问私有状态用于测试
            expect(search.results.length).toBe(0);
        }

        document.body.removeChild(search);
    });

    it("应该处理空查询", async () => {
        const search = document.createElement("wsx-doc-search") as DocSearch;
        document.body.appendChild(search);

        const input = search.querySelector(".search-input") as HTMLInputElement;
        if (input) {
            input.value = "";
            input.dispatchEvent(new Event("input"));

            await new Promise((resolve) => setTimeout(resolve, 400));

            // @ts-expect-error - 访问私有状态用于测试
            expect(search.results.length).toBe(0);
            // @ts-expect-error - 访问私有状态用于测试
            expect(search.isOpen).toBe(false);
        }

        document.body.removeChild(search);
    });

    it("应该显示无结果消息", async () => {
        const mockIndex: SearchIndex = {
            documents: [
                {
                    id: "guide/test",
                    title: "Test",
                    category: "guide",
                    route: "/docs/guide/test",
                    content: "content",
                },
            ],
            options: {
                keys: [{ name: "title", weight: 0.7 }],
                threshold: 0.3,
                includeScore: true,
                includeMatches: true,
            },
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockIndex),
        } as Response);

        const search = document.createElement("wsx-doc-search") as DocSearch;
        document.body.appendChild(search);

        await new Promise((resolve) => setTimeout(resolve, 300));

        const input = search.querySelector(".search-input") as HTMLInputElement;
        if (input) {
            input.value = "nonexistent";
            input.dispatchEvent(new Event("input"));

            await new Promise((resolve) => setTimeout(resolve, 400));

            // @ts-expect-error - 访问私有状态用于测试
            expect(search.results.length).toBe(0);
            // @ts-expect-error - 访问私有状态用于测试
            expect(search.isOpen).toBe(true);
        }

        document.body.removeChild(search);
    });

    it("应该缓存搜索索引", async () => {
        const mockIndex: SearchIndex = {
            documents: [],
            options: {
                keys: [],
                threshold: 0.3,
                includeScore: true,
                includeMatches: true,
            },
        };

        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockIndex),
        } as Response);

        const search1 = document.createElement("wsx-doc-search") as DocSearch;
        const search2 = document.createElement("wsx-doc-search") as DocSearch;
        document.body.appendChild(search1);
        document.body.appendChild(search2);

        await new Promise((resolve) => setTimeout(resolve, 300));

        // 搜索索引只应该加载一次
        const indexCalls = mockFetch.mock.calls.filter(
            (call) => call[0] === "/.wsx-press/search-index.json"
        );
        expect(indexCalls.length).toBe(1);

        document.body.removeChild(search1);
        document.body.removeChild(search2);
    });
});
