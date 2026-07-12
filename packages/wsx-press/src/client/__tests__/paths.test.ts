import { describe, it, expect, beforeEach } from "vitest";
import {
    configurePressBase,
    DOCS_ROUTE_PREFIX,
    extractPressAssetFileName,
    getDocsRelativePath,
    getPressBase,
    normalizeSiteBase,
    pressAsset,
    pressAssetMountPath,
    pressDocMarkdownUrl,
    pressSitePath,
    PRESS_ASSET_DIR,
    resetPressBase,
    stripPressBase,
} from "../paths";

describe("normalizeSiteBase", () => {
    it("根路径与空值归一为 /", () => {
        expect(normalizeSiteBase("/")).toBe("/");
        expect(normalizeSiteBase("")).toBe("/");
    });

    it("补全前导与尾部斜杠", () => {
        expect(normalizeSiteBase("/productivity")).toBe("/productivity/");
        expect(normalizeSiteBase("productivity/")).toBe("/productivity/");
        expect(normalizeSiteBase("/app/v2/")).toBe("/app/v2/");
    });
});

describe("configurePressBase / getPressBase", () => {
    beforeEach(() => {
        resetPressBase();
    });

    it("默认 base 为 /", () => {
        expect(getPressBase()).toBe("/");
    });

    it("显式配置后返回规范化 base", () => {
        configurePressBase("/productivity");
        expect(getPressBase()).toBe("/productivity/");
    });

    it("resetPressBase 恢复默认", () => {
        configurePressBase("/productivity/");
        resetPressBase();
        expect(getPressBase()).toBe("/");
    });
});

describe("pressSitePath", () => {
    beforeEach(() => {
        resetPressBase();
    });

    it("根 base 下保持应用内路由", () => {
        expect(pressSitePath("/docs/guide")).toBe("/docs/guide");
        expect(pressSitePath("/")).toBe("/");
        expect(pressSitePath("")).toBe("/");
    });

    it("子路径 base 下加前缀", () => {
        configurePressBase("/productivity/");
        expect(pressSitePath("/docs/guide")).toBe("/productivity/docs/guide");
        expect(pressSitePath("/")).toBe("/productivity/");
    });

    it("无 leading slash 的路由也能拼接", () => {
        configurePressBase("/productivity/");
        expect(pressSitePath("docs/guide")).toBe("/productivity/docs/guide");
    });
});

describe("pressAsset / pressDocMarkdownUrl", () => {
    beforeEach(() => {
        resetPressBase();
    });

    it("根 base 下生成 /.wsx-press 资源路径", () => {
        expect(pressAsset("docs-meta.json")).toBe("/.wsx-press/docs-meta.json");
        expect(pressAsset(".wsx-press/search-index.json")).toBe("/.wsx-press/search-index.json");
    });

    it("子路径 base 下生成带前缀资源路径", () => {
        configurePressBase("/productivity/");
        expect(pressAsset("docs-meta.json")).toBe("/productivity/.wsx-press/docs-meta.json");
        expect(pressDocMarkdownUrl("guide/intro")).toBe("/productivity/docs/guide/intro.md");
    });

    it("根 base 下 markdown URL", () => {
        expect(pressDocMarkdownUrl("guide/intro")).toBe("/docs/guide/intro.md");
    });
});

describe("stripPressBase", () => {
    beforeEach(() => {
        resetPressBase();
    });

    it("根 base 下原样返回 pathname", () => {
        expect(stripPressBase("/docs/a/b")).toBe("/docs/a/b");
        expect(stripPressBase("")).toBe("/");
    });

    it("子路径 base 下剥离前缀", () => {
        configurePressBase("/productivity/");
        expect(stripPressBase("/productivity/docs/a/b")).toBe("/docs/a/b");
        expect(stripPressBase("/productivity")).toBe("/");
        expect(stripPressBase("/productivity/")).toBe("/");
    });

    it("不匹配 base 时返回原 pathname", () => {
        configurePressBase("/productivity/");
        expect(stripPressBase("/other/docs/a")).toBe("/other/docs/a");
    });
});

describe("getDocsRelativePath", () => {
    beforeEach(() => {
        resetPressBase();
    });

    it("从根部署 pathname 提取 docPath", () => {
        expect(getDocsRelativePath("/docs/a/b")).toBe("a/b");
    });

    it("从子路径 pathname 提取 docPath", () => {
        configurePressBase("/productivity/");
        expect(getDocsRelativePath("/productivity/docs/a/b")).toBe("a/b");
    });

    it("非文档路由返回 null", () => {
        expect(getDocsRelativePath("/")).toBeNull();
        expect(getDocsRelativePath("/productivity/")).toBeNull();
        configurePressBase("/productivity/");
        expect(getDocsRelativePath("/productivity/about")).toBeNull();
    });

    it("仅 /docs/ 前缀无内容时返回 null", () => {
        expect(getDocsRelativePath(`${DOCS_ROUTE_PREFIX}/`)).toBeNull();
    });
});

describe("pressAssetMountPath / extractPressAssetFileName", () => {
    it("根 base mount 路径", () => {
        expect(pressAssetMountPath("/")).toBe(`/${PRESS_ASSET_DIR}`);
    });

    it("子路径 mount 路径", () => {
        expect(pressAssetMountPath("/productivity/")).toBe("/productivity/.wsx-press");
    });

    it("从 pathname 提取文件名", () => {
        expect(extractPressAssetFileName("/.wsx-press/docs-meta.json")).toBe("docs-meta.json");
        expect(extractPressAssetFileName("/productivity/.wsx-press/search-index.json")).toBe(
            "search-index.json"
        );
        expect(extractPressAssetFileName("/.wsx-presssearch-index.json")).toBe("search-index.json");
        expect(extractPressAssetFileName("/about")).toBeNull();
    });
});
