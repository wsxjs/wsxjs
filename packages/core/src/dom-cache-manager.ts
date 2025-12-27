import { createLogger } from "./utils/logger";

const logger = createLogger("DOMCacheManager");

/**
 * Parent container information for duplicate key detection
 */
interface ParentInfo {
    parentTag: string;
    parentClass: string;
    element: Element;
}

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

    // Track key-parent relationships to detect duplicate keys in all environments
    // Map<CacheKey, ParentInfo>
    private keyParentMap = new Map<string, ParentInfo>();

    // Flag to enable duplicate key warnings (enabled by default, critical for correctness)
    private warnDuplicateKeys = true;

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
        // Always check for duplicate keys (critical for correctness)
        if (this.warnDuplicateKeys) {
            this.checkDuplicateKey(key, element);
        }

        this.cache.set(key, element);
    }

    /**
     * Checks if a cache key is being reused in a different parent container.
     * Runs in all environments to help developers catch key conflicts early.
     * This is critical for correctness and helps prevent subtle bugs.
     */
    private checkDuplicateKey(key: string, element: Element): void {
        const existing = this.keyParentMap.get(key);
        const currentParent = element.parentElement;

        if (existing && currentParent) {
            const currentParentInfo = this.getParentInfo(currentParent);
            const existingParentInfo = `${existing.parentTag}${existing.parentClass ? "." + existing.parentClass : ""}`;

            // Check if the element is being used in a different parent container
            if (currentParentInfo !== existingParentInfo) {
                logger.warn(
                    `Duplicate key "${key}" detected in different parent containers!\n` +
                        `  Previous parent: ${existingParentInfo}\n` +
                        `  Current parent:  ${currentParentInfo}\n` +
                        `\n` +
                        `This may cause elements to appear in wrong containers or be moved unexpectedly.\n` +
                        `\n` +
                        `Solution: Use unique key prefixes for different locations:\n` +
                        `  Example: <wsx-link key="nav-0"> vs <wsx-link key="overflow-0">\n` +
                        `\n` +
                        `See https://wsxjs.dev/docs/guide/DOM_CACHE_GUIDE for best practices.`
                );
            }
        }

        // Track this key-parent relationship for future checks
        if (currentParent) {
            this.keyParentMap.set(key, {
                parentTag: currentParent.tagName.toLowerCase(),
                parentClass: currentParent.className,
                element,
            });
        }
    }

    /**
     * Gets a formatted parent container description.
     */
    private getParentInfo(parent: Element): string {
        const tag = parent.tagName.toLowerCase();
        const className = parent.className;
        return `${tag}${className ? "." + className.split(" ")[0] : ""}`;
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
