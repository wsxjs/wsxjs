import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
// @ts-expect-error - .wsx files are handled by Vite plugin at build time
import DocTOC from "../DocTOC.wsx";
import { RouterUtils } from "@wsxjs/wsx-router";
import { configurePressBase, resetPressBase } from "../../paths";

if (!customElements.get("wsx-doc-toc")) {
    customElements.define("wsx-doc-toc", DocTOC);
}

describe("DocTOC 组件", () => {
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        resetPressBase();
        mockFetch = vi.fn();
        global.fetch = mockFetch;
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

    it("子路径 base 下 fetch TOC 并解析 docPath", async () => {
        configurePressBase("/productivity/");

        mockFetch.mockResolvedValue({
            ok: true,
            json: () =>
                Promise.resolve({
                    "guide/intro": [
                        {
                            id: "intro",
                            level: 2,
                            text: "介绍",
                            children: [],
                        },
                    ],
                }),
        } as Response);

        RouterUtils._setCurrentRoute({
            path: "/productivity/docs/guide/intro",
            params: {},
            query: {},
            hash: "",
        });

        const toc = document.createElement("wsx-doc-toc") as DocTOC;
        document.body.appendChild(toc);

        await new Promise((resolve) => setTimeout(resolve, 300));

        expect(mockFetch).toHaveBeenCalledWith("/productivity/.wsx-press/docs-toc.json");

        const title = toc.querySelector(".doc-toc-title");
        expect(title?.textContent).toBe("目录");

        document.body.removeChild(toc);
    });
});
