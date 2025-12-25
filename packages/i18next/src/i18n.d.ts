/**
 * @wsxjs/wsx-i18next 类型声明
 *
 * 为使用 @i18n 装饰器的组件扩展类型定义
 * 这个文件会被包含在包的 dist 目录中，供其他项目使用
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

        /**
         * i18n 实例，由 @i18n 装饰器注入
         */
        readonly i18n: import("i18next").i18n;
    }

    interface LightComponent {
        /**
         * 翻译函数，由 @i18n 装饰器注入
         * @param key 翻译键
         * @param options 翻译选项（插值变量等）
         * @returns 翻译后的字符串
         */
        t(key: string, options?: object): string;

        /**
         * i18n 实例，由 @i18n 装饰器注入
         */
        readonly i18n: import("i18next").i18n;
    }
}

export {};
