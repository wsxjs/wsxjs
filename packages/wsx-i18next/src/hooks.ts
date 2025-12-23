/**
 * useTranslation 函数（API 与 react-i18next 兼容）
 */

import { i18n } from "./i18n";
import type { UseTranslationResponse } from "./types";

/**
 * useTranslation - API 与 react-i18next 兼容的翻译函数
 *
 * **重要说明**：
 * - 这不是 React hook，而是 WSXJS 的普通函数
 * - API 设计参考 react-i18next，但实现方式完全不同
 * - 在 WSXJS 中，需要配合 @state 或 @i18n 装饰器实现响应式
 * - 不会自动响应语言变化，需要手动订阅 languageChanged 事件
 *
 * @param namespace 命名空间，默认为 'common'
 * @returns 翻译对象
 */
export function useTranslation(namespace: string = "common"): UseTranslationResponse {
    // 创建一个包装函数，保持 API 兼容性
    const t = (key: string, options?: object): string => {
        // 每次调用 t() 时，i18n.t() 会使用当前的 i18n.language
        // 所以只要组件重渲染，就会得到新的翻译
        return i18n.t(key, { ns: namespace, ...options });
    };
    return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        t: t as any,
        i18n,
        ready: i18n.isInitialized,
    };
}
