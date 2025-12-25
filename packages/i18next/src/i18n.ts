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
    i18next
        .use(Backend)
        .use(LanguageDetector)
        .init({
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
            ...config,
        });

    return i18next;
}

// 导出 i18n 实例（直接导出常量）
export const i18n: typeof i18next = i18next;
