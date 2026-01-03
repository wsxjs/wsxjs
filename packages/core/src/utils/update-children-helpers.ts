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
        // 关键修复：只检查直接子文本节点，确保 node.parentNode === parent
        // 这样可以防止将元素内部的文本节点（如 span 内部的文本节点）误判为独立的文本节点
        if (node.nodeType === Node.TEXT_NODE && node.parentNode === parent) {
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
 * @returns 更新后的文本节点（用于标记为已处理）
 */
export function updateOrCreateTextNode(
    parent: HTMLElement | SVGElement,
    oldNode: Node | null,
    newText: string
): Node {
    if (oldNode && oldNode.nodeType === Node.TEXT_NODE) {
        // 只有当文本内容不同时才更新
        if (oldNode.textContent !== newText) {
            oldNode.textContent = newText;
        }
        return oldNode;
    } else {
        // RFC 0048 关键修复：如果 oldNode 为 null，先检查是否已经存在相同内容的直接子文本节点
        // 这样可以防止重复创建文本节点
        // 只检查直接子文本节点，不检查元素内部的文本节点
        if (!oldNode) {
            for (let i = 0; i < parent.childNodes.length; i++) {
                const node = parent.childNodes[i];
                // 关键修复：只检查直接子文本节点，确保 node.parentNode === parent
                // 这样可以防止将元素内部的文本节点（如 span 内部的文本节点）误判为独立的文本节点
                if (
                    node.nodeType === Node.TEXT_NODE &&
                    node.parentNode === parent &&
                    node.textContent === newText
                ) {
                    // 找到相同内容的直接子文本节点，返回它而不是创建新节点
                    return node;
                }
            }
        }

        // 如果没有找到相同内容的文本节点，创建新节点
        const newTextNode = document.createTextNode(newText);
        if (oldNode && !shouldPreserveElement(oldNode)) {
            parent.replaceChild(newTextNode, oldNode);
        } else {
            parent.insertBefore(newTextNode, oldNode || null);
        }
        return newTextNode;
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
    // 确定目标位置：应该在 oldNode 的位置（oldNode.nextSibling 之前）
    const targetNextSibling = oldNode?.nextSibling || null;
    replaceOrInsertElementAtPosition(parent, newChild, oldNode, targetNextSibling);
}

/**
 * 替换或插入元素节点到指定位置
 * 确保元素在正确的位置，保持 DOM 顺序
 */
export function replaceOrInsertElementAtPosition(
    parent: HTMLElement | SVGElement,
    newChild: HTMLElement | SVGElement,
    oldNode: Node | null,
    targetNextSibling: Node | null
): void {
    // 如果新元素已经在其他父元素中，先移除
    if (newChild.parentNode && newChild.parentNode !== parent) {
        newChild.parentNode.removeChild(newChild);
    }

    // 检查元素是否已经在正确位置
    const isInCorrectPosition =
        newChild.parentNode === parent && newChild.nextSibling === targetNextSibling;

    if (isInCorrectPosition) {
        // 已经在正确位置，不需要移动
        return;
    }

    // 如果元素已经在 parent 中但位置不对，需要移动到正确位置
    if (newChild.parentNode === parent) {
        // insertBefore 会自动处理：如果元素已经在 DOM 中，会先移除再插入到新位置
        parent.insertBefore(newChild, targetNextSibling);
        return;
    }

    // 元素不在 parent 中，需要插入或替换
    if (oldNode && oldNode.parentNode === parent && !shouldPreserveElement(oldNode)) {
        if (oldNode !== newChild) {
            // 关键修复：在替换元素之前，标记旧元素内的所有文本节点为已处理
            // 这样可以防止在移除阶段被误删
            // 注意：这里只标记直接子文本节点，不递归处理嵌套元素内的文本节点
            // 因为 replaceChild 会一起处理元素及其所有子节点
            parent.replaceChild(newChild, oldNode);
        }
    } else {
        // RFC 0048 关键修复：在插入元素之前，检查是否已经存在相同内容的元素
        // 如果 newChild 已经在 parent 中，不应该再次插入
        // 如果 parent 中已经存在相同标签名和内容的元素，也不应该插入
        // 这样可以防止重复插入相同的元素（特别是从 HTML 字符串解析而来的元素）
        if (newChild.parentNode === parent) {
            // 元素已经在 parent 中，不需要再次插入
            return;
        }
        // RFC 0048 关键修复：检查是否已经存在相同内容的元素
        // 注意：这个检查只适用于从 HTML 字符串解析而来的元素（没有 __wsxCacheKey）
        // 对于由 h() 创建的元素（有 __wsxCacheKey），应该通过引用匹配，而不是内容匹配
        // 这样可以避免误判语言切换器等组件（它们由 h() 创建，每次渲染可能有相同内容但不同引用）
        const newChildCacheKey = getElementCacheKey(newChild);
        // 只有当 newChild 没有 cache key 时，才进行内容匹配检查
        // 如果有 cache key，说明是由 h() 创建的，应该通过引用匹配（已经在 elementSet 中检查）
        if (!newChildCacheKey) {
            const newChildContent = newChild.textContent || "";
            const newChildTag = newChild.tagName.toLowerCase();
            // 检查 parent 中是否已经存在相同标签名和内容的元素（且也没有 cache key）
            for (let i = 0; i < parent.childNodes.length; i++) {
                const existingNode = parent.childNodes[i];
                if (existingNode instanceof HTMLElement || existingNode instanceof SVGElement) {
                    const existingCacheKey = getElementCacheKey(existingNode);
                    // 只有当 existingNode 也没有 cache key 时，才进行内容匹配
                    if (
                        !existingCacheKey &&
                        existingNode.tagName.toLowerCase() === newChildTag &&
                        existingNode.textContent === newChildContent &&
                        existingNode !== newChild
                    ) {
                        // 找到相同内容的元素（且都没有 cache key），不需要插入 newChild
                        // 这是从 HTML 字符串解析而来的重复元素
                        return;
                    }
                }
            }
        }
        // 插入到目标位置
        parent.insertBefore(newChild, targetNextSibling);
    }
}

/**
 * 添加新的子节点到末尾
 */
export function appendNewChild(
    parent: HTMLElement | SVGElement,
    child: JSXChildren,
    processedNodes?: Set<Node>
): void {
    if (child === null || child === undefined || child === false) {
        return;
    }

    if (typeof child === "string" || typeof child === "number") {
        const newTextNode = document.createTextNode(String(child));
        parent.appendChild(newTextNode);
        // 关键修复：标记新创建的文本节点为已处理，防止在移除阶段被误删
        if (processedNodes) {
            processedNodes.add(newTextNode);
        }
    } else if (child instanceof HTMLElement || child instanceof SVGElement) {
        // RFC 0048 关键修复：在插入元素之前，检查是否已经存在相同的元素
        // 如果 child 已经在 parent 中，不应该再次插入
        // 这样可以防止重复插入相同的元素（特别是从 HTML 字符串解析而来的元素）
        if (child.parentNode === parent) {
            // 元素已经在 parent 中，不需要再次插入
            return;
        }
        // 确保元素不在其他父元素中
        if (child.parentNode && child.parentNode !== parent) {
            child.parentNode.removeChild(child);
        }
        // 插入到末尾
        parent.appendChild(child);
        // RFC 0048 关键修复：标记新添加的元素为已处理，防止在移除阶段被误删
        if (processedNodes) {
            processedNodes.add(child);
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
    cacheKeyMap: Map<string, HTMLElement | SVGElement>,
    processedNodes?: Set<Node>
): boolean {
    // 保留的元素不移除
    if (shouldPreserveElement(node)) {
        return false;
    }

    // 关键修复：如果文本节点已被处理，不应该移除
    if (node.nodeType === Node.TEXT_NODE && processedNodes && processedNodes.has(node)) {
        return false;
    }

    // 关键修复：如果文本节点在已处理的元素内部，不应该移除
    // 这样可以防止在元素被替换时，元素内部的文本节点被误删
    // 但是，只有当父元素还在当前 parent 的子树中时才检查
    if (node.nodeType === Node.TEXT_NODE && processedNodes) {
        let parent = node.parentNode;
        while (parent) {
            // 关键修复：只有当父元素还在 DOM 中并且在当前 parent 的子树中时才检查
            // 因为如果父元素被 replaceChild 移除了，它就不在 DOM 中了
            if (processedNodes.has(parent) && parent.parentNode) {
                return false; // 文本节点在已处理的元素内部，不应该移除
            }
            parent = parent.parentNode;
        }
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
    cacheKeyMap: Map<string, HTMLElement | SVGElement>,
    processedNodes?: Set<Node>
): Node[] {
    const nodesToRemove: Node[] = [];

    for (let i = 0; i < parent.childNodes.length; i++) {
        const node = parent.childNodes[i];
        if (shouldRemoveNode(node, elementSet, cacheKeyMap, processedNodes)) {
            nodesToRemove.push(node);
        }
    }

    return nodesToRemove;
}

/**
 * 批量移除节点（从后往前，避免索引变化）
 * @param parent - 父元素
 * @param nodes - 要移除的节点列表
 * @param cacheManager - 可选的缓存管理器，用于获取元素的 ref 回调
 */
export function removeNodes(
    parent: HTMLElement | SVGElement,
    nodes: Node[],
    cacheManager?: { getMetadata: (element: Element) => Record<string, unknown> | undefined }
): void {
    for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        if (node.parentNode === parent) {
            // 关键修复：在移除元素之前，检查是否有 ref 回调，如果有，调用它并传入 null
            // 这确保组件可以清理引用，避免使用已移除的元素
            if (cacheManager && (node instanceof HTMLElement || node instanceof SVGElement)) {
                const metadata = cacheManager.getMetadata(node);
                const refCallback = metadata?.ref;
                if (typeof refCallback === "function") {
                    try {
                        refCallback(null);
                    } catch {
                        // 忽略回调错误
                    }
                }
            }
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
