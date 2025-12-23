/**
 * Mixin API - 为基类添加 i18n 支持
 */

import { i18n } from "./i18n";
import type { WebComponent, LightComponent } from "@wsxjs/wsx-core";

/**
 * 为任何继承自 WebComponent 或 LightComponent 的类添加 i18n 支持
 *
 * 使用方式：
 * ```tsx
 * export class MyComponent extends withI18n(WebComponent, 'common') {
 *     render() {
 *         return <div>{this.t('welcome')}</div>;
 *     }
 * }
 *
 * export class MyLightComponent extends withI18n(LightComponent, 'common') {
 *     render() {
 *         return <div>{this.t('welcome')}</div>;
 *     }
 * }
 * ```
 *
 * @param Base 基类（WebComponent 或 LightComponent）
 * @param defaultNamespace 默认命名空间
 * @returns 增强后的类
 */
export function withI18n<T extends typeof WebComponent | typeof LightComponent>(
    Base: T,
    defaultNamespace: string = "common"
): T {
    return class extends Base {
        protected t(key: string, namespace?: string, options?: object): string {
            return i18n.t(key, { ns: namespace || defaultNamespace, ...options });
        }

        protected get i18n() {
            return i18n;
        }

        protected onConnected(): void {
            // 订阅语言变化事件，自动触发重渲染
            i18n.on("languageChanged", () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((this as any).rerender) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (this as any).rerender();
                }
            });
        }
    } as T;
}
