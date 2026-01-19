/**
 * Element Marking Utilities
 *
 * Pure functions for marking and identifying DOM elements created by h() (RFC 0037).
 * Core rule: All elements created by h() must be marked with __wsxCacheKey.
 * Unmarked elements (custom elements, third-party library injected) should be preserved.
 */

/**
 * Internal property name for cache key on DOM elements
 */
const CACHE_KEY_PROP = "__wsxCacheKey";

/**
 * Marks an element with a cache key.
 * This marks the element as created by h() and eligible for framework management.
 *
 * @param element - DOM element to mark
 * @param cacheKey - Cache key to store on the element
 */
export function markElement(element: HTMLElement | SVGElement, cacheKey: string): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (element as any)[CACHE_KEY_PROP] = cacheKey;
}

/**
 * Gets the cache key from an element.
 * Returns null if the element is not marked (not created by h()).
 *
 * @param element - DOM element to check
 * @returns Cache key string or null
 */
export function getElementCacheKey(element: HTMLElement | SVGElement): string | null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const key = (element as any)[CACHE_KEY_PROP];
    return key !== undefined ? String(key) : null;
}

/**
 * Checks if an element was created by h().
 * Core rule: Elements with __wsxCacheKey are created by h() and can be managed by the framework.
 * Elements without this mark should be preserved (custom elements, third-party library injected).
 *
 * @param element - DOM element to check
 * @returns True if element was created by h()
 */
export function isCreatedByH(element: Node): boolean {
    if (!(element instanceof HTMLElement || element instanceof SVGElement)) {
        return false;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (element as any)[CACHE_KEY_PROP] !== undefined;
}

/**
 * Checks if an element should be preserved during DOM updates.
 * Core rule: Unmarked elements (custom elements, third-party library injected) should be preserved.
 *
 * @param element - DOM element to check
 * @returns True if element should be preserved
 */
export function shouldPreserveElement(element: Node): boolean {
    // 规则 1: 非元素节点（如文本节点）不再默认保留
    // 它们应该通过 updateChildren 的 processedNodes 机制由框架管理
    // 只有当它们的父元素是保留元素时，它们才会被保留（在 shouldRemoveNode 中处理）
    if (!(element instanceof HTMLElement || element instanceof SVGElement)) {
        return false;
    }

    // 规则 2: 没有标记的元素保留（自定义元素、第三方库注入）
    // 关键修正：除了检查是否由 h() 创建，还要检查是否被框架显式标记为托管 (__wsxManaged)
    // 这主要用于处理从 HTML 字符串解析出的元素 (parseHTMLToNodes)
    if (!isCreatedByH(element) && (element as any).__wsxManaged !== true) {
        return true;
    }

    // 规则 3: 显式标记保留
    if (element instanceof HTMLElement && element.hasAttribute("data-wsx-preserve")) {
        return true;
    }

    // 规则 4: 由 h() 创建或被标记为托管的元素 → 不保留（由框架管理）
    return false;
}
