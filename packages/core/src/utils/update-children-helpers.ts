/**
 * Pure helper functions for updateChildren
 *
 * 将 updateChildren 的复杂逻辑拆分为小的纯函数，
 * 遵循 Linus 的"好品味"原则：消除特殊情况，使代码简洁易读
 */

import { flattenChildren, type JSXChildren } from "./dom-utils";
import { shouldPreserveElement, getElementCacheKey } from "./element-marking";

/**
 * 收集所有需要保留的元素（第三方库注入的元素）
 */
export function collectPreservedElements(element: HTMLElement | SVGElement): Node[] {
    const preserved: Node[] = [];
    for (let i = 0; i < element.childNodes.length; i++) {
        const child = element.childNodes[i];
        if (shouldPreserveElement(child)) {
            preserved.push(child);
        }
    }
    return preserved;
}

/**
 * 查找与 oldChild 对应的 DOM 节点（通过元素引用）
 */
function findDOMNodeByReference(
    oldChild: HTMLElement | SVGElement,
    parent: HTMLElement | SVGElement
): Node | null {
    if (oldChild.parentNode === parent && !shouldPreserveElement(oldChild)) {
        return oldChild;
    }
    return null;
}

/**
 * 查找与 oldChild 对应的 DOM 节点（通过 cache key）
 */
function findDOMNodeByCacheKey(cacheKey: string, parent: HTMLElement | SVGElement): Node | null {
    for (let i = 0; i < parent.childNodes.length; i++) {
        const child = parent.childNodes[i];
        if (child instanceof HTMLElement || child instanceof SVGElement) {
            if (shouldPreserveElement(child)) continue;
            if (getElementCacheKey(child) === cacheKey) {
                return child;
            }
        }
    }
    return null;
}

/**
 * 查找元素节点对应的 DOM 节点
 */
export function findElementNode(
    oldChild: HTMLElement | SVGElement,
    parent: HTMLElement | SVGElement
): Node | null {
    // 先尝试直接引用匹配
    const byRef = findDOMNodeByReference(oldChild, parent);
    if (byRef) return byRef;

    // 再尝试 cache key 匹配
    const cacheKey = getElementCacheKey(oldChild);
    if (cacheKey) {
        return findDOMNodeByCacheKey(cacheKey, parent);
    }

    return null;
}

/**
 * 查找文本节点对应的 DOM 节点
 * 关键：跳过所有元素节点，只查找文本节点
 */
export function findTextNode(
    parent: HTMLElement | SVGElement,
    domIndex: { value: number }
): Node | null {
    while (domIndex.value < parent.childNodes.length) {
        const node = parent.childNodes[domIndex.value];
        if (node.nodeType === Node.TEXT_NODE) {
            const textNode = node;
            domIndex.value++;
            return textNode;
        }
        // 跳过元素节点和其他类型的节点（它们会在自己的迭代中处理）
        // 关键：必须递增 domIndex，否则会无限循环
        domIndex.value++;
    }
    return null;
}

/**
 * 检查文本节点是否需要更新
 */
export function shouldUpdateTextNode(
    oldText: string,
    newText: string,
    oldNode: Node | null
): boolean {
    if (oldText !== newText) return true;
    if (oldNode && oldNode.nodeType === Node.TEXT_NODE && oldNode.textContent !== newText) {
        return true;
    }
    return false;
}

/**
 * 更新或创建文本节点
 */
export function updateOrCreateTextNode(
    parent: HTMLElement | SVGElement,
    oldNode: Node | null,
    newText: string
): void {
    if (oldNode && oldNode.nodeType === Node.TEXT_NODE) {
        // 只有当文本内容不同时才更新
        if (oldNode.textContent !== newText) {
            oldNode.textContent = newText;
        }
    } else {
        // Bug 2 修复：如果 oldNode 为 null，说明 findTextNode 没有找到对应的文本节点
        // 此时不应该盲目更新第一个找到的文本节点，而应该创建新节点
        // 因为：
        // 1. 如果文本内容相同，调用方已经跳过了更新（在 element-update.ts 中）
        // 2. 如果文本内容不同，应该创建新节点，而不是更新错误的节点
        const newTextNode = document.createTextNode(newText);
        if (oldNode && !shouldPreserveElement(oldNode)) {
            parent.replaceChild(newTextNode, oldNode);
        } else {
            parent.insertBefore(newTextNode, oldNode || null);
        }
    }
}

/**
 * 移除节点（如果不应该保留）
 */
export function removeNodeIfNotPreserved(
    parent: HTMLElement | SVGElement,
    node: Node | null
): void {
    if (node && !shouldPreserveElement(node) && node.parentNode === parent) {
        parent.removeChild(node);
    }
}

/**
 * 替换或插入元素节点
 */
export function replaceOrInsertElement(
    parent: HTMLElement | SVGElement,
    newChild: HTMLElement | SVGElement,
    oldNode: Node | null
): void {
    // 如果新元素已经在其他父元素中，先移除
    if (newChild.parentNode && newChild.parentNode !== parent) {
        newChild.parentNode.removeChild(newChild);
    }

    if (oldNode && !shouldPreserveElement(oldNode)) {
        if (oldNode !== newChild) {
            parent.replaceChild(newChild, oldNode);
        }
    } else if (newChild.parentNode !== parent) {
        parent.insertBefore(newChild, oldNode || null);
    }
}

