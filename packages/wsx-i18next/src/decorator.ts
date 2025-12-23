/**
 * @i18n 装饰器 - 自动为组件注入翻译功能
 */

import { i18n } from "./i18n";

/**
 * @i18n 装饰器 - 自动为组件注入翻译功能
 *
 * 使用方式：
 * ```tsx
 * @i18n('common')
 * export class MyComponent extends WebComponent {
 *     render() {
 *         return <div>{this.t('welcome')}</div>;
 *     }
 * }
 * ```
 *
 * @param namespace 命名空间，默认为 'common'
 * @returns 类装饰器
 */
export function i18nDecorator(namespace: string = "common") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function <T extends { new (...args: any[]): any }>(constructor: T) {
        class I18nEnhanced extends constructor {
            // 使用 public 而不是 private，因为导出的匿名类类型限制
            public _i18nNamespace!: string;
            public _i18nUnsubscribe?: () => void;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            constructor(...args: any[]) {
                super(...args);
                // 初始化命名空间
                this._i18nNamespace = namespace;
            }

            // 注入 t 方法
            public t(key: string, options?: object): string {
                return i18n.t(key, { ns: this._i18nNamespace, ...options });
            }

            // 注入 i18n 实例
            public get i18n() {
                return i18n;
            }

            // 生命周期：组件连接时订阅语言变化
            public onConnected(): void {
                // 创建回调函数并保存引用，以便后续取消订阅

                const handler = (() => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    if ((this as any).rerender) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (this as any).rerender();
                    }
                }) as () => void;

                // 保存回调引用以便取消订阅
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (this as any)._languageChangedHandler = handler;

                // 订阅语言变化事件
                const unsubscribe = i18n.on("languageChanged", handler);

                // 如果返回的是函数，直接使用；否则使用 off 方法
                if (typeof unsubscribe === "function") {
                    this._i18nUnsubscribe = unsubscribe;
                } else {
                    // 如果 i18n.on 返回的不是函数，创建一个取消订阅函数
                    // 使用 off 方法（如果可用）或空函数
                    this._i18nUnsubscribe = () => {
                        if (typeof i18n.off === "function") {
                            i18n.off("languageChanged", handler);
                        }
                    };
                }
            }

            // 生命周期：组件断开时取消订阅
            public onDisconnected(): void {
                // 取消 i18n 订阅
                if (this._i18nUnsubscribe && typeof this._i18nUnsubscribe === "function") {
                    try {
                        this._i18nUnsubscribe();
                    } catch {
                        // 如果 unsubscribe 调用失败，尝试使用 off 方法（如果可用）
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const handler = (this as any)._languageChangedHandler;
                        if (handler && typeof i18n.off === "function") {
                            i18n.off("languageChanged", handler);
                        }
                    }
                    this._i18nUnsubscribe = undefined;
                } else {
                    // 如果 unsubscribe 不是函数，尝试使用 off 方法（如果可用）
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const handler = (this as any)._languageChangedHandler;
                    if (handler && typeof i18n.off === "function") {
                        i18n.off("languageChanged", handler);
                    }
                }
                // 清理回调引用
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((this as any)._languageChangedHandler) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    delete (this as any)._languageChangedHandler;
                }
            }
        }
        // 复制静态属性和方法
        Object.setPrototypeOf(I18nEnhanced, constructor);
        Object.defineProperty(I18nEnhanced, "name", {
            value: constructor.name,
            writable: false,
        });
        return I18nEnhanced as T;
    };
}
