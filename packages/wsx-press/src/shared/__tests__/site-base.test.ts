import { describe, it, expect } from "vitest";
import {
    extractPressAssetFileName,
    normalizeSiteBase,
    pressAssetMountPath,
    PRESS_ASSET_DIR,
} from "../site-base";

describe("shared/site-base", () => {
    it("normalizeSiteBase 边界", () => {
        expect(normalizeSiteBase("/")).toBe("/");
        expect(normalizeSiteBase("")).toBe("/");
        expect(normalizeSiteBase("x")).toBe("/x/");
    });

    it("pressAssetMountPath 无尾部斜杠 base", () => {
        expect(pressAssetMountPath("/productivity")).toBe("/productivity/.wsx-press");
    });

    it("extractPressAssetFileName legacy 路径", () => {
        expect(extractPressAssetFileName("/.wsx-press/")).toBeNull();
        expect(extractPressAssetFileName("/.wsx-press")).toBeNull();
        expect(extractPressAssetFileName("/.wsx-presssearch-index.json")).toBe("search-index.json");
        expect(extractPressAssetFileName("/productivity/.wsx-press/docs-toc.json")).toBe(
            "docs-toc.json"
        );
    });

    it("导出 PRESS_ASSET_DIR", () => {
        expect(PRESS_ASSET_DIR).toBe(".wsx-press");
    });
});
