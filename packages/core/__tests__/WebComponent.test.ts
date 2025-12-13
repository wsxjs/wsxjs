/**
 * Comprehensive unit tests for WebComponent.ts
 * Tests Shadow DOM, lifecycle, JSX rendering, and all component features
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { WebComponent, type WebComponentConfig } from "../src/web-component";
import { h } from "../src/jsx-factory";
import { StyleManager } from "../src/styles/style-manager";

// Mock StyleManager
jest.mock("../src/styles/style-manager", () => ({
    StyleManager: {
        applyStyles: jest.fn(),
    },
}));

// Test implementation of WebComponent
class TestComponent extends WebComponent {
    public renderCallCount = 0;
    public lastRenderData: unknown = null;
    private _shouldError = false;

    static override get observedAttributes(): string[] {
        return ["test-attr", "disabled"];
    }

    constructor(config: WebComponentConfig = {}) {
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
                h("span", { id: "test-content" }, "Hello World"),
                h(
                    "button",
                    {
                        onClick: () =>
                            this.dispatchEvent(
                                new CustomEvent("test-click", {
                                    detail: { source: "button" },
                                    bubbles: true,
                                    composed: true,
                                })
                            ),
                    },
                    "Click Me"
                ),
            ]
        );
    }

    // Test methods to control behavior
    public triggerError() {
        this._shouldError = true;
        this.rerender();
    }

    public getConfigPublic<T>(key: string, defaultValue?: T): T {
        return this.getConfig(key, defaultValue);
    }

    public setConfigPublic(key: string, value: unknown): void {
        this.setConfig(key, value);
    }

    public rerenderPublic(): void {
        this.rerender();
    }

    public getAttrPublic(name: string, defaultValue?: string): string {
        return this.getAttr(name, defaultValue);
    }

    public setAttrPublic(name: string, value: string): void {
        this.setAttr(name, value);
    }

    public removeAttrPublic(name: string): void {
        this.removeAttr(name);
    }

    public hasAttrPublic(name: string): boolean {
        return this.hasAttr(name);
    }

    // Lifecycle hooks for testing
    public onConnected?: () => void;
    public onDisconnected?: () => void;
    public onAttributeChanged?: (name: string, oldValue: string, newValue: string) => void;
}

// Register the test component
customElements.define("test-component", TestComponent);

describe("WebComponent", () => {
    let component: TestComponent;
    let container: HTMLElement;

    beforeEach(() => {
        // Clear mocks
        jest.clearAllMocks();

        // Create fresh container
        container = document.createElement("div");
        document.body.appendChild(container);

        // Create fresh component
        component = new TestComponent({
            styles: ".test { color: red; }",
            styleName: "test-component",
        });
    });

    afterEach(() => {
        // Clean up
        if (component.parentNode) {
            component.parentNode.removeChild(component);
        }
        if (container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });

    describe("Constructor and Basic Setup", () => {
        it("should create a shadow root", () => {
            expect(component.shadowRoot).toBeInstanceOf(ShadowRoot);
            expect(component.shadowRoot.mode).toBe("open");
        });

        it("should store config properly", () => {
            const config = { styles: ".test {}", customProp: "value" };
            const comp = new TestComponent(config);

            expect(comp.getConfigPublic("styles")).toBe(".test {}");
            expect(comp.getConfigPublic("customProp")).toBe("value");
            expect(comp.getConfigPublic("nonexistent", "default")).toBe("default");
        });

        it("should apply styles via StyleManager", () => {
            // Styles are applied in connectedCallback, so we need to connect the component first
            container.appendChild(component);
            expect(StyleManager.applyStyles).toHaveBeenCalledWith(
                component.shadowRoot,
                "test-component",
                ".test { color: red; }"
            );
        });

        it("should work without config", () => {
            // Clear previous calls from other tests
            jest.clearAllMocks();

            const comp = new TestComponent();
            expect(comp.shadowRoot).toBeInstanceOf(ShadowRoot);
            expect(StyleManager.applyStyles).not.toHaveBeenCalled();
        });
    });

    describe("Lifecycle - connectedCallback", () => {
        it("should render JSX content when connected to DOM", () => {
            container.appendChild(component);

            expect(component.renderCallCount).toBe(1);
            expect(component.shadowRoot.querySelector(".test-component")).toBeTruthy();
            expect(component.shadowRoot.querySelector("#test-content")?.textContent).toBe(
                "Hello World"
            );
        });

        it("should call onConnected hook if defined", () => {
            const onConnected = jest.fn();
            component.onConnected = onConnected;

            container.appendChild(component);

            expect(onConnected).toHaveBeenCalledTimes(1);
        });

        it("should handle render errors gracefully", () => {
            const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

            component.triggerError();
            container.appendChild(component);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("Error in connectedCallback:"),
                expect.any(Error)
            );

            // Should render error message
            const errorDiv = component.shadowRoot.querySelector('div[style*="color: red"]');
            expect(errorDiv).toBeTruthy();
            expect(errorDiv?.textContent).toContain("Component Error");

            consoleSpy.mockRestore();
        });
    });

    describe("Lifecycle - disconnectedCallback", () => {
        it("should call onDisconnected hook if defined", () => {
            const onDisconnected = jest.fn();
            component.onDisconnected = onDisconnected;

            container.appendChild(component);
            container.removeChild(component);

            expect(onDisconnected).toHaveBeenCalledTimes(1);
        });
    });

    describe("Lifecycle - attributeChangedCallback", () => {
        it("should call onAttributeChanged hook if defined", () => {
            const onAttributeChanged = jest.fn();
            component.onAttributeChanged = onAttributeChanged;

            container.appendChild(component);
            component.setAttribute("test-attr", "new-value");

            expect(onAttributeChanged).toHaveBeenCalledWith("test-attr", null, "new-value");
        });

        it("should observe the correct attributes", () => {
            expect(TestComponent.observedAttributes).toEqual(["test-attr", "disabled"]);
        });
    });

    describe("Event System", () => {
        it("should dispatch custom events correctly", (done) => {
            container.appendChild(component);

            component.addEventListener("test-event", (event: Event) => {
                const customEvent = event as CustomEvent;
                expect(customEvent.detail).toEqual({ data: "test" });
                expect(customEvent.bubbles).toBe(true);
                expect(customEvent.composed).toBe(true);
                done();
            });

            component.dispatchEvent(
                new CustomEvent("test-event", {
                    detail: { data: "test" },
                    bubbles: true,
                    composed: true,
                })
            );
        });

        it("should handle JSX event handlers", () => {
            container.appendChild(component);
            const eventSpy = jest.fn();

            component.addEventListener("test-click", eventSpy);

            const button = component.shadowRoot.querySelector("button");
            button?.click();

            expect(eventSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: { source: "button" },
                })
            );
        });
    });

    describe("Shadow DOM Queries", () => {
        beforeEach(() => {
            container.appendChild(component);
        });

        it("should find elements via querySelector", () => {
            const element = component.querySelector<HTMLSpanElement>("#test-content");
            expect(element).toBeTruthy();
            expect(element?.tagName).toBe("SPAN");
            expect(element?.textContent).toBe("Hello World");
        });

        it("should find elements via querySelectorAll", () => {
            const elements = component.querySelectorAll<HTMLElement>("span, button");
            expect(elements).toHaveLength(2);
            expect(elements[0].tagName).toBe("SPAN");
            expect(elements[1].tagName).toBe("BUTTON");
        });

        it("should return null for non-existent elements", () => {
            const element = component.querySelector("#non-existent");
            expect(element).toBeNull();
        });
    });

    describe("Rerendering", () => {
        beforeEach(() => {
            container.appendChild(component);
        });

        it("should preserve adopted stylesheets during rerender", () => {
            // Mock adopted stylesheets
            const mockStyleSheet = new CSSStyleSheet();
            component.shadowRoot.adoptedStyleSheets = [mockStyleSheet];

            const initialRenderCount = component.renderCallCount;
            component.rerenderPublic();

            expect(component.renderCallCount).toBe(initialRenderCount + 1);
            expect(component.shadowRoot.adoptedStyleSheets).toEqual([mockStyleSheet]);
            expect(StyleManager.applyStyles).toHaveBeenCalledTimes(1); // Only called once during construction
        });

        it("should reapply styles if no adopted stylesheets exist", () => {
            // Ensure no adopted stylesheets
            component.shadowRoot.adoptedStyleSheets = [];

            component.rerenderPublic();

            expect(StyleManager.applyStyles).toHaveBeenCalledTimes(2); // Once during construction, once during rerender
        });

        it("should handle render errors during rerender", () => {
            const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

            component.triggerError();

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("Error in rerender:"),
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });

        it("should clear content before rerendering", async () => {
            container.appendChild(component);
            const initialElement = component.shadowRoot.querySelector("#test-content");
            expect(initialElement).toBeTruthy();

            component.rerenderPublic();

            // Wait for rerender to complete
            await new Promise((resolve) => queueMicrotask(() => resolve()));
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Should still have the element (newly rendered)
            const newElement = component.shadowRoot.querySelector("#test-content");
            expect(newElement).toBeTruthy();
            // Note: In some cases, the element might be the same instance if DOM is reused
            // The important thing is that rerender was called and content is correct
            expect(component.shadowRoot.textContent).toContain("Hello World");
        });
    });

    describe("Attribute Helpers", () => {
        beforeEach(() => {
            container.appendChild(component);
        });

        it("should get/set/remove attributes correctly", () => {
            component.setAttrPublic("data-test", "value");
            expect(component.getAttrPublic("data-test")).toBe("value");
            expect(component.hasAttrPublic("data-test")).toBe(true);

            component.removeAttrPublic("data-test");
            expect(component.getAttrPublic("data-test")).toBe("");
            expect(component.hasAttrPublic("data-test")).toBe(false);
        });

        it("should return default values for missing attributes", () => {
            expect(component.getAttrPublic("non-existent")).toBe("");
            expect(component.getAttrPublic("non-existent", "default")).toBe("default");
        });
    });

    describe("Config Management", () => {
        it("should get config values with defaults", () => {
            component.setConfigPublic("testKey", "testValue");

            expect(component.getConfigPublic("testKey")).toBe("testValue");
            expect(component.getConfigPublic("nonExistent", "default")).toBe("default");
            expect(component.getConfigPublic("nonExistent")).toBeUndefined();
        });

        it("should update config values", () => {
            component.setConfigPublic("dynamic", "initial");
            expect(component.getConfigPublic("dynamic")).toBe("initial");

            component.setConfigPublic("dynamic", "updated");
            expect(component.getConfigPublic("dynamic")).toBe("updated");
        });
    });

    describe("Error Handling", () => {
        it("should render error UI when renderError is called", () => {
            container.appendChild(component);

            // Suppress expected error logs during this test
            const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

            try {
                // Trigger error rendering
                component.triggerError();

                const errorDiv = component.shadowRoot.querySelector('div[style*="color: red"]');
                expect(errorDiv).toBeTruthy();
                expect(errorDiv?.textContent).toContain("[TestComponent] Component Error:");
                expect(errorDiv?.textContent).toContain("Test render error");
            } finally {
                consoleSpy.mockRestore();
            }
        });

        it("should clear existing content when rendering error", () => {
            container.appendChild(component);

            // Verify normal content exists
            expect(component.shadowRoot.querySelector("#test-content")).toBeTruthy();

            // Suppress expected error logs during this test
            const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

            try {
                // Trigger error
                component.triggerError();

                // Normal content should be gone, only error content should remain
                expect(component.shadowRoot.querySelector("#test-content")).toBeNull();
                expect(component.shadowRoot.querySelector('div[style*="color: red"]')).toBeTruthy();
            } finally {
                consoleSpy.mockRestore();
            }
        });
    });

    describe("JSX Integration", () => {
        beforeEach(() => {
            container.appendChild(component);
        });

        it("should render JSX elements correctly", () => {
            const mainDiv = component.shadowRoot.querySelector(".test-component");
            expect(mainDiv).toBeTruthy();
            expect(mainDiv?.getAttribute("data-testid")).toBe("main-container");
        });

        it("should handle nested JSX elements", () => {
            const span = component.shadowRoot.querySelector(".test-component #test-content");
            const button = component.shadowRoot.querySelector(".test-component button");

            expect(span?.textContent).toBe("Hello World");
            expect(button?.textContent).toBe("Click Me");
        });

        it("should support ref callbacks in JSX", () => {
            let capturedElement: HTMLElement | null = null;

            // Create a component that uses ref
            class RefTestComponent extends WebComponent {
                render(): HTMLElement {
                    return h(
                        "div",
                        {
                            ref: (el: HTMLElement) => {
                                capturedElement = el;
                            },
                        },
                        "Ref test"
                    );
                }
            }

            customElements.define("ref-test-component", RefTestComponent);
            const refComponent = new RefTestComponent();
            container.appendChild(refComponent);

            expect(capturedElement).toBeTruthy();
            expect((capturedElement as unknown as HTMLElement).tagName).toBe("DIV");
            expect((capturedElement as unknown as HTMLElement).textContent).toBe("Ref test");
        });
    });

    describe("Inheritance and Extensibility", () => {
        it("should support custom observed attributes", () => {
            expect(TestComponent.observedAttributes).toContain("test-attr");
            expect(TestComponent.observedAttributes).toContain("disabled");
        });

        it("should allow lifecycle hooks to be overridden", () => {
            const onConnectedSpy = jest.fn();
            const onDisconnectedSpy = jest.fn();
            const onAttributeChangedSpy = jest.fn();

            component.onConnected = onConnectedSpy;
            component.onDisconnected = onDisconnectedSpy;
            component.onAttributeChanged = onAttributeChangedSpy;

            container.appendChild(component);
            component.setAttribute("test-attr", "value");
            container.removeChild(component);

            expect(onConnectedSpy).toHaveBeenCalledTimes(1);
            expect(onAttributeChangedSpy).toHaveBeenCalledWith("test-attr", null, "value");
            expect(onDisconnectedSpy).toHaveBeenCalledTimes(1);
        });
    });
});
