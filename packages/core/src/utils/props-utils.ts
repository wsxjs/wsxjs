/**
 * Props Utilities
 *
 * Pure functions for handling element properties and attributes (RFC 0037).
 * These functions implement the HTML First strategy for property setting.
 */

import { getSVGAttributeName, shouldUseSVGNamespace } from "./svg-utils";
import { createLogger } from "./logger";
const logger = createLogger("Props Utilities");

/**
 * 检查是否是 HTML 标准属性
 * HTML First 策略的核心：优先识别标准属性
 *
 * @param key - 属性名
 * @returns 是否是标准 HTML 属性
 */
export function isStandardHTMLAttribute(key: string): boolean {
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
export function isSpecialProperty(key: string, value: unknown): boolean {
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
 * @param tag - HTML 标签名（用于判断是否是 SVG）
 */
export function setSmartProperty(
    element: HTMLElement | SVGElement,
    key: string,
    value: unknown,
    tag: string
): void {
    const isSVG = shouldUseSVGNamespace(tag);

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
                    logger.warn(
                        `[WSX] Attribute "${key}" value too large, ` +
                            `consider using a non-standard property name instead`
                    );
                }
                element.setAttribute(attributeName, serialized);
            } catch (error) {
                // 无法序列化（如循环引用），警告并跳过
                logger.warn(`Cannot serialize attribute "${key}":`, error);
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
                logger.warn(`Cannot serialize SVG attribute "${key}":`, error);
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
                    logger.warn(`Cannot serialize readonly property "${key}":`, error);
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
                        logger.warn(
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
                    logger.warn(
                        `[WSX] Property "${key}" value too large for attribute, ` +
                            `consider using a JavaScript property instead`
                    );
                }
                element.setAttribute(attributeName, serialized);
            } catch (error) {
                // 无法序列化，警告并跳过
                logger.warn(`Cannot serialize property "${key}" for attribute:`, error);
            }
        } else {
            element.setAttribute(attributeName, String(value));
        }
    }
}
