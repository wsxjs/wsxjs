/**
 * hooks.ts 测试 - 100% 覆盖率
 */

import { useTranslation } from "../hooks";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { i18n } from "../i18n";

// Mock i18n
jest.mock("../i18n", () => {
    const mockI18n = {
        language: "en",
        isInitialized: true,
        t: jest.fn((key: string, options?: any) => {
            if (options?.ns) {
                return `${options.ns}:${key}`;
            }
            return key;
        }),
    };
    return {
        i18n: mockI18n,
    };
});

describe("hooks.ts", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("useTranslation", () => {
        test("应该返回正确的翻译对象", () => {
            const result = useTranslation();

            expect(result).toHaveProperty("t");
            expect(result).toHaveProperty("i18n");
            expect(result).toHaveProperty("ready");
            expect(result.i18n).toBe(i18n);
            expect(result.ready).toBe(true);
        });

        test("应该使用默认命名空间 'common'", () => {
            const result = useTranslation();
            const translated = result.t("hello");

            expect(i18n.t).toHaveBeenCalledWith("hello", { ns: "common" });
            expect(translated).toBe("common:hello");
        });

        test("应该使用指定的命名空间", () => {
            const result = useTranslation("home");
            const translated = result.t("title");

            expect(i18n.t).toHaveBeenCalledWith("title", { ns: "home" });
            expect(translated).toBe("home:title");
        });

        test("应该传递额外的选项给 i18n.t", () => {
            const result = useTranslation("common");
            const options = { count: 5 };
            result.t("items", options);

            expect(i18n.t).toHaveBeenCalledWith("items", {
                ns: "common",
                count: 5,
            });
        });

        test("应该返回 i18n 实例", () => {
            const result = useTranslation();

            expect(result.i18n).toBe(i18n);
        });

        test("应该返回正确的 ready 状态", () => {
            (i18n as any).isInitialized = false;
            const result = useTranslation();

            expect(result.ready).toBe(false);

            (i18n as any).isInitialized = true;
            const result2 = useTranslation();

            expect(result2.ready).toBe(true);
        });

        test("应该处理空字符串命名空间", () => {
            const result = useTranslation("");
            result.t("key");

            expect(i18n.t).toHaveBeenCalledWith("key", { ns: "" });
        });

        test("应该处理多个连续调用", () => {
            const result = useTranslation("test");
            result.t("key1");
            result.t("key2", { value: "test" });

            expect(i18n.t).toHaveBeenCalledTimes(2);
            expect(i18n.t).toHaveBeenNthCalledWith(1, "key1", { ns: "test" });
            expect(i18n.t).toHaveBeenNthCalledWith(2, "key2", {
                ns: "test",
                value: "test",
            });
        });
    });
});
