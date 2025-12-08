/**
 * WSX TypeScript 声明文件
 * 支持 JSX 语法和其他 WSX 特性
 */
import { WebComponent, LightComponent } from "../src/index";
// WSX 文件支持 - 将 .wsx 文件视为 TypeScript 模块
// 标准类型声明：支持 WebComponent 和 LightComponent
declare module "*.wsx" {
    // Allow any class that extends WebComponent or LightComponent
    const Component: new (...args: unknown[]) => WebComponent | LightComponent;
    export default Component;
}

// JSX 命名空间
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare namespace JSX {
    interface IntrinsicElements {
        [elemName: string]: Record<string, unknown>;
    }

    type Element = HTMLElement;

    interface ElementClass {
        render(): HTMLElement;
    }

    interface ElementAttributesProperty {
        props: Record<string, unknown>;
    }

    interface ElementChildrenAttribute {
        children: unknown[];
    }
}

// JSX 工厂函数类型
declare function h(
    type: string | ((props: Record<string, unknown> | null, children: unknown[]) => HTMLElement),
    props?: Record<string, unknown> | null,
    ...children: unknown[]
): HTMLElement;

declare const Fragment: (props: Record<string, unknown>, children: unknown[]) => DocumentFragment;

export { h, Fragment };
