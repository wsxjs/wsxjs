/**
 * i18next 配置和初始化
 */

import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";
import type { I18nConfig } from "./types";

/**
 * 初始化 i18next
 * @param config 配置选项
 * @returns i18n 实例
 */
export function initI18n(config: I18nConfig = {}): typeof i18next {
    // 合并配置
    const finalConfig = {
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
        // 配置 LanguageDetector 的检测顺序
        // LanguageDetector 会自动从 localStorage 读取（使用 lookupLocalStorage 指定的键）
        // 然后回退到浏览器语言检测
        detection: {
            order: ["localStorage", "navigator"],
            caches: ["localStorage"],
            lookupLocalStorage: "wsx-language",
        },
        ...config,
    };

    // 初始化 i18next
    i18next.use(Backend).use(LanguageDetector).init(finalConfig);

    return i18next;
}

// 导出 i18n 实例（直接导出常量）
export const i18n: typeof i18next = i18next;
