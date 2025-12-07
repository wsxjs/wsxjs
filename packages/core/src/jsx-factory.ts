/**
 * 纯原生JSX工厂 - 零依赖的EditorJS Web Component支持
 *
 * 特点：
 * - 完全独立，不依赖React或任何框架
 * - 支持标准JSX语法
 * - 原生DOM操作，性能优异
 * - 完全通用，适用于任何Web Components
 * - TypeScript类型安全
 */

// JSX 类型声明已移至 types/wsx-types.d.ts

import { createElement, shouldUseSVGNamespace, getSVGAttributeName } from "./utils/svg-utils";

// JSX子元素类型
export type JSXChildren =
    | string
    | number
    | HTMLElement
    | SVGElement
    | DocumentFragment
    | JSXChildren[]
    | null
    | undefined
    | boolean;

/**
 * 纯原生JSX工厂函数
 *
 * @param tag - HTML标签名或组件函数
 * @param props - 属性对象
 * @param children - 子元素
 * @returns DOM元素
 */
export function h(
    tag:
        | string
        | ((
              props: Record<string, unknown> | null,
              children: JSXChildren[]
          ) => HTMLElement | SVGElement),
    props: Record<string, unknown> | null = {},
    ...children: JSXChildren[]
): HTMLElement | SVGElement {
    // 处理组件函数
    if (typeof tag === "function") {
        return tag(props, children);
    }

    // 创建DOM元素 - 自动检测SVG命名空间
    const element = createElement(tag);

    // 处理属性
    if (props) {
        const isSVG = shouldUseSVGNamespace(tag);

        Object.entries(props).forEach(([key, value]) => {
            if (value === null || value === undefined || value === false) {
                return;
            }

            // 处理ref回调
            if (key === "ref" && typeof value === "function") {
                value(element);
            }
            // 处理className和class
            else if (key === "className" || key === "class") {
                if (isSVG) {
                    // SVG元素使用class属性
                    element.setAttribute("class", value as string);
                } else {
                    // HTML元素可以使用className
                    (element as HTMLElement).className = value as string;
                }
            }
            // 处理style
            else if (key === "style" && typeof value === "string") {
                element.setAttribute("style", value);
            }
            // 处理事件监听器
            else if (key.startsWith("on") && typeof value === "function") {
                const eventName = key.slice(2).toLowerCase();
                element.addEventListener(eventName, value as EventListener);
            }
            // 处理布尔属性
            else if (typeof value === "boolean") {
                if (value) {
                    element.setAttribute(key, "");
                }
            }
            // 处理其他属性
            else {
                // 对SVG元素使用正确的属性名
                const attributeName = isSVG ? getSVGAttributeName(key) : key;
                element.setAttribute(attributeName, String(value));
            }
        });
    }

    // 处理子元素
    const flatChildren = flattenChildren(children);
    flatChildren.forEach((child) => {
        if (child === null || child === undefined || child === false) {
            return;
        }

        if (typeof child === "string" || typeof child === "number") {
            element.appendChild(document.createTextNode(String(child)));
        } else if (child instanceof HTMLElement || child instanceof SVGElement) {
            element.appendChild(child);
        } else if (child instanceof DocumentFragment) {
            element.appendChild(child);
        }
    });

    return element;
}

/**
 * 扁平化子元素数组
 */
function flattenChildren(
    children: JSXChildren[]
): (string | number | HTMLElement | SVGElement | DocumentFragment | boolean | null | undefined)[] {
    const result: (
        | string
        | number
        | HTMLElement
        | SVGElement
        | DocumentFragment
        | boolean
        | null
        | undefined
    )[] = [];

    for (const child of children) {
        if (child === null || child === undefined || child === false) {
            continue;
        } else if (Array.isArray(child)) {
            result.push(...flattenChildren(child));
        } else {
            result.push(child);
        }
    }

    return result;
}

/**
 * JSX Fragment支持 - 用于包装多个子元素
 */
export function Fragment(_props: unknown, children: JSXChildren[]): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const flatChildren = flattenChildren(children);

    flatChildren.forEach((child) => {
        if (child === null || child === undefined || child === false) {
            return;
        }

        if (typeof child === "string" || typeof child === "number") {
            fragment.appendChild(document.createTextNode(String(child)));
        } else if (child instanceof HTMLElement || child instanceof SVGElement) {
            fragment.appendChild(child);
        } else if (child instanceof DocumentFragment) {
            fragment.appendChild(child);
        }
    });

    return fragment;
}

/**
 * JSX function for React's new JSX transform
 * Handles the new format: jsx(tag, { children: child, ...props })
 */
export function jsx(
    tag:
        | string
        | ((
              props: Record<string, unknown> | null,
              children: JSXChildren[]
          ) => HTMLElement | SVGElement),
    props: Record<string, unknown> | null
): HTMLElement | SVGElement {
    if (!props) {
        return h(tag, null);
    }

    const { children, ...restProps } = props;
    if (children !== undefined && children !== null) {
        const childrenArray = Array.isArray(children) ? children : [children];
        return h(tag, restProps, ...childrenArray);
    }
    return h(tag, restProps);
}

/**
 * JSX function for multiple children in React's new JSX transform
 * Handles the new format: jsxs(tag, { children: [child1, child2], ...props })
 */
export function jsxs(
    tag:
        | string
        | ((
              props: Record<string, unknown> | null,
              children: JSXChildren[]
          ) => HTMLElement | SVGElement),
    props: Record<string, unknown> | null
): HTMLElement | SVGElement {
    if (!props) {
        return h(tag, null);
    }

    const { children, ...restProps } = props;
    if (Array.isArray(children)) {
        return h(tag, restProps, ...children);
    } else if (children !== undefined && children !== null) {
        return h(tag, restProps, children as JSXChildren);
    }
    return h(tag, restProps);
}
