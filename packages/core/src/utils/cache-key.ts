/**
 * Cache Key Generation Utilities
 *
 * Pure functions for generating cache keys for DOM elements (RFC 0037).
 * These functions are used by the jsx-factory to identify and cache DOM elements.
 */

import { RenderContext } from "../render-context";
import type { BaseComponent } from "../base-component";

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
 * Component-level element counters (using WeakMap to avoid memory leaks)
 * Each component instance maintains its own counter to ensure unique cache keys
 * when position ID is not available.
 */
const componentElementCounters = new WeakMap<BaseComponent, number>();

/**
 * Component ID cache (using WeakMap to avoid memory leaks)
 * Caches component IDs to avoid recomputing them on every render.
 */
const componentIdCache = new WeakMap<BaseComponent, string>();

/**
 * Generates a cache key for a DOM element.
 *
 * Cache key format: `${componentId}:${tag}:${identifier}`
 *
 * Priority:
 * 1. User-provided key (if exists) - most reliable
 * 2. Index (if in list scenario)
 * 3. Position ID (if provided and valid)
 * 4. Component-level counter (runtime fallback, ensures uniqueness)
 * 5. Timestamp fallback (last resort, ensures uniqueness)
 *
 * @param tag - HTML tag name
 * @param props - Element props (may contain position ID, index, or key)
 * @param componentId - Component instance ID (from RenderContext)
 * @param component - Optional component instance (for counter-based fallback)
 * @returns Cache key string
 */
export function generateCacheKey(
    tag: string,
    props: Record<string, unknown> | null | undefined,
    componentId: string,
    component?: BaseComponent
): string {
    const positionId = props?.[POSITION_ID_KEY];
    const userKey = props?.key;
    const index = props?.[INDEX_KEY];

    // 优先级 1: 用户 key（最可靠）
    if (userKey !== undefined && userKey !== null) {
        return `${componentId}:${tag}:key-${String(userKey)}`;
    }

    // 优先级 2: 索引（列表场景）
    if (index !== undefined && index !== null) {
        return `${componentId}:${tag}:idx-${String(index)}`;
    }

    // 优先级 3: 位置 ID（编译时注入，如果有效）
    if (positionId !== undefined && positionId !== null && positionId !== "no-id") {
        return `${componentId}:${tag}:${String(positionId)}`;
    }

    // 优先级 4: 组件级别计数器（运行时回退，确保唯一性）
    // 注意：计数器在 RenderContext.runInContext 开始时已重置
    if (component) {
        let counter = componentElementCounters.get(component) || 0;
        counter++;
        componentElementCounters.set(component, counter);
        return `${componentId}:${tag}:auto-${counter}`;
    }

    // 最后回退：时间戳（不推荐，但确保唯一性）
    return `${componentId}:${tag}:fallback-${Date.now()}-${Math.random()}`;
}

/**
 * Resets the element counter for a component when a new render cycle starts.
 * This should be called at the beginning of RenderContext.runInContext.
 *
 * @param component - The component instance starting a new render cycle
 * @internal
 */
export function resetCounterForNewRenderCycle(component: BaseComponent): void {
    // 新的渲染周期开始，直接重置计数器
    componentElementCounters.set(component, 0);
}

/**
 * Gets the component ID from the current render context.
 * Falls back to 'unknown' if no context is available.
 * Uses caching to avoid recomputing the ID on every call.
 *
 * @returns Component ID string
 */
export function getComponentId(): string {
    const component = RenderContext.getCurrentComponent();
    if (component) {
        // Check cache first
        let cachedId = componentIdCache.get(component);
        if (cachedId) {
            return cachedId;
        }

        // Compute and cache
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const instanceId = (component as any)._instanceId || "default";
        cachedId = `${component.constructor.name}:${instanceId}`;
        componentIdCache.set(component, cachedId);
        return cachedId;
    }
    return "unknown";
}
