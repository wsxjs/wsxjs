/**
 * i18n.ts 测试 - 100% 覆盖率
 */

import { initI18n, i18n } from "../i18n";
import type { I18nConfig } from "../types";

// Mock i18next
jest.mock("i18next", () => {
    const mockI18n = {
        use: jest.fn().mockReturnThis(),
        init: jest.fn().mockReturnThis(),
        language: "en",
        isInitialized: true,
        t: jest.fn((key: string) => key),
        on: jest.fn(),
        off: jest.fn(),
        changeLanguage: jest.fn(),
    };
    return {
        __esModule: true,
        default: mockI18n,
    };
});

// Mock plugins
jest.mock("i18next-browser-languagedetector", () => {
    return jest.fn();
});

jest.mock("i18next-http-backend", () => {
    return jest.fn();
});

describe("i18n.ts", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("initI18n", () => {
        test("应该使用默认配置初始化 i18n", () => {
            const result = initI18n();

            expect(result).toBe(i18n);
            expect(i18n.use).toHaveBeenCalledTimes(2); // Backend 和 LanguageDetector
            expect(i18n.init).toHaveBeenCalledWith(
                expect.objectContaining({
                    fallbackLng: "en",
                    debug: false,
                    interpolation: {
                        escapeValue: false,
                    },
                    backend: {
                        loadPath: "/locales/{{lng}}/{{ns}}.json",
                    },
                    ns: ["common", "home", "docs", "examples"],
                    defaultNS: "common",
                })
            );
        });

        test("应该合并自定义配置", () => {
            const customConfig: I18nConfig = {
                fallbackLng: "zh",
                debug: true,
                defaultNS: "custom",
            };

            initI18n(customConfig);

            expect(i18n.init).toHaveBeenCalledWith(
                expect.objectContaining({
                    fallbackLng: "zh",
                    debug: true,
                    defaultNS: "custom",
                    interpolation: {
                        escapeValue: false,
                    },
                })
            );
        });

        test("应该支持自定义 resources", () => {
            const config: I18nConfig = {
                resources: {
                    en: {
                        common: { hello: "Hello" },
                    },
                },
            };

            initI18n(config);

            expect(i18n.init).toHaveBeenCalledWith(
                expect.objectContaining({
                    resources: config.resources,
                })
            );
        });

        test("应该支持自定义 backend 配置", () => {
            const config: I18nConfig = {
                backend: {
                    loadPath: "/custom/{{lng}}/{{ns}}.json",
                },
            };

            initI18n(config);

            expect(i18n.init).toHaveBeenCalledWith(
                expect.objectContaining({
                    backend: {
                        loadPath: "/custom/{{lng}}/{{ns}}.json",
                    },
                })
            );
        });

        test("应该支持自定义命名空间", () => {
            const config: I18nConfig = {
                ns: ["custom1", "custom2"],
            };

            initI18n(config);

            expect(i18n.init).toHaveBeenCalledWith(
                expect.objectContaining({
                    ns: ["custom1", "custom2"],
                })
            );
        });

        test("应该支持自定义 interpolation 配置", () => {
            const config: I18nConfig = {
                interpolation: {
                    escapeValue: true,
                },
            };

            initI18n(config);

            expect(i18n.init).toHaveBeenCalledWith(
                expect.objectContaining({
                    interpolation: {
                        escapeValue: true,
                    },
                })
            );
        });

        test("空配置应该使用默认值", () => {
            initI18n({});

            expect(i18n.init).toHaveBeenCalledWith(
                expect.objectContaining({
                    fallbackLng: "en",
                    debug: false,
                })
            );
        });
    });

    describe("i18n 导出", () => {
        test("应该导出 i18n 实例", () => {
            expect(i18n).toBeDefined();
            expect(i18n).toHaveProperty("t");
            expect(i18n).toHaveProperty("on");
        });
    });
});
