/**
 * @wsxjs/wsx-i18next - i18next integration for WSXJS components
 *
 * 为 WSXJS 组件提供 i18next 国际化支持
 */

// 导出 i18n 实例和初始化函数
import { initI18n } from "./i18n";
import i18next from "i18next";
export { i18next as i18nInstance, initI18n };

// 导出装饰器（使用 i18n 作为装饰器名称，方便使用）
import { i18nDecorator } from "./decorator";
export { i18nDecorator as i18n, i18nDecorator };

// 导出 hooks
export { useTranslation } from "./hooks";

// 导出 mixin
export { withI18n } from "./mixin";

// 导出类型
export type { I18nConfig, UseTranslationResponse } from "./types";
