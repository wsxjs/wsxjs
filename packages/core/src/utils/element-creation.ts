/**
 * Element Creation Utilities
 *
 * Pure functions for creating DOM elements and applying props/children.
 * Extracted from jsx-factory.ts to keep functions small and focused.
 */

import { createElement, shouldUseSVGNamespace, getSVGAttributeName } from "./svg-utils";
import { flattenChildren, type JSXChildren } from "./dom-utils";
import { setSmartProperty, isFrameworkInternalProp } from "./props-utils";

/**
 * Applies a single prop to an element.
 */
function applySingleProp(
    element: HTMLElement | SVGElement,
    key: string,
    value: unknown,
    tag: string,
    isSVG: boolean
): void {
    // 关键修复：不要在这里提前返回 false，因为布尔属性 false 需要特殊处理（移除属性）
    // 只对 null 和 undefined 提前返回
    if (value === null || value === undefined) {
        return;
    }

    // 处理ref回调
    if (key === "ref" && typeof value === "function") {
        value(element);
        return;
    }

    // 处理className和class
    if (key === "className" || key === "class") {
        if (isSVG) {
            element.setAttribute("class", value as string);
        } else {
            (element as HTMLElement).className = value as string;
        }
        return;
    }

    // 处理style
    if (key === "style" && typeof value === "string") {
        element.setAttribute("style", value);
        return;
    }

    // 处理事件监听器
    if (key.startsWith("on") && typeof value === "function") {
        const eventName = key.slice(2).toLowerCase();

        // 关键修复：保存监听器引用，以便后续更新时移除旧的监听器
        const listenerKey = `__wsxListener_${eventName}`;
        element.addEventListener(eventName, value as EventListener);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (element as any)[listenerKey] = value;
        return;
    }

    // 处理布尔属性
    if (typeof value === "boolean") {
        if (value) {
            element.setAttribute(key, "");
            // 对于 input 元素，同时设置 JavaScript 属性
            if (element instanceof HTMLInputElement) {
                if (key === "checked") {
                    element.checked = true;
                } else if (key === "disabled") {
                    element.disabled = true;
                } else if (key === "readonly") {
                    element.readOnly = true; // 注意：JavaScript 属性是 readOnly（驼峰）
                }
            } else if (element instanceof HTMLOptionElement && key === "selected") {
                element.selected = true;
            }
        } else {
            // 关键修复：当布尔属性为 false 时，应该移除属性
            // 这样可以确保元素状态正确更新（例如：radio button 取消选择时移除 checked 属性）
            const attributeName = isSVG ? getSVGAttributeName(key) : key;
            element.removeAttribute(attributeName);
            // 对于 input 元素，同时设置 JavaScript 属性为 false
            if (element instanceof HTMLInputElement) {
                if (key === "checked") {
                    element.checked = false;
                } else if (key === "disabled") {
                    element.disabled = false;
                } else if (key === "readonly") {
                    element.readOnly = false; // 注意：JavaScript 属性是 readOnly（驼峰）
                }
            } else if (element instanceof HTMLOptionElement && key === "selected") {
                element.selected = false;
            }
        }
        return;
    }

    // 特殊处理 input/textarea/select 的 value 属性
    if (key === "value") {
        if (
            element instanceof HTMLInputElement ||
            element instanceof HTMLTextAreaElement ||
            element instanceof HTMLSelectElement
        ) {
            element.value = String(value);
        } else {
            const attributeName = isSVG ? getSVGAttributeName(key) : key;
            element.setAttribute(attributeName, String(value));
        }
        return;
    }

    // 过滤框架内部属性（不应该渲染到 DOM）
    if (isFrameworkInternalProp(key)) {
        return;
    }

    // 处理其他属性 - 使用智能属性设置函数
    setSmartProperty(element, key, value, tag);
}

/**
 * Applies all props to an element.
 */
export function applyPropsToElement(
    element: HTMLElement | SVGElement,
    props: Record<string, unknown> | null,
    tag: string
): void {
    if (!props) {
        return;
    }

    const isSVG = shouldUseSVGNamespace(tag);
    Object.entries(props).forEach(([key, value]) => {
        applySingleProp(element, key, value, tag, isSVG);
    });
}

/**
 * Appends children to an element.
 */
export function appendChildrenToElement(
    element: HTMLElement | SVGElement,
    children: JSXChildren[]
): void {
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
}

/**
 * Creates an element and applies props and children.
 */
export function createElementWithPropsAndChildren(
    tag: string,
    props: Record<string, unknown> | null,
    children: JSXChildren[]
): HTMLElement | SVGElement {
    const element = createElement(tag);
    applyPropsToElement(element, props, tag);
    appendChildrenToElement(element, children);
    return element;
}
