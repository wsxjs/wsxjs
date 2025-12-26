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

/**
 * 检查是否是 HTML 标准属性
 * HTML First 策略的核心：优先识别标准属性
 *
 * @param key - 属性名
 * @returns 是否是标准 HTML 属性
 */
function isStandardHTMLAttribute(key: string): boolean {
    // 标准 HTML 属性集合（常见属性）
    const standardAttributes = new Set([
        // 全局属性
        "id",
        "class",
        "className",
        "style",
        "title",
        "lang",
        "dir",
        "hidden",
        "tabindex",
        "accesskey",
        "contenteditable",
        "draggable",
        "spellcheck",
        "translate",
        "autocapitalize",
        "autocorrect",
        // 表单属性
        "name",
        "value",
        "type",
        "placeholder",
        "required",
        "disabled",
        "readonly",
        "checked",
        "selected",
        "multiple",
        "min",
        "max",
        "step",
        "autocomplete",
        "autofocus",
        "form",
        "formaction",
        "formenctype",
        "formmethod",
        "formnovalidate",
        "formtarget",
        // 链接属性
        "href",
        "target",
        "rel",
        "download",
        "hreflang",
        "ping",
        // 媒体属性
        "src",
        "alt",
        "width",
        "height",
        "poster",
        "preload",
        "controls",
        "autoplay",
        "loop",
        "muted",
        "playsinline",
        "crossorigin",
        // ARIA 属性（部分常见）
        "role",
    ]);

    const lowerKey = key.toLowerCase();

    // 检查是否是标准属性
    if (standardAttributes.has(lowerKey)) {
        return true;
    }

    // 检查是否是 data-* 属性（必须使用连字符）
    // 注意：单独的 "data" 不是标准属性，不在这个列表中
    // data 可以检查 JavaScript 属性，data-* 只使用 setAttribute
    if (lowerKey.startsWith("data-")) {
        return true; // 标准属性，只使用 setAttribute，不检查对象属性
    }

    // 检查是否是 aria-* 属性
    if (lowerKey.startsWith("aria-")) {
        return true;
    }

    // 检查是否是 SVG 命名空间属性
    if (key.startsWith("xml:") || key.startsWith("xlink:")) {
        return true;
    }

    return false;
}

/**
 * 检查是否是特殊属性（已有专门处理逻辑的属性）
 * 这些属性不应该进入通用属性处理流程
 */
function isSpecialProperty(key: string, value: unknown): boolean {
    return (
        key === "ref" ||
        key === "className" ||
        key === "class" ||
        key === "style" ||
        (key.startsWith("on") && typeof value === "function") ||
        typeof value === "boolean" ||
        key === "value"
    );
}

/**
 * 智能属性设置函数
 * HTML First 策略：优先使用 HTML 属性，避免与标准属性冲突
 *
 * @param element - DOM 元素
 * @param key - 属性名
 * @param value - 属性值
 * @param isSVG - 是否是 SVG 元素
 */
function setSmartProperty(
    element: HTMLElement | SVGElement,
    key: string,
    value: unknown,
    isSVG: boolean = false
): void {
    // 1. 检查是否是特殊属性（已有处理逻辑的属性）
    if (isSpecialProperty(key, value)) {
        return; // 由现有逻辑处理
    }

    // 2. HTML First: 优先检查是否是 HTML 标准属性
    if (isStandardHTMLAttribute(key)) {
        // 标准 HTML 属性：直接使用 setAttribute，不检查 JavaScript 属性
        const attributeName = isSVG ? getSVGAttributeName(key) : key;

        // 对于复杂类型，尝试序列化
        if (typeof value === "object" && value !== null) {
            try {
                const serialized = JSON.stringify(value);
                // 检查长度限制（保守估计 1MB）
                if (serialized.length > 1024 * 1024) {
                    console.warn(
                        `[WSX] Attribute "${key}" value too large, ` +
                            `consider using a non-standard property name instead`
                    );
                }
                element.setAttribute(attributeName, serialized);
            } catch (error) {
                // 无法序列化（如循环引用），警告并跳过
                console.warn(`[WSX] Cannot serialize attribute "${key}":`, error);
            }
        } else {
            element.setAttribute(attributeName, String(value));
        }
        // 重要：标准属性只使用 setAttribute，不使用 JavaScript 属性
        return;
    }

    // 3. SVG 元素特殊处理：对于 SVG 元素，很多属性应该直接使用 setAttribute
    // 因为 SVG 元素的很多属性是只读的（如 viewBox）
    if (element instanceof SVGElement) {
        const attributeName = getSVGAttributeName(key);
        // 对于复杂类型，尝试序列化
        if (typeof value === "object" && value !== null) {
            try {
                const serialized = JSON.stringify(value);
                element.setAttribute(attributeName, serialized);
            } catch (error) {
                console.warn(`[WSX] Cannot serialize SVG attribute "${key}":`, error);
            }
        } else {
            element.setAttribute(attributeName, String(value));
        }
        return;
    }

    // 4. 非标准属性：检查元素是否有该 JavaScript 属性
    const hasProperty = key in element || Object.prototype.hasOwnProperty.call(element, key);

    if (hasProperty) {
        // 检查是否是只读属性
        let isReadOnly = false;
        try {
            const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), key);
            if (descriptor) {
                isReadOnly =
                    (descriptor.get !== undefined && descriptor.set === undefined) ||
                    (descriptor.writable === false && descriptor.set === undefined);
            }
        } catch {
            // 忽略错误，继续尝试设置
        }

        if (isReadOnly) {
            // 只读属性使用 setAttribute
            const attributeName = isSVG ? getSVGAttributeName(key) : key;
            // 对于复杂类型，尝试序列化
            if (typeof value === "object" && value !== null) {
                try {
                    const serialized = JSON.stringify(value);
                    element.setAttribute(attributeName, serialized);
                } catch (error) {
                    console.warn(`[WSX] Cannot serialize readonly property "${key}":`, error);
                }
            } else {
                element.setAttribute(attributeName, String(value));
            }
        } else {
            // 使用 JavaScript 属性赋值（支持任意类型）
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (element as any)[key] = value;
            } catch {
                // 如果赋值失败，回退到 setAttribute
                const attributeName = isSVG ? getSVGAttributeName(key) : key;
                // 对于复杂类型，尝试序列化
                if (typeof value === "object" && value !== null) {
                    try {
                        const serialized = JSON.stringify(value);
                        element.setAttribute(attributeName, serialized);
                    } catch (error) {
                        console.warn(
                            `[WSX] Cannot serialize property "${key}" for attribute:`,
                            error
                        );
                    }
                } else {
                    element.setAttribute(attributeName, String(value));
                }
            }
        }
    } else {
        // 没有 JavaScript 属性，使用 setAttribute
        const attributeName = isSVG ? getSVGAttributeName(key) : key;

        // 对于复杂类型，尝试序列化
        if (typeof value === "object" && value !== null) {
            try {
                const serialized = JSON.stringify(value);
                // 检查长度限制
                if (serialized.length > 1024 * 1024) {
                    console.warn(
                        `[WSX] Property "${key}" value too large for attribute, ` +
                            `consider using a JavaScript property instead`
                    );
                }
                element.setAttribute(attributeName, serialized);
            } catch (error) {
                // 无法序列化，警告并跳过
                console.warn(`[WSX] Cannot serialize property "${key}" for attribute:`, error);
            }
        } else {
            element.setAttribute(attributeName, String(value));
        }
    }
}

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
            // 处理其他属性 - 使用智能属性设置函数
            else {
                setSmartProperty(element, key, value, isSVG);
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
