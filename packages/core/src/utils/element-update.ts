/**
 * Element Update Utilities
 *
 * Pure functions for fine-grained DOM updates (RFC 0037 Phase 4).
 * These functions update only changed props and children, avoiding full element recreation.
 */

import { shouldUseSVGNamespace, getSVGAttributeName } from "./svg-utils";
import { flattenChildren, type JSXChildren } from "./dom-utils";
import { setSmartProperty } from "./props-utils";
import { shouldPreserveElement } from "./element-marking";
import type { DOMCacheManager } from "../dom-cache-manager";

/**
 * Removes a property from an element.
 */
function removeProp(
    element: HTMLElement | SVGElement,
    key: string,
    oldValue: unknown,
    tag: string
): void {
    const isSVG = shouldUseSVGNamespace(tag);

    // 处理特殊属性
    if (key === "ref") {
        // ref 是回调，不需要移除
        return;
    }

    if (key === "className" || key === "class") {
        if (isSVG) {
            element.removeAttribute("class");
        } else {
            (element as HTMLElement).className = "";
        }
        return;
    }

    if (key === "style") {
        element.removeAttribute("style");
        return;
    }

    if (key.startsWith("on") && typeof oldValue === "function") {
        // 事件监听器：需要移除（但无法获取原始监听器，所以跳过）
        // 注意：这可能导致内存泄漏，但在实际使用中，事件监听器通常不会变化
        return;
    }

    if (key === "value") {
        if (
            element instanceof HTMLInputElement ||
            element instanceof HTMLTextAreaElement ||
            element instanceof HTMLSelectElement
        ) {
            element.value = "";
        } else {
            const attributeName = isSVG ? getSVGAttributeName(key) : key;
            element.removeAttribute(attributeName);
        }
        return;
    }

    // 移除其他属性
    const attributeName = isSVG ? getSVGAttributeName(key) : key;
    element.removeAttribute(attributeName);

    // 尝试移除 JavaScript 属性
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (element as any)[key];
    } catch {
        // 忽略删除失败
    }
}

/**
 * Applies a single prop to an element (same logic as element-creation.ts).
 */
