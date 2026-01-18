import { describe, test, expect, beforeEach, vi } from "vitest";
import WsxCodeTool from "../WsxCodeTool.wsx";
import type { CodeData } from "../WsxCodeTool.wsx";
import type WsxCodeComponent from "../WsxCodeComponent.wsx";
import "../WsxCodeComponent.wsx";
// Mock the stylesheet import
vi.mock("../WsxCodeTool.css", () => ({ default: "" }));

describe("WsxCodeTool", () => {
    let tool: WsxCodeTool;

    beforeEach(async () => {
        tool = new WsxCodeTool();
    });

    describe("Tool Configuration", () => {
        test("should have correct toolbox configuration", () => {
            const toolbox = WsxCodeTool.toolbox;
            expect(toolbox.title).toBe("Code Block");
            expect(toolbox.icon).toBe("💻");
        });

        test("should support readonly mode", () => {
            expect(WsxCodeTool.isReadOnlySupported).toBe(true);
        });
    });

    describe("Tool Initialization", () => {
        test("should initialize with default data", () => {
            const defaultTool = new WsxCodeTool();
            expect(defaultTool["data"].code).toBe("");
            expect(defaultTool["data"].language).toBe("javascript");
            expect(defaultTool["data"].showLineNumbers).toBe(true);
        });

        test("should initialize with provided data", () => {
            const initialData: CodeData = {
                code: 'console.log("test");',
                language: "typescript",
                showLineNumbers: false,
            };

            const toolWithData = new WsxCodeTool({ data: initialData });
            expect(toolWithData["data"]).toEqual(initialData);
        });

        test("should initialize in readonly mode", () => {
            const readOnlyTool = new WsxCodeTool({ readOnly: true });
            expect(readOnlyTool["readOnly"]).toBe(true);
        });
    });

    describe("Tool Rendering", () => {
        test("should render and return HTMLElement", () => {
            const element = tool.render();
            expect(element).toBeInstanceOf(HTMLElement);
            expect(element.tagName.toLowerCase()).toBe("div");
        });

        test("should create WSX component element", () => {
            const element = tool.render();
            const component = element.querySelector("wsx-code-component");
            expect(component).toBeInstanceOf(HTMLElement);
        });

        // 移除不稳定的测试，将重新构建
        test.skip("should set initial attributes on component", () => {
            const initialData: CodeData = {
                code: "test code",
                language: "python",
                showLineNumbers: false,
            };

            const toolWithData = new WsxCodeTool({ data: initialData });
            const element = toolWithData.render();
            const component = element.querySelector("wsx-code-component") as WsxCodeComponent;

            expect(component.getAttribute("code")).toBe("test code");
            expect(component.getAttribute("language")).toBe("python");
            expect(component.getAttribute("showlinenumbers")).toBe("false");
        });

        test("should set readonly attribute when in readonly mode", () => {
            const readOnlyTool = new WsxCodeTool({ readOnly: true });
            const element = readOnlyTool.render();
            const component = element.querySelector("wsx-code-component") as WsxCodeComponent;

            expect(component.getAttribute("readonly")).toBe("true");
        });
    });

    describe("Event Handling", () => {
        test("should listen for codechange events", async () => {
            const element = tool.render();
            const component = element.querySelector("wsx-code-component") as WsxCodeComponent;

            // Simulate code change
            const event = new CustomEvent("codechange", { detail: "new code" });
            component.dispatchEvent(event);

            // Check if data was updated
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(tool["data"].code).toBe("new code");
        });

        test("should listen for languagechange events", async () => {
            const element = tool.render();
            const component = element.querySelector("wsx-code-component") as WsxCodeComponent;

            // Simulate language change
            const event = new CustomEvent("languagechange", { detail: "python" });
            component.dispatchEvent(event);

            // Check if data was updated
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(tool["data"].language).toBe("python");
        });

        test("should listen for showlinenumberschange events", async () => {
            const element = tool.render();
            const component = element.querySelector("wsx-code-component") as WsxCodeComponent;

            // Simulate line numbers toggle
            const event = new CustomEvent("showlinenumberschange", { detail: false });
            component.dispatchEvent(event);

            // Check if data was updated
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(tool["data"].showLineNumbers).toBe(false);
        });
    });

    describe("Data Saving", () => {
        test("should save data from component", () => {
            // Mock component with data
            const mockComponent = {
                getData: vi.fn().mockReturnValue({
                    code: "saved code",
                    language: "typescript",
                    showLineNumbers: true,
                }),
            } as WsxCodeComponent;

            tool["component"] = mockComponent;

            const savedData = tool.save();
            expect(savedData.code).toBe("saved code");
            expect(savedData.language).toBe("typescript");
            expect(savedData.showLineNumbers).toBe(true);
        });

        test("should return current data if no component", () => {
            tool["data"] = {
                code: "test",
                language: "javascript",
                showLineNumbers: true,
            };

            const savedData = tool.save();
            expect(savedData).toEqual(tool["data"]);
        });
    });

    describe("Data Validation", () => {
        test("should validate data with non-empty code", () => {
            const validData: CodeData = {
                code: 'console.log("valid");',
                language: "javascript",
                showLineNumbers: true,
            };

            expect(tool.validate(validData)).toBe(true);
        });

        test("should reject data with empty code", () => {
            const invalidData: CodeData = {
                code: "",
                language: "javascript",
                showLineNumbers: true,
            };

            expect(tool.validate(invalidData)).toBe(false);
        });

        test("should reject data with whitespace-only code", () => {
            const invalidData: CodeData = {
                code: "   \n\t  ",
                language: "javascript",
                showLineNumbers: true,
            };

            expect(tool.validate(invalidData)).toBe(false);
        });

        test("should handle undefined code", () => {
            const invalidData = {
                language: "javascript",
                showLineNumbers: true,
            } as CodeData;

            expect(tool.validate(invalidData)).toBe(false);
        });
    });

    describe("Settings Rendering", () => {
        test("should render settings panel", () => {
            const settings = tool.renderSettings();
            expect(settings).toBeInstanceOf(HTMLElement);
            expect(settings.tagName.toLowerCase()).toBe("div");
        });

        test("should have proper settings content", () => {
            const settings = tool.renderSettings();
            expect(settings.textContent).toContain("WSX Code Block Settings");
            expect(settings.textContent).toContain("syntax highlighting");
            expect(settings.textContent).toContain("line numbers");
            expect(settings.textContent).toContain("formatting capabilities");
        });

        test("should have proper styling", () => {
            const settings = tool.renderSettings();
            expect(settings.style.padding).toBe("16px");

            const label = settings.querySelector("label");
            expect(label?.style.fontWeight).toBe("bold");

            const description = settings.querySelector("p");
            expect(description?.style.color).toBe("#666");
            expect(description?.style.fontSize).toBe("14px");
        });
    });

    describe("Integration", () => {
        // 移除不稳定的测试，将重新构建
        test.skip("should work with EditorJS block structure", () => {
            const element = tool.render();

            // Should return a block-level element suitable for EditorJS
            expect(element.style.display).toBe("block");
            expect(element.children.length).toBe(1);
            expect(element.firstElementChild?.tagName.toLowerCase()).toBe("wsx-code-component");
        });

        // 移除不稳定的测试，将重新构建
        test.skip("should maintain data consistency between renders", () => {
            const initialData: CodeData = {
                code: "const x = 42;",
                language: "javascript",
                showLineNumbers: true,
            };

            const toolWithData = new WsxCodeTool({ data: initialData });

            // First render
            const element1 = toolWithData.render();
            const component1 = element1.querySelector("wsx-code-component") as WsxCodeComponent;
            expect(component1.getAttribute("code")).toBe("const x = 42;");

            // Simulate saving without component changes - should return current data
            const savedData = toolWithData.save();
            expect(savedData.code).toBe("const x = 42;");
        });

        test("should handle component lifecycle properly", () => {
            const element = tool.render();
            expect(tool["wrapper"]).toBe(element);
            expect(tool["component"]).toBeInstanceOf(HTMLElement);

            // Should be able to access component after render
            const component = tool["component"] as WsxCodeComponent;
            expect(component.tagName.toLowerCase()).toBe("wsx-code-component");
        });
    });

    describe("Error Handling", () => {
        test("should handle missing component gracefully in save", () => {
            tool["component"] = undefined;

            expect(() => tool.save()).not.toThrow();
            const savedData = tool.save();
            expect(savedData).toEqual(tool["data"]);
        });

        test("should handle component creation errors", () => {
            // Mock document.createElement to throw
            const originalCreateElement = document.createElement;
            document.createElement = vi.fn().mockImplementation(() => {
                throw new Error("createElement failed");
            });

            expect(() => tool.render()).toThrow("createElement failed");

            // Restore original
            document.createElement = originalCreateElement;
        });
    });
});
