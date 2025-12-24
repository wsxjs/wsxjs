// Global test setup
import "@testing-library/jest-dom";

// Polyfill setImmediate for JSDOM environment (required by pino's thread-stream)
if (typeof setImmediate === "undefined") {
    (global as typeof globalThis).setImmediate = (
        callback: (...args: unknown[]) => void,
        ...args: unknown[]
    ) => {
        return setTimeout(() => {
            callback(...args);
        }, 0);
    };
    (global as typeof globalThis).clearImmediate = (id: ReturnType<typeof setTimeout>) => {
        clearTimeout(id);
    };
}

// Mock window.customElements if not available
if (typeof window !== "undefined" && !window.customElements) {
    const mockCustomElements = {
        define: jest.fn(),
        get: jest.fn(),
        whenDefined: jest.fn().mockResolvedValue(undefined),
        upgrade: jest.fn(),
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
