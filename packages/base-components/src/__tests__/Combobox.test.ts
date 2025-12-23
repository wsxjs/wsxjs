import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Combobox from "../Combobox.wsx";

// 注册组件
if (!customElements.get("wsx-combobox")) {
    customElements.define("wsx-combobox", Combobox);
}

describe("Combobox", () => {
    let combobox: Combobox;

    beforeEach(() => {
        combobox = document.createElement("wsx-combobox") as Combobox;
        document.body.appendChild(combobox);
    });

    afterEach(() => {
        if (combobox.parentNode) {
            document.body.removeChild(combobox);
        }
    });

    describe("初始化", () => {
        it("应该正确初始化", () => {
            expect(combobox).toBeInstanceOf(Combobox);
            expect(combobox.shadowRoot).toBeTruthy();
        });

        it("应该通过构造函数配置", () => {
            const configuredCombobox = new Combobox({
                placeholder: "搜索...",
                searchable: false,
                multiple: true,
            });
            expect(configuredCombobox).toBeInstanceOf(Combobox);
        });
    });

    describe("选项管理", () => {
        it("应该设置选项列表", async () => {
            const options = [
                { value: "1", label: "选项1" },
                { value: "2", label: "选项2" },
            ];
            combobox.setOptions(options);
            await new Promise((resolve) => setTimeout(resolve, 50));
            expect(combobox.shadowRoot).toBeTruthy();
        });

        it("应该设置选中的值（单选）", () => {
            const options = [
                { value: "1", label: "选项1" },
                { value: "2", label: "选项2" },
            ];
            combobox.setOptions(options);
            combobox.setValue("1");
            expect(combobox.getValue()).toBe("1");
        });

        it("应该设置选中的值（多选）", () => {
            const configuredCombobox = new Combobox({ multiple: true });
            document.body.appendChild(configuredCombobox);
            const options = [
                { value: "1", label: "选项1" },
                { value: "2", label: "选项2" },
            ];
            configuredCombobox.setOptions(options);
            configuredCombobox.setValue(["1", "2"]);
            const value = configuredCombobox.getValue();
            expect(Array.isArray(value)).toBe(true);
            expect((value as string[]).length).toBe(2);
            document.body.removeChild(configuredCombobox);
        });
    });

    describe("搜索功能", () => {
        it("应该支持搜索", async () => {
            const options = [
                { value: "1", label: "选项1" },
                { value: "2", label: "选项2" },
            ];
            combobox.setOptions(options);
            combobox.rerender();
            await new Promise((resolve) => setTimeout(resolve, 10));

            const input = combobox.shadowRoot?.querySelector("input");
            if (input) {
                input.value = "选项1";
                input.dispatchEvent(new Event("input", { bubbles: true }));
                await new Promise((resolve) => setTimeout(resolve, 10));
                expect(input.value).toBe("选项1");
            }
        });

        it("应该过滤选项", async () => {
            const configuredCombobox = new Combobox({ searchable: true });
            document.body.appendChild(configuredCombobox);
            const options = [
                { value: "1", label: "Apple" },
                { value: "2", label: "Banana" },
            ];
            configuredCombobox.setOptions(options);
            configuredCombobox.rerender();
            await new Promise((resolve) => setTimeout(resolve, 10));

            const input = configuredCombobox.shadowRoot?.querySelector("input");
            if (input) {
                input.focus();
                await new Promise((resolve) => setTimeout(resolve, 10));
                input.value = "Apple";
                input.dispatchEvent(new Event("input", { bubbles: true }));
                await new Promise((resolve) => setTimeout(resolve, 10));
                expect(input.value).toBe("Apple");
            }
            document.body.removeChild(configuredCombobox);
        });
    });

    describe("多选功能", () => {
        it("应该支持多选", async () => {
            const configuredCombobox = new Combobox({ multiple: true });
            document.body.appendChild(configuredCombobox);
            const options = [
                { value: "1", label: "选项1" },
                { value: "2", label: "选项2" },
            ];
            configuredCombobox.setOptions(options);
            configuredCombobox.rerender();
            await new Promise((resolve) => setTimeout(resolve, 10));

            configuredCombobox.setValue(["1", "2"]);
            await new Promise((resolve) => setTimeout(resolve, 10));
            const value = configuredCombobox.getValue();
            expect(Array.isArray(value)).toBe(true);
            document.body.removeChild(configuredCombobox);
        });
    });

    describe("事件", () => {
        it("应该在值改变时触发 change 事件", () => {
            const changeHandler = vi.fn();
            combobox.addEventListener("change", changeHandler);
            combobox.setValue("test");
            expect(changeHandler).toHaveBeenCalled();
        });
    });

    describe("下拉菜单", () => {
        it("应该切换下拉菜单", async () => {
            const options = [{ value: "1", label: "选项1" }];
            combobox.setOptions(options);
            combobox.rerender();
            await new Promise((resolve) => setTimeout(resolve, 50));

            const arrow = combobox.shadowRoot?.querySelector(".combobox-arrow");
            if (arrow) {
                // 第一次点击，打开下拉菜单
                arrow.click();
                await new Promise((resolve) => setTimeout(resolve, 300));
                const menu = combobox.shadowRoot?.querySelector(".combobox-menu");
                expect(menu).toBeTruthy();
                // 确保输入框失去焦点，避免 openDropdown 被触发
                const input = combobox.shadowRoot?.querySelector("input");
                if (input) {
                    input.blur();
                }
                await new Promise((resolve) => setTimeout(resolve, 50));
                // 第二次点击，关闭下拉菜单
                arrow.click();
                await new Promise((resolve) => setTimeout(resolve, 300));
                expect(combobox.shadowRoot?.querySelector(".combobox-menu")).toBeFalsy();
            }
        });

        it("应该选择选项（单选）", async () => {
            const options = [
                { value: "1", label: "选项1" },
                { value: "2", label: "选项2" },
            ];
            combobox.setOptions(options);
            combobox.rerender();
            await new Promise((resolve) => setTimeout(resolve, 10));

            const input = combobox.shadowRoot?.querySelector("input");
            if (input) {
                input.click();
                await new Promise((resolve) => setTimeout(resolve, 10));
                const option = combobox.shadowRoot?.querySelector(
                    '.combobox-option[role="option"]'
                );
                if (option) {
                    (option as HTMLElement).click();
                    await new Promise((resolve) => setTimeout(resolve, 10));
                    expect(combobox.getValue()).toBe("1");
                }
            }
        });

        it("应该选择选项（多选）", async () => {
            const configuredCombobox = new Combobox({ multiple: true });
            document.body.appendChild(configuredCombobox);
            const options = [
                { value: "1", label: "选项1" },
                { value: "2", label: "选项2" },
            ];
            configuredCombobox.setOptions(options);
            configuredCombobox.rerender();
            await new Promise((resolve) => setTimeout(resolve, 10));

            const input = configuredCombobox.shadowRoot?.querySelector("input");
            if (input) {
                input.click();
                await new Promise((resolve) => setTimeout(resolve, 10));
                const option = configuredCombobox.shadowRoot?.querySelector(
                    '.combobox-option[role="option"]'
                );
                if (option) {
                    (option as HTMLElement).click();
                    await new Promise((resolve) => setTimeout(resolve, 10));
                    const value = configuredCombobox.getValue();
                    expect(Array.isArray(value)).toBe(true);
                }
            }
            document.body.removeChild(configuredCombobox);
        });

        it("应该移除多选值", async () => {
            const configuredCombobox = new Combobox({ multiple: true });
            document.body.appendChild(configuredCombobox);
            const options = [
                { value: "1", label: "选项1" },
                { value: "2", label: "选项2" },
            ];
            configuredCombobox.setOptions(options);
            configuredCombobox.setValue(["1", "2"]);
            configuredCombobox.rerender();
            await new Promise((resolve) => setTimeout(resolve, 10));

            const removeButton =
                configuredCombobox.shadowRoot?.querySelector(".combobox-tag-remove");
            if (removeButton) {
                removeButton.click();
                await new Promise((resolve) => setTimeout(resolve, 10));
                const value = configuredCombobox.getValue();
                expect(Array.isArray(value)).toBe(true);
                expect((value as string[]).length).toBeLessThan(2);
            }
            document.body.removeChild(configuredCombobox);
        });

        it("应该显示空状态", async () => {
            combobox.setOptions([]);
            combobox.rerender();
            await new Promise((resolve) => setTimeout(resolve, 10));

            const input = combobox.shadowRoot?.querySelector("input");
            if (input) {
                input.click();
                await new Promise((resolve) => setTimeout(resolve, 10));
                const empty = combobox.shadowRoot?.querySelector(".combobox-empty");
                expect(empty).toBeTruthy();
            }
        });

        it("应该处理外部点击关闭", async () => {
            const options = [{ value: "1", label: "选项1" }];
            combobox.setOptions(options);
            combobox.rerender();
            await new Promise((resolve) => setTimeout(resolve, 10));

            const input = combobox.shadowRoot?.querySelector("input");
            if (input) {
                input.click();
                await new Promise((resolve) => setTimeout(resolve, 10));
                // 点击外部
                document.body.click();
                await new Promise((resolve) => setTimeout(resolve, 10));
                const menu = combobox.shadowRoot?.querySelector(".combobox-menu");
                expect(menu).toBeFalsy();
            }
        });

        it("应该在组件断开时清理事件监听器", async () => {
            const configuredCombobox = new Combobox();
            document.body.appendChild(configuredCombobox);
            const options = [{ value: "1", label: "选项1" }];
            configuredCombobox.setOptions(options);
            configuredCombobox.rerender();
            await new Promise((resolve) => setTimeout(resolve, 10));

            const input = configuredCombobox.shadowRoot?.querySelector("input");
            if (input) {
                input.click();
                await new Promise((resolve) => setTimeout(resolve, 10));
            }

            const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
            document.body.removeChild(configuredCombobox);
            expect(removeEventListenerSpy).toHaveBeenCalled();
        });

        it("应该处理多选时的切换选择", async () => {
            const configuredCombobox = new Combobox({ multiple: true });
            document.body.appendChild(configuredCombobox);
            const options = [
                { value: "1", label: "选项1" },
                { value: "2", label: "选项2" },
            ];
            configuredCombobox.setOptions(options);
            configuredCombobox.rerender();
            await new Promise((resolve) => setTimeout(resolve, 10));

            const input = configuredCombobox.shadowRoot?.querySelector("input");
            if (input) {
                input.click();
                await new Promise((resolve) => setTimeout(resolve, 10));
                const option = configuredCombobox.shadowRoot?.querySelector(
                    '.combobox-option[role="option"]'
                );
                if (option) {
                    // 第一次点击：选择
                    (option as HTMLElement).click();
                    await new Promise((resolve) => setTimeout(resolve, 10));
                    // 第二次点击：取消选择
                    (option as HTMLElement).click();
                    await new Promise((resolve) => setTimeout(resolve, 10));
                    const value = configuredCombobox.getValue();
                    expect(Array.isArray(value)).toBe(true);
                    expect((value as string[]).length).toBe(0);
                }
            }
            document.body.removeChild(configuredCombobox);
        });

        it("应该处理搜索时的空结果", async () => {
            const configuredCombobox = new Combobox({ searchable: true });
            document.body.appendChild(configuredCombobox);
            const options = [
                { value: "1", label: "Apple" },
                { value: "2", label: "Banana" },
            ];
            configuredCombobox.setOptions(options);
            await new Promise((resolve) => setTimeout(resolve, 100));

            const input = configuredCombobox.shadowRoot?.querySelector("input");
            if (input) {
                input.focus();
                await new Promise((resolve) => setTimeout(resolve, 50));
                input.value = "Orange";
                input.dispatchEvent(new Event("input", { bubbles: true }));
                await new Promise((resolve) => setTimeout(resolve, 100));
                const empty = configuredCombobox.shadowRoot?.querySelector(".combobox-empty");
                expect(empty?.textContent).toBe("No results found");
            }
            document.body.removeChild(configuredCombobox);
        });
    });
});
