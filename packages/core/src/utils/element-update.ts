/**
 * Element Update Utilities
 *
 * Pure functions for fine-grained DOM updates (RFC 0037 Phase 4).
 * These functions update only changed props and children, avoiding full element recreation.
 */

import { shouldUseSVGNamespace, getSVGAttributeName } from "./svg-utils";
import { type JSXChildren } from "./dom-utils";
import { setSmartProperty, isFrameworkInternalProp } from "./props-utils";
import { shouldPreserveElement } from "./element-marking";
import type { DOMCacheManager } from "../dom-cache-manager";
import {
    collectPreservedElements,
    findElementNode,
    findTextNode,
    updateOrCreateTextNode,
    removeNodeIfNotPreserved,
    replaceOrInsertElement,
    replaceOrInsertElementAtPosition,
    appendNewChild,
    buildNewChildrenMaps,
    deduplicateCacheKeys,
    collectNodesToRemove,
    removeNodes,
    reinsertPreservedElements,
    flattenChildrenSafe,
} from "./update-children-helpers";

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
        // 关键修复：当 ref 被移除时，调用回调并传入 null
        // 这确保组件可以清理引用，避免使用已移除的元素
        // 例如：LanguageSwitcher 的 dropdownElement 应该在元素被移除时设置为 null
        if (typeof oldValue === "function") {
            try {
                oldValue(null);
            } catch {
                // 忽略回调错误
            }
        }
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
    newChildren: JSXChildren[],
    _cacheManager?: DOMCacheManager // 可选参数，保留以保持 API 兼容性
): void {
    const flatOld = flattenChildrenSafe(oldChildren);
    const flatNew = flattenChildrenSafe(newChildren);

    // 收集需要保留的元素（第三方库注入的元素）
    const preservedElements = collectPreservedElements(element);

    // 更新现有子节点
    const minLength = Math.min(flatOld.length, flatNew.length);
    const domIndex = { value: 0 }; // 使用对象包装，使其可在函数间传递
    // 跟踪已处理的节点，用于确定正确的位置
    const processedNodes = new Set<Node>();

    for (let i = 0; i < minLength; i++) {
        const oldChild = flatOld[i];
        const newChild = flatNew[i];

        // 查找对应的 DOM 节点
        let oldNode: Node | null = null;
        if (oldChild instanceof HTMLElement || oldChild instanceof SVGElement) {
            oldNode = findElementNode(oldChild, element);
            // 关键修复：当处理元素节点时，需要更新 domIndex 以跳过该元素
            // 这样，下一个文本节点的查找位置才是正确的
            if (oldNode && oldNode.parentNode === element) {
                // 找到 oldNode 在 DOM 中的位置
                const nodeIndex = Array.from(element.childNodes).indexOf(oldNode as ChildNode);
                if (nodeIndex !== -1 && nodeIndex >= domIndex.value) {
                    // 更新 domIndex 到 oldNode 之后的位置
                    domIndex.value = nodeIndex + 1;
                }
            }
        } else if (typeof oldChild === "string" || typeof oldChild === "number") {
            oldNode = findTextNode(element, domIndex);
            // RFC-0044 修复：fallback 搜索必须验证文本内容
            // 在缓存元素复用场景下，不能盲目返回第一个找到的文本节点
            // 必须确保内容匹配，否则会导致错误的更新
            if (!oldNode && element.childNodes.length > 0) {
                const oldText = String(oldChild);
                for (let j = domIndex.value; j < element.childNodes.length; j++) {
                    const node = element.childNodes[j];
                    // 关键修复：只检查直接子文本节点，确保 node.parentNode === element
                    // 并且必须验证文本内容是否匹配
                    if (
                        node.nodeType === Node.TEXT_NODE &&
                        node.parentNode === element &&
                        node.textContent === oldText
                    ) {
                        oldNode = node;
                        // 更新 domIndex 到找到的文本节点之后
                        domIndex.value = j + 1;
                        break;
                    }
                }
            }
        }

        // 处理文本节点（oldChild 是字符串/数字）
        if (typeof oldChild === "string" || typeof oldChild === "number") {
            if (typeof newChild === "string" || typeof newChild === "number") {
                const oldText = String(oldChild);
                const newText = String(newChild);

                // Bug 2 修复：只有当文本内容确实需要更新时才调用 updateOrCreateTextNode
                // 如果 oldText === newText 且 oldNode 为 null，说明文本节点可能已经存在且内容正确
                // 或者不需要创建，因此不应该调用 updateOrCreateTextNode
                const needsUpdate =
                    oldText !== newText ||
                    (oldNode &&
                        oldNode.nodeType === Node.TEXT_NODE &&
                        oldNode.textContent !== newText);

                if (needsUpdate) {
                    // RFC-0044 修复：使用返回的节点引用直接标记
                    // updateOrCreateTextNode 现在返回更新/创建的节点
                    // 这样可以准确标记，避免搜索失败导致的重复创建
                    const updatedNode = updateOrCreateTextNode(element, oldNode, newText);
                    if (updatedNode && !processedNodes.has(updatedNode)) {
                        processedNodes.add(updatedNode);
                    }
                } else {
                    // 即使不需要更新，也要标记为已处理（文本节点已存在且内容正确）
                    if (oldNode && oldNode.parentNode === element) {
                        processedNodes.add(oldNode);
                    }
                }
            } else {
                // 类型变化：文本 -> 元素/Fragment
                removeNodeIfNotPreserved(element, oldNode);
                if (newChild instanceof HTMLElement || newChild instanceof SVGElement) {
                    replaceOrInsertElement(element, newChild, oldNode);
                } else if (newChild instanceof DocumentFragment) {
                    element.insertBefore(newChild, oldNode || null);
                }
            }
        }
        // 处理元素节点（oldChild 是元素）
        else if (oldChild instanceof HTMLElement || oldChild instanceof SVGElement) {
            if (oldNode && shouldPreserveElement(oldNode)) {
                continue; // 跳过保留的元素
            }

            if (newChild instanceof HTMLElement || newChild instanceof SVGElement) {
                // 关键修复：确定正确的位置
                // 策略：基于 flatNew 数组的顺序来确定位置，而不是 DOM 中的实际顺序
                // 因为某些元素可能被隐藏（position: absolute），导致 DOM 顺序与数组顺序不同

                // 找到索引 i 之前的所有元素，确定 newChild 应该在这些元素之后
                let targetNextSibling: Node | null = null;
                let foundPreviousElement = false;

                // 从后往前查找，找到最后一个在 DOM 中的前一个元素
                for (let j = i - 1; j >= 0; j--) {
                    const prevChild = flatNew[j];
                    if (prevChild instanceof HTMLElement || prevChild instanceof SVGElement) {
                        if (prevChild.parentNode === element) {
                            // 找到前一个元素，newChild 应该在它之后
                            targetNextSibling = prevChild.nextSibling;
                            foundPreviousElement = true;
                            break;
                        }
                    }
                }

                // 如果没有找到前一个元素，newChild 应该在开头
                if (!foundPreviousElement) {
                    // 找到第一个非保留、未处理的子节点
                    const firstChild = Array.from(element.childNodes).find(
                        (node) => !shouldPreserveElement(node) && !processedNodes.has(node)
                    );
                    targetNextSibling = firstChild || null;
                }

                // 检查 newChild 是否已经在正确位置
                const isInCorrectPosition =
                    newChild.parentNode === element && newChild.nextSibling === targetNextSibling;

                // 如果 newChild === oldChild 且位置正确，说明是同一个元素且位置正确
                if (newChild === oldChild && isInCorrectPosition) {
                    // 标记为已处理
                    if (oldNode) processedNodes.add(oldNode);
                    processedNodes.add(newChild);
                    continue; // 元素已经在正确位置，不需要更新
                }

                // 如果 newChild 是从缓存复用的（与 oldChild 不同），或者位置不对，需要调整
                // 使用 oldNode 作为参考（如果存在），但目标位置基于数组顺序
                const referenceNode = oldNode && oldNode.parentNode === element ? oldNode : null;
                replaceOrInsertElementAtPosition(
                    element,
                    newChild,
                    referenceNode,
                    targetNextSibling
                );

                // 关键修复：在替换元素后，从 processedNodes 中移除旧的元素引用
                // 这样可以防止旧的 span 元素内部的文本节点被误判为不应该移除
                if (oldNode && oldNode !== newChild) {
                    processedNodes.delete(oldNode);
                }
                // 标记新元素为已处理
                processedNodes.add(newChild);
            } else {
                // 类型变化：元素 -> 文本/Fragment
                removeNodeIfNotPreserved(element, oldNode);
                if (typeof newChild === "string" || typeof newChild === "number") {
                    const newTextNode = document.createTextNode(String(newChild));
                    element.insertBefore(newTextNode, oldNode?.nextSibling || null);
                    // 关键修复：标记新创建的文本节点为已处理，防止在移除阶段被误删
                    processedNodes.add(newTextNode);
                } else if (newChild instanceof DocumentFragment) {
                    element.insertBefore(newChild, oldNode?.nextSibling || null);
                }
            }
        }
    }

    // 添加新子节点
    for (let i = minLength; i < flatNew.length; i++) {
        appendNewChild(element, flatNew[i], processedNodes);
    }

    // 移除多余子节点（使用纯函数简化逻辑）
    // 步骤 1: 构建新子元素的引用集合和 cache key 映射
    const { elementSet, cacheKeyMap } = buildNewChildrenMaps(flatNew);

    // 步骤 2: 处理重复的 cache key（确保每个 cache key 在 DOM 中只出现一次）
    deduplicateCacheKeys(element, cacheKeyMap);

    // 步骤 3: 收集需要移除的节点（跳过保留元素和新子元素）
    const nodesToRemove = collectNodesToRemove(element, elementSet, cacheKeyMap, processedNodes);

    // 步骤 4: 批量移除节点（从后往前，避免索引变化）
    // 传递 cacheManager 以便在移除元素时调用 ref 回调
    removeNodes(element, nodesToRemove, _cacheManager);

    // 步骤 5: 重新插入所有保留的元素到 DOM 末尾
    // 这确保了第三方库注入的元素不会丢失
    reinsertPreservedElements(element, preservedElements);
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

    // 关键修复：在更新 DOM 之前先保存新的元数据
    // 这样可以防止竞态条件：如果在更新过程中触发了另一个渲染，
    // 新渲染会读取到正确的元数据，而不是过时的数据
    cacheManager.setMetadata(element, {
        props: newProps || {},
        children: newChildren,
    });

    // 更新 props
    updateProps(element, oldProps, newProps, tag);

    // 更新 children
    updateChildren(element, oldChildren, newChildren, cacheManager);
}
