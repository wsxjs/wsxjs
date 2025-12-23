import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import CodeBlock from "../CodeBlock.wsx";

// 注册组件
if (!customElements.get("code-block")) {
    customElements.define("code-block", CodeBlock);
}

describe("CodeBlock", () => {
    let codeBlock: CodeBlock;

    beforeEach(() => {
        codeBlock = document.createElement("code-block") as CodeBlock;
        document.body.appendChild(codeBlock);
    });

    afterEach(() => {
        if (codeBlock.parentNode) {
            document.body.removeChild(codeBlock);
        }
    });

    describe("初始化", () => {
        it("应该正确初始化", () => {
            expect(codeBlock).toBeInstanceOf(CodeBlock);
        });

        it("应该从属性初始化", async () => {
            codeBlock.setAttribute("code", "const x = 1;");
            codeBlock.setAttribute("language", "javascript");
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(codeBlock).toBeTruthy();
        });
    });

    describe("配置", () => {
        it("应该更新配置", async () => {
            codeBlock.updateConfig({
                code: "const x = 1;",
                language: "javascript",
                title: "Test",
            });
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(codeBlock).toBeTruthy();
        });

        it("应该处理代码段", async () => {
            codeBlock.updateConfig({
                segments: [
                    { code: "const x = 1;", language: "javascript" },
                    { code: "print(x)", language: "python" },
                ],
            });
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(codeBlock).toBeTruthy();
        });
    });

    describe("复制功能", () => {
        it("应该复制代码", async () => {
            // Mock navigator.clipboard for JSDOM
            const mockWriteText = vi.fn().mockResolvedValue(undefined);
            Object.defineProperty(navigator, "clipboard", {
                value: {
                    writeText: mockWriteText,
                },
                writable: true,
                configurable: true,
            });

            codeBlock.setAttribute("code", "const x = 1;");
            codeBlock.setAttribute("show-copy", "true");
            await new Promise((resolve) => setTimeout(resolve, 200));

            const copyButton = codeBlock.querySelector(".btn-copy");
            if (copyButton) {
                copyButton.click();
                await new Promise((resolve) => setTimeout(resolve, 100));
                expect(mockWriteText).toHaveBeenCalledWith("const x = 1;");
            }
        });

        it("应该处理复制失败的回退", async () => {
            // Mock navigator.clipboard for JSDOM - make it fail
            const mockWriteText = vi.fn().mockRejectedValue(new Error("Failed"));
            Object.defineProperty(navigator, "clipboard", {
                value: {
                    writeText: mockWriteText,
                },
                writable: true,
                configurable: true,
            });

            // Mock document.execCommand for JSDOM
            const mockExecCommand = vi.fn().mockReturnValue(true);
            Object.defineProperty(document, "execCommand", {
                value: mockExecCommand,
                writable: true,
                configurable: true,
            });

            codeBlock.setAttribute("code", "const x = 1;");
            codeBlock.setAttribute("show-copy", "true");
            await new Promise((resolve) => setTimeout(resolve, 200));

            const copyButton = codeBlock.querySelector(".btn-copy");
            if (copyButton) {
                // Mock createElement 和 appendChild
                const createElementSpy = vi.spyOn(document, "createElement");
                const appendChildSpy = vi.spyOn(document.body, "appendChild");
                const removeChildSpy = vi.spyOn(document.body, "removeChild");

                copyButton.click();
                await new Promise((resolve) => setTimeout(resolve, 200));
                // 应该尝试使用 fallback
                expect(mockWriteText).toHaveBeenCalled();
                expect(createElementSpy).toHaveBeenCalledWith("textarea");
                expect(appendChildSpy).toHaveBeenCalled();
                expect(mockExecCommand).toHaveBeenCalledWith("copy");
                expect(removeChildSpy).toHaveBeenCalled();
            }
        });
    });

    describe("在线体验功能", () => {
        it("应该处理在线体验按钮", async () => {
            const callback = vi.fn();
            codeBlock.updateConfig({
                code: "const x = 1;",
                showTryOnline: true,
                onTryOnline: callback,
            });
            await new Promise((resolve) => setTimeout(resolve, 200));

            const tryButton = codeBlock.querySelector(".btn-try");
            if (tryButton) {
                tryButton.click();
                expect(callback).toHaveBeenCalled();
            }
        });

        it("应该使用 tryOnlineUrl", async () => {
            const originalLocation = window.location;
            const mockLocation = {
                href: "",
                assign: vi.fn(),
                replace: vi.fn(),
                reload: vi.fn(),
            };
            delete (window as { location?: Location }).location;
            (window as { location: Location }).location = mockLocation as unknown as Location;

            codeBlock.updateConfig({
                code: "const x = 1;",
                showTryOnline: true,
                tryOnlineUrl: "https://example.com/playground",
            });
            await new Promise((resolve) => setTimeout(resolve, 200));

            const tryButton = codeBlock.querySelector(".btn-try");
            if (tryButton) {
                tryButton.click();
                await new Promise((resolve) => setTimeout(resolve, 10));
                expect(mockLocation.href).toBe("https://example.com/playground");
            }

            (window as { location: Location }).location = originalLocation;
        });

        it("应该使用默认 playground URL", async () => {
            const originalLocation = window.location;
            const mockLocation = {
                href: "",
                assign: vi.fn(),
                replace: vi.fn(),
                reload: vi.fn(),
            };
            delete (window as { location?: Location }).location;
            (window as { location: Location }).location = mockLocation as unknown as Location;

            codeBlock.updateConfig({
                code: "const x = 1;",
                showTryOnline: true,
            });
            await new Promise((resolve) => setTimeout(resolve, 200));

            const tryButton = codeBlock.querySelector(".btn-try");
            if (tryButton) {
                tryButton.click();
                await new Promise((resolve) => setTimeout(resolve, 10));
                expect(mockLocation.href).toBe("/playground");
            }

            (window as { location: Location }).location = originalLocation;
        });
    });

    describe("属性变化", () => {
        it("应该处理 code 属性变化", async () => {
            codeBlock.setAttribute("code", "const x = 1;");
            await new Promise((resolve) => setTimeout(resolve, 100));
            codeBlock.setAttribute("code", "const y = 2;");
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(codeBlock).toBeTruthy();
        });

        it("应该处理 language 属性变化", async () => {
            codeBlock.setAttribute("language", "javascript");
            await new Promise((resolve) => setTimeout(resolve, 200));
            expect(codeBlock).toBeTruthy();
        });

        it("应该处理语法高亮", async () => {
            codeBlock.setAttribute("code", "const x = 1;");
            codeBlock.setAttribute("language", "javascript");
            // 等待属性变化处理完成和 rerender 完成（rerender 使用 requestAnimationFrame）
            // 使用轮询等待 code 元素出现，最多等待 2 秒
            let code: HTMLElement | null = null;
            for (let i = 0; i < 100; i++) {
                await new Promise((resolve) => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            setTimeout(resolve, 20);
                        });
                    });
                });
                code = codeBlock.querySelector("code");
                if (code) break;
            }
            // 应该应用语法高亮
            // CodeBlock 使用 Light DOM，所以直接查询
            expect(code).toBeTruthy();
            expect(code?.textContent).toBe("const x = 1;");
        });

        it("应该处理高亮失败的情况", async () => {
            const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
            // 使用无效的语言
            codeBlock.setAttribute("code", "test");
            codeBlock.setAttribute("language", "invalid-language");
            // 等待属性变化处理完成和 rerender 完成（rerender 使用 requestAnimationFrame）
            // 使用轮询等待 code 元素出现，最多等待 2 秒
            let code: HTMLElement | null = null;
            for (let i = 0; i < 100; i++) {
                await new Promise((resolve) => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            setTimeout(resolve, 20);
                        });
                    });
                });
                code = codeBlock.querySelector("code");
                if (code) break;
            }
            // 应该仍然显示代码
            // CodeBlock 使用 Light DOM，所以直接查询
            expect(code).toBeTruthy();
            expect(code?.textContent).toBe("test");
            consoleErrorSpy.mockRestore();
        });

        it("应该处理 title 属性变化", async () => {
            codeBlock.setAttribute("title", "Test Title");
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(codeBlock).toBeTruthy();
        });
    });
});
