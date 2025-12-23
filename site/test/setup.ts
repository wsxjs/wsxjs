// Vitest setup for examples package
import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// Mock window.customElements if not available
if (typeof window !== "undefined" && !window.customElements) {
    const mockCustomElements = {
        define: vi.fn(),
        get: vi.fn(),
        whenDefined: vi.fn().mockResolvedValue(undefined),
        upgrade: vi.fn(),
    };

    Object.defineProperty(window, "customElements", {
        value: mockCustomElements,
        writable: true,
    });
}

// Mock ShadowRoot if not available
if (typeof window !== "undefined" && !window.ShadowRoot) {
    class MockShadowRoot extends DocumentFragment {
        host: Element;
        constructor(host: Element) {
            super();
            this.host = host;
        }
    }

    Object.defineProperty(window, "ShadowRoot", {
        value: MockShadowRoot,
        writable: true,
    });
}

// Mock CSS.supports if not available
if (typeof CSS === "undefined") {
    (globalThis as Record<string, unknown>).CSS = {
        supports: vi.fn(() => false),
    };
}

// Mock constructable stylesheets if not available
if (typeof CSSStyleSheet === "undefined") {
    (globalThis as Record<string, unknown>).CSSStyleSheet = class {
        replaceSync() {}
    };
}
