import { DOMCacheManager } from "../src/dom-cache-manager";
import { BaseComponent } from "../src/base-component";
import { RenderContext } from "../src/render-context";

class MockComponentWithCache extends BaseComponent {
    render(): HTMLElement {
        return document.createElement("div");
    }

    protected _rerender(): void {
        // Mock implementation
    }
}

customElements.define("test-dom-cache-component", MockComponentWithCache);

describe("DOMCacheManager", () => {
    let manager: DOMCacheManager;

    beforeEach(() => {
        manager = new DOMCacheManager();
    });

    test("caches elements by key", () => {
        const el = document.createElement("div");
        manager.set("key1", el);
        expect(manager.get("key1")).toBe(el);
        expect(manager.has("key1")).toBe(true);
    });

    test("returns undefined for missing keys", () => {
        expect(manager.get("missing")).toBeUndefined();
    });

    test("clears cache", () => {
        manager.set("key1", document.createElement("div"));
        manager.clear();
        expect(manager.has("key1")).toBe(false);
    });

    test("stores metadata for elements", () => {
        const el = document.createElement("div");
        const meta = { prop: "value" };
        manager.setMetadata(el, meta);
        expect(manager.getMetadata(el)).toBe(meta);
    });
});

describe("Integration: RenderContext access to DOMCache", () => {
    test("RenderContext exposes current component cache", () => {
        const component = new MockComponentWithCache();
        const cache = component.getDomCache();

        expect(cache).toBeInstanceOf(DOMCacheManager);

        RenderContext.runInContext(component, () => {
            expect(RenderContext.getDOMCache()).toBe(cache);
        });

        expect(RenderContext.getDOMCache()).toBeUndefined();
    });
});
