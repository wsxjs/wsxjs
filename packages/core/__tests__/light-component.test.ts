/**
 * Comprehensive unit tests for LightComponent.ts
 * Tests Light DOM rendering, lifecycle, reactive state, and all component features
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file requires accessing private methods and properties for comprehensive testing

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { LightComponent } from "../src/light-component";
import { h } from "../src/jsx-factory";

// Test implementation of LightComponent
class TestLightComponent extends LightComponent {
    public renderCallCount: number = 0;
    public lastRenderData: unknown = null;
    private _shouldError: boolean = false;

    static override get observedAttributes(): string[] {
        return ["test-attr", "disabled"];
    }

    constructor(config: any = {}) {
        super(config);
    }

    render(): HTMLElement {
        this.renderCallCount++;

        if (this._shouldError) {
            throw new Error("Test render error");
        }

        this.lastRenderData = {
            config: this.config,
            timestamp: Date.now(),
        };

        return h(
            "div",
            {
                className: "test-component",
                "data-testid": "main-container",
            },
            [
                h("h1", { className: "title" }, "Test Component"),
                h("p", { className: "content" }, "Test content"),
            ]
        );
    }

    setShouldError(value: boolean) {
        this._shouldError = value;
    }
}

// Register the test component for jsdom compatibility
// jsdom requires HTMLElement subclasses to be registered before instantiation
if (!customElements.get("test-light-component")) {
    customElements.define("test-light-component", TestLightComponent);
}

describe("LightComponent", () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
    });

    afterEach(() => {
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        // Clean up any registered custom elements
        document.querySelectorAll("test-light-component").forEach((el) => {
            el.remove();
        });
    });

    describe("Basic Instantiation", () => {
        it("should create a LightComponent instance", () => {
            const component = new TestLightComponent();
            expect(component).toBeInstanceOf(HTMLElement);
            expect(component).toBeInstanceOf(LightComponent);
            expect(component.connected).toBe(false);
        });

        it("should accept config in constructor", () => {
            const config = {
                styles: "div { color: red; }",
                styleName: "test-style",
                debug: true,
            };
            const component = new TestLightComponent(config);
            expect(component.config).toEqual(config);
        });

        it("should not have shadowRoot", () => {
            const component = new TestLightComponent();
            expect(component.shadowRoot).toBeNull();
        });
    });

    describe("Lifecycle: connectedCallback", () => {
        it("should render content when connected to DOM", () => {
            const component = new TestLightComponent();
            container.appendChild(component);
            // connectedCallback is automatically called by browser when appended to DOM

            expect(component.connected).toBe(true);
            expect(component.renderCallCount).toBeGreaterThanOrEqual(1);
            expect(component.querySelector(".test-component")).toBeTruthy();
            expect(component.querySelector(".title")).toBeTruthy();
            expect(component.querySelector(".content")).toBeTruthy();
        });

        it("should apply styles when provided", () => {
            const styles = ".test-component { color: red; }";
            const component = new TestLightComponent({
                styles,
                styleName: "test-component",
            });
            container.appendChild(component);
            // connectedCallback is automatically called by browser

            const styleElement = component.querySelector(
                'style[data-wsx-light-component="test-component"]'
            );
            expect(styleElement).toBeTruthy();
            expect(styleElement?.textContent).toBe(styles);
        });

        it("should use constructor name as styleName if not provided", () => {
            const styles = ".test { color: red; }";
            const component = new TestLightComponent({ styles });
            container.appendChild(component);
            component.connectedCallback();

            const styleElement = component.querySelector(
                'style[data-wsx-light-component="TestLightComponent"]'
            );
            expect(styleElement).toBeTruthy();
        });

        it("should not duplicate styles on multiple connections", () => {
            const styles = ".test { color: red; }";
            const component = new TestLightComponent({ styles });
            container.appendChild(component);
            // connectedCallback is automatically called by browser
            // Manually call again to test duplicate prevention
            component.connectedCallback();

            const styleElements = component.querySelectorAll(
                'style[data-wsx-light-component="TestLightComponent"]'
            );
            expect(styleElements.length).toBe(1);
        });

        it("should call onConnected hook if provided", () => {
            let hookCalled = false;
            class HookComponent extends TestLightComponent {
                protected onConnected() {
                    hookCalled = true;
                }
            }
            if (!customElements.get("test-hook-component")) {
                customElements.define("test-hook-component", HookComponent);
            }

            const component = new HookComponent();
            container.appendChild(component);
            // connectedCallback is automatically called by browser when appended to DOM

            expect(hookCalled).toBe(true);
        });

        it("should handle render errors gracefully", () => {
            const component = new TestLightComponent();
            component.setShouldError(true);
            container.appendChild(component);
            component.connectedCallback();

            const errorDiv = component.querySelector("div[style*='color: red']");
            expect(errorDiv).toBeTruthy();
            expect(errorDiv?.textContent).toContain("Component Error");
        });
    });

    describe("Lifecycle: disconnectedCallback", () => {
        it("should clean up when disconnected", () => {
            const component = new TestLightComponent({
                styles: ".test { color: red; }",
            });
            container.appendChild(component);
            // connectedCallback is automatically called by browser

            expect(component.connected).toBe(true);
            component.disconnectedCallback();
        });

        it("should call onDisconnected hook if provided", () => {
            let hookCalled = false;
            class HookComponent extends TestLightComponent {
                protected onDisconnected() {
                    hookCalled = true;
                }
            }
            if (!customElements.get("test-disconnect-component")) {
                customElements.define("test-disconnect-component", HookComponent);
            }

            const component = new HookComponent();
            container.appendChild(component);
            // connectedCallback is automatically called by browser
            component.disconnectedCallback();

            expect(hookCalled).toBe(true);
        });

        it("should cleanup reactive states on disconnect", () => {
            const component = new TestLightComponent();
            container.appendChild(component);
            // connectedCallback is automatically called by browser

            // Create some reactive state
            (component as any).useState("test", 0);
            expect((component as any)._reactiveStates.size).toBeGreaterThan(0);

            component.disconnectedCallback();
            expect((component as any)._reactiveStates.size).toBe(0);
        });

        it("should cleanup styles on disconnect", () => {
            const component = new TestLightComponent({
                styles: ".test { color: red; }",
                styleName: "test-component",
            });
            container.appendChild(component);
            // connectedCallback is automatically called by browser

            expect(
                component.querySelector('style[data-wsx-light-component="test-component"]')
            ).toBeTruthy();

            component.disconnectedCallback();

            expect(
                component.querySelector('style[data-wsx-light-component="test-component"]')
            ).toBeFalsy();
        });
    });

    describe("Lifecycle: attributeChangedCallback", () => {
        it("should call onAttributeChanged hook when attribute changes", () => {
            let changedName = "";
            let changedOldValue = "";
            let changedNewValue = "";

            class HookComponent extends TestLightComponent {
                protected onAttributeChanged(name: string, oldValue: string, newValue: string) {
                    changedName = name;
                    changedOldValue = oldValue;
                    changedNewValue = newValue;
                }
            }
            if (!customElements.get("test-attr-component")) {
                customElements.define("test-attr-component", HookComponent);
            }

            const component = new HookComponent();
            container.appendChild(component);
            // connectedCallback is automatically called by browser

            component.setAttribute("test-attr", "new-value");
            component.attributeChangedCallback("test-attr", "", "new-value");

            expect(changedName).toBe("test-attr");
            expect(changedOldValue).toBe("");
            expect(changedNewValue).toBe("new-value");
        });
    });

    describe("Reactive State: reactive()", () => {
        it("should create reactive object", () => {
            const component = new TestLightComponent();
            container.appendChild(component);
            component.connectedCallback();

            const state = (component as any).reactive({ count: 0, name: "test" });
            expect(state).toBeDefined();
            expect(state.count).toBe(0);
            expect(state.name).toBe("test");
        });

        it("should trigger rerender on state change", async () => {
            const component = new TestLightComponent();
            container.appendChild(component);
            component.connectedCallback();

            const initialRenderCount = component.renderCallCount;
            const state = (component as any).reactive({ count: 0 });

            // Wait for microtask queue
            await new Promise((resolve) => queueMicrotask(resolve));

            state.count = 1;

            // Wait for reactive system to schedule rerender
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(component.renderCallCount).toBeGreaterThan(initialRenderCount);
        });

        it("should support debug mode", () => {
            const component = new TestLightComponent({ debug: true });
            container.appendChild(component);
            component.connectedCallback();

            const state = component["reactive"]({ count: 0 }, "debug-state");
            expect(state).toBeDefined();
            expect((component as any)._isDebugEnabled).toBe(true);
        });
    });

    describe("Reactive State: useState()", () => {
        it("should create state with initial value", () => {
            const component = new TestLightComponent();
            container.appendChild(component);
            component.connectedCallback();

            const [getter] = (component as any).useState("count", 0);
            expect(getter()).toBe(0);
        });

        it("should update state with setter", () => {
            const component = new TestLightComponent();
            container.appendChild(component);
            component.connectedCallback();

            const [getter, setter] = (component as any).useState("count", 0);
            setter(10);
            expect(getter()).toBe(10);
            // setter is used above
        });

        it("should support function updates", () => {
            const component = new TestLightComponent();
            container.appendChild(component);
            component.connectedCallback();

            const [getter, setter] = (component as any).useState("count", 0);
            setter((prev) => prev + 1);
            expect(getter()).toBe(1);
        });

        it("should return same state instance for same key", () => {
            const component = new TestLightComponent();
            container.appendChild(component);
            component.connectedCallback();

            const [getter1, setter1] = (component as any).useState("count", 0);
            const [getter2, setter2] = (component as any).useState("count", 0);

            expect(getter1).toBe(getter2);
            expect(setter1).toBe(setter2);
            // getter1, setter1, getter2, setter2 are all used above
        });

        it("should trigger rerender on state change", async () => {
            const component = new TestLightComponent();
            container.appendChild(component);
            component.connectedCallback();

            const initialRenderCount = component.renderCallCount;
            const [, setter] = (component as any).useState("count", 0);

            setter(1);

            // Wait for reactive system to schedule rerender
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(component.renderCallCount).toBeGreaterThan(initialRenderCount);
        });
    });

    describe("Rerender", () => {
        it("should rerender component", () => {
            const component = new TestLightComponent();
            container.appendChild(component);
            component.connectedCallback();

            const initialRenderCount = component.renderCallCount;
            (component as any).rerender();

            expect(component.renderCallCount).toBe(initialRenderCount + 1);
        });

        it("should clear innerHTML before rerender", () => {
            const component = new TestLightComponent();
            container.appendChild(component);
            component.connectedCallback();

            const initialContent = component.innerHTML;
            expect(initialContent).toBeTruthy();

            (component as any).rerender();

            // Content should be replaced, not appended
            expect(component.innerHTML).toBeTruthy();
        });

        it("should not rerender if not connected", () => {
            const component = new TestLightComponent();
            const initialRenderCount = component.renderCallCount;

            (component as any).rerender();

            expect(component.renderCallCount).toBe(initialRenderCount);
        });

        it("should handle render errors during rerender", () => {
            const component = new TestLightComponent();
            container.appendChild(component);
            component.connectedCallback();

            component.setShouldError(true);
            (component as any).rerender();

            const errorDiv = component.querySelector("div[style*='color: red']");
            expect(errorDiv).toBeTruthy();
        });
    });

    describe("DOM Query Methods", () => {
        it("should query elements using querySelector", () => {
            const component = new TestLightComponent();
            container.appendChild(component);
            component.connectedCallback();

            const element = component.querySelector(".title");
            expect(element).toBeTruthy();
            expect(element?.textContent).toBe("Test Component");
        });

        it("should query all elements using querySelectorAll", () => {
            const component = new TestLightComponent();
            container.appendChild(component);
            component.connectedCallback();

            const elements = component.querySelectorAll("p");
            expect(elements.length).toBeGreaterThan(0);
        });
    });

    describe("Config Methods", () => {
        it("should get config value with default", () => {
            const component = new TestLightComponent({ test: "value" });
            expect((component as any).getConfig("test", "default")).toBe("value");
            expect((component as any).getConfig("missing", "default")).toBe("default");
        });

        it("should set config value", () => {
            const component = new TestLightComponent();
            (component as any).setConfig("test", "value");
            expect(component.config.test).toBe("value");
        });
    });

    describe("Attribute Methods", () => {
        it("should get attribute with default", () => {
            const component = new TestLightComponent();
            component.setAttribute("test", "value");

            expect((component as any).getAttr("test", "default")).toBe("value");
            expect((component as any).getAttr("missing", "default")).toBe("default");
        });

        it("should set attribute", () => {
            const component = new TestLightComponent();
            (component as any).setAttr("test", "value");
            expect(component.getAttribute("test")).toBe("value");
        });

        it("should remove attribute", () => {
            const component = new TestLightComponent();
            component.setAttribute("test", "value");
            (component as any).removeAttr("test");
            expect(component.hasAttribute("test")).toBe(false);
        });

        it("should check if attribute exists", () => {
            const component = new TestLightComponent();
            expect((component as any).hasAttr("test")).toBe(false);
            component.setAttribute("test", "value");
            expect((component as any).hasAttr("test")).toBe(true);
        });
    });

    describe("Style Management", () => {
        it("should apply scoped styles", () => {
            const component = new TestLightComponent();
            container.appendChild(component);

            const styles = ".test { color: red; }";
            (component as any).applyScopedStyles("test-style", styles);

            const styleElement = component.querySelector(
                'style[data-wsx-light-component="test-style"]'
            );
            expect(styleElement).toBeTruthy();
            expect(styleElement?.textContent).toBe(styles);
        });

        it("should not duplicate styles", () => {
            const component = new TestLightComponent();
            container.appendChild(component);

            const styles = ".test { color: red; }";
            (component as any).applyScopedStyles("test-style", styles);
            (component as any).applyScopedStyles("test-style", styles);

            const styleElements = component.querySelectorAll(
                'style[data-wsx-light-component="test-style"]'
            );
            expect(styleElements.length).toBe(1);
        });

        it("should insert style as first child", () => {
            const component = new TestLightComponent();
            container.appendChild(component);
            component.connectedCallback();

            const styles = ".new-style { color: blue; }";
            component["applyScopedStyles"]("new-style", styles);

            const styleElement = component.querySelector(
                'style[data-wsx-light-component="new-style"]'
            );
            expect(styleElement).toBeTruthy();
            // Style should be before content
            expect(component.firstChild).toBe(styleElement);
        });
    });

    describe("Error Handling", () => {
        it("should render error message on render error", () => {
            const component = new TestLightComponent();
            container.appendChild(component);
            component.setShouldError(true);
            component.connectedCallback();

            const errorDiv = component.querySelector("div[style*='color: red']");
            expect(errorDiv).toBeTruthy();
            expect(errorDiv?.textContent).toContain("Component Error");
            expect(errorDiv?.textContent).toContain("Test render error");
        });

        it("should clear content before showing error", () => {
            const component = new TestLightComponent();
            container.appendChild(component);
            component.connectedCallback();

            const initialContent = component.innerHTML;
            component.setShouldError(true);
            (component as any).renderError(new Error("Test error"));

            expect(component.innerHTML).not.toBe(initialContent);
            expect(component.innerHTML).toContain("Component Error");
        });
    });

    describe("Integration with Reactive System", () => {
        it("should work with reactive state in render", async () => {
            class ReactiveComponent extends TestLightComponent {
                private state = (this as any).reactive({ count: 0 });

                render(): HTMLElement {
                    return h("div", {}, [
                        h(
                            "span",
                            { "data-count": String(this.state.count) },
                            String(this.state.count)
                        ),
                    ]);
                }
            }

            if (!customElements.get("test-reactive-component")) {
                customElements.define("test-reactive-component", ReactiveComponent);
            }

            const component = new ReactiveComponent();
            container.appendChild(component);
            // connectedCallback is automatically called by browser

            const initialCount = component.querySelector("[data-count]")?.textContent;
            expect(initialCount).toBe("0");

            (component as any).state.count = 5;

            // Wait for reactive system
            await new Promise((resolve) => setTimeout(resolve, 10));

            const newCount = component.querySelector("[data-count]")?.textContent;
            expect(newCount).toBe("5");
        });

        it("should work with useState in render", async () => {
            class StateComponent extends TestLightComponent {
                private countState: any;

                constructor() {
                    super();
                    this.countState = (this as any).useState("count", 0);
                }

                render(): HTMLElement {
                    const [count, setCount] = this.countState;
                    return h("div", {}, [
                        h("span", { "data-count": String(count()) }, String(count())),
                        h(
                            "button",
                            {
                                onClick: () => setCount(count() + 1),
                            },
                            "Increment"
                        ),
                    ]);
                }
            }

            if (!customElements.get("test-state-component")) {
                customElements.define("test-state-component", StateComponent);
            }

            const component = new StateComponent();
            container.appendChild(component);
            // connectedCallback is automatically called by browser

            const initialCount = component.querySelector("[data-count]")?.textContent;
            expect(initialCount).toBe("0");

            const button = component.querySelector("button") as HTMLButtonElement;
            button.click();

            // Wait for reactive system
            await new Promise((resolve) => setTimeout(resolve, 10));

            const newCount = component.querySelector("[data-count]")?.textContent;
            expect(newCount).toBe("1");
        });
    });
});
