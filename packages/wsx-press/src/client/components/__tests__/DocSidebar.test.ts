import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
// @ts-expect-error - .wsx files are handled by Vite plugin at build time
import DocSidebar from "../DocSidebar.wsx";
import { RouterUtils } from "@wsxjs/wsx-router";
import { configurePressBase, resetPressBase } from "../../paths";
import { metadataCache } from "../DocPage.wsx";

if (!customElements.get("wsx-doc-sidebar")) {
    customElements.define("wsx-doc-sidebar", DocSidebar);
}

describe("DocSidebar 组件", () => {
    let mockFetch: ReturnType<typeof vi.fn>;
    let navigateSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        resetPressBase();
        mockFetch = vi.fn();
        global.fetch = mockFetch;
        navigateSpy = vi.spyOn(RouterUtils, "navigate").mockImplementation(() => {});
        metadataCache.data = null;
        metadataCache.promise = null;
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

    it("子路径 base 下 fetch 元数据并 navigate 带前缀", async () => {
        configurePressBase("/productivity/");

        mockFetch.mockResolvedValue({
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

        const sidebar = document.createElement("wsx-doc-sidebar") as DocSidebar;
        document.body.appendChild(sidebar);

        await new Promise((resolve) => setTimeout(resolve, 300));

        expect(mockFetch).toHaveBeenCalledWith("/productivity/.wsx-press/docs-meta.json");

        const link = sidebar.querySelector(".doc-sidebar-link") as HTMLAnchorElement;
        expect(link?.getAttribute("href")).toBe("/productivity/docs/guide/intro");

        link?.click();
        expect(navigateSpy).toHaveBeenCalledWith("/productivity/docs/guide/intro");

        document.body.removeChild(sidebar);
    });

    it("子路径下 stripPressBase 用于 active 状态", async () => {
        configurePressBase("/productivity/");

        mockFetch.mockResolvedValue({
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

        RouterUtils._setCurrentRoute({
            path: "/productivity/docs/guide/intro",
            params: {},
            query: {},
            hash: "",
        });

        const sidebar = document.createElement("wsx-doc-sidebar") as DocSidebar;
        document.body.appendChild(sidebar);

        await new Promise((resolve) => setTimeout(resolve, 300));

        const activeLink = sidebar.querySelector(".doc-sidebar-link.active");
        expect(activeLink).toBeTruthy();

        document.body.removeChild(sidebar);
    });
});
