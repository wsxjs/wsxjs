/**
 * Unit tests for auto-registration functionality
 * Tests decorator and function-based registration of web components
 */

import { describe, it, expect, afterEach } from "@jest/globals";
import { WebComponent } from "../src/web-component";
import { autoRegister, registerComponent } from "../src/auto-register";
import { h } from "../src/jsx-factory";

describe("Auto Registration", () => {
    // Keep track of registered components for cleanup
    const registeredComponents = new Set<string>();

    afterEach(() => {
        // Clean up registered components
        registeredComponents.forEach((_tagName) => {
            // We can't actually unregister custom elements in tests,
            // but we can track what was registered
        });
        registeredComponents.clear();
    });

    describe("autoRegister decorator", () => {
        it("should auto-register component with default tag name", () => {
            @autoRegister()
            class TestAutoComponent extends WebComponent {
                render(): HTMLElement {
                    return h("div", { className: "test-auto" }, "Auto registered");
                }
            }

            const tagName = "test-auto-component";
            registeredComponents.add(tagName);

            expect(customElements.get(tagName)).toBe(TestAutoComponent);
        });

        it("should auto-register component with custom tag name", () => {
            @autoRegister({ tagName: "custom-auto-tag" })
            class CustomAutoComponent extends WebComponent {
                render(): HTMLElement {
                    return h("div", { className: "custom-auto" }, "Custom auto");
                }
            }

            const tagName = "custom-auto-tag";
            registeredComponents.add(tagName);

            expect(customElements.get(tagName)).toBe(CustomAutoComponent);
        });

        it("should auto-register component with prefix", () => {
            @autoRegister({ prefix: "my-" })
            class PrefixTestComponent extends WebComponent {
                render(): HTMLElement {
                    return h("div", { className: "prefix-test" }, "Prefixed");
                }
            }

            const tagName = "my-prefix-test-component";
            registeredComponents.add(tagName);

            expect(customElements.get(tagName)).toBe(PrefixTestComponent);
        });

        it("should not re-register if component already exists", () => {
            // First registration
            @autoRegister({ tagName: "no-duplicate-test" })
            class FirstComponent extends WebComponent {
                render(): HTMLElement {
                    return h("div", {}, "First");
                }
            }

            const tagName = "no-duplicate-test";
            registeredComponents.add(tagName);

            // Second registration with same tag name should not override
            @autoRegister({ tagName: "no-duplicate-test" })
            class _SecondComponent extends WebComponent {
                render(): HTMLElement {
                    return h("div", {}, "Second");
                }
            }

            // Should still be the first component
            expect(customElements.get(tagName)).toBe(FirstComponent);
        });

        it("should convert PascalCase to kebab-case correctly", () => {
            @autoRegister()
            class MyComplexComponentName extends WebComponent {
                render(): HTMLElement {
                    return h("div", {}, "Complex name");
                }
            }

            const tagName = "my-complex-component-name";
            registeredComponents.add(tagName);

            expect(customElements.get(tagName)).toBe(MyComplexComponentName);
        });
    });

    describe("registerComponent function", () => {
        it("should register component with default tag name", () => {
            class FunctionTestComponent extends WebComponent {
                render(): HTMLElement {
                    return h("div", { className: "function-test" }, "Function registered");
                }
            }

            registerComponent(FunctionTestComponent);

            const tagName = "function-test-component";
            registeredComponents.add(tagName);

            expect(customElements.get(tagName)).toBe(FunctionTestComponent);
        });

        it("should register component with custom tag name", () => {
            class CustomFunctionComponent extends WebComponent {
                render(): HTMLElement {
                    return h("div", { className: "custom-function" }, "Custom function");
                }
            }

            registerComponent(CustomFunctionComponent, {
                tagName: "custom-function-tag",
            });

            const tagName = "custom-function-tag";
            registeredComponents.add(tagName);

            expect(customElements.get(tagName)).toBe(CustomFunctionComponent);
        });

        it("should register component with prefix", () => {
            class PrefixFunctionComponent extends WebComponent {
                render(): HTMLElement {
                    return h("div", { className: "prefix-function" }, "Prefix function");
                }
            }

            registerComponent(PrefixFunctionComponent, { prefix: "app-" });

            const tagName = "app-prefix-function-component";
            registeredComponents.add(tagName);

            expect(customElements.get(tagName)).toBe(PrefixFunctionComponent);
        });

        it("should not re-register if component already exists", () => {
            class ExistingComponent extends WebComponent {
                render(): HTMLElement {
                    return h("div", {}, "Existing");
                }
            }

            // First registration
            registerComponent(ExistingComponent, { tagName: "existing-test" });

            const tagName = "existing-test";
            registeredComponents.add(tagName);

            // Second registration should not override
            class AnotherComponent extends WebComponent {
                render(): HTMLElement {
                    return h("div", {}, "Another");
                }
            }

            registerComponent(AnotherComponent, { tagName: "existing-test" });

            // Should still be the first component
            expect(customElements.get(tagName)).toBe(ExistingComponent);
        });
    });

    describe("Tag name derivation", () => {
        it("should handle single word class names", () => {
            @autoRegister()
            class Button extends WebComponent {
                render(): HTMLElement {
                    return h("button", {}, "Button");
                }
            }

            const tagName = "button-component";
            registeredComponents.add(tagName);

            expect(customElements.get(tagName)).toBe(Button);
        });

        it("should handle class names with multiple capital letters", () => {
            @autoRegister()
            class HTMLEditor extends WebComponent {
                render(): HTMLElement {
                    return h("div", { className: "html-editor" }, "HTML Editor");
                }
            }

            const tagName = "htmleditor-component";
            registeredComponents.add(tagName);

            expect(customElements.get(tagName)).toBe(HTMLEditor);
        });

        it("should handle class names with numbers", () => {
            @autoRegister()
            class Component2D extends WebComponent {
                render(): HTMLElement {
                    return h("div", { className: "component-2d" }, "2D Component");
                }
            }

            const tagName = "component2d-component";
            registeredComponents.add(tagName);

            expect(customElements.get(tagName)).toBe(Component2D);
        });

        it("should add prefix correctly", () => {
            @autoRegister({ prefix: "ui-" })
            class DialogBox extends WebComponent {
                render(): HTMLElement {
                    return h("div", { className: "dialog-box" }, "Dialog");
                }
            }

            const tagName = "ui-dialog-box";
            registeredComponents.add(tagName);

            expect(customElements.get(tagName)).toBe(DialogBox);
        });
    });

    describe("Integration with WebComponent", () => {
        it("should work with full component lifecycle", () => {
            @autoRegister({ tagName: "lifecycle-test" })
            class LifecycleTestComponent extends WebComponent {
                public connectedCount = 0;
                public disconnectedCount = 0;

                render(): HTMLElement {
                    return h("div", { className: "lifecycle-test" }, "Lifecycle test");
                }

                protected onConnected(): void {
                    this.connectedCount++;
                }

                protected onDisconnected(): void {
                    this.disconnectedCount++;
                }
            }

            const tagName = "lifecycle-test";
            registeredComponents.add(tagName);

            // Create instance and test lifecycle
            const component = new LifecycleTestComponent();
            document.body.appendChild(component);

            expect(component.connectedCount).toBe(1);
            expect(component.shadowRoot.querySelector(".lifecycle-test")).toBeTruthy();

            document.body.removeChild(component);
            expect(component.disconnectedCount).toBe(1);
        });

        it("should work with component attributes", async () => {
            @autoRegister({ tagName: "attr-test" })
            class AttributeTestComponent extends WebComponent {
                static override get observedAttributes(): string[] {
                    return ["test-attr"];
                }

                public attributeChanges: Array<{
                    name: string;
                    oldValue: string;
                    newValue: string;
                }> = [];

                render(): HTMLElement {
                    return h(
                        "div",
                        { className: "attr-test" },
                        `Attr: ${this.getAttr("test-attr", "default")}`
                    );
                }

                protected onAttributeChanged(
                    name: string,
                    oldValue: string,
                    newValue: string
                ): void {
                    this.attributeChanges.push({ name, oldValue, newValue });
                    this.rerender();
                }
            }

            const tagName = "attr-test";
            registeredComponents.add(tagName);

            const component = new AttributeTestComponent();
            document.body.appendChild(component);

            expect(component.shadowRoot.textContent).toContain("Attr: default");

            component.setAttribute("test-attr", "new-value");
            // Wait for attributeChangedCallback to be called
            await new Promise((resolve) => queueMicrotask(() => resolve()));
            expect(component.attributeChanges).toHaveLength(1);
            expect(component.attributeChanges[0]).toEqual({
                name: "test-attr",
                oldValue: null,
                newValue: "new-value",
            });
            // Wait for rerender to complete (attribute change triggers async rerender)
            await new Promise((resolve) => queueMicrotask(() => resolve()));
            await new Promise((resolve) => setTimeout(resolve, 20));
            expect(component.shadowRoot.textContent).toContain("Attr: new-value");

            document.body.removeChild(component);
        });
    });
});
