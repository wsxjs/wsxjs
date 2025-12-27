/**
 * Cache Key Generation Utilities
 *
 * Pure functions for generating cache keys for DOM elements (RFC 0037).
 * These functions are used by the jsx-factory to identify and cache DOM elements.
 */

import { RenderContext } from "../render-context";

/**
 * Internal symbol for position ID (used by Babel plugin in future)
 * For now, we use a string key for backward compatibility
 */
const POSITION_ID_KEY = "__wsxPositionId";

/**
 * Internal symbol for index (used in list scenarios)
 */
const INDEX_KEY = "__wsxIndex";

/**
 * Generates a cache key for a DOM element.
 *
 * Cache key format: `${componentId}:${tag}:${positionId}:${keyOrIndex}`
 *
 * Priority:
 * 1. User-provided key (if exists)
 * 2. Index (if in list)
 * 3. Position ID (if provided)
 * 4. Fallback to 'no-id'
 *
 * @param tag - HTML tag name
 * @param props - Element props (may contain position ID, index, or key)
 * @param componentId - Component instance ID (from RenderContext)
 * @returns Cache key string
 */
export function generateCacheKey(
    tag: string,
    props: Record<string, unknown> | null | undefined,
    componentId: string
): string {
    const positionId = props?.[POSITION_ID_KEY] ?? "no-id";
    const userKey = props?.key;
    const index = props?.[INDEX_KEY];

    // 优先级 1: 用户提供了 key → 使用 key
    if (userKey !== undefined && userKey !== null) {
        return `${componentId}:${tag}:key-${String(userKey)}`;
    }

    // 优先级 2: 列表场景 → 使用索引
    if (index !== undefined && index !== null) {
        return `${componentId}:${tag}:idx-${String(index)}`;
    }

    // 优先级 3: 普通元素 → 使用位置 ID
    return `${componentId}:${tag}:${String(positionId)}`;
}

/**
 * Gets the component ID from the current render context.
 * Falls back to 'unknown' if no context is available.
 *
 * @returns Component ID string
 */
export function getComponentId(): string {
    const component = RenderContext.getCurrentComponent();
    if (component) {
        // Use constructor name + instance ID if available
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const instanceId = (component as any)._instanceId || "default";
        return `${component.constructor.name}:${instanceId}`;
    }
    return "unknown";
}
