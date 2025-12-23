/**
 * TypeScript 类型定义
 */

import type { TFunction, i18n as I18nType } from "i18next";

/**
 * i18n 配置接口
 */
export interface I18nConfig {
    fallbackLng?: string;
    debug?: boolean;
    resources?: Record<string, Record<string, object>>;
    backend?: {
        loadPath?: string;
    };
    ns?: string[];
    defaultNS?: string;
    interpolation?: {
        escapeValue?: boolean;
    };
}

/**
 * useTranslation 返回类型
 */
export interface UseTranslationResponse {
    t: TFunction;
    i18n: I18nType;
    ready: boolean;
}
