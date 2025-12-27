import { BaseComponent } from "./base-component";
import { resetCounterForNewRenderCycle } from "./utils/cache-key";

/**
 * RenderContext
 *
 * Tracks the currently rendering component instance.
 * improved for RFC 0037 to support DOM caching and optimization.
 */
export class RenderContext {
    private static current: BaseComponent | null = null;

    /**
     * Executes a function within the context of a component.
     * @param component The component instance currently rendering.
     * @param fn The function to execute (usually the render method).
     */
    static runInContext<T>(component: BaseComponent, fn: () => T): T {
        // 重置计数器以标记新的渲染周期开始
        resetCounterForNewRenderCycle(component);

        const prev = RenderContext.current;
        RenderContext.current = component;
        try {
            return fn();
        } finally {
            RenderContext.current = prev;
        }
    }

    /**
     * Gets the currently rendering component.
     */
    static getCurrentComponent(): BaseComponent | null {
        return RenderContext.current;
    }

    /**
     * Gets the current component's DOM cache.
     */
    static getDOMCache() {
        return RenderContext.current?.getDomCache();
    }
}
