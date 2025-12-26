/**
 * DOMCacheManager
 *
 * Manages DOM element caching for fine-grained updates (RFC 0037).
 * Stores elements by unique keys derived from component ID + position/key.
 */
export class DOMCacheManager {
    // Map<CacheKey, DOMElement>
    private cache = new Map<string, Element>();

    // Map<DOMElement, Metadata>
    // Stores metadata (props, children) for cached elements to support diffing
    private metadata = new WeakMap<Element, Record<string, unknown>>();

    /**
     * Retrieves an element from the cache.
     * @param key The unique cache key.
     */
    get(key: string): Element | undefined {
        return this.cache.get(key);
    }

    /**
     * Stores an element in the cache.
     * @param key The unique cache key.
     * @param element The DOM element to cache.
     */
    set(key: string, element: Element): void {
        this.cache.set(key, element);
    }

    /**
     * Checks if a key exists in the cache.
     */
    has(key: string): boolean {
        return this.cache.has(key);
    }

    /**
     * Clears the cache.
     * Should be called when component is disconnected or cache is invalidated.
     */
    clear(): void {
        this.cache.clear();
        // WeakMap doesn't need clearing
    }

    /**
     * Stores metadata for an element (e.g. previous props).
     */
    setMetadata(element: Element, meta: Record<string, unknown>): void {
        this.metadata.set(element, meta);
    }

    /**
     * Retrieves metadata for an element.
     */
    getMetadata(element: Element): Record<string, unknown> | undefined {
        return this.metadata.get(element);
    }
}
