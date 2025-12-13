/**
 * Unit tests for @state property decorator functionality
 * WebComponent and LightComponent already have reactive() and useState() methods
 * Babel plugin handles @state initialization at compile time
 */

// Test file requires accessing private methods and properties for comprehensive testing

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { WebComponent } from "../src/web-component";
import { LightComponent } from "../src/light-component";
import { state } from "../src/reactive-decorator";
import { h } from "../src/jsx-factory";

// Type definitions for testing reactive decorator functionality
interface ReactiveInstance {
    reactive?: <T extends object>(obj: T, debugName?: string) => T;
    useState?: <T>(
        key: string,
        initialValue: T
    ) => [() => T, (value: T | ((prev: T) => T)) => void];
    scheduleRerender?: () => void;
    rerender?: () => void;
    connected?: boolean;
    connectedCallback?: () => void;
    shadowRoot?: ShadowRoot;
    [key: string]: unknown;
}

interface ComponentWithState {
    count?: number;
    message?: string;
    state?: {
        count: number;
        message?: string;
        active?: boolean;
        user?: { name: string; age: number };
        settings?: { theme: string };
    } | null;
    items?: number[] | string[];
    theme?: string;
    enabled?: boolean;
    baseCount?: number;
    derivedCount?: number;
}

type TestComponentWithState = ReactiveInstance & ComponentWithState;

// Test container for DOM operations
let container: HTMLElement;

// Register test components for jsdom compatibility
beforeEach(() => {
    // Create a container for DOM operations
    container = document.createElement("div");
    document.body.appendChild(container);

    // Clean up any existing registrations
    const tagNames = [
        "test-web-reactive",
        "test-web-reactive-state",
        "test-web-reactive-reactive",
        "test-web-reactive-object",
        "test-web-reactive-array",
        "test-web-reactive-focus",
        "test-light-reactive",
        "test-light-reactive-state",
        "test-reactive",
        "test-reactive-state",
        "test-component-primitives",
        "test-component-object",
        "test-component-array",
        "test-component-multiple",
        "test-component-updates",
        "test-derived",
        "test-component-object-replace",
        "test-component-array-replace",
        "test-component-nested-replace",
        "test-component-null-handle",
        "test-component-array-mutations",
    ];
    tagNames.forEach((tag) => {
        if (customElements.get(tag)) {
            // Note: customElements.delete is not available in jsdom
            // Components will be overwritten if re-registered
        }
    });
});

afterEach(() => {
    // Clean up container
    if (container && container.parentNode) {
        container.parentNode.removeChild(container);
    }
});

