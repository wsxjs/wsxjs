/**
 * WSXJS 类型声明文件
 *
 * 为WSX组件和模块提供TypeScript类型支持
 */

// Import core WSX types
// Types from @wsxjs/wsx-core are available globally

// 图片模块声明
declare module "*.png" {
    const src: string;
    export default src;
}

declare module "*.jpg" {
    const src: string;
    export default src;
}

declare module "*.jpeg" {
    const src: string;
    export default src;
}

declare module "*.svg" {
    const src: string;
    export default src;
}

// CSS module declarations
declare module "*.css" {
    const styles: string;
    export default styles;
}

declare module "*.css?inline" {
    const styles: string;
    export default styles;
}

// WSX component module declarations
// Types from @wsxjs/wsx-core and @testing-library/jest-dom
// are automatically loaded via tsconfig.json types configuration

// 全局类型扩展 - 预留给将来添加全局类型
declare global {
    namespace Vi {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type Assertion<T = any> = jest.Matchers<void, T>;
        type AsymmetricMatchersContaining = jest.Expect;
    }
}

export {};