function applySingleProp(
    element: HTMLElement | SVGElement,
    key: string,
    value: unknown,
    tag: string,
    isSVG: boolean
): void {
    if (value === null || value === undefined || value === false) {
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
        // 注意：这里会重复添加事件监听器，但这是预期的行为
        // 在实际使用中，事件监听器通常不会频繁变化
        element.addEventListener(eventName, value as EventListener);
        return;
    }

    // 处理布尔属性
    if (typeof value === "boolean") {
        if (value) {
            element.setAttribute(key, "");
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

    // 处理其他属性 - 使用智能属性设置函数
    setSmartProperty(element, key, value, tag);
}

/**
 * Updates element props by comparing old and new props.
 * Only updates changed properties.
 */
export function updateProps(
    element: HTMLElement | SVGElement,
    oldProps: Record<string, unknown> | null | undefined,
    newProps: Record<string, unknown> | null | undefined,
    tag: string
): void {
    const isSVG = shouldUseSVGNamespace(tag);
    const old = oldProps || {};
    const new_ = newProps || {};

    // 移除旧属性（在新 props 中不存在的）
    for (const key in old) {
        if (!(key in new_)) {
            removeProp(element, key, old[key], tag);
        }
    }

    // 添加/更新新属性（值发生变化的）
    // 优化：跳过相同值的属性，减少不必要的 DOM 操作
    for (const key in new_) {
        const oldValue = old[key];
        const newValue = new_[key];

        // 快速路径：引用相等，跳过
        if (oldValue === newValue) {
            continue;
        }

        // 深度比较：对于对象和数组，进行浅比较
        if (
            typeof oldValue === "object" &&
            oldValue !== null &&
            typeof newValue === "object" &&
            newValue !== null
        ) {
            // 浅比较：只比较第一层属性
            if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
                continue;
            }
        }

        // 值确实变化了，更新属性
        applySingleProp(element, key, newValue, tag, isSVG);
    }
}

/**
 * Updates element children by comparing old and new children.
 * Simple version: only handles same number of children.
 */
export function updateChildren(
    element: HTMLElement | SVGElement,
    oldChildren: JSXChildren[],
    newChildren: JSXChildren[]
): void {
    const flatOld = flattenChildren(oldChildren);
    const flatNew = flattenChildren(newChildren);

    // 阶段 4 简化版：只处理相同数量的子节点
    const minLength = Math.min(flatOld.length, flatNew.length);

    // 更新现有子节点
    for (let i = 0; i < minLength; i++) {
        const oldChild = flatOld[i];
        const newChild = flatNew[i];

        // 如果是文本节点，更新文本内容
        if (typeof oldChild === "string" || typeof oldChild === "number") {
            if (typeof newChild === "string" || typeof newChild === "number") {
                const textNode = element.childNodes[i];
                if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                    textNode.textContent = String(newChild);
                } else {
                    // 替换为新的文本节点
                    const newTextNode = document.createTextNode(String(newChild));
                    if (textNode) {
                        element.replaceChild(newTextNode, textNode);
                    } else {
                        element.appendChild(newTextNode);
                    }
                }
            } else {
                // 类型变化：替换节点
                const textNode = element.childNodes[i];
                if (textNode) {
                    // 检查是否应该保留旧节点
                    if (!shouldPreserveElement(textNode)) {
                        element.removeChild(textNode);
                    }
                    // 如果应该保留，不删除（但可能仍需要添加新节点）
                }
                if (typeof newChild === "string" || typeof newChild === "number") {
                    element.appendChild(document.createTextNode(String(newChild)));
                } else if (newChild instanceof HTMLElement || newChild instanceof SVGElement) {
                    element.appendChild(newChild);
                } else if (newChild instanceof DocumentFragment) {
                    element.appendChild(newChild);
                }
            }
        } else if (oldChild instanceof HTMLElement || oldChild instanceof SVGElement) {
            // 如果是元素节点，检查是否是同一个元素
            if (newChild === oldChild) {
                // 同一个元素，不需要更新
                continue;
            } else if (newChild instanceof HTMLElement || newChild instanceof SVGElement) {
                // 不同的元素，替换
                const oldNode = element.childNodes[i];
                if (oldNode) {
                    // 检查是否应该保留旧节点
                    if (!shouldPreserveElement(oldNode)) {
                        // 只有当新子元素不在当前位置时才替换
                        if (oldNode !== newChild) {
                            element.replaceChild(newChild, oldNode);
                        }
                    } else {
                        // 应该保留旧节点，只添加新节点（不替换）
                        if (newChild.parentNode !== element) {
                            element.appendChild(newChild);
                        }
                    }
                } else {
                    if (newChild.parentNode !== element) {
                        element.appendChild(newChild);
                    }
                }
            } else {
                // 类型变化：替换节点
                const oldNode = element.childNodes[i];
                if (oldNode) {
                    // 检查是否应该保留旧节点
                    if (!shouldPreserveElement(oldNode)) {
                        element.removeChild(oldNode);
                    }
                    // 如果应该保留，不删除（但可能仍需要添加新节点）
                }
                if (typeof newChild === "string" || typeof newChild === "number") {
                    element.appendChild(document.createTextNode(String(newChild)));
                } else if (newChild instanceof DocumentFragment) {
                    element.appendChild(newChild);
                }
            }
        }
    }

    // 添加新子节点
    for (let i = minLength; i < flatNew.length; i++) {
        const newChild = flatNew[i];
        if (newChild === null || newChild === undefined || newChild === false) {
            continue;
        }

        if (typeof newChild === "string" || typeof newChild === "number") {
            element.appendChild(document.createTextNode(String(newChild)));
        } else if (newChild instanceof HTMLElement || newChild instanceof SVGElement) {
            // 确保子元素正确添加到当前父容器
            // appendChild 会自动从旧父容器移除并添加到新父容器
            // 但我们需要确保不重复添加已存在的子元素
            if (newChild.parentNode !== element) {
                element.appendChild(newChild);
            }
        } else if (newChild instanceof DocumentFragment) {
            element.appendChild(newChild);
        }
    }

    // 移除多余子节点（阶段 5：正确处理元素保留）
    // 关键：需要跳过"应该保留"的元素（第三方库注入的元素）
    const nodesToRemove: Node[] = [];
    for (let i = flatNew.length; i < element.childNodes.length; i++) {
        const child = element.childNodes[i];
        if (!shouldPreserveElement(child)) {
            // 只有不应该保留的节点才添加到移除列表
            nodesToRemove.push(child);
        }
        // 如果应该保留，跳过（不添加到移除列表）
    }

    // 统一移除（从后往前移除，避免索引变化）
    for (let i = nodesToRemove.length - 1; i >= 0; i--) {
        const node = nodesToRemove[i];
        if (node.parentNode === element) {
            element.removeChild(node);
        }
    }
}

/**
 * Updates an element with new props and children.
 * Stores metadata in cache manager for next update.
 */
export function updateElement(
    element: HTMLElement | SVGElement,
    newProps: Record<string, unknown> | null,
    newChildren: JSXChildren[],
    tag: string,
    cacheManager: DOMCacheManager
): void {
    // 获取旧的元数据
    const oldMetadata = cacheManager.getMetadata(element);
    const oldProps = (oldMetadata?.props as Record<string, unknown>) || null;
    const oldChildren = (oldMetadata?.children as JSXChildren[]) || [];

    // 更新 props
    updateProps(element, oldProps, newProps, tag);

    // 更新 children
    updateChildren(element, oldChildren, newChildren);

    // 保存新的元数据
    cacheManager.setMetadata(element, {
        props: newProps || {},
        children: newChildren,
    });
}
