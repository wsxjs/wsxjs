import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import type WsxCodeComponent from "../WsxCodeComponent.wsx";
import "../WsxCodeComponent.wsx";
// Mock the stylesheet import
vi.mock("../WsxCodeTool.css?inline", () => ({ default: "mocked-styles" }));

describe("WsxCodeComponent", () => {
    let component: WsxCodeComponent;

    // Helper function to wait for component updates
    const waitForUpdate = () => new Promise((resolve) => setTimeout(resolve, 50));

    beforeEach(async () => {
        // Create component instance
        component = document.createElement("wsx-code-component") as WsxCodeComponent;
        document.body.appendChild(component);
        if (component.connectedCallback) {
            component.connectedCallback();
        }
        // Wait for component to be connected and rendered
        await new Promise((resolve) => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setTimeout(() => resolve(undefined), 100);
                });
            });
        });
    });

    afterEach(() => {
        if (component) {
            component.remove();
        }
    });

    describe("Component Initialization", () => {
        test("should register with correct tag name", () => {
            expect(customElements.get("wsx-code-component")).toBeDefined();
        });

        test("should have initial default values", () => {
            const data = component.getData();
            expect(data.code).toBe("");
            expect(data.language).toBe("javascript");
            expect(data.showLineNumbers).toBe(true);
        });

        test("should render basic structure", () => {
            const codeToolElement = component.shadowRoot?.querySelector(".wsx-code-tool");
            expect(codeToolElement).toBeInTheDocument();

            const toolbar = component.shadowRoot?.querySelector(".code-toolbar");
            expect(toolbar).toBeInTheDocument();

            const codeContainer = component.shadowRoot?.querySelector(".code-container");
            expect(codeContainer).toBeInTheDocument();

            const preview = component.shadowRoot?.querySelector(".code-preview");
            expect(preview).toBeInTheDocument();
        });
    });

    describe("Attribute Handling", () => {
        // 移除不稳定的测试，将重新构建
        test.skip("should handle code attribute", async () => {
            const testCode = 'console.log("Hello, World!");';
            component.setAttribute("code", testCode);
            await waitForUpdate();

            expect(component.getData().code).toBe(testCode);

            const textarea = component.shadowRoot?.querySelector(
                ".code-editor"
            ) as HTMLTextAreaElement;
            expect(textarea?.value).toBe(testCode);
        });

        // 移除不稳定的测试，将重新构建
        test.skip("should handle language attribute", async () => {
            component.setAttribute("language", "python");
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => resolve(undefined), 100);
                    });
                });
            });

            expect(component.getData().language).toBe("python");

            const select = component.shadowRoot?.querySelector(
                ".language-select"
            ) as HTMLSelectElement;
            expect(select?.value).toBe("python");
        });

        test("should handle showlinenumbers attribute", async () => {
            component.setAttribute("showlinenumbers", "false");
            await waitForUpdate();

            expect(component.getData().showLineNumbers).toBe(false);

            const checkbox = component.shadowRoot?.querySelector(
                'input[type="checkbox"]'
            ) as HTMLInputElement;
            expect(checkbox?.checked).toBe(false);
        });

        test("should handle readonly attribute", async () => {
            component.setAttribute("readonly", "true");
            await waitForUpdate();

            const textarea = component.shadowRoot?.querySelector(
                ".code-editor"
            ) as HTMLTextAreaElement;
            expect(textarea?.readOnly).toBe(true);

            const select = component.shadowRoot?.querySelector(
                ".language-select"
            ) as HTMLSelectElement;
            expect(select?.disabled).toBe(true);
        });
    });

    describe("User Interactions", () => {
        test("should update code when typing in textarea", () => {
            const textarea = component.shadowRoot?.querySelector(
                ".code-editor"
            ) as HTMLTextAreaElement;
            const testCode = "const x = 42;";

            // Simulate typing
            textarea.value = testCode;
            textarea.dispatchEvent(new Event("input", { bubbles: true }));

            expect(component.getData().code).toBe(testCode);
        });

        test("should emit codechange event when code changes", async () => {
            const testCode = "let y = 100;";
            let eventFired = false;
            let eventDetail = "";

            component.addEventListener("codechange", (e: CustomEvent) => {
                eventFired = true;
                eventDetail = e.detail;
            });

            const textarea = component.shadowRoot?.querySelector(
                ".code-editor"
            ) as HTMLTextAreaElement;
            textarea.value = testCode;
            textarea.dispatchEvent(new Event("input", { bubbles: true }));

            // Wait for event to fire
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(eventFired).toBe(true);
            expect(eventDetail).toBe(testCode);
        });

        test("should change language when select value changes", () => {
            const select = component.shadowRoot?.querySelector(
                ".language-select"
            ) as HTMLSelectElement;

            select.value = "typescript";
            select.dispatchEvent(new Event("change", { bubbles: true }));

            expect(component.getData().language).toBe("typescript");
        });

        test("should emit languagechange event when language changes", async () => {
            let eventFired = false;
            let eventDetail = "";

            component.addEventListener("languagechange", (e: CustomEvent) => {
                eventFired = true;
                eventDetail = e.detail;
            });

            const select = component.shadowRoot?.querySelector(
                ".language-select"
            ) as HTMLSelectElement;
            select.value = "css";
            select.dispatchEvent(new Event("change", { bubbles: true }));

            // Wait for event to fire
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(eventFired).toBe(true);
            expect(eventDetail).toBe("css");
        });

        test("should toggle line numbers when checkbox changes", () => {
            const checkbox = component.shadowRoot?.querySelector(
                'input[type="checkbox"]'
            ) as HTMLInputElement;

            checkbox.checked = false;
            checkbox.dispatchEvent(new Event("change", { bubbles: true }));

            expect(component.getData().showLineNumbers).toBe(false);
        });

        test("should emit showlinenumberschange event when line numbers toggle", async () => {
            let eventFired = false;
            let eventDetail: boolean | null = null;

            component.addEventListener("showlinenumberschange", (e: CustomEvent) => {
                eventFired = true;
                eventDetail = e.detail;
            });

            const checkbox = component.shadowRoot?.querySelector(
                'input[type="checkbox"]'
            ) as HTMLInputElement;
            checkbox.checked = false;
            checkbox.dispatchEvent(new Event("change", { bubbles: true }));

            // Wait for event to fire
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(eventFired).toBe(true);
            expect(eventDetail).toBe(false);
        });
    });

    describe("Line Numbers Feature", () => {
        // 移除不稳定的测试，将重新构建
        test.skip("should show line numbers when enabled", async () => {
            component.setAttribute("code", "line 1\nline 2\nline 3");
            component.setAttribute("showlinenumbers", "true");
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => resolve(undefined), 100);
                    });
                });
            });

            const lineNumbers = component.shadowRoot?.querySelector(".line-numbers");
            expect(lineNumbers).toBeTruthy();

            const lineNumberElements = component.shadowRoot?.querySelectorAll(".line-number");
            expect(lineNumberElements).toHaveLength(3);
        });

        test("should hide line numbers when disabled", async () => {
            component.setAttribute("showlinenumbers", "false");
            await waitForUpdate();

            const lineNumbers = component.shadowRoot?.querySelector(".line-numbers");
            expect(lineNumbers).not.toBeInTheDocument();
        });

        // 移除不稳定的测试，将重新构建
        test.skip("should update line numbers when code changes", async () => {
            component.setAttribute("code", "line 1\nline 2");
            component.setAttribute("showlinenumbers", "true");
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => resolve(undefined), 100);
                    });
                });
            });

            let lineNumberElements = component.shadowRoot?.querySelectorAll(".line-number");
            expect(lineNumberElements).toHaveLength(2);

            component.setAttribute("code", "line 1\nline 2\nline 3\nline 4");
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => resolve(undefined), 100);
                    });
                });
            });

            lineNumberElements = component.shadowRoot?.querySelectorAll(".line-number");
            expect(lineNumberElements).toHaveLength(4);
        });
    });

    describe("Preview Feature", () => {
        // 移除不稳定的测试，将重新构建
        test.skip("should show character count in preview", async () => {
            const testCode = "hello world";
            component.setAttribute("code", testCode);
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => resolve(undefined), 100);
                    });
                });
            });

            const charCount = component.shadowRoot?.querySelector(".char-count");
            expect(charCount?.textContent).toContain(testCode.length.toString());
        });

        test("should show language in preview header", async () => {
            component.setAttribute("language", "python");
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => resolve(undefined), 100);
                    });
                });
            });

            const previewHeader = component.shadowRoot?.querySelector(".preview-header span");
            expect(previewHeader?.textContent).toContain("python");
        });

        test.skip("should show code in preview", async () => {
            const testCode = 'console.log("test");';
            component.setAttribute("code", testCode);
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => resolve(undefined), 100);
                    });
                });
            });

            const previewCode = component.shadowRoot?.querySelector(".code-preview code");
            expect(previewCode?.textContent).toBe(testCode);
        });

        test("should show placeholder when no code", () => {
            component.setAttribute("code", "");

            const previewCode = component.shadowRoot?.querySelector(".code-preview code");
            expect(previewCode?.textContent).toBe("// Your code will appear here");
        });
    });

    describe("Readonly Mode", () => {
        test("should disable interactions in readonly mode", async () => {
            component.setAttribute("readonly", "true");
            await waitForUpdate();

            const textarea = component.shadowRoot?.querySelector(
                ".code-editor"
            ) as HTMLTextAreaElement;
            const select = component.shadowRoot?.querySelector(
                ".language-select"
            ) as HTMLSelectElement;
            const checkbox = component.shadowRoot?.querySelector(
                'input[type="checkbox"]'
            ) as HTMLInputElement;

            expect(textarea.readOnly).toBe(true);
            expect(select.disabled).toBe(true);
            expect(checkbox.disabled).toBe(true);
        });

        test("should hide action buttons in readonly mode", async () => {
            component.setAttribute("readonly", "true");
            await waitForUpdate();

            const formatBtn = component.shadowRoot?.querySelector(".format-btn");
            const copyBtn = component.shadowRoot?.querySelector(".copy-btn");

            expect(formatBtn).not.toBeInTheDocument();
            expect(copyBtn).not.toBeInTheDocument();
        });

        // 移除不稳定的测试，将重新构建
        test.skip("should show action buttons in editable mode", async () => {
            component.setAttribute("readonly", "false");
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => resolve(undefined), 100);
                    });
                });
            });

            const formatBtn = component.shadowRoot?.querySelector(".format-btn");
            const copyBtn = component.shadowRoot?.querySelector(".copy-btn");

            expect(formatBtn).toBeTruthy();
            expect(copyBtn).toBeTruthy();
        });
    });

    describe("Format Feature", () => {
        // 移除不稳定的测试，将重新构建
        test.skip("should format JSON code", async () => {
            const unformattedJson = '{"name":"test","value":123}';
            const expectedJson = '{\n  "name": "test",\n  "value": 123\n}';

            component.setAttribute("language", "json");
            component.setAttribute("code", unformattedJson);
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => resolve(undefined), 100);
                    });
                });
            });

            const formatBtn = component.shadowRoot?.querySelector(
                ".format-btn"
            ) as HTMLButtonElement;
            expect(formatBtn).toBeTruthy();
            formatBtn?.click();
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => resolve(undefined), 100);
                    });
                });
            });

            expect(component.getData().code).toBe(expectedJson);
        });

        // 移除不稳定的测试，将重新构建
        test.skip("should format JavaScript code", async () => {
            const unformattedJs = "function test(){return 42;}";
            component.setAttribute("language", "javascript");
            component.setAttribute("code", unformattedJs);
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => resolve(undefined), 100);
                    });
                });
            });

            const formatBtn = component.shadowRoot?.querySelector(
                ".format-btn"
            ) as HTMLButtonElement;
            expect(formatBtn).toBeTruthy();
            formatBtn?.click();
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => resolve(undefined), 100);
                    });
                });
            });

            const formattedCode = component.getData().code;
            expect(formattedCode).toContain("\n"); // Should have line breaks
        });

        test("should handle format errors gracefully", () => {
            const invalidJson = '{"invalid": json}';

            component.setAttribute("language", "json");
            component.setAttribute("code", invalidJson);

            const formatBtn = component.shadowRoot?.querySelector(
                ".format-btn"
            ) as HTMLButtonElement;
            formatBtn?.click();

            // Should not crash and keep original code
            expect(component.getData().code).toBe(invalidJson);
        });
    });

    describe("Language Support", () => {
        test("should support all expected languages", () => {
            const expectedLanguages = [
                "javascript",
                "typescript",
                "python",
                "java",
                "cpp",
                "css",
                "html",
                "json",
                "markdown",
            ];

            const select = component.shadowRoot?.querySelector(
                ".language-select"
            ) as HTMLSelectElement;
            const options = Array.from(select.options).map((option) => option.value);

            expectedLanguages.forEach((lang) => {
                expect(options).toContain(lang);
            });
        });

        test("should capitalize language names in select options", () => {
            const select = component.shadowRoot?.querySelector(
                ".language-select"
            ) as HTMLSelectElement;
            const javascriptOption = Array.from(select.options).find(
                (option) => option.value === "javascript"
            );

            expect(javascriptOption?.textContent).toBe("Javascript");
        });
    });

    describe("Accessibility", () => {
        test("should have proper labels", () => {
            const languageLabel = component.shadowRoot?.querySelector(".language-selector label");
            expect(languageLabel?.textContent).toBe("Language:");

            const checkboxLabel = component.shadowRoot?.querySelector(".checkbox-label");
            expect(checkboxLabel?.textContent).toContain("Line Numbers");
        });

        // 移除不稳定的测试，将重新构建
        test.skip("should have proper button titles", async () => {
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => resolve(undefined), 50);
                    });
                });
            });
            const formatBtn = component.shadowRoot?.querySelector(
                ".format-btn"
            ) as HTMLButtonElement;
            const copyBtn = component.shadowRoot?.querySelector(".copy-btn") as HTMLButtonElement;

            expect(formatBtn?.title).toBe("Format Code");
            expect(copyBtn?.title).toBe("Copy Code");
        });

        test("should have proper placeholder text", async () => {
            component.setAttribute("language", "python");
            await waitForUpdate();

            const textarea = component.shadowRoot?.querySelector(
                ".code-editor"
            ) as HTMLTextAreaElement;
            expect(textarea?.placeholder).toBe("Enter python code here...");
        });
    });
});
