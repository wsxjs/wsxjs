/**
 * Element Update Utilities
 *
 * Pure functions for fine-grained DOM updates (RFC 0037 Phase 4).
 * These functions update only changed props and children, avoiding full element recreation.
 */

import { shouldUseSVGNamespace, getSVGAttributeName } from "./svg-utils";
import { type JSXChildren } from "./dom-utils";
import { setSmartProperty, isFrameworkInternalProp } from "./props-utils";
import { shouldPreserveElement, getElementCacheKey } from "./element-marking";
import type { DOMCacheManager } from "../dom-cache-manager";
import {
    collectPreservedElements,
    findElementNode,
    findTextNode,
    updateOrCreateTextNode,
    removeNodeIfNotPreserved,
    appendNewChild,
    buildNodeMaps,
    deduplicateCacheKeys,
    collectNodesToRemove,
    removeNodes,
    reinsertPreservedElements,
    flattenChildrenSafe,
    replaceOrInsertElementAtPosition,
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
        // 关键修复：移除事件监听器，避免内存泄漏
        const eventName = key.slice(2).toLowerCase();
        const listenerKey = `__wsxListener_${eventName}`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const savedListener = (element as any)[listenerKey];

        if (savedListener) {
            element.removeEventListener(eventName, savedListener);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (element as any)[listenerKey];
        }
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

        // 关键修复：移除旧的监听器，避免重复添加
        // 在元素上保存监听器引用，以便后续移除
        const listenerKey = `__wsxListener_${eventName}`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const oldListener = (element as any)[listenerKey];

        if (oldListener) {
            element.removeEventListener(eventName, oldListener);
        }

        // 添加新监听器并保存引用
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

    // 步骤 1: 构建节点映射
    // 获取旧状态的 Key -> Node 映射，用于在循环中查找复用节点 ( matchedOld )
    const { cacheKeyMap: oldKeyMap } = buildNodeMaps(flatOld);

    // 获取新状态的集合（用于清理判断）
    const newMaps = buildNodeMaps(flatNew);

    // 更新现有子节点
    const minLength = Math.min(flatOld.length, flatNew.length);
    const domIndex = { value: 0 }; // 搜索旧节点的文本节点索引
    const insertionIndex = { value: 0 }; // 逻辑插入位置的索引
    // 跟踪所有在新状态中被“承认”的节点（无论是复用的还是新增加的）
    const processedNodes = new Set<Node>();

    for (let i = 0; i < minLength; i++) {
        const oldChild = flatOld[i];
        const newChild = flatNew[i];

        // 查找对应的 DOM 节点
        let oldNode: Node | null = null;

        // 1. 优先尝试使用 Key 匹配 (RFC 0048)
        if (newChild instanceof HTMLElement || newChild instanceof SVGElement) {
            const key = getElementCacheKey(newChild);
            if (key) {
                // 从旧状态映射中查找
                const matchedOld = oldKeyMap.get(key);
                if (matchedOld && matchedOld.parentNode === element) {
                    oldNode = matchedOld;
                }
            }
        }

        // 2. 如果没有 Key 匹配，尝试按顺序匹配相同类型的容器/节点
        if (!oldNode) {
            if (oldChild instanceof HTMLElement || oldChild instanceof SVGElement) {
                // 如果 oldChild 是元素，尝试寻找它的 DOM 引用
                oldNode = findElementNode(oldChild, element);
            } else if (
                typeof oldChild === "string" ||
                typeof oldChild === "number" ||
                oldChild instanceof Node
            ) {
                // 如果是文本或通用 Node，从当前偏移位置查找第一个匹配的文本节点
                oldNode = findTextNode(element, domIndex, processedNodes);
            }
        }

        // 重要：如果找到了匹配的 oldNode，跳转 domIndex 以便下一次搜索跳过它
        if (oldNode && oldNode.parentNode === element) {
            const childrenArray = Array.from(element.childNodes);
            const nodeIndex = childrenArray.indexOf(oldNode as ChildNode);
            if (nodeIndex !== -1 && nodeIndex >= domIndex.value) {
                domIndex.value = nodeIndex + 1;
            }
        }

        // 确定插入位置
        const targetNode =
            insertionIndex.value < element.childNodes.length
                ? element.childNodes[insertionIndex.value]
                : null;

        // --- 开始协调 ---

        // 情况 A: newChild 是文本或数值 (转文本)
        const isNewTextChild =
            typeof newChild === "string" ||
            typeof newChild === "number" ||
            (newChild instanceof Node && newChild.nodeType === Node.TEXT_NODE);

        if (isNewTextChild) {
            const newTextContent =
                newChild instanceof Node ? newChild.textContent || "" : String(newChild);

            // 如果当前父元素被保留，由于我们正在更新它的内容，我们继续
            if (shouldPreserveElement(element)) continue;

            const targetMatchingNode = newChild instanceof Node ? (newChild as Node) : oldNode;

            const updatedNode = updateOrCreateTextNode(
                element,
                targetMatchingNode,
                newTextContent,
                targetNode
            );
            if (updatedNode) {
                processedNodes.add(updatedNode);
                insertionIndex.value++;
            }
        }
        // 情况 B: newChild 是 HTMLElement/SVGElement
        else if (newChild instanceof HTMLElement || newChild instanceof SVGElement) {
            replaceOrInsertElementAtPosition(
                element,
                newChild,
                oldNode,
                targetNode,
                processedNodes
            );
            insertionIndex.value++;
        }
        // 情况 C: newChild 是 DocumentFragment (兼容性回退)
        else if (newChild instanceof DocumentFragment) {
            const fragmentChildren = Array.from(newChild.childNodes);
            for (const fc of fragmentChildren) {
                processedNodes.add(fc);
            }
            element.insertBefore(newChild, targetNode);
            if (oldNode && !processedNodes.has(oldNode)) {
                removeNodeIfNotPreserved(element, oldNode);
            }
            insertionIndex.value++;
        }
    }

    // 步骤 2: 添加超出 minLength 的新子节点
    for (let i = minLength; i < flatNew.length; i++) {
        appendNewChild(element, flatNew[i], processedNodes);
    }

    // 步骤 3: 清理旧的冗余节点
    // 处理掉新状态中重复的 cache key（如果有）
    deduplicateCacheKeys(element, newMaps.cacheKeyMap);

    // 收集需要彻底移除的节点（不在 processedNodes 中且非 3rd-party 保留）
    const nodesToRemove = collectNodesToRemove(
        element,
        newMaps.elementSet,
        newMaps.cacheKeyMap,
        processedNodes,
        newMaps.nodeSet
    );

    // 执行批量删除
    removeNodes(element, nodesToRemove, _cacheManager);

    // 步骤 4: 重新插入保留元素，确保它们位于末尾
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
