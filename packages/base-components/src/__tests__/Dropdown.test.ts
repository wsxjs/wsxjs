import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Dropdown from "../Dropdown.wsx";

// 注册组件
if (!customElements.get("wsx-dropdown")) {
    customElements.define("wsx-dropdown", Dropdown);
}

describe("Dropdown", () => {
    let dropdown: Dropdown;

    beforeEach(() => {
        dropdown = document.createElement("wsx-dropdown") as Dropdown;
        document.body.appendChild(dropdown);
    });

    afterEach(() => {
        if (dropdown.parentNode) {
            document.body.removeChild(dropdown);
        }
    });

    describe("初始化", () => {
        it("应该正确初始化", () => {
            expect(dropdown).toBeInstanceOf(Dropdown);
            expect(dropdown.shadowRoot).toBeTruthy();
        });

        it("应该通过构造函数配置", () => {
            const configuredDropdown = new Dropdown({
                placeholder: "选择...",
                disabled: true,
                align: "right",
                position: "top",
                trigger: "hover",
            });
            expect(configuredDropdown).toBeInstanceOf(Dropdown);
        });
    });

    describe("选项管理", () => {
        it("应该设置选项列表", async () => {
            const options = [
                { value: "1", label: "选项1" },
                { value: "2", label: "选项2" },
            ];
            dropdown.setOptions(options);
            await new Promise((resolve) => setTimeout(resolve, 100));
            const button = dropdown.shadowRoot?.querySelector(".dropdown-button");
            if (button) {
                button.click();
                await new Promise((resolve) => setTimeout(resolve, 100));
                const menu = dropdown.shadowRoot?.querySelector(".dropdown-menu");
                expect(menu).toBeTruthy();
            }
        });

        it("应该设置选中的值", () => {
            const options = [
                { value: "1", label: "选项1" },
                { value: "2", label: "选项2" },
            ];
            dropdown.setOptions(options);
            dropdown.setValue("1");
            expect(dropdown.getValue()).toBe("1");
        });

        it("应该获取选中的值", () => {
            expect(dropdown.getValue()).toBeUndefined();
            dropdown.setValue("test");
            expect(dropdown.getValue()).toBe("test");
        });

        it("应该处理空字符串值", () => {
            dropdown.setValue("");
            expect(dropdown.getValue()).toBeUndefined();
        });
    });

    describe("下拉菜单", () => {
        it("应该切换下拉菜单", async () => {
            const options = [{ value: "1", label: "选项1" }];
            dropdown.setOptions(options);
            dropdown.rerender();
            await new Promise((resolve) => setTimeout(resolve, 10));

            const button = dropdown.shadowRoot?.querySelector(".dropdown-button");
            if (button) {
                button.click();
                await new Promise((resolve) => setTimeout(resolve, 10));
                const menu = dropdown.shadowRoot?.querySelector(".dropdown-menu");
                expect(menu).toBeTruthy();
            }
        });

        it("应该选择选项", async () => {
            const options = [
                { value: "1", label: "选项1" },
                { value: "2", label: "选项2" },
            ];
            dropdown.setOptions(options);
            dropdown.rerender();
            await new Promise((resolve) => setTimeout(resolve, 10));

            const changeHandler = vi.fn();
            dropdown.addEventListener("change", changeHandler);

            const button = dropdown.shadowRoot?.querySelector(".dropdown-button");
            if (button) {
                button.click();
                await new Promise((resolve) => setTimeout(resolve, 10));
                const option = dropdown.shadowRoot?.querySelector(
                    '.dropdown-option[role="option"]'
                );
                if (option) {
                    (option as HTMLElement).click();
                    await new Promise((resolve) => setTimeout(resolve, 10));
                    expect(changeHandler).toHaveBeenCalled();
                }
            }
        });

        it("应该处理禁用选项", async () => {
            const options = [
                { value: "1", label: "选项1", disabled: true },
                { value: "2", label: "选项2" },
            ];
            dropdown.setOptions(options);
            await new Promise((resolve) => setTimeout(resolve, 100));

            const button = dropdown.shadowRoot?.querySelector(".dropdown-button");
            if (button) {
                button.click();
                await new Promise((resolve) => setTimeout(resolve, 100));
                const disabledOption = dropdown.shadowRoot?.querySelector(
                    ".dropdown-option.disabled"
                );
                expect(disabledOption).toBeTruthy();
            }
        });

        it("应该显示空状态", async () => {
            dropdown.setOptions([]);
            dropdown.rerender();
            await new Promise((resolve) => setTimeout(resolve, 10));

            const button = dropdown.shadowRoot?.querySelector(".dropdown-button");
            if (button) {
                button.click();
                await new Promise((resolve) => setTimeout(resolve, 10));
                const empty = dropdown.shadowRoot?.querySelector(".dropdown-empty");
                expect(empty).toBeTruthy();
            }
        });
    });

    describe("配置", () => {
        it("应该处理 disabled 配置", async () => {
            const configuredDropdown = new Dropdown({ disabled: true });
            document.body.appendChild(configuredDropdown);
            configuredDropdown.rerender();
            await new Promise((resolve) => setTimeout(resolve, 10));
            const button = configuredDropdown.shadowRoot?.querySelector(".dropdown-button");
            expect(button?.hasAttribute("disabled")).toBe(true);
            document.body.removeChild(configuredDropdown);
        });

        it("应该处理 placeholder", async () => {
            const configuredDropdown = new Dropdown({ placeholder: "自定义占位符" });
            document.body.appendChild(configuredDropdown);
            configuredDropdown.rerender();
            await new Promise((resolve) => setTimeout(resolve, 10));
            const text = configuredDropdown.shadowRoot?.querySelector(".dropdown-text");
            expect(text?.textContent).toBe("自定义占位符");
            document.body.removeChild(configuredDropdown);
        });

        it("应该处理 hover trigger", async () => {
            const configuredDropdown = new Dropdown({ trigger: "hover" });
            document.body.appendChild(configuredDropdown);
            const options = [{ value: "1", label: "选项1" }];
            configuredDropdown.setOptions(options);
            await new Promise((resolve) => setTimeout(resolve, 100));

            const button = configuredDropdown.shadowRoot?.querySelector(".dropdown-button");
            if (button) {
                const mouseEnter = new MouseEvent("mouseenter", { bubbles: true });
                button.dispatchEvent(mouseEnter);
                await new Promise((resolve) => setTimeout(resolve, 100));
                const menu = configuredDropdown.shadowRoot?.querySelector(".dropdown-menu");
                expect(menu).toBeTruthy();
            }
            document.body.removeChild(configuredDropdown);
        });

        it("应该处理外部点击关闭", async () => {
            const options = [{ value: "1", label: "选项1" }];
            dropdown.setOptions(options);
            dropdown.rerender();
            await new Promise((resolve) => setTimeout(resolve, 50));

            const button = dropdown.shadowRoot?.querySelector(".dropdown-button");
            if (button) {
                button.click();
                await new Promise((resolve) => setTimeout(resolve, 100));
                // Wait for handler to attach
                await new Promise((resolve) => setTimeout(resolve, 50));
                // 点击外部
                document.body.click();
                await new Promise((resolve) => setTimeout(resolve, 100));
                const menu = dropdown.shadowRoot?.querySelector(".dropdown-menu");
                expect(menu).toBeFalsy();
            }
        });

        it("应该处理 disabled 时不能打开", async () => {
            const configuredDropdown = new Dropdown({ disabled: true });
            document.body.appendChild(configuredDropdown);
            const options = [{ value: "1", label: "选项1" }];
            configuredDropdown.setOptions(options);
            configuredDropdown.rerender();
            await new Promise((resolve) => setTimeout(resolve, 10));

            const button = configuredDropdown.shadowRoot?.querySelector(".dropdown-button");
            if (button) {
                button.click();
                await new Promise((resolve) => setTimeout(resolve, 10));
                const menu = configuredDropdown.shadowRoot?.querySelector(".dropdown-menu");
                expect(menu).toBeFalsy();
            }
            document.body.removeChild(configuredDropdown);
        });

        it("应该处理自定义渲染函数", async () => {
            const options = [
                {
                    value: "1",
                    label: "选项1",
                    render: () => {
                        const div = document.createElement("div");
                        div.textContent = "自定义渲染";
                        return div;
                    },
                },
            ];
            dropdown.setOptions(options);
            await new Promise((resolve) => setTimeout(resolve, 100));

            const button = dropdown.shadowRoot?.querySelector(".dropdown-button");
            if (button) {
                button.click();
                await new Promise((resolve) => setTimeout(resolve, 50));
                // 查找自定义渲染的元素
                const option = dropdown.shadowRoot?.querySelector(".dropdown-option");
                if (option) {
                    const custom = option.querySelector("div");
                    expect(custom?.textContent).toBe("自定义渲染");
                }
            }
        });

        it("应该处理 hover trigger 的鼠标离开", async () => {
            const configuredDropdown = new Dropdown({ trigger: "hover" });
            document.body.appendChild(configuredDropdown);
            const options = [{ value: "1", label: "选项1" }];
            configuredDropdown.setOptions(options);
            configuredDropdown.rerender();
            await new Promise((resolve) => setTimeout(resolve, 50));

            const button = configuredDropdown.shadowRoot?.querySelector(".dropdown-button");
            if (button) {
                const mouseEnter = new MouseEvent("mouseenter", { bubbles: true });
                button.dispatchEvent(mouseEnter);
                await new Promise((resolve) => setTimeout(resolve, 50));
                const menu = configuredDropdown.shadowRoot?.querySelector(".dropdown-menu");
                expect(menu).toBeTruthy();
                const mouseLeave = new MouseEvent("mouseleave", { bubbles: true });
                button.dispatchEvent(mouseLeave);
                await new Promise((resolve) => setTimeout(resolve, 50));
                const menuAfterLeave =
                    configuredDropdown.shadowRoot?.querySelector(".dropdown-menu");
                // hover trigger 在 mouseleave 时应该关闭
                expect(menuAfterLeave).toBeFalsy();
            }
            document.body.removeChild(configuredDropdown);
        });

        it("应该在组件断开时清理事件监听器", async () => {
            const configuredDropdown = new Dropdown();
            document.body.appendChild(configuredDropdown);
            const options = [{ value: "1", label: "选项1" }];
            configuredDropdown.setOptions(options);
            configuredDropdown.rerender();
            await new Promise((resolve) => setTimeout(resolve, 10));

            const button = configuredDropdown.shadowRoot?.querySelector(".dropdown-button");
            if (button) {
                button.click();
                await new Promise((resolve) => setTimeout(resolve, 10));
            }

            const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
            document.body.removeChild(configuredDropdown);
            // 应该清理事件监听器
            expect(removeEventListenerSpy).toHaveBeenCalled();
        });

        it("应该处理 hover trigger 的菜单鼠标事件", async () => {
            const configuredDropdown = new Dropdown({ trigger: "hover" });
            document.body.appendChild(configuredDropdown);
            const options = [{ value: "1", label: "选项1" }];
            configuredDropdown.setOptions(options);
            configuredDropdown.rerender();
            await new Promise((resolve) => setTimeout(resolve, 100));

            const button = configuredDropdown.shadowRoot?.querySelector(".dropdown-button");
            if (button) {
                const mouseEnter = new MouseEvent("mouseenter", { bubbles: true });
                button.dispatchEvent(mouseEnter);
                await new Promise((resolve) => setTimeout(resolve, 100));
                const menu = configuredDropdown.shadowRoot?.querySelector(".dropdown-menu");
                expect(menu).toBeTruthy();
                if (menu) {
                    // 菜单的 mouseenter 应该保持打开
                    const menuMouseEnter = new MouseEvent("mouseenter", { bubbles: true });
                    menu.dispatchEvent(menuMouseEnter);
                    await new Promise((resolve) => setTimeout(resolve, 10));
                    const menuAfter =
                        configuredDropdown.shadowRoot?.querySelector(".dropdown-menu");
                    expect(menuAfter).toBeTruthy();
                }
            }
            document.body.removeChild(configuredDropdown);
        });
    });

    describe("事件", () => {
        it("应该在值改变时触发 change 事件", () => {
            const changeHandler = vi.fn();
            dropdown.addEventListener("change", changeHandler);
            dropdown.setValue("test");
            expect(changeHandler).toHaveBeenCalled();
        });
    });
});
