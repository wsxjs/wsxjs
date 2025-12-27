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
    // 关键修复：手动从 localStorage 读取语言，优先级高于浏览器检测
    // 这确保了即使 LanguageDetector 失败，也能正确加载保存的语言
    const savedLanguage =
        typeof window !== "undefined" ? localStorage.getItem("wsx-language") : null;

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
        // 关键修复：如果有 savedLanguage，强制使用它（优先级最高）
        // 如果没有，让 LanguageDetector 决定（会先检查 localStorage，再检查 navigator）
        ...(savedLanguage ? { lng: savedLanguage } : {}),
        // 配置 LanguageDetector 的检测顺序（仅在没有显式 lng 时生效）
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
