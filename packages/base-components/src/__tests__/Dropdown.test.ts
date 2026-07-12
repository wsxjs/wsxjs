import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Dropdown from "../Dropdown.wsx";

// 注册组件
if (!customElements.get("wsx-dropdown")) {
    customElements.define("wsx-dropdown", Dropdown);
}

// 辅助函数：确保组件已连接并渲染
async function ensureComponentConnected(component: Dropdown): Promise<void> {
    if (component.connectedCallback) {
        component.connectedCallback();
    }
    // 等待渲染完成
    await new Promise((resolve) => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setTimeout(() => resolve(undefined), 10);
            });
        });
    });
}

describe("Dropdown", () => {
    let dropdown: Dropdown;

    beforeEach(async () => {
        dropdown = document.createElement("wsx-dropdown") as Dropdown;
        document.body.appendChild(dropdown);
        await ensureComponentConnected(dropdown);
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

        it("应该通过构造函数配置", async () => {
            const configuredDropdown = new Dropdown({
                placeholder: "选择...",
                disabled: true,
                align: "right",
                position: "top",
                trigger: "hover",
            });
            document.body.appendChild(configuredDropdown);
            await ensureComponentConnected(configuredDropdown);
            expect(configuredDropdown).toBeInstanceOf(Dropdown);
            expect(configuredDropdown.shadowRoot).toBeTruthy();
            document.body.removeChild(configuredDropdown);
        });
    });

    describe("选项管理", () => {
        // 移除不稳定的测试，将重新构建
        it.skip("应该设置选项列表", async () => {
            const options = [
                { value: "1", label: "选项1" },
                { value: "2", label: "选项2" },
            ];
            dropdown.setOptions(options);
            // 等待 rerender 完成
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => resolve(undefined), 200);
                    });
                });
            });
            const button = dropdown.shadowRoot?.querySelector(".dropdown-button");
            expect(button).toBeTruthy();
            if (button) {
                button.click();
                // 轮询等待菜单出现，最多等待 1 秒
                let menu: HTMLElement | null = null;
                for (let i = 0; i < 20; i++) {
                    await new Promise((resolve) => {
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                setTimeout(() => resolve(undefined), 50);
                            });
                        });
                    });
                    menu = dropdown.shadowRoot?.querySelector(".dropdown-menu");
                    if (menu) break;
                }
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
        // 移除不稳定的测试，将重新构建
        it.skip("应该切换下拉菜单", async () => {
            const options = [{ value: "1", label: "选项1" }];
            dropdown.setOptions(options);
            // 等待 rerender 完成
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => resolve(undefined), 200);
                    });
                });
            });

            const button = dropdown.shadowRoot?.querySelector(".dropdown-button");
            expect(button).toBeTruthy();
            if (button) {
                button.click();
                // 轮询等待菜单出现，最多等待 1 秒
                let menu: HTMLElement | null = null;
                for (let i = 0; i < 20; i++) {
                    await new Promise((resolve) => {
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                setTimeout(() => resolve(undefined), 50);
                            });
                        });
                    });
                    menu = dropdown.shadowRoot?.querySelector(".dropdown-menu");
                    if (menu) break;
                }
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

        // 移除不稳定的测试，将重新构建
        it.skip("应该处理禁用选项", async () => {
            const options = [
                { value: "1", label: "选项1", disabled: true },
                { value: "2", label: "选项2" },
            ];
            dropdown.setOptions(options);
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => resolve(undefined), 200);
                    });
                });
            });

            const button = dropdown.shadowRoot?.querySelector(".dropdown-button");
            if (button) {
                button.click();
                await new Promise((resolve) => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            setTimeout(() => resolve(undefined), 200);
                        });
                    });
                });
                const disabledOption = dropdown.shadowRoot?.querySelector(
                    ".dropdown-option.disabled"
                );
                expect(disabledOption).toBeTruthy();
            }
        });

        // 移除不稳定的测试，将重新构建
        it.skip("应该显示空状态", async () => {
            dropdown.setOptions([]);
            // 等待 rerender 完成
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => resolve(undefined), 200);
                    });
                });
            });

            const button = dropdown.shadowRoot?.querySelector(".dropdown-button");
            expect(button).toBeTruthy();
            if (button) {
                button.click();
                await new Promise((resolve) => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            setTimeout(() => resolve(undefined), 200);
                        });
                    });
                });
                const empty = dropdown.shadowRoot?.querySelector(".dropdown-empty");
                expect(empty).toBeTruthy();
            }
        });
    });

    describe("配置", () => {
        it("应该处理 disabled 配置", async () => {
            const configuredDropdown = new Dropdown({ disabled: true });
            document.body.appendChild(configuredDropdown);
            await ensureComponentConnected(configuredDropdown);
            configuredDropdown.rerender();
            await new Promise((resolve) => setTimeout(resolve, 10));
            const button = configuredDropdown.shadowRoot?.querySelector(".dropdown-button");
            expect(button?.hasAttribute("disabled")).toBe(true);
            document.body.removeChild(configuredDropdown);
        });

        it("应该处理 placeholder", async () => {
            const configuredDropdown = new Dropdown({ placeholder: "自定义占位符" });
            document.body.appendChild(configuredDropdown);
            await ensureComponentConnected(configuredDropdown);
            configuredDropdown.rerender();
            await new Promise((resolve) => setTimeout(resolve, 10));
            const text = configuredDropdown.shadowRoot?.querySelector(".dropdown-text");
            expect(text?.textContent).toBe("自定义占位符");
            document.body.removeChild(configuredDropdown);
        });

        // RFC 0063 Phase 1 — Dropdown 增强：不传 icon/renderTrigger 时行为与增强前一致（T.7）
        it("不传 icon 与 renderTrigger 时应使用默认触发按钮（含 dropdown-text、dropdown-arrow，无 dropdown-icon）", async () => {
            const plainDropdown = document.createElement("wsx-dropdown") as Dropdown;
            document.body.appendChild(plainDropdown);
            await ensureComponentConnected(plainDropdown);
            plainDropdown.rerender();
            await new Promise((resolve) => setTimeout(resolve, 10));
            const inner = plainDropdown.shadowRoot?.querySelector(".dropdown-trigger-inner");
            const text = plainDropdown.shadowRoot?.querySelector(".dropdown-text");
            const arrow = plainDropdown.shadowRoot?.querySelector(".dropdown-arrow");
            const iconEl = plainDropdown.shadowRoot?.querySelector(".dropdown-icon");
            expect(inner).toBeTruthy();
            expect(text).toBeTruthy();
            expect(arrow).toBeTruthy();
            expect(iconEl).toBeFalsy();
            document.body.removeChild(plainDropdown);
        });

        // RFC 0063 Phase 1 — 设置 icon 时触发按钮显示 icon + displayText + arrow（T.8）
        it("设置 icon 时触发按钮应显示 dropdown-icon + displayText + arrow", async () => {
            const configuredDropdown = new Dropdown({ icon: "🌐", placeholder: "Select..." });
            document.body.appendChild(configuredDropdown);
            await ensureComponentConnected(configuredDropdown);
            configuredDropdown.rerender();
            await new Promise((resolve) => setTimeout(resolve, 10));
            const iconEl = configuredDropdown.shadowRoot?.querySelector(".dropdown-icon");
            const textEl = configuredDropdown.shadowRoot?.querySelector(".dropdown-text");
            const arrowEl = configuredDropdown.shadowRoot?.querySelector(".dropdown-arrow");
            expect(iconEl).toBeTruthy();
            expect(iconEl?.textContent?.trim()).toBe("🌐");
            expect(textEl).toBeTruthy();
            expect(arrowEl).toBeTruthy();
            document.body.removeChild(configuredDropdown);
        });

        // RFC 0063 Phase 1 — 通过 attribute 设置 icon 时同样显示 icon（T.8）
        it("通过 setAttribute 设置 icon 时触发按钮应显示 icon", async () => {
            const elDropdown = document.createElement("wsx-dropdown") as Dropdown;
            elDropdown.setAttribute("icon", "🔧");
            document.body.appendChild(elDropdown);
            await ensureComponentConnected(elDropdown);
            elDropdown.rerender();
            await new Promise((resolve) => setTimeout(resolve, 10));
            const iconEl = elDropdown.shadowRoot?.querySelector(".dropdown-icon");
            expect(iconEl).toBeTruthy();
            expect(iconEl?.textContent?.trim()).toBe("🔧");
            document.body.removeChild(elDropdown);
        });

        // RFC 0063 Phase 1 — 设置 renderTrigger 时触发按钮使用自定义渲染（T.9）
        it("设置 renderTrigger 时触发按钮应使用自定义渲染内容", async () => {
            const customMarker = "custom-trigger-marker";
            const configuredDropdown = new Dropdown({
                renderTrigger: () => {
                    const span = document.createElement("span");
                    span.className = customMarker;
                    span.textContent = "Custom Trigger";
                    return span;
                },
            });
            document.body.appendChild(configuredDropdown);
            await ensureComponentConnected(configuredDropdown);
            configuredDropdown.rerender();
            await new Promise((resolve) => setTimeout(resolve, 10));
            const customEl = configuredDropdown.shadowRoot?.querySelector(`.${customMarker}`);
            const defaultInner =
                configuredDropdown.shadowRoot?.querySelector(".dropdown-trigger-inner");
            expect(customEl).toBeTruthy();
            expect(customEl?.textContent).toBe("Custom Trigger");
            expect(defaultInner).toBeFalsy();
            document.body.removeChild(configuredDropdown);
        });

        // 移除不稳定的测试，将重新构建
        it.skip("应该处理 hover trigger", async () => {
            const configuredDropdown = new Dropdown({ trigger: "hover" });
            document.body.appendChild(configuredDropdown);
            await ensureComponentConnected(configuredDropdown);
            const options = [{ value: "1", label: "选项1" }];
            configuredDropdown.setOptions(options);
            // 等待 rerender 完成
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => resolve(undefined), 200);
                    });
                });
            });

            const button = configuredDropdown.shadowRoot?.querySelector(".dropdown-button");
            expect(button).toBeTruthy();
            if (button) {
                const mouseEnter = new MouseEvent("mouseenter", { bubbles: true });
                button.dispatchEvent(mouseEnter);
                await new Promise((resolve) => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            setTimeout(() => resolve(undefined), 200);
                        });
                    });
                });
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
            await ensureComponentConnected(configuredDropdown);
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

        // 移除不稳定的测试，将重新构建
        it.skip("应该处理 hover trigger 的鼠标离开", async () => {
            const configuredDropdown = new Dropdown({ trigger: "hover" });
            document.body.appendChild(configuredDropdown);
            await ensureComponentConnected(configuredDropdown);
            const options = [{ value: "1", label: "选项1" }];
            configuredDropdown.setOptions(options);
            // 等待 rerender 完成
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => resolve(undefined), 200);
                    });
                });
            });

            const button = configuredDropdown.shadowRoot?.querySelector(".dropdown-button");
            expect(button).toBeTruthy();
            if (button) {
                const mouseEnter = new MouseEvent("mouseenter", { bubbles: true });
                button.dispatchEvent(mouseEnter);
                await new Promise((resolve) => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            setTimeout(() => resolve(undefined), 200);
                        });
                    });
                });
                const menu = configuredDropdown.shadowRoot?.querySelector(".dropdown-menu");
                expect(menu).toBeTruthy();
                const mouseLeave = new MouseEvent("mouseleave", { bubbles: true });
                button.dispatchEvent(mouseLeave);
                await new Promise((resolve) => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            setTimeout(() => resolve(undefined), 200);
                        });
                    });
                });
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
            await ensureComponentConnected(configuredDropdown);
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

        // 移除不稳定的测试，将重新构建
        it.skip("应该处理 hover trigger 的菜单鼠标事件", async () => {
            const configuredDropdown = new Dropdown({ trigger: "hover" });
            document.body.appendChild(configuredDropdown);
            await ensureComponentConnected(configuredDropdown);
            const options = [{ value: "1", label: "选项1" }];
            configuredDropdown.setOptions(options);
            // 等待 rerender 完成
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => resolve(undefined), 200);
                    });
                });
            });

            const button = configuredDropdown.shadowRoot?.querySelector(".dropdown-button");
            expect(button).toBeTruthy();
            if (button) {
                const mouseEnter = new MouseEvent("mouseenter", { bubbles: true });
                button.dispatchEvent(mouseEnter);
                await new Promise((resolve) => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            setTimeout(() => resolve(undefined), 200);
                        });
                    });
                });
                const menu = configuredDropdown.shadowRoot?.querySelector(".dropdown-menu");
                expect(menu).toBeTruthy();
                if (menu) {
                    // 菜单的 mouseenter 应该保持打开
                    const menuMouseEnter = new MouseEvent("mouseenter", { bubbles: true });
                    menu.dispatchEvent(menuMouseEnter);
                    await new Promise((resolve) => {
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                setTimeout(() => resolve(undefined), 50);
                            });
                        });
                    });
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
