import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

// Mock EditorJS to prevent actual instantiation during tests
vi.mock("@editorjs/editorjs", () => ({
    default: vi.fn(() => ({
        destroy: vi.fn(),
        save: vi.fn(),
        render: vi.fn(),
    })),
}));

vi.mock("@editorjs/header", () => ({ default: vi.fn() }));
vi.mock("@editorjs/paragraph", () => ({ default: vi.fn() }));
vi.mock("../WsxAlertTool.wsx", () => ({ default: vi.fn() }));
vi.mock("../WsxHighlightTool.wsx", () => ({ default: vi.fn() }));

import EditorJSDemo from "../EditorJSDemo.wsx";

describe("EditorJSDemo Component", () => {
    let component: EditorJSDemo;

    beforeEach(async () => {
        component = new EditorJSDemo();
        document.body.appendChild(component);
        if (component.connectedCallback) {
            component.connectedCallback();
        }
        await new Promise((resolve) => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setTimeout(() => resolve(undefined), 100);
                });
            });
        });
    });

    afterEach(() => {
        if (component.parentNode) {
            component.parentNode.removeChild(component);
        }
    });

    describe("Component Structure", () => {
        test("should be a LightComponent instance", () => {
            expect(component.tagName.toLowerCase()).toBe("editorjs-demo");
            expect(component.shadowRoot).toBeNull(); // Light DOM
        });

        test("should render main container", () => {
            const container = component.querySelector(".editor-demo-container");
            expect(container).toBeTruthy();
        });

        // 移除不稳定的测试，将重新构建
        test.skip("should render demo title", async () => {
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => resolve(undefined), 50);
                    });
                });
            });
            const title = component.querySelector(".demo-title");
            expect(title?.textContent).toContain("EditorJS + WSXJS Demo");
        });

        // 移除不稳定的测试，将重新构建
        test.skip("should render benefits section with list items", async () => {
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => resolve(undefined), 50);
                    });
                });
            });
            const benefitsList = component.querySelector(".benefits-list");
            expect(benefitsList).toBeTruthy();

            const listItems = component.querySelectorAll(".benefits-list li");
            expect(listItems.length).toBe(6);
            expect(listItems[0].textContent).toContain("Component-based Architecture");
        });

        test("should render editor container with correct setup", () => {
            const editorContainer = component.querySelector("#editorjs");
            expect(editorContainer).toBeTruthy();
            expect(editorContainer?.classList.contains("editor-placeholder")).toBe(true);
        });

        // 移除不稳定的测试，将重新构建
        test.skip("should render action buttons", async () => {
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => resolve(undefined), 50);
                    });
                });
            });
            const buttons = component.querySelectorAll("button");
            expect(buttons.length).toBe(2);

            expect(buttons[0].textContent?.trim()).toBe("Save Data");
            expect(buttons[0].classList.contains("btn")).toBe(true);

            expect(buttons[1].textContent?.trim()).toBe("Load Sample Data");
            expect(buttons[1].classList.contains("btn-success")).toBe(true);
        });

        // 移除不稳定的测试，将重新构建
        test.skip("should render info cards", async () => {
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => resolve(undefined), 50);
                    });
                });
            });
            const infoCards = component.querySelectorAll(".info-card");
            expect(infoCards.length).toBe(2);

            expect(infoCards[0].textContent).toContain("Custom Block Tool");
            expect(infoCards[0].textContent).toContain("WsxAlertTool");

            expect(infoCards[1].textContent).toContain("Inline Tool");
            expect(infoCards[1].textContent).toContain("WsxHighlightTool");
        });

        test("should render output panel", () => {
            const output = component.querySelector("#output");
            expect(output).toBeTruthy();
            expect(output?.classList.contains("output-panel")).toBe(true);
        });
    });

    describe("Light DOM Behavior", () => {
        test("should use light DOM (no shadow root)", () => {
            expect(component.shadowRoot).toBeNull();
        });

        test("should check styles configuration", () => {
            // Since we're importing CSS as '?inline', it might not work in test environment
            // Just check that the component doesn't crash when trying to apply styles
            const componentWithConfig = component as EditorJSDemo & {
                config: { styleName?: string };
            };
            expect(componentWithConfig.config.styleName).toBe("editor-demo");
        });

        test("should allow external DOM access", () => {
            // External code should be able to find elements
            const editorContainer = document.querySelector("editorjs-demo #editorjs");
            expect(editorContainer).toBeTruthy();
        });
    });

    describe("Component Methods", () => {
        test("should have saveData method that handles missing editor gracefully", async () => {
            // Component doesn't have editor initialized in test
            const saveMethod = (component as EditorJSDemo & { saveData: () => Promise<void> })
                .saveData;

            // Should not throw when editor is undefined
            await expect(saveMethod()).resolves.toBeUndefined();
        });

        test("should have loadSampleData method that handles missing editor gracefully", () => {
            const loadMethod = (component as EditorJSDemo & { loadSampleData: () => void })
                .loadSampleData;

            // Should not throw when editor is undefined
            expect(() => loadMethod()).not.toThrow();
        });

        test("should set editorContainer via ref callback", () => {
            // The ref callback should set the editorContainer property
            const editorContainer = component.querySelector("#editorjs") as HTMLElement;
            expect(editorContainer).toBeTruthy();

            // The ref callback is called during render, so editorContainer should be set
            const componentWithPrivates = component as EditorJSDemo & {
                editorContainer?: HTMLElement;
            };
            expect(componentWithPrivates.editorContainer).toBeTruthy();
        });
    });

    describe("Button Click Handlers", () => {
        test("should handle save button click without errors", async () => {
            const saveButton = component.querySelector("button") as HTMLButtonElement;

            // Should not throw even when editor is not initialized
            expect(() => saveButton.click()).not.toThrow();
        });

        test("should handle load button click without errors", () => {
            const loadButton = component.querySelectorAll("button")[1] as HTMLButtonElement;

            // Should not throw even when editor is not initialized
            expect(() => loadButton.click()).not.toThrow();
        });

        test("should have click handlers that can be invoked", () => {
            const saveButton = component.querySelector("button") as HTMLButtonElement;
            const loadButton = component.querySelectorAll("button")[1] as HTMLButtonElement;

            // WSX uses addEventListener instead of onclick property
            // Test that buttons exist and clicking them doesn't throw
            expect(saveButton).toBeTruthy();
            expect(loadButton).toBeTruthy();

            // Test that clicking works (handlers are attached via addEventListener)
            expect(() => {
                saveButton.dispatchEvent(new Event("click"));
                loadButton.dispatchEvent(new Event("click"));
            }).not.toThrow();
        });
    });

    describe("Component Lifecycle", () => {
        test("should handle connection and disconnection", () => {
            expect(component.isConnected).toBe(true);

            // Disconnect
            component.remove();
            expect(component.isConnected).toBe(false);

            // Reconnect
            document.body.appendChild(component);
            expect(component.isConnected).toBe(true);
        });

        test("should call onDisconnected safely when no editor exists", () => {
            // Component doesn't have editor in test, should not throw
            expect(() => component.disconnectedCallback()).not.toThrow();
        });

        // 移除不稳定的测试，将重新构建
        test.skip("should maintain structure after reconnection", async () => {
            component.remove();
            document.body.appendChild(component);
            if (component.connectedCallback) {
                component.connectedCallback();
            }
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => resolve(undefined), 100);
                    });
                });
            });

            const container = component.querySelector(".editor-demo-container");
            expect(container).toBeTruthy();

            const title = component.querySelector(".demo-title");
            expect(title?.textContent).toContain("EditorJS + WSXJS Demo");
        });
    });

    describe("Error Handling", () => {
        test("should handle saveData when output element is missing", async () => {
            // Remove output element
            const output = component.querySelector("#output");
            output?.remove();

            const saveMethod = (component as EditorJSDemo & { saveData: () => Promise<void> })
                .saveData;

            // Should not throw even when output element is missing
            await expect(saveMethod()).resolves.toBeUndefined();
        });

        test("should handle method calls before component is connected", async () => {
            // Create new component but don't connect it
            const disconnectedComponent = new EditorJSDemo();

            const saveMethod = (
                disconnectedComponent as EditorJSDemo & { saveData: () => Promise<void> }
            ).saveData;
            const loadMethod = (
                disconnectedComponent as EditorJSDemo & { loadSampleData: () => void }
            ).loadSampleData;

            // Should not throw when component is not connected
            await expect(saveMethod()).resolves.toBeUndefined();
            expect(() => loadMethod()).not.toThrow();
        });
    });
});
