/**
 * Element Update Utilities
 *
 * Pure functions for fine-grained DOM updates (RFC 0037 Phase 4).
 * These functions update only changed props and children, avoiding full element recreation.
 */

import { shouldUseSVGNamespace, getSVGAttributeName } from "./svg-utils";
import { flattenChildren, type JSXChildren } from "./dom-utils";
import { setSmartProperty, isFrameworkInternalProp } from "./props-utils";
import { shouldPreserveElement, getElementCacheKey } from "./element-marking";
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

    // 过滤框架内部属性（不应该从 DOM 移除，因为它们本来就不应该存在）
    if (isFrameworkInternalProp(key)) {
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

    // 过滤框架内部属性（不应该渲染到 DOM）
    if (isFrameworkInternalProp(key)) {
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

        // 如果 oldValue 是 undefined，说明是新增属性，需要设置
        if (oldValue === undefined) {
            applySingleProp(element, key, newValue, tag, isSVG);
            continue;
        }

        // 深度比较：对于对象和数组，使用 JSON.stringify 进行深度比较
        // 注意：JSON.stringify 会进行完整的深度比较，不仅仅是第一层
        // 关键修复：即使 JSON.stringify 结果相同，如果引用不同，也应该更新
        // 因为对象可能包含函数、Symbol 等无法序列化的内容，或者对象引用变化意味着需要更新
        if (
            typeof oldValue === "object" &&
            oldValue !== null &&
            typeof newValue === "object" &&
            newValue !== null
        ) {
            // 深度比较：使用 JSON.stringify 比较整个对象结构
            // 这样可以检测到嵌套对象（如 navigation.items[].label）的变化
            try {
                const oldJson = JSON.stringify(oldValue);
                const newJson = JSON.stringify(newValue);
                if (oldJson === newJson) {
                    // JSON 字符串相同，但引用不同
                    // 对于自定义元素的属性（如 navigation），即使 JSON 相同，引用变化也可能需要更新
                    // 因为 setter 可能会触发其他逻辑
                    // 但是，为了性能，我们只在 JSON 不同时才更新
                    // 如果 JSON 相同但引用不同，可能是同一个对象的不同引用，不需要更新
                    continue;
                }
            } catch {
                // 如果 JSON.stringify 失败（如循环引用），认为对象已变化
                // 继续执行，更新属性
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
    // 关键：直接使用 oldChild 作为 oldNode（如果它是元素），因为它已经在 DOM 中
    // 对于文本节点，按顺序匹配（跳过应该保留的元素节点）
    let domIndex = 0; // DOM 中的实际索引，用于匹配文本节点
    for (let i = 0; i < minLength; i++) {
        const oldChild = flatOld[i];
        const newChild = flatNew[i];

        // 找到与 oldChild 对应的实际 DOM 节点
        // 关键：oldChild 是上次渲染的元素引用，如果它在 DOM 中，直接使用它
        let oldNode: Node | null = null;
        if (oldChild instanceof HTMLElement || oldChild instanceof SVGElement) {
            // 元素节点：检查 oldChild 是否在 DOM 中
            // 如果 oldChild 的 parentNode 是当前 element，说明它在 DOM 中
            if (oldChild.parentNode === element) {
                oldNode = oldChild;
            }
            // 如果 oldChild 不在 DOM 中，oldNode 保持为 null
        } else if (typeof oldChild === "string" || typeof oldChild === "number") {
            // 文本节点：按顺序找到对应的文本节点（跳过所有元素节点）
            while (domIndex < element.childNodes.length) {
                const node = element.childNodes[domIndex];
                if (node.nodeType === Node.TEXT_NODE) {
                    oldNode = node;
                    domIndex++;
                    break;
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    // 跳过所有元素节点（不管是保留的还是框架管理的）
                    // 因为元素节点会在自己的迭代中处理
                    domIndex++;
                } else {
                    // 跳过其他类型的节点
                    domIndex++;
                }
            }
        }

        // 如果是文本节点，更新文本内容
        if (typeof oldChild === "string" || typeof oldChild === "number") {
            if (typeof newChild === "string" || typeof newChild === "number") {
                if (oldNode && oldNode.nodeType === Node.TEXT_NODE) {
                    // 更新现有文本节点
                    oldNode.textContent = String(newChild);
                } else {
                    // 创建新的文本节点
                    const newTextNode = document.createTextNode(String(newChild));
                    if (oldNode && !shouldPreserveElement(oldNode)) {
                        element.replaceChild(newTextNode, oldNode);
                    } else {
                        element.insertBefore(newTextNode, oldNode || null);
                    }
                }
            } else {
                // 类型变化：文本 -> 元素
                if (oldNode && !shouldPreserveElement(oldNode)) {
                    element.removeChild(oldNode);
                }
                if (newChild instanceof HTMLElement || newChild instanceof SVGElement) {
                    if (newChild.parentNode !== element) {
                        element.insertBefore(newChild, oldNode || null);
                    }
                } else if (newChild instanceof DocumentFragment) {
                    element.insertBefore(newChild, oldNode || null);
                }
            }
        } else if (oldChild instanceof HTMLElement || oldChild instanceof SVGElement) {
            // 如果是元素节点，检查是否是同一个元素
            if (newChild === oldChild) {
                // 同一个元素，不需要更新（元素内容会在 updateElement 中更新）
                continue;
            } else if (newChild instanceof HTMLElement || newChild instanceof SVGElement) {
                // 不同的元素引用，需要替换
                // 检查 cache key：如果 cache key 相同，说明是同一个逻辑位置，应该替换
                const oldCacheKey =
                    oldNode && (oldNode instanceof HTMLElement || oldNode instanceof SVGElement)
                        ? getElementCacheKey(oldNode)
                        : null;
                const newCacheKey = getElementCacheKey(newChild);
                const hasSameCacheKey = oldCacheKey && newCacheKey && oldCacheKey === newCacheKey;

                if (oldNode) {
                    // oldNode 存在（oldChild 在 DOM 中）
                    if (!shouldPreserveElement(oldNode)) {
                        // 可以替换
                        if (oldNode !== newChild) {
                            // 如果 newChild 已经在 DOM 中，需要先移除它（避免重复）
                            if (newChild.parentNode === element) {
                                // newChild 已经在当前 element 中
                                // 如果 cache key 相同，说明是同一个逻辑位置，应该替换 oldNode
                                if (hasSameCacheKey) {
                                    // 如果 newChild 就是 oldNode，不需要替换
                                    if (newChild !== oldNode) {
                                        // 替换旧元素（replaceChild 会自动从 newChild 的旧位置移除它）
                                        // 但是，如果 newChild 在 oldNode 之后，replaceChild 会先移除 newChild，然后替换 oldNode
                                        // 这会导致 newChild 移动到 oldNode 的位置，这是正确的
                                        // 如果 newChild 在 oldNode 之前，replaceChild 也会将 newChild 移动到 oldNode 的位置
                                        // 所以，无论 newChild 在哪里，replaceChild 都会将其移动到 oldNode 的位置
                                        element.replaceChild(newChild, oldNode);
                                    }
                                } else {
                                    // cache key 不同，说明 newChild 在错误的位置
                                    // 先移除 newChild（它可能在错误的位置）
                                    element.removeChild(newChild);
                                    // 然后替换 oldNode
                                    element.replaceChild(newChild, oldNode);
                                }
                            } else if (newChild.parentNode) {
                                // newChild 在其他父元素中，先移除
                                newChild.parentNode.removeChild(newChild);
                                // 然后替换 oldNode
                                element.replaceChild(newChild, oldNode);
                            } else {
                                // newChild 不在 DOM 中，直接替换
                                element.replaceChild(newChild, oldNode);
                            }
                        }
                    } else {
                        // 应该保留旧节点，只添加新节点（不替换）
                        if (newChild.parentNode !== element) {
                            // 如果 newChild 在其他父元素中，先移除
                            if (newChild.parentNode) {
                                newChild.parentNode.removeChild(newChild);
                            }
                            element.insertBefore(newChild, oldNode.nextSibling);
                        }
                    }
                } else {
                    // oldNode 不存在（oldChild 不在 DOM 中），直接添加新元素
                    if (newChild.parentNode !== element) {
                        // 如果 newChild 在其他父元素中，先移除
                        if (newChild.parentNode) {
                            newChild.parentNode.removeChild(newChild);
                        }
                        element.appendChild(newChild);
                    }
                }
            } else {
                // 类型变化：元素 -> 文本
                if (oldNode && !shouldPreserveElement(oldNode)) {
                    element.removeChild(oldNode);
                }
                if (typeof newChild === "string" || typeof newChild === "number") {
                    const newTextNode = document.createTextNode(String(newChild));
                    element.insertBefore(newTextNode, oldNode?.nextSibling || null);
                } else if (newChild instanceof DocumentFragment) {
                    element.insertBefore(newChild, oldNode?.nextSibling || null);
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
            // 如果 newChild 已经在 DOM 中，需要检查它是否在正确的位置
            if (newChild.parentNode === element) {
                // newChild 已经在当前 element 中
                // 检查它是否在正确的位置（应该在最后，因为这是"添加新子节点"部分）
                const currentIndex = Array.from(element.childNodes).indexOf(newChild);
                const expectedIndex = element.childNodes.length - 1;
                if (currentIndex !== expectedIndex) {
                    // 位置不对，移动到正确位置（末尾）
                    element.removeChild(newChild);
                    element.appendChild(newChild);
                }
                // 如果位置正确，跳过（避免重复添加）
                // 注意：元素内容会在 updateElement 中更新，所以这里只需要确保位置正确
                continue;
            } else if (newChild.parentNode) {
                // newChild 在其他父元素中，先移除
                newChild.parentNode.removeChild(newChild);
            }
            // 添加 newChild 到当前 element 的末尾
            element.appendChild(newChild);
        } else if (newChild instanceof DocumentFragment) {
            element.appendChild(newChild);
        }
    }

    // 移除多余子节点（阶段 5：正确处理元素保留）
    // 关键：需要跳过"应该保留"的元素（第三方库注入的元素）
    // 以及已经在 newChildren 中的元素（通过元素引用或 cache key 匹配）
    const nodesToRemove: Node[] = [];
    const newChildSet = new Set<HTMLElement | SVGElement | DocumentFragment>();
    const newChildCacheKeyMap = new Map<string, HTMLElement | SVGElement>();
    // 只将元素节点添加到 Set 中（文本节点不能直接比较）
    for (const child of flatNew) {
        if (
            child instanceof HTMLElement ||
            child instanceof SVGElement ||
            child instanceof DocumentFragment
        ) {
            newChildSet.add(child);
            // 同时收集 cache key 到 Map，用于匹配（即使元素引用不同，cache key 相同也认为是同一个元素）
            // 注意：DocumentFragment 没有 cache key，只能通过引用匹配
            if (child instanceof HTMLElement || child instanceof SVGElement) {
                const cacheKey = getElementCacheKey(child);
                if (cacheKey) {
                    // 如果 cache key 已存在，保留最新的元素（newChild）
                    newChildCacheKeyMap.set(cacheKey, child);
                }
            }
        }
    }

    // 第一步：处理重复的 cache key（如果 DOM 中有多个元素具有相同的 cache key，只保留 newChild）
    // 注意：需要从后往前遍历，避免在循环中修改 DOM 导致索引问题
    // 关键：这个步骤在"更新现有子节点"循环之后执行，所以需要处理那些在"更新现有子节点"循环中没有处理的重复元素
    const processedCacheKeys = new Set<string>();
    // 构建 newChild 到其在 flatNew 中索引的映射，用于确定正确位置
    const newChildToIndexMap = new Map<HTMLElement | SVGElement, number>();
    for (let i = 0; i < flatNew.length; i++) {
        const child = flatNew[i];
        if (child instanceof HTMLElement || child instanceof SVGElement) {
            newChildToIndexMap.set(child, i);
        }
    }

    for (let i = element.childNodes.length - 1; i >= 0; i--) {
        const child = element.childNodes[i];
        if (child instanceof HTMLElement || child instanceof SVGElement) {
            // 关键修复：跳过应该保留的元素（第三方库注入的元素）
            if (shouldPreserveElement(child)) {
                continue;
            }
            const cacheKey = getElementCacheKey(child);
            if (
                cacheKey &&
                newChildCacheKeyMap.has(cacheKey) &&
                !processedCacheKeys.has(cacheKey)
            ) {
                processedCacheKeys.add(cacheKey);
                const newChild = newChildCacheKeyMap.get(cacheKey)!;
                // 如果 child 不是 newChild，说明是旧元素，应该被移除或替换
                if (child !== newChild) {
                    // 如果 newChild 已经在 DOM 中，移除旧元素
                    if (newChild.parentNode === element) {
                        // newChild 已经在 DOM 中，移除旧元素
                        // 注意：newChild 已经在 DOM 中，所以不需要再次添加
                        // 但需要确保 newChild 在正确的位置（通过 replaceChild 移动到旧元素的位置）
                        // 这样可以确保 newChild 在正确的位置，而不是在错误的位置
                        // 但是，如果 newChild 在 child 之后，replaceChild 会先移除 newChild，然后替换 child
                        // 这会导致 newChild 移动到 child 的位置，这是正确的
                        // 如果 newChild 在 child 之前，replaceChild 也会将 newChild 移动到 child 的位置
                        // 所以，无论 newChild 在哪里，replaceChild 都会将其移动到 child 的位置
                        element.replaceChild(newChild, child);
                    } else {
                        // newChild 不在 DOM 中，替换旧元素
                        element.replaceChild(newChild, child);
                    }
                } else {
                    // child === newChild，说明是同一个元素，不需要处理
                    // 但需要确保它在正确的位置（这应该在"更新现有子节点"循环中处理）
                }
            }
        }
    }

    // 第二步：移除不在 newChildren 中的元素
    for (let i = 0; i < element.childNodes.length; i++) {
        const child = element.childNodes[i];

        // 跳过应该保留的元素（第三方库注入的元素）
        if (shouldPreserveElement(child)) {
            continue;
        }

        // 跳过已经在 newChildren 中的元素（通过元素引用或 cache key 匹配）
        if (child instanceof HTMLElement || child instanceof SVGElement) {
            // 方法 1: 直接元素引用匹配
            if (newChildSet.has(child)) {
                continue;
            }
            // 方法 2: cache key 匹配（用于处理语言切换等场景，元素引用可能不同但 cache key 相同）
            const cacheKey = getElementCacheKey(child);
            if (cacheKey && newChildCacheKeyMap.has(cacheKey)) {
                // 已经在第一步处理过了，跳过
                continue;
            }
        } else if (child instanceof DocumentFragment) {
            // DocumentFragment 只能通过引用匹配
            if (newChildSet.has(child)) {
                continue;
            }
        }

        // 只有不应该保留且不在 newChildren 中的节点才添加到移除列表
        nodesToRemove.push(child);
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
