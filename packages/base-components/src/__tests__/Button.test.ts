import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Button from "../Button.wsx";

// 注册组件
if (!customElements.get("wsx-button")) {
    customElements.define("wsx-button", Button);
}

describe("Button", () => {
    let button: Button;

    beforeEach(() => {
        button = document.createElement("wsx-button") as Button;
        document.body.appendChild(button);
    });

    afterEach(() => {
        if (button.parentNode) {
            document.body.removeChild(button);
        }
    });

    describe("初始化", () => {
        it("应该正确初始化", () => {
            expect(button).toBeInstanceOf(Button);
            expect(button.shadowRoot).toBeTruthy();
        });

        it("应该通过构造函数配置", () => {
            const configuredButton = new Button({
                disabled: true,
                loading: true,
                variant: "primary",
                size: "lg",
            });
            expect(configuredButton.isDisabled).toBe(true);
            expect(configuredButton.isLoading).toBe(true);
        });
    });

    describe("属性", () => {
        it("应该设置 disabled 属性", () => {
            button.setAttribute("disabled", "");
            expect(button.isDisabled).toBe(true);
            button.removeAttribute("disabled");
            expect(button.isDisabled).toBe(false);
        });

        it("应该设置 loading 属性", () => {
            button.setAttribute("loading", "");
            expect(button.isLoading).toBe(true);
            button.removeAttribute("loading");
            expect(button.isLoading).toBe(false);
        });

        it("应该设置 icon 属性", async () => {
            button.setAttribute("icon", "star");
            await new Promise((resolve) => setTimeout(resolve, 50));
            expect(button.buttonIcon).toBe("star");
        });

        it("应该设置 href 属性", async () => {
            button.setAttribute("href", "https://example.com");
            await new Promise((resolve) => setTimeout(resolve, 50));
            const link = button.shadowRoot?.querySelector("a");
            expect(link).toBeTruthy();
            expect(link?.getAttribute("href")).toBe("https://example.com");
        });

        it("应该设置 variant 属性", () => {
            button.setAttribute("variant", "danger");
            button.rerender();
            expect(button.shadowRoot?.querySelector(".btn")).toBeTruthy();
        });

        it("应该设置 size 属性", () => {
            button.setAttribute("size", "xl");
            button.rerender();
            expect(button.shadowRoot?.querySelector(".btn")).toBeTruthy();
        });

        it("应该设置 toggle 和 checked 属性", () => {
            button.setAttribute("toggle", "");
            button.setAttribute("checked", "");
            button.rerender();
            expect(button.isChecked).toBe(true);
        });
    });

    describe("事件处理", () => {
        it("应该处理点击事件", () => {
            const clickHandler = vi.fn();
            button.addEventListener("click", clickHandler);
            button.click();
            expect(clickHandler).toHaveBeenCalled();
        });

        it("应该处理 toggle 点击", async () => {
            button.setAttribute("toggle", "");
            await new Promise((resolve) => setTimeout(resolve, 10));
            button.click();
            await new Promise((resolve) => setTimeout(resolve, 10));
            expect(button.isChecked).toBe(true);
            button.click();
            await new Promise((resolve) => setTimeout(resolve, 10));
            expect(button.isChecked).toBe(false);
        });

        it("应该处理 disabled 时的点击", async () => {
            button.setAttribute("toggle", "");
            button.setAttribute("disabled", "");
            await new Promise((resolve) => setTimeout(resolve, 10));
            const clickHandler = vi.fn();
            button.addEventListener("click", clickHandler);
            button.click();
            await new Promise((resolve) => setTimeout(resolve, 10));
            // disabled 时 toggle 不应该改变
            expect(button.isChecked).toBe(false);
        });

        it("应该处理鼠标按下事件（波纹效果）", () => {
            const mouseEvent = new MouseEvent("mousedown", {
                clientX: 100,
                clientY: 100,
                bubbles: true,
            });
            const btn = button.shadowRoot?.querySelector(".btn");
            if (btn) {
                btn.dispatchEvent(mouseEvent);
                // 应该设置 CSS 变量
                expect(button.style.getPropertyValue("--x")).toBeTruthy();
                expect(button.style.getPropertyValue("--y")).toBeTruthy();
            }
        });

        it("应该处理键盘事件", () => {
            const keyEvent = new KeyboardEvent("keydown", {
                code: "Enter",
                bubbles: true,
            });
            const btn = button.shadowRoot?.querySelector(".btn");
            if (btn) {
                const stopPropagation = vi.spyOn(keyEvent, "stopPropagation");
                btn.dispatchEvent(keyEvent);
                expect(stopPropagation).toHaveBeenCalled();
            }
        });

        it("应该处理 Space 键", () => {
            const keyEvent = new KeyboardEvent("keydown", {
                code: "Space",
                bubbles: true,
            });
            const btn = button.shadowRoot?.querySelector(".btn");
            if (btn) {
                const stopPropagation = vi.spyOn(keyEvent, "stopPropagation");
                btn.dispatchEvent(keyEvent);
                expect(stopPropagation).toHaveBeenCalled();
            }
        });
    });

    describe("公共 API", () => {
        it("应该提供 focus 方法", () => {
            const focusSpy = vi.spyOn(HTMLElement.prototype, "focus");
            button.focus();
            expect(focusSpy).toHaveBeenCalled();
        });

        it("应该通过 getter/setter 设置 disabled", () => {
            button.isDisabled = true;
            expect(button.isDisabled).toBe(true);
            button.isDisabled = false;
            expect(button.isDisabled).toBe(false);
        });

        it("应该通过 getter/setter 设置 loading", () => {
            button.isLoading = true;
            expect(button.isLoading).toBe(true);
            button.isLoading = false;
            expect(button.isLoading).toBe(false);
        });

        it("应该通过 getter/setter 设置 checked", () => {
            button.setAttribute("toggle", "");
            button.isChecked = true;
            expect(button.isChecked).toBe(true);
            button.isChecked = false;
            expect(button.isChecked).toBe(false);
        });

        it("应该通过 getter/setter 设置 icon", async () => {
            button.buttonIcon = "star";
            await new Promise((resolve) => setTimeout(resolve, 10));
            expect(button.buttonIcon).toBe("star");
            button.buttonIcon = null;
            await new Promise((resolve) => setTimeout(resolve, 10));
            expect(button.buttonIcon).toBeNull();
        });

        it("应该处理所有属性变化", async () => {
            button.setAttribute("type", "submit");
            await new Promise((resolve) => setTimeout(resolve, 10));
            button.setAttribute("target", "_self");
            await new Promise((resolve) => setTimeout(resolve, 10));
            button.setAttribute("rel", "nofollow");
            await new Promise((resolve) => setTimeout(resolve, 10));
            button.setAttribute("download", "file.pdf");
            await new Promise((resolve) => setTimeout(resolve, 10));
            button.setAttribute("variant", "primary");
            await new Promise((resolve) => setTimeout(resolve, 10));
            button.setAttribute("size", "lg");
            await new Promise((resolve) => setTimeout(resolve, 10));
            expect(button.shadowRoot).toBeTruthy();
        });

        it("应该处理 updateButtonState", async () => {
            button.setAttribute("href", "https://example.com");
            await new Promise((resolve) => setTimeout(resolve, 100));
            const link = button.shadowRoot?.querySelector("a");
            expect(link).toBeTruthy();
            expect(link?.getAttribute("href")).toBe("https://example.com");

            button.setAttribute("disabled", "");
            await new Promise((resolve) => setTimeout(resolve, 200));
            // disabled 时应该移除 href - 需要重新查询元素，因为 rerender 可能重新创建了 DOM
            const linkAfterDisabled = button.shadowRoot?.querySelector("a");
            expect(linkAfterDisabled?.getAttribute("href")).toBeNull();

            button.removeAttribute("disabled");
            await new Promise((resolve) => setTimeout(resolve, 200));
            // 恢复时应该重新设置 href
            const linkAfterEnabled = button.shadowRoot?.querySelector("a");
            expect(linkAfterEnabled?.getAttribute("href")).toBe("https://example.com");
        });
    });

    describe("渲染", () => {
        it("应该渲染按钮内容", () => {
            const slot = button.shadowRoot?.querySelector("slot");
            expect(slot).toBeTruthy();
        });

        it("应该渲染 loading 状态", async () => {
            button.setAttribute("loading", "");
            await new Promise((resolve) => setTimeout(resolve, 50));
            const loading = button.shadowRoot?.querySelector(".loading");
            expect(loading).toBeTruthy();
        });

        it("应该渲染 icon", async () => {
            button.setAttribute("icon", "star");
            await new Promise((resolve) => setTimeout(resolve, 50));
            // icon 只在非 loading 时显示
            button.setAttribute("loading", "");
            await new Promise((resolve) => setTimeout(resolve, 50));
            button.removeAttribute("loading");
            await new Promise((resolve) => setTimeout(resolve, 50));
            const icon = button.shadowRoot?.querySelector(".icon");
            expect(icon).toBeTruthy();
            expect(icon?.getAttribute("data-icon")).toBe("star");
        });

        it("应该在 loading 时不显示 icon", async () => {
            button.setAttribute("icon", "star");
            button.setAttribute("loading", "");
            await new Promise((resolve) => setTimeout(resolve, 50));
            const icon = button.shadowRoot?.querySelector(".icon");
            expect(icon).toBeFalsy();
        });

        it("应该渲染为链接当有 href 时", async () => {
            button.setAttribute("href", "https://example.com");
            await new Promise((resolve) => setTimeout(resolve, 50));
            const link = button.shadowRoot?.querySelector("a");
            expect(link).toBeTruthy();
            expect(link?.getAttribute("href")).toBe("https://example.com");
        });

        it("应该在 disabled 时移除链接的 href", async () => {
            button.setAttribute("href", "https://example.com");
            await new Promise((resolve) => setTimeout(resolve, 100));
            const link = button.shadowRoot?.querySelector("a");
            expect(link).toBeTruthy();
            expect(link?.getAttribute("href")).toBe("https://example.com");

            button.setAttribute("disabled", "");
            await new Promise((resolve) => setTimeout(resolve, 200));
            // 需要重新查询元素，因为 rerender 可能重新创建了 DOM
            const linkAfterDisabled = button.shadowRoot?.querySelector("a");
            expect(linkAfterDisabled?.getAttribute("href")).toBeNull();
        });
    });
});
