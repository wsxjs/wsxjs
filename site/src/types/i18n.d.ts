/**
 * i18n 装饰器类型扩展
 * 为使用 @i18n 装饰器的组件添加 t 方法的类型定义
 */

declare module "@wsxjs/wsx-core" {
    interface WebComponent {
        /**
         * 翻译函数，由 @i18n 装饰器注入
         * @param key 翻译键
         * @param options 翻译选项（插值变量等）
         * @returns 翻译后的字符串
         */
        t(key: string, options?: object): string;
    }

    interface LightComponent {
        /**
         * 翻译函数，由 @i18n 装饰器注入
         * @param key 翻译键
         * @param options 翻译选项（插值变量等）
         * @returns 翻译后的字符串
         */
        t(key: string, options?: object): string;
    }
}

export {};
