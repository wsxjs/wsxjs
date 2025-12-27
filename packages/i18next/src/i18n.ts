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
    // 手动从 localStorage 读取语言，优先级高于浏览器检测
    const savedLanguage =
        typeof window !== "undefined" ? localStorage.getItem("wsx-language") : null;

    // 合并配置，如果有 savedLanguage 则使用它作为初始语言
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
        // 如果有保存的语言，直接设置为初始语言
        lng: savedLanguage || undefined,
        // 配置 LanguageDetector 的检测顺序
        detection: {
            order: ["localStorage", "navigator"],
            caches: ["localStorage"],
            lookupLocalStorage: "wsx-language",
        },
        ...config,
    };

    i18next.use(Backend).use(LanguageDetector).init(finalConfig);

    return i18next;
}

// 导出 i18n 实例（直接导出常量）
export const i18n: typeof i18next = i18next;
