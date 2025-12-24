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
import { parseHTMLToNodes } from "./utils/dom-utils";

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
            // 特殊处理 input/textarea/select 的 value 属性
            // 使用 .value 而不是 setAttribute，因为 .value 是当前值，setAttribute 是初始值
            else if (key === "value") {
                if (
                    element instanceof HTMLInputElement ||
                    element instanceof HTMLTextAreaElement ||
                    element instanceof HTMLSelectElement
                ) {
                    element.value = String(value);
                } else {
                    // 对于其他元素，使用 setAttribute
                    const attributeName = isSVG ? getSVGAttributeName(key) : key;
                    element.setAttribute(attributeName, String(value));
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
 * 检测字符串是否包含HTML标签
 * 使用更严格的检测：必须包含完整的 HTML 标签（开始和结束标签，或自闭合标签）
 */
function isHTMLString(str: string): boolean {
    const trimmed = str.trim();
    if (!trimmed) return false;

    // 更严格的检测：必须包含完整的 HTML 标签
    // 1. 必须以 < 开头
    // 2. 后面跟着字母（标签名）
    // 3. 必须包含 > 来闭合标签
    // 4. 排除单独的 < 或 > 符号（如数学表达式 "a < b"）
    const htmlTagPattern = /<[a-z][a-z0-9]*(\s[^>]*)?(\/>|>)/i;

    // 额外检查：确保不是纯文本中的 < 和 >（如 "a < b" 或 "x > y"）
    // 如果字符串看起来像数学表达式或纯文本，不应该被检测为 HTML
    const looksLikeMath = /^[^<]*<[^>]*>[^>]*$/.test(trimmed) && !htmlTagPattern.test(trimmed);
    if (looksLikeMath) return false;

    return htmlTagPattern.test(trimmed);
}

/**
 * 扁平化子元素数组
 * 自动检测HTML字符串并转换为DOM节点
 *
 * @param children - 子元素数组
 * @param skipHTMLDetection - 是否跳过HTML检测（用于已解析的节点，避免无限递归）
 * @param depth - 当前递归深度（防止无限递归，最大深度为 10）
 */
function flattenChildren(
    children: JSXChildren[],
    skipHTMLDetection: boolean = false,
    depth: number = 0
): (string | number | HTMLElement | SVGElement | DocumentFragment | boolean | null | undefined)[] {
    // 防止无限递归：如果深度超过 10，停止处理
    if (depth > 10) {
        console.warn(
            "[WSX] flattenChildren: Maximum depth exceeded, treating remaining children as text"
        );
        return children.filter(
            (child): child is string | number =>
                typeof child === "string" || typeof child === "number"
        );
    }
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
            // 递归处理数组，保持 skipHTMLDetection 状态，增加深度
            result.push(...flattenChildren(child, skipHTMLDetection, depth + 1));
        } else if (typeof child === "string") {
            // 如果跳过HTML检测，直接添加字符串（避免无限递归）
            if (skipHTMLDetection) {
                result.push(child);
            } else if (isHTMLString(child)) {
                // 自动检测HTML字符串并转换为DOM节点
                // 使用 try-catch 防止解析失败导致崩溃
                try {
                    const nodes = parseHTMLToNodes(child);
                    // 递归处理转换后的节点数组，标记为已解析，避免再次检测HTML
                    // parseHTMLToNodes 返回的字符串是纯文本节点，不应该再次被检测为HTML
                    // 但是为了安全，我们仍然设置 skipHTMLDetection = true
                    if (nodes.length > 0) {
                        // 直接添加解析后的节点，不再递归处理（避免无限递归）
                        // parseHTMLToNodes 已经完成了所有解析工作
                        for (const node of nodes) {
                            if (typeof node === "string") {
                                // 文本节点直接添加，不再检测 HTML（已解析）
                                result.push(node);
                            } else {
                                // DOM 元素直接添加
                                result.push(node);
                            }
                        }
                    } else {
                        // 如果解析失败，回退到纯文本
                        result.push(child);
                    }
                } catch (error) {
                    // 如果解析失败，回退到纯文本，避免崩溃
                    console.warn("[WSX] Failed to parse HTML string, treating as text:", error);
                    result.push(child);
                }
            } else {
                result.push(child);
            }
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