/**
 * 添加新的子节点到末尾
 */
export function appendNewChild(parent: HTMLElement | SVGElement, child: JSXChildren): void {
    if (child === null || child === undefined || child === false) {
        return;
    }

    if (typeof child === "string" || typeof child === "number") {
        parent.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof HTMLElement || child instanceof SVGElement) {
        // 确保元素不在其他父元素中
        if (child.parentNode && child.parentNode !== parent) {
            child.parentNode.removeChild(child);
        }
        if (child.parentNode !== parent) {
            parent.appendChild(child);
        }
    } else if (child instanceof DocumentFragment) {
        parent.appendChild(child);
    }
}

/**
 * 构建新子元素的引用集合和 cache key 映射
 */
export function buildNewChildrenMaps(flatNew: JSXChildren[]): {
    elementSet: Set<HTMLElement | SVGElement | DocumentFragment>;
    cacheKeyMap: Map<string, HTMLElement | SVGElement>;
} {
    const elementSet = new Set<HTMLElement | SVGElement | DocumentFragment>();
    const cacheKeyMap = new Map<string, HTMLElement | SVGElement>();

    for (const child of flatNew) {
        if (
            child instanceof HTMLElement ||
            child instanceof SVGElement ||
            child instanceof DocumentFragment
        ) {
            elementSet.add(child);
            if (child instanceof HTMLElement || child instanceof SVGElement) {
                const cacheKey = getElementCacheKey(child);
                if (cacheKey) {
                    cacheKeyMap.set(cacheKey, child);
                }
            }
        }
    }

    return { elementSet, cacheKeyMap };
}

/**
 * 检查节点是否应该被移除
 */
export function shouldRemoveNode(
    node: Node,
    elementSet: Set<HTMLElement | SVGElement | DocumentFragment>,
    cacheKeyMap: Map<string, HTMLElement | SVGElement>
): boolean {
    // 保留的元素不移除
    if (shouldPreserveElement(node)) {
        return false;
    }

    // 检查是否在新子元素集合中（通过引用）
    if (
        node instanceof HTMLElement ||
        node instanceof SVGElement ||
        node instanceof DocumentFragment
    ) {
        if (elementSet.has(node)) {
            return false;
        }

        // 检查是否通过 cache key 匹配
        if (node instanceof HTMLElement || node instanceof SVGElement) {
            const cacheKey = getElementCacheKey(node);
            if (cacheKey && cacheKeyMap.has(cacheKey)) {
                return false;
            }
        }
    }

    return true;
}

/**
 * 处理重复的 cache key（如果 DOM 中有多个元素具有相同的 cache key，只保留 newChild）
 * 这个函数确保每个 cache key 在 DOM 中只出现一次
 */
export function deduplicateCacheKeys(
    parent: HTMLElement | SVGElement,
    cacheKeyMap: Map<string, HTMLElement | SVGElement>
): void {
    const processedCacheKeys = new Set<string>();

    // 从后往前遍历，避免在循环中修改 DOM 导致索引问题
    for (let i = parent.childNodes.length - 1; i >= 0; i--) {
        const child = parent.childNodes[i];
        if (child instanceof HTMLElement || child instanceof SVGElement) {
            // 跳过应该保留的元素（第三方库注入的元素）
            if (shouldPreserveElement(child)) {
                continue;
            }
            const cacheKey = getElementCacheKey(child);
            if (cacheKey && cacheKeyMap.has(cacheKey) && !processedCacheKeys.has(cacheKey)) {
                processedCacheKeys.add(cacheKey);
                const newChild = cacheKeyMap.get(cacheKey)!;
                // 如果 child 不是 newChild，说明是旧元素，应该被替换
                if (child !== newChild) {
                    parent.replaceChild(newChild, child);
                }
            }
        }
    }
}

/**
 * 收集需要移除的节点
 */
export function collectNodesToRemove(
    parent: HTMLElement | SVGElement,
    elementSet: Set<HTMLElement | SVGElement | DocumentFragment>,
    cacheKeyMap: Map<string, HTMLElement | SVGElement>
): Node[] {
    const nodesToRemove: Node[] = [];

    for (let i = 0; i < parent.childNodes.length; i++) {
        const node = parent.childNodes[i];
        if (shouldRemoveNode(node, elementSet, cacheKeyMap)) {
            nodesToRemove.push(node);
        }
    }

    return nodesToRemove;
}

/**
 * 批量移除节点（从后往前，避免索引变化）
 */
export function removeNodes(parent: HTMLElement | SVGElement, nodes: Node[]): void {
    for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        if (node.parentNode === parent) {
            parent.removeChild(node);
        }
    }
}

/**
 * 重新插入保留的元素到 DOM 末尾
 */
export function reinsertPreservedElements(
    parent: HTMLElement | SVGElement,
    preservedElements: Node[]
): void {
    for (const element of preservedElements) {
        if (element.parentNode !== parent) {
            parent.appendChild(element);
        }
    }
}

/**
 * 扁平化子元素
 */
export function flattenChildrenSafe(children: JSXChildren[]): JSXChildren[] {
    return flattenChildren(children);
}