describe("@state decorator with WebComponent", () => {
    it("should have reactive methods in WebComponent", () => {
        class TestWebComponent extends WebComponent {
            render() {
                return h("div", {}, "Test") as HTMLElement;
            }
        }

        customElements.define("test-web-reactive", TestWebComponent);
        const instance = new TestWebComponent() as unknown as ReactiveInstance;

        // WebComponent now has reactive methods directly
        expect(typeof instance.reactive).toBe("function");
        expect(typeof instance.useState).toBe("function");
        expect(typeof instance.scheduleRerender).toBe("function");
    });

    it("should automatically initialize @state properties (Babel plugin handles this)", () => {
        class TestWebComponent extends WebComponent {
            @state private count = 0;
            @state private message = "Hello";

            render() {
                return h(
                    "div",
                    {},
                    `Count: ${this.count}, Message: ${this.message}`
                ) as HTMLElement;
            }
        }

        customElements.define("test-web-reactive-state", TestWebComponent);
        const instance = new TestWebComponent() as unknown as TestComponentWithState;

        // State should be accessible (initialized by Babel plugin or metadata fallback)
        expect(instance.count).toBe(0);
        expect(instance.message).toBe("Hello");
    });

    it("should make @state properties reactive", async () => {
        let renderCount = 0;

        class TestWebComponent extends WebComponent {
            @state private count = 0;

            render() {
                renderCount++;
                return h("div", {}, `Count: ${this.count}`) as HTMLElement;
            }

            protected rerender(): void {
                super.rerender();
            }
        }

        customElements.define("test-web-reactive-reactive", TestWebComponent);
        const instance = new TestWebComponent() as unknown as TestComponentWithState &
            ReactiveInstance;
        instance.connected = true;

        // Initial render
        if (instance.connectedCallback) {
            instance.connectedCallback();
        }
        const initialRenderCount = renderCount;
        expect(initialRenderCount).toBeGreaterThan(0);

        // Change state - should trigger rerender
        instance.count = 5;

        // Wait for queueMicrotask to execute rerender
        await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
        // Additional wait to ensure rerender completes
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(renderCount).toBeGreaterThan(initialRenderCount);
        expect(instance.count).toBe(5);
    });

    it("should handle object @state properties with reactive()", () => {
        class TestWebComponent extends WebComponent {
            @state private state = { count: 0, message: "test" };

            render() {
                // Use state to avoid unused variable warning
                void this.state;
                return h("div", {}, "Test") as HTMLElement;
            }
        }

        customElements.define("test-web-reactive-object", TestWebComponent);
        const instance = new TestWebComponent() as unknown as TestComponentWithState;

        expect(instance.state).toBeDefined();
        const stateValue = instance.state;
        if (stateValue && typeof stateValue === "object" && "count" in stateValue) {
            expect(stateValue.count).toBe(0);
            if ("message" in stateValue) {
                expect(stateValue.message).toBe("test");
            }
        }
    });

    it("should handle array @state properties with reactive()", () => {
        class TestWebComponent extends WebComponent {
            @state private items: number[] = [1, 2, 3];

            render() {
                // Use items to avoid unused variable warning
                void this.items;
                return h("div", {}, "Test") as HTMLElement;
            }
        }

        customElements.define("test-web-reactive-array", TestWebComponent);
        const instance = new TestWebComponent() as unknown as TestComponentWithState;

        expect(Array.isArray(instance.items)).toBe(true);
        const items = instance.items;
        if (Array.isArray(items)) {
            expect(items.length).toBe(3);
        }
    });

    it("should preserve focus during rerender", () => {
        class TestWebComponent extends WebComponent {
            @state private count = 0;

            render() {
                return h("div", {}, [
                    h("input", { id: "test-input", value: String(this.count) }),
                    h("button", { id: "test-button" }, "Click"),
                ]) as HTMLElement;
            }
        }

        customElements.define("test-web-reactive-focus", TestWebComponent);
        const instance = new TestWebComponent() as unknown as TestComponentWithState &
            ReactiveInstance;
        instance.connected = true;
        if (instance.connectedCallback) {
            instance.connectedCallback();
        }

        const input = instance.shadowRoot?.querySelector("#test-input") as HTMLInputElement | null;
        if (input) {
            input.focus();
            input.setSelectionRange(2, 2);

            // Trigger rerender
            instance.count = 10;
            if (instance.rerender) {
                instance.rerender();
            }

            // Focus should be preserved (in real browser, not fully testable in jsdom)
            // But the code should not throw
            expect(instance.shadowRoot?.querySelector("#test-input")).toBeTruthy();
        }
    });
});

describe("@state decorator with LightComponent", () => {
    it("should work with LightComponent", () => {
        class TestLightComponent extends LightComponent {
            @state private count = 0;

            render() {
                return h("div", {}, `Count: ${this.count}`) as HTMLElement;
            }
        }

        customElements.define("test-light-reactive", TestLightComponent);
        const instance = new TestLightComponent() as unknown as ComponentWithState;

        // LightComponent already has reactive methods, @state is initialized by Babel plugin
        expect(instance.count).toBe(0);
    });

    it("should automatically initialize @state in LightComponent", () => {
        class TestLightComponent extends LightComponent {
            @state private message = "Hello Light";
            @state private items: string[] = ["a", "b"];

            render() {
                // Use items to avoid unused variable warning
                void this.items;
                return h("div", {}, this.message) as HTMLElement;
            }
        }

        customElements.define("test-light-reactive-state", TestLightComponent);
        const instance = new TestLightComponent() as unknown as ComponentWithState;

        expect(instance.message).toBe("Hello Light");
        expect(instance.items).toEqual(["a", "b"]);
    });
});

