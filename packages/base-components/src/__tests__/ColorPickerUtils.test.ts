import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    handleCSSVariables,
    setDefaultColorCache,
    getDefaultColorCache,
    setCustomColorCache,
    getCustomColorCache,
    throttle,
    CONVERTER_BTN,
    CONVERTER_PANEL,
} from "../ColorPickerUtils";

describe("ColorPickerUtils", () => {
    beforeEach(() => {
        sessionStorage.clear();
        // 设置一些 CSS 变量用于测试
        document.documentElement.style.setProperty("--test-color", "#ff0000");
    });

    afterEach(() => {
        sessionStorage.clear();
        document.documentElement.style.removeProperty("--test-color");
    });

    describe("handleCSSVariables", () => {
        it("应该返回原始值当不是 CSS 变量时", () => {
            expect(handleCSSVariables("#ff0000")).toBe("#ff0000");
            expect(handleCSSVariables("red")).toBe("red");
            expect(handleCSSVariables("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
        });

        it("应该提取并返回 CSS 变量值", () => {
            const result = handleCSSVariables("var(--test-color)");
            expect(result).toBe("#ff0000");
        });

        it("应该处理不存在的 CSS 变量", () => {
            const result = handleCSSVariables("var(--non-existent)");
            expect(result).toBe("--non-existent"); // getCSSPropertyValue 返回空字符串时返回变量名
        });

        it("应该处理带空格的 CSS 变量", () => {
            document.documentElement.style.setProperty("--test-color-2", "blue");
            const result = handleCSSVariables("var( --test-color-2 )");
            expect(result).toBe("blue");
            document.documentElement.style.removeProperty("--test-color-2");
        });
    });

    describe("setDefaultColorCache", () => {
        it("应该缓存默认颜色", () => {
            const result = setDefaultColorCache("#ff0000", "text");
            expect(result).toBe("#ff0000");
            const cached = sessionStorage.getItem("editor-js-text-color-cache-text");
            expect(cached).toBe('"#ff0000"');
        });

        it("应该为不同的插件类型创建不同的缓存", () => {
            setDefaultColorCache("#ff0000", "text");
            setDefaultColorCache("#00ff00", "marker");
            expect(sessionStorage.getItem("editor-js-text-color-cache-text")).toBe('"#ff0000"');
            expect(sessionStorage.getItem("editor-js-text-color-cache-marker")).toBe('"#00ff00"');
        });
    });

    describe("getDefaultColorCache", () => {
        it("应该返回缓存的颜色", () => {
            setDefaultColorCache("#ff0000", "text");
            const result = getDefaultColorCache("#000000", "text");
            expect(result).toBe("#ff0000");
        });

        it("应该返回默认颜色当缓存不存在时", () => {
            const result = getDefaultColorCache("#000000", "text");
            expect(result).toBe("#000000");
        });
    });

    describe("setCustomColorCache", () => {
        it("应该缓存自定义颜色", () => {
            setCustomColorCache("#ff0000", "text");
            const cached = sessionStorage.getItem("editor-js-text-color-cache-text-custom");
            expect(cached).toBe('"#ff0000"');
        });

        it("应该为不同的插件类型创建不同的缓存", () => {
            setCustomColorCache("#ff0000", "text");
            setCustomColorCache("#00ff00", "marker");
            expect(sessionStorage.getItem("editor-js-text-color-cache-text-custom")).toBe(
                '"#ff0000"'
            );
            expect(sessionStorage.getItem("editor-js-text-color-cache-marker-custom")).toBe(
                '"#00ff00"'
            );
        });
    });

    describe("getCustomColorCache", () => {
        it("应该返回缓存的自定义颜色", () => {
            setCustomColorCache("#ff0000", "text");
            const result = getCustomColorCache("text");
            expect(result).toBe("#ff0000");
        });

        it("应该返回 null 当缓存不存在时", () => {
            const result = getCustomColorCache("text");
            expect(result).toBeNull();
        });
    });

    describe("throttle", () => {
        it("应该节流函数调用", (done) => {
            const fn = vi.fn();
            const throttled = throttle(fn, 100);

            throttled();
            throttled();
            throttled();

            expect(fn).toHaveBeenCalledTimes(0);

            setTimeout(() => {
                expect(fn).toHaveBeenCalledTimes(1);
                done();
            }, 150);
        });

        it("应该传递参数给节流函数", (done) => {
            const fn = vi.fn();
            const throttled = throttle(fn, 100);

            throttled("arg1", "arg2");

            setTimeout(() => {
                expect(fn).toHaveBeenCalledWith("arg1", "arg2");
                done();
            }, 150);
        });

        it("应该允许在延迟后再次调用", (done) => {
            const fn = vi.fn();
            const throttled = throttle(fn, 50);

            throttled();
            setTimeout(() => {
                throttled();
                setTimeout(() => {
                    expect(fn).toHaveBeenCalledTimes(2);
                    done();
                }, 100);
            }, 100);
        });

        it("应该处理 throttle 函数中的 id 清理", (done) => {
            const fn = vi.fn();
            const throttled = throttle(fn, 50);

            throttled("test");
            // 在延迟期间再次调用应该被忽略
            throttled("test2");
            throttled("test3");

            setTimeout(() => {
                expect(fn).toHaveBeenCalledTimes(1);
                expect(fn).toHaveBeenCalledWith("test");
                // id 应该被清理（设置为 null），允许下次调用
                throttled("test4");
                setTimeout(() => {
                    expect(fn).toHaveBeenCalledTimes(2);
                    expect(fn).toHaveBeenCalledWith("test4");
                    done();
                }, 100);
            }, 100);
        });

        it("应该处理 throttle 中 id 为 null 的情况", (done) => {
            const fn = vi.fn();
            const throttled = throttle(fn, 10);

            // 第一次调用
            throttled("first");
            // 等待执行完成，id 应该被设置为 null
            setTimeout(() => {
                // 此时 id 为 null，应该允许新的调用
                throttled("second");
                setTimeout(() => {
                    expect(fn).toHaveBeenCalledTimes(2);
                    expect(fn).toHaveBeenNthCalledWith(1, "first");
                    expect(fn).toHaveBeenNthCalledWith(2, "second");
                    done();
                }, 50);
            }, 50);
        });
    });

    describe("常量", () => {
        it("应该导出 CONVERTER_BTN 常量", () => {
            expect(CONVERTER_BTN).toBe("ce-inline-toolbar__dropdown");
        });

        it("应该导出 CONVERTER_PANEL 常量", () => {
            expect(CONVERTER_PANEL).toBe("ce-conversion-toolbar--showed");
        });
    });
});
