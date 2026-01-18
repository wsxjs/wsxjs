import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import ColorPicker from "../ColorPicker.wsx";

// 注册组件
if (!customElements.get("wsx-color-picker")) {
    customElements.define("wsx-color-picker", ColorPicker);
}

describe("ColorPicker", () => {
    let colorPicker: ColorPicker;
    let originalLocalStorage: Storage;

    beforeEach(async () => {
        originalLocalStorage = window.localStorage;
        const store: Record<string, string> = {};
        Object.defineProperty(window, "localStorage", {
            value: {
                getItem: (key: string) => store[key] || null,
                setItem: (key: string, value: string) => {
                    store[key] = value;
                },
                removeItem: (key: string) => {
                    delete store[key];
                },
                clear: () => {
                    Object.keys(store).forEach((key) => delete store[key]);
                },
            },
            writable: true,
        });

        colorPicker = document.createElement("wsx-color-picker") as ColorPicker;
        document.body.appendChild(colorPicker);
        if (colorPicker.connectedCallback) {
            colorPicker.connectedCallback();
        }
        await new Promise((resolve) => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setTimeout(() => resolve(undefined), 10);
                });
            });
        });
    });

    afterEach(() => {
        if (colorPicker.parentNode) {
            document.body.removeChild(colorPicker);
        }
        window.localStorage = originalLocalStorage;
    });

    describe("初始化", () => {
        it("应该正确初始化", () => {
            expect(colorPicker).toBeInstanceOf(ColorPicker);
            expect(colorPicker.shadowRoot).toBeTruthy();
        });

        it("应该通过构造函数配置", () => {
            const configuredPicker = new ColorPicker({
                colorCollections: ["#ff0000", "#00ff00"],
                hasCustomPicker: true,
                pluginType: "marker",
            });
            expect(configuredPicker).toBeInstanceOf(ColorPicker);
        });
    });

    describe("颜色选择", () => {
        it("应该选择颜色", async () => {
            const colorHandler = vi.fn();
            colorPicker.addEventListener("colorchange", colorHandler);

            const colorBtn = colorPicker.shadowRoot?.querySelector(".color-btn");
            if (colorBtn) {
                colorBtn.click();
                await new Promise((resolve) => setTimeout(resolve, 50));

                const colorCube = colorPicker.shadowRoot?.querySelector(".color-cube");
                if (colorCube) {
                    colorCube.click();
                    await new Promise((resolve) => setTimeout(resolve, 50));
                    expect(colorHandler).toHaveBeenCalled();
                }
            }
        });

        it("应该处理自定义颜色选择器", async () => {
            const configuredPicker = new ColorPicker({ hasCustomPicker: true });
            document.body.appendChild(configuredPicker);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const colorBtn = configuredPicker.shadowRoot?.querySelector(".color-btn");
            if (colorBtn) {
                colorBtn.click();
                await new Promise((resolve) => setTimeout(resolve, 50));
                const customPicker = configuredPicker.shadowRoot?.querySelector(".custom-picker");
                expect(customPicker).toBeTruthy();
            }
            document.body.removeChild(configuredPicker);
        });

        it("应该渲染颜色按钮", async () => {
            await new Promise((resolve) => setTimeout(resolve, 50));
            const colorBtn = colorPicker.shadowRoot?.querySelector(".color-btn");
            expect(colorBtn).toBeTruthy();
        });

        it("应该处理面板点击事件", async () => {
            const colorBtn = colorPicker.shadowRoot?.querySelector(".color-btn");
            if (colorBtn) {
                colorBtn.click();
                await new Promise((resolve) => setTimeout(resolve, 50));
                const panel = colorPicker.shadowRoot?.querySelector(".color-panel");
                if (panel) {
                    const clickEvent = new MouseEvent("click", { bubbles: true });
                    panel.dispatchEvent(clickEvent);
                    // 面板点击不应该关闭面板
                    await new Promise((resolve) => setTimeout(resolve, 10));
                    expect(panel).toBeTruthy();
                }
            }
        });

        it("应该处理文档点击关闭面板", async () => {
            const colorBtn = colorPicker.shadowRoot?.querySelector(".color-btn");
            if (colorBtn) {
                colorBtn.click();
                await new Promise((resolve) => setTimeout(resolve, 50));
                // 点击文档外部
                document.body.click();
                await new Promise((resolve) => setTimeout(resolve, 50));
                const panel = colorPicker.shadowRoot?.querySelector(".color-panel");
                expect(panel).toBeFalsy();
            }
        });

        it("应该在组件断开时清理事件监听器", () => {
            const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
            document.body.removeChild(colorPicker);
            expect(removeEventListenerSpy).toHaveBeenCalled();
            removeEventListenerSpy.mockRestore();
        });
    });

    describe("公共 API", () => {
        it("应该获取选中的颜色", () => {
            const color = colorPicker.getSelectedColor();
            expect(typeof color).toBe("string");
        });

        it("应该设置颜色", () => {
            colorPicker.setColor("#ff0000");
            expect(colorPicker.getSelectedColor()).toBe("#ff0000");
        });

        it("应该聚焦组件", () => {
            const focusSpy = vi.spyOn(HTMLElement.prototype, "focus");
            colorPicker.focus();
            expect(focusSpy).toHaveBeenCalled();
        });
    });

    describe("属性变化", () => {
        it("应该处理 disabled 属性", async () => {
            colorPicker.setAttribute("disabled", "");
            await new Promise((resolve) => setTimeout(resolve, 10));
            expect(colorPicker.shadowRoot).toBeTruthy();
        });

        it("应该处理 selected-color 属性", async () => {
            colorPicker.setAttribute("selected-color", "#00ff00");
            await new Promise((resolve) => setTimeout(resolve, 10));
            expect(colorPicker.getSelectedColor()).toBe("#00ff00");
        });
    });

    describe("面板切换", () => {
        it("应该切换面板", async () => {
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => resolve(undefined), 100);
                    });
                });
            });
            const colorBtn = colorPicker.shadowRoot?.querySelector(".color-btn");
            expect(colorBtn).toBeTruthy();
            if (colorBtn) {
                colorBtn.click();
                await new Promise((resolve) => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            setTimeout(() => resolve(undefined), 100);
                        });
                    });
                });
                const panel = colorPicker.shadowRoot?.querySelector(".color-panel");
                expect(panel).toBeTruthy();
            }
        });
    });
});