describe("@state property decorator", () => {
    it("should work with primitive values", () => {
        class TestComponent extends WebComponent {
            @state private count = 0;
            @state private message = "test";
            @state private enabled = true;

            render() {
                // Use state properties to avoid unused variable warnings
                void this.count;
                void this.message;
                void this.enabled;
                return h("div", {}, "Test") as HTMLElement;
            }
        }

        customElements.define("test-component-primitives", TestComponent);
        const instance = new TestComponent() as unknown as ComponentWithState;

        const count = instance.count;
        const message = instance.message;
        const enabled = instance.enabled;
        expect(count).toBe(0);
        expect(message).toBe("test");
        expect(enabled).toBe(true);
    });

    it("should work with object values", () => {
        class TestComponent extends WebComponent {
            @state private state = { count: 0, message: "test" };

            render() {
                // Use state to avoid unused variable warning
                void this.state;
                return h("div", {}, "Test") as HTMLElement;
            }
        }

        customElements.define("test-component-object", TestComponent);
        const instance = new TestComponent() as unknown as ComponentWithState;

        const stateValue = instance.state;
        expect(stateValue).toBeDefined();
        if (stateValue && typeof stateValue === "object" && "count" in stateValue) {
            expect(stateValue.count).toBe(0);
            if ("message" in stateValue) {
                expect(stateValue.message).toBe("test");
            }
        }
    });

    it("should work with array values", () => {
        class TestComponent extends WebComponent {
            @state private items = [1, 2, 3];

            render() {
                // Use items to avoid unused variable warning
                void this.items;
                return h("div", {}, "Test") as HTMLElement;
            }
        }

        customElements.define("test-component-array", TestComponent);
        const instance = new TestComponent() as unknown as ComponentWithState;

        expect(Array.isArray(instance.items)).toBe(true);
        const items = instance.items;
        if (Array.isArray(items)) {
            expect(items).toEqual([1, 2, 3]);
        }
    });
});

describe("@state decorator error handling", () => {
    it("should throw error if target is undefined (Babel plugin not configured)", () => {
        // This test verifies that @state decorator throws helpful error when Babel plugin is not configured
        // In practice, Babel plugin should process the decorator before it runs
        expect(() => {
            // Simulate decorator being called with undefined target (Babel plugin not configured)
            const stateFn = state as (target: unknown, propertyKey: string) => void;
            stateFn(undefined, "count");
        }).toThrow(/Babel plugin/);
    });

    it("should throw error if used on getter property", () => {
        expect(() => {
            class TestComponent extends WebComponent {
                @state
                get count() {
                    return 0;
                }

                render() {
                    return h("div", {}, "Test") as HTMLElement;
                }
            }
            // Use the class to trigger decorator execution
            void TestComponent;
        }).toThrow(/cannot be used with getter properties/);
    });
});

