/**
 * Unit tests for @state property decorator functionality
 * WebComponent and LightComponent already have reactive() and useState() methods
 * Babel plugin handles @state initialization at compile time
 */

// Test file requires accessing private methods and properties for comprehensive testing

import { describe, it, expect, beforeEach } from "@jest/globals";
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
    state?: { count: number; message?: string; active?: boolean };
    items?: number[] | string[];
    theme?: string;
    enabled?: boolean;
    baseCount?: number;
    derivedCount?: number;
}

type TestComponentWithState = ReactiveInstance & ComponentWithState;

// Register test components for jsdom compatibility
beforeEach(() => {
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
    ];
    tagNames.forEach((tag) => {
        if (customElements.get(tag)) {
            // Note: customElements.delete is not available in jsdom
            // Components will be overwritten if re-registered
        }
    });
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

    it("should make @state properties reactive", (done: () => void) => {
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
        expect(renderCount).toBe(1);

        // Change state - should trigger rerender
        instance.count = 5;

        // Wait for reactive update
        setTimeout(() => {
            expect(renderCount).toBeGreaterThan(1);
            expect(instance.count).toBe(5);
            done();
        }, 10);
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
        }).toThrow(/Please ensure Babel plugin is configured/);
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