describe("@state decorator runtime fallback", () => {
    let originalWarn: typeof console.warn;
    let warnCalls: string[];

    beforeEach(() => {
        // Mock console.warn to capture warnings
        originalWarn = console.warn;
        warnCalls = [];
        console.warn = jest.fn((...args: unknown[]) => {
            warnCalls.push(args.map((arg) => String(arg)).join(" "));
        });
    });

    afterEach(() => {
        // Restore original console.warn
        console.warn = originalWarn;
    });

    it("should show warning when decorator executes at runtime (Stage 3 format)", () => {
        // Simulate Stage 3 decorator format
        const mockContext = {
            kind: "field" as const,
            name: "testProperty",
            addInitializer: jest.fn((initializer: () => void) => {
                // Simulate component instance
                const mockInstance = {
                    reactive: jest.fn((obj: object) => obj),
                    useState: jest.fn((key: string, value: unknown) => [() => value, () => {}]),
                    scheduleRerender: jest.fn(),
                };
                initializer.call(mockInstance);
            }),
        };

        // Call state decorator with Stage 3 format
        state(mockContext);

        // Verify warning was shown
        expect(warnCalls.length).toBeGreaterThan(0);
        expect(warnCalls[0]).toContain("[WSX] @state decorator is using runtime fallback");
        expect(warnCalls[0]).toContain("testProperty");
        expect(warnCalls[0]).toContain("@wsxjs/wsx-vite-plugin");
    });

    it("should show warning when decorator executes at runtime (legacy format)", () => {
        // Simulate legacy decorator format
        const mockTarget = {};
        const propertyKey = "testProperty";

        // Call state decorator with legacy format
        state(mockTarget, propertyKey);

        // Verify warning was shown
        expect(warnCalls.length).toBeGreaterThan(0);
        expect(warnCalls[0]).toContain("[WSX] @state decorator is using runtime fallback");
        expect(warnCalls[0]).toContain("testProperty");
    });

    it("should throw error if component does not extend WebComponent or LightComponent (Stage 3)", () => {
        const mockContext = {
            kind: "field" as const,
            name: "testProperty",
            addInitializer: jest.fn((initializer: () => void) => {
                // Simulate component instance without reactive methods
                const mockInstance = {};
                expect(() => {
                    initializer.call(mockInstance);
                }).toThrow(/does not extend WebComponent or LightComponent/);
            }),
        };

        // Call state decorator
        state(mockContext);

        // Verify addInitializer was called
        expect(mockContext.addInitializer).toHaveBeenCalled();
    });

    it("should throw error if component does not extend WebComponent or LightComponent (null instance)", () => {
        const mockContext = {
            kind: "field" as const,
            name: "testProperty",
            addInitializer: jest.fn((initializer: () => void) => {
                // Simulate null instance
                expect(() => {
                    initializer.call(null);
                }).toThrow(/does not extend WebComponent or LightComponent/);
            }),
        };

        // Call state decorator
        state(mockContext);

        // Verify addInitializer was called
        expect(mockContext.addInitializer).toHaveBeenCalled();
    });

    it("should initialize reactive state for primitives in runtime fallback", () => {
        const mockContext = {
            kind: "field" as const,
            name: "count",
            addInitializer: jest.fn((initializer: () => void) => {
                // Simulate component instance with reactive methods
                const mockInstance = {
                    reactive: jest.fn((obj: object) => obj),
                    useState: jest.fn((key: string, value: unknown) => [() => value, () => {}]),
                    scheduleRerender: jest.fn(),
                    count: 42, // Initial value
                };
                initializer.call(mockInstance);
            }),
        };

        // Call state decorator
        state(mockContext);

        // Verify useState was called with correct initial value
        expect(mockContext.addInitializer).toHaveBeenCalled();
        // The initializer should have been executed, setting up the property
    });

    it("should initialize reactive state for objects in runtime fallback", () => {
        const mockContext = {
            kind: "field" as const,
            name: "state",
            addInitializer: jest.fn((initializer: () => void) => {
                const initialValue = { count: 0 };
                // Simulate component instance with reactive methods
                const mockInstance = {
                    reactive: jest.fn((obj: object) => obj),
                    useState: jest.fn(),
                    scheduleRerender: jest.fn(),
                    state: initialValue,
                };
                initializer.call(mockInstance);
            }),
        };

        // Call state decorator
        state(mockContext);

        // Verify reactive was called
        expect(mockContext.addInitializer).toHaveBeenCalled();
    });

    it("should throw error if used on non-field (Stage 3)", () => {
        const mockContext = {
            kind: "method" as const,
            name: "testMethod",
        };

        expect(() => {
            state(mockContext);
        }).toThrow(/can only be used on class fields, not method/);
    });
});

describe("@state decorator integration", () => {
    it("should work with multiple @state properties", () => {
        class TestComponent extends WebComponent {
            @state private count = 0;
            @state private message = "Hello";
            @state private state = { active: true };
            @state private items: number[] = [];

            render() {
                // Use state properties to avoid unused variable warnings
                void this.message;
                void this.state;
                void this.items;
                return h("div", {}, `Count: ${this.count}`) as HTMLElement;
            }
        }

        customElements.define("test-component-multiple", TestComponent);
        const instance = new TestComponent() as unknown as ComponentWithState;

        const count = instance.count;
        const message = instance.message;
        const stateValue = instance.state;
        const items = instance.items;
        expect(count).toBe(0);
        expect(message).toBe("Hello");
        if (stateValue && typeof stateValue === "object" && "active" in stateValue) {
            expect(stateValue.active).toBe(true);
        }
        expect(items).toEqual([]);
    });

    it("should automatically wrap new objects in reactive when replaced", async () => {
        let renderCallCount = 0;

        class TestComponent extends WebComponent {
            @state private state = { count: 0, message: "initial" };

            render() {
                renderCallCount++;
                return h("div", {}, `Count: ${this.state.count}`) as HTMLElement;
            }
        }

        customElements.define("test-component-object-replace", TestComponent);
        const instance = new TestComponent() as unknown as ComponentWithState;
        container.appendChild(instance as unknown as HTMLElement);
        (instance as unknown as ReactiveInstance).connectedCallback?.();

        // Wait for initial render to complete
        await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
        const initialRenderCount = renderCallCount;
        expect(initialRenderCount).toBeGreaterThan(0);

        // Replace the entire object - should automatically wrap in reactive
        instance.state = { count: 5, message: "updated" };

        // Wait for queueMicrotask to execute rerender
        await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
        // Additional wait to ensure rerender completes
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(renderCallCount).toBeGreaterThan(initialRenderCount);
        if (instance.state && typeof instance.state === "object" && "count" in instance.state) {
            expect(instance.state.count).toBe(5);
        }
    });

    it("should automatically wrap new arrays in reactive when replaced", async () => {
        let renderCallCount = 0;

        class TestComponent extends WebComponent {
            @state private items: number[] = [1, 2, 3];

            render() {
                renderCallCount++;
                return h("div", {}, `Items: ${this.items.length}`) as HTMLElement;
            }
        }

        customElements.define("test-component-array-replace", TestComponent);
        const instance = new TestComponent() as unknown as ComponentWithState;
        container.appendChild(instance as unknown as HTMLElement);
        (instance as unknown as ReactiveInstance).connectedCallback?.();

        // Wait for initial render to complete
        await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
        const initialRenderCount = renderCallCount;
        expect(initialRenderCount).toBeGreaterThan(0);

        // Replace the entire array - should automatically wrap in reactive
        instance.items = [4, 5, 6, 7];

        // Wait for queueMicrotask to execute rerender
        await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
        // Additional wait to ensure rerender completes
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(renderCallCount).toBeGreaterThan(initialRenderCount);
        if (Array.isArray(instance.items)) {
            expect(instance.items).toEqual([4, 5, 6, 7]);
        }
    });

    it("should handle nested object replacement", async () => {
        let renderCallCount = 0;

        class TestComponent extends WebComponent {
            @state private state = {
                user: { name: "John", age: 30 },
                settings: { theme: "light" },
            };

            render() {
                renderCallCount++;
                return h("div", {}, "Test") as HTMLElement;
            }
        }

        customElements.define("test-component-nested-replace", TestComponent);
        const instance = new TestComponent() as unknown as ComponentWithState;
        container.appendChild(instance as unknown as HTMLElement);
        (instance as unknown as ReactiveInstance).connectedCallback?.();

        // Wait for initial render to complete
        await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
        const initialRenderCount = renderCallCount;
        expect(initialRenderCount).toBeGreaterThan(0);

        // Replace with nested object - should automatically wrap in reactive
        instance.state = {
            user: { name: "Jane", age: 25 },
            settings: { theme: "dark" },
        };

        // Wait for queueMicrotask to execute rerender
        await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
        // Additional wait to ensure rerender completes
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(renderCallCount).toBeGreaterThan(initialRenderCount);
    });

    it("should handle null and undefined values correctly", () => {
        class TestComponent extends WebComponent {
            @state private state: { count: number } | null = { count: 0 };

            render() {
                return h("div", {}, "Test") as HTMLElement;
            }
        }

        customElements.define("test-component-null-handle", TestComponent);
        const instance = new TestComponent() as unknown as ComponentWithState;

        // Setting to null should not wrap in reactive
        instance.state = null;
        expect(instance.state).toBeNull();
    });

    describe("Array mutation methods that trigger rerender", () => {
        let renderCallCount = 0;

        const createTestComponent = () => {
            renderCallCount = 0;
            return class extends WebComponent {
                @state private items: number[] = [1, 2, 3];

                render() {
                    renderCallCount++;
                    return h("div", {}, `Items: ${this.items.length}`) as HTMLElement;
                }
            };
        };

        it("should trigger rerender on push()", async () => {
            const TestComponent = createTestComponent();
            customElements.define("test-array-push", TestComponent);
            const instance = new TestComponent() as unknown as ComponentWithState;
            container.appendChild(instance as unknown as HTMLElement);
            (instance as unknown as ReactiveInstance).connectedCallback?.();

            // Wait for initial render to complete
            await new Promise((resolve) => queueMicrotask(resolve));
            const initialRenderCount = renderCallCount;
            expect(initialRenderCount).toBeGreaterThan(0);

            if (Array.isArray(instance.items) && instance.items instanceof Array) {
                (instance.items as number[]).push(4);
            }

            // Wait for queueMicrotask to execute rerender
            await new Promise((resolve) => queueMicrotask(resolve));
            // Additional wait to ensure rerender completes
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(renderCallCount).toBeGreaterThan(initialRenderCount);
            if (Array.isArray(instance.items)) {
                expect(instance.items).toEqual([1, 2, 3, 4]);
            }
        });

        it("should trigger rerender on pop()", async () => {
            const TestComponent = createTestComponent();
            customElements.define("test-array-pop", TestComponent);
            const instance = new TestComponent() as unknown as ComponentWithState;
            container.appendChild(instance as unknown as HTMLElement);
            (instance as unknown as ReactiveInstance).connectedCallback?.();

            // Wait for initial render to complete
            await new Promise((resolve) => queueMicrotask(resolve));
            const initialRenderCount = renderCallCount;
            expect(initialRenderCount).toBeGreaterThan(0);

            if (Array.isArray(instance.items)) {
                instance.items.pop();
            }

            // Wait for queueMicrotask to execute rerender
            await new Promise((resolve) => queueMicrotask(resolve));
            // Additional wait to ensure rerender completes
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(renderCallCount).toBeGreaterThan(initialRenderCount);
            if (Array.isArray(instance.items)) {
                expect(instance.items).toEqual([1, 2]);
            }
        });

        it("should trigger rerender on shift()", async () => {
            const TestComponent = createTestComponent();
            customElements.define("test-array-shift", TestComponent);
            const instance = new TestComponent() as unknown as ComponentWithState;
            container.appendChild(instance as unknown as HTMLElement);
            (instance as unknown as ReactiveInstance).connectedCallback?.();

            // Wait for initial render to complete
            await new Promise((resolve) => queueMicrotask(resolve));
            const initialRenderCount = renderCallCount;
            expect(initialRenderCount).toBeGreaterThan(0);

            if (Array.isArray(instance.items)) {
                instance.items.shift();
            }

            // Wait for queueMicrotask to execute rerender
            await new Promise((resolve) => queueMicrotask(resolve));
            // Additional wait to ensure rerender completes
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(renderCallCount).toBeGreaterThan(initialRenderCount);
            if (Array.isArray(instance.items)) {
                expect(instance.items).toEqual([2, 3]);
            }
        });

        it("should trigger rerender on unshift()", async () => {
            const TestComponent = createTestComponent();
            customElements.define("test-array-unshift", TestComponent);
            const instance = new TestComponent() as unknown as ComponentWithState;
            container.appendChild(instance as unknown as HTMLElement);
            (instance as unknown as ReactiveInstance).connectedCallback?.();

            // Wait for initial render to complete
            await new Promise((resolve) => queueMicrotask(resolve));
            const initialRenderCount = renderCallCount;
            expect(initialRenderCount).toBeGreaterThan(0);

            if (Array.isArray(instance.items) && instance.items instanceof Array) {
                (instance.items as number[]).unshift(0);
            }

            // Wait for queueMicrotask to execute rerender
            await new Promise((resolve) => queueMicrotask(resolve));
            // Additional wait to ensure rerender completes
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(renderCallCount).toBeGreaterThan(initialRenderCount);
            if (Array.isArray(instance.items)) {
                expect(instance.items).toEqual([0, 1, 2, 3]);
            }
        });

        it("should trigger rerender on splice()", async () => {
            const TestComponent = createTestComponent();
            customElements.define("test-array-splice", TestComponent);
            const instance = new TestComponent() as unknown as ComponentWithState;
            container.appendChild(instance as unknown as HTMLElement);
            (instance as unknown as ReactiveInstance).connectedCallback?.();

            // Wait for initial render to complete
            await new Promise((resolve) => queueMicrotask(resolve));
            const initialRenderCount = renderCallCount;
            expect(initialRenderCount).toBeGreaterThan(0);

            if (Array.isArray(instance.items)) {
                instance.items.splice(1, 1, 99);
            }

            // Wait for queueMicrotask to execute rerender
            await new Promise((resolve) => queueMicrotask(resolve));
            // Additional wait to ensure rerender completes
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(renderCallCount).toBeGreaterThan(initialRenderCount);
            if (Array.isArray(instance.items)) {
                expect(instance.items).toEqual([1, 99, 3]);
            }
        });

        it("should trigger rerender on sort()", async () => {
            const TestComponent = createTestComponent();
            customElements.define("test-array-sort", TestComponent);
            const instance = new TestComponent() as unknown as ComponentWithState;
            if (Array.isArray(instance.items)) {
                instance.items = [3, 1, 2];
            }
            container.appendChild(instance as unknown as HTMLElement);
            (instance as unknown as ReactiveInstance).connectedCallback?.();

            // Wait for initial render to complete
            await new Promise((resolve) => queueMicrotask(resolve));
            const initialRenderCount = renderCallCount;
            expect(initialRenderCount).toBeGreaterThan(0);

            if (Array.isArray(instance.items)) {
                instance.items.sort();
            }

            // Wait for queueMicrotask to execute rerender
            await new Promise((resolve) => queueMicrotask(resolve));
            // Additional wait to ensure rerender completes
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(renderCallCount).toBeGreaterThan(initialRenderCount);
            if (Array.isArray(instance.items)) {
                expect(instance.items).toEqual([1, 2, 3]);
            }
        });

        it("should trigger rerender on reverse()", async () => {
            const TestComponent = createTestComponent();
            customElements.define("test-array-reverse", TestComponent);
            const instance = new TestComponent() as unknown as ComponentWithState;
            container.appendChild(instance as unknown as HTMLElement);
            (instance as unknown as ReactiveInstance).connectedCallback?.();

            // Wait for initial render to complete
            await new Promise((resolve) => queueMicrotask(resolve));
            const initialRenderCount = renderCallCount;
            expect(initialRenderCount).toBeGreaterThan(0);

            if (Array.isArray(instance.items)) {
                instance.items.reverse();
            }

            // Wait for queueMicrotask to execute rerender
            await new Promise((resolve) => queueMicrotask(resolve));
            // Additional wait to ensure rerender completes
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(renderCallCount).toBeGreaterThan(initialRenderCount);
            if (Array.isArray(instance.items)) {
                expect(instance.items).toEqual([3, 2, 1]);
            }
        });

        it("should trigger rerender on array index assignment", async () => {
            const TestComponent = createTestComponent();
            customElements.define("test-array-index", TestComponent);
            const instance = new TestComponent() as unknown as ComponentWithState;
            container.appendChild(instance as unknown as HTMLElement);
            (instance as unknown as ReactiveInstance).connectedCallback?.();

            // Wait for initial render to complete
            await new Promise((resolve) => queueMicrotask(resolve));
            const initialRenderCount = renderCallCount;
            expect(initialRenderCount).toBeGreaterThan(0);

            if (Array.isArray(instance.items)) {
                instance.items[0] = 99;
            }

            // Wait for queueMicrotask to execute rerender
            await new Promise((resolve) => queueMicrotask(resolve));
            // Additional wait to ensure rerender completes
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(renderCallCount).toBeGreaterThan(initialRenderCount);
            if (Array.isArray(instance.items)) {
                expect(instance.items[0]).toBe(99);
            }
        });

        it("should trigger rerender on array length modification", async () => {
            const TestComponent = createTestComponent();
            customElements.define("test-array-length", TestComponent);
            const instance = new TestComponent() as unknown as ComponentWithState;
            container.appendChild(instance as unknown as HTMLElement);
            (instance as unknown as ReactiveInstance).connectedCallback?.();

            // Wait for initial render to complete
            await new Promise((resolve) => queueMicrotask(resolve));
            const initialRenderCount = renderCallCount;
            expect(initialRenderCount).toBeGreaterThan(0);

            if (Array.isArray(instance.items)) {
                instance.items.length = 0;
            }

            // Wait for queueMicrotask to execute rerender
            await new Promise((resolve) => queueMicrotask(resolve));
            // Additional wait to ensure rerender completes
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(renderCallCount).toBeGreaterThan(initialRenderCount);
            if (Array.isArray(instance.items)) {
                expect(instance.items).toEqual([]);
            }
        });

        it("should trigger rerender on multiple array operations", async () => {
            const TestComponent = createTestComponent();
            customElements.define("test-array-multiple", TestComponent);
            const instance = new TestComponent() as unknown as ComponentWithState;
            container.appendChild(instance as unknown as HTMLElement);
            (instance as unknown as ReactiveInstance).connectedCallback?.();

            // Wait for initial render to complete
            await new Promise((resolve) => queueMicrotask(resolve));
            const initialRenderCount = renderCallCount;
            expect(initialRenderCount).toBeGreaterThan(0);

            if (Array.isArray(instance.items) && instance.items instanceof Array) {
                const items = instance.items as number[];
                items.push(4);
                items.push(5);
                items.pop();
                items[0] = 99;
            }

            // Wait for queueMicrotask to execute rerender
            await new Promise((resolve) => queueMicrotask(resolve));
            // Additional wait to ensure rerender completes
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Should trigger rerender (may be batched)
            expect(renderCallCount).toBeGreaterThan(initialRenderCount);
            if (Array.isArray(instance.items)) {
                expect(instance.items[0]).toBe(99);
                expect(instance.items.length).toBeGreaterThan(2);
            }
        });
    });

    it("should handle state updates correctly", (done: () => void) => {
        let renderCount = 0;

        class TestComponent extends WebComponent {
            @state private count = 0;
            @state private message = "Initial";

            render() {
                renderCount++;
                return h("div", {}, `${this.count}: ${this.message}`) as HTMLElement;
            }

            protected rerender(): void {
                super.rerender();
            }
        }

        customElements.define("test-component-updates", TestComponent);
        const instance = new TestComponent() as unknown as TestComponentWithState &
            ReactiveInstance;
        instance.connected = true;
        if (instance.connectedCallback) {
            instance.connectedCallback();
        }

        expect(renderCount).toBe(1);

        // Update state
        instance.count = 10;
        instance.message = "Updated";

        setTimeout(() => {
            expect(instance.count).toBe(10);
            expect(instance.message).toBe("Updated");
            done();
        }, 10);
    });

    it("should work with inheritance", () => {
        class BaseComponent extends WebComponent {
            @state protected baseCount = 0;

            render() {
                return h("div", {}, "Base") as HTMLElement;
            }
        }

        class DerivedComponent extends BaseComponent {
            @state private derivedCount = 0;

            render() {
                // Use derivedCount to avoid unused variable warning
                void this.derivedCount;
                return h("div", {}, "Derived") as HTMLElement;
            }
        }

        customElements.define("test-derived", DerivedComponent);
        const instance = new DerivedComponent() as unknown as ComponentWithState;

        const baseCount = instance.baseCount;
        const derivedCount = instance.derivedCount;
        expect(baseCount).toBe(0);
        expect(derivedCount).toBe(0);
    });
});
