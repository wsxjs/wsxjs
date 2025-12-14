/**
 * LightComponent 测试
 *
 * 测试 LightComponent 的生命周期和渲染逻辑，特别是：
 * 1. 首次连接时的渲染
 * 2. 重新连接时的智能渲染（避免重复）
 * 3. Editor.js 移动元素场景的处理
 */

import { LightComponent } from "../src/light-component";
import { h } from "../src/jsx-factory";

// 创建一个测试用的 LightComponent 子类
class TestLightComponent extends LightComponent {
    public renderCallCount = 0;
    public onConnectedCallCount = 0;
    public onDisconnectedCallCount = 0;

    render(): HTMLElement | SVGElement {
        this.renderCallCount++;
        return h("div", { class: "test-content" }, [
            h("h1", {}, "Test Component"),
            h("p", { id: "test-paragraph" }, "This is a test component"),
        ]);
    }

    protected onConnected(): void {
        this.onConnectedCallCount++;
    }

    protected onDisconnected(): void {
        this.onDisconnectedCallCount++;
    }
}

// 注册自定义元素
if (!customElements.get("test-light-component")) {
    customElements.define("test-light-component", TestLightComponent);
}

describe("LightComponent", () => {
    let component: TestLightComponent;

    beforeEach(() => {
        // 使用 document.createElement 创建已注册的自定义元素
        component = document.createElement("test-light-component") as TestLightComponent;
    });

    afterEach(() => {
        if (component && component.parentNode) {
            component.parentNode.removeChild(component);
        }
    });

    describe("首次连接 (First Connection)", () => {
        test("应该渲染内容", () => {
            document.body.appendChild(component);

            expect(component.renderCallCount).toBe(1);
            expect(component.children.length).toBeGreaterThan(0);
            expect(component.querySelector(".test-content")).toBeTruthy();
            expect(component.querySelector("#test-paragraph")?.textContent).toBe(
                "This is a test component"
            );
        });

        test("应该调用 onConnected 钩子", () => {
            document.body.appendChild(component);

            expect(component.onConnectedCallCount).toBe(1);
        });

        test("重新连接时如果内容存在会跳过渲染（性能优化）", () => {
            document.body.appendChild(component);
            expect(component.renderCallCount).toBe(1);

            // 通过再次连接来验证渲染行为
            component.remove();
            document.body.appendChild(component);

            // 如果内容存在，会跳过渲染（避免重复元素）
            expect(component.renderCallCount).toBe(1); // 只渲染了一次（跳过重复渲染）
        });
    });

    describe("重新连接 (Reconnection) - Editor.js 场景", () => {
        test("如果内容存在，应该跳过渲染（避免重复）", () => {
            // 首次连接
            document.body.appendChild(component);
            expect(component.renderCallCount).toBe(1);

            const firstContent = component.querySelector(".test-content");
            expect(firstContent).toBeTruthy();

            // 模拟 Editor.js 移动元素：断开连接但保留内容
            component.disconnectedCallback();
            expect((component as any).connected).toBe(false);

            // 重新连接（内容仍然存在）
            component.connectedCallback();

            // 应该跳过渲染，因为内容仍然存在
            expect(component.renderCallCount).toBe(1); // 仍然是 1，没有重新渲染
            expect(component.querySelector(".test-content")).toBe(firstContent); // 同一个元素
        });

        test("如果内容不存在，应该重新渲染", () => {
            // 首次连接
            document.body.appendChild(component);
            expect(component.renderCallCount).toBe(1);

            // 手动清空内容（模拟外部库清理）
            component.innerHTML = "";

            // 断开连接
            component.disconnectedCallback();

            // 重新连接
            component.connectedCallback();

            // 应该重新渲染，因为内容不存在
            expect(component.renderCallCount).toBe(2); // 渲染了两次
            expect(component.querySelector(".test-content")).toBeTruthy();
        });

        test("重新连接时应该重新初始化事件监听器", () => {
            // 首次连接
            document.body.appendChild(component);

            // 断开连接
            component.disconnectedCallback();

            // 重新连接
            component.connectedCallback();

            // onConnected 应该被调用两次（首次连接 + 重新连接）
            expect(component.onConnectedCallCount).toBe(2);
        });

        test("重新连接时应该调用 onConnected 钩子", () => {
            // 首次连接
            document.body.appendChild(component);
            expect(component.onConnectedCallCount).toBe(1);

            // 断开连接
            component.disconnectedCallback();
            expect(component.onDisconnectedCallCount).toBe(1);

            // 重新连接（内容存在）
            component.connectedCallback();

            // onConnected 应该被调用两次
            expect(component.onConnectedCallCount).toBe(2);
        });
    });

    describe("样式处理", () => {
        test("应该应用样式", () => {
            class StyledTestComponent extends LightComponent {
                constructor() {
                    super({
                        styles: ".test { color: red; }",
                        styleName: "test-component",
                    });
                }

                render(): HTMLElement | SVGElement {
                    return h("div", {}, "Test") as HTMLElement;
                }
            }

            if (!customElements.get("styled-test-component")) {
                customElements.define("styled-test-component", StyledTestComponent);
            }

            const componentWithStyles = document.createElement(
                "styled-test-component"
            ) as StyledTestComponent;

            document.body.appendChild(componentWithStyles);

            const styleElement = componentWithStyles.querySelector(
                'style[data-wsx-light-component="test-component"]'
            );
            expect(styleElement).toBeTruthy();
            expect(styleElement?.textContent).toContain("color: red");
        });

        test("样式元素应该在第一个位置", () => {
            class StyledTestComponent2 extends LightComponent {
                constructor() {
                    super({
                        styles: ".test { color: red; }",
                        styleName: "test-component-2",
                    });
                }

                render(): HTMLElement | SVGElement {
                    return h("div", {}, "Test") as HTMLElement;
                }
            }

            if (!customElements.get("styled-test-component-2")) {
                customElements.define("styled-test-component-2", StyledTestComponent2);
            }

            const componentWithStyles = document.createElement(
                "styled-test-component-2"
            ) as StyledTestComponent2;

            document.body.appendChild(componentWithStyles);

            const styleElement = componentWithStyles.querySelector(
                'style[data-wsx-light-component="test-component-2"]'
            );
            expect(styleElement).toBe(componentWithStyles.firstChild);
        });

        test("重新连接时应该保持样式元素位置", () => {
            class StyledTestComponent3 extends LightComponent {
                constructor() {
                    super({
                        styles: ".test { color: red; }",
                        styleName: "test-component-3",
                    });
                }

                render(): HTMLElement | SVGElement {
                    return h("div", {}, "Test") as HTMLElement;
                }
            }

            if (!customElements.get("styled-test-component-3")) {
                customElements.define("styled-test-component-3", StyledTestComponent3);
            }

            const componentWithStyles = document.createElement(
                "styled-test-component-3"
            ) as StyledTestComponent3;

            // 首次连接
            document.body.appendChild(componentWithStyles);

            const styleElement = componentWithStyles.querySelector(
                'style[data-wsx-light-component="test-component-3"]'
            );
            expect(styleElement).toBe(componentWithStyles.firstChild);

            // 断开连接
            componentWithStyles.disconnectedCallback();

            // 重新连接（内容存在）
            componentWithStyles.connectedCallback();

            // 样式元素应该仍然在第一个位置
            // 注意：重新连接后，firstChild 可能是一个新的引用，但内容相同
            const newStyleElement = componentWithStyles.querySelector(
                'style[data-wsx-light-component="test-component-3"]'
            );
            expect(newStyleElement).toBe(componentWithStyles.firstChild);
        });
    });

    describe("错误处理", () => {
        test("渲染错误时应该显示错误信息", () => {
            class ErrorTestComponent extends LightComponent {
                render(): HTMLElement {
                    throw new Error("Render error");
                }
            }

            if (!customElements.get("error-test-component")) {
                customElements.define("error-test-component", ErrorTestComponent);
            }

            const errorComponent = document.createElement(
                "error-test-component"
            ) as ErrorTestComponent;

            document.body.appendChild(errorComponent);

            // 应该显示错误信息
            const errorElement = errorComponent.querySelector("div");
            expect(errorElement).toBeTruthy();
            expect(errorElement?.textContent).toContain("Component Error");
            expect(errorElement?.textContent).toContain("Render error");
        });

        test("错误后重新连接应该恢复正常", () => {
            let shouldThrow = true;

            class RecoverableErrorComponent extends LightComponent {
                render(): HTMLElement {
                    if (shouldThrow) {
                        shouldThrow = false;
                        throw new Error("Render error");
                    }
                    return h("div", {}, "Success") as HTMLElement;
                }
            }

            if (!customElements.get("recoverable-error-component")) {
                customElements.define("recoverable-error-component", RecoverableErrorComponent);
            }

            const errorComponent = document.createElement(
                "recoverable-error-component"
            ) as RecoverableErrorComponent;

            // 首次连接（错误）
            document.body.appendChild(errorComponent);
            expect(errorComponent.querySelector("div")?.textContent).toContain("Error");

            // 断开连接
            errorComponent.disconnectedCallback();

            // 重新连接（应该成功）
            errorComponent.connectedCallback();
            expect(errorComponent.querySelector("div")?.textContent).toBe("Success");
        });
    });

    describe("DOM 查询方法", () => {
        test("querySelector 应该能找到子元素", () => {
            document.body.appendChild(component);

            const paragraph = component.querySelector("#test-paragraph");
            expect(paragraph).toBeTruthy();
            expect(paragraph?.textContent).toBe("This is a test component");
        });

        test("querySelectorAll 应该能找到所有匹配的元素", () => {
            class MultiItemComponent extends LightComponent {
                render(): HTMLElement | SVGElement {
                    return h("div", {}, [
                        h("p", { class: "item" }, "Item 1"),
                        h("p", { class: "item" }, "Item 2"),
                        h("p", { class: "item" }, "Item 3"),
                    ]);
                }
            }

            if (!customElements.get("multi-item-component")) {
                customElements.define("multi-item-component", MultiItemComponent);
            }

            const multiComponent = document.createElement(
                "multi-item-component"
            ) as MultiItemComponent;

            document.body.appendChild(multiComponent);

            const items = multiComponent.querySelectorAll(".item");
            expect(items.length).toBe(3);
        });
    });

    describe("Editor.js 移动元素场景（完整流程）", () => {
        test("应该正确处理 Editor.js 移动元素的完整流程", () => {
            // 1. 首次连接
            document.body.appendChild(component);
            expect(component.renderCallCount).toBe(1);
            expect(component.onConnectedCallCount).toBe(1);

            const originalContent = component.querySelector(".test-content");
            expect(originalContent).toBeTruthy();

            // 2. Editor.js 移动元素：断开连接（但内容仍然存在）
            component.disconnectedCallback();
            expect((component as any).connected).toBe(false);
            expect(component.onDisconnectedCallCount).toBe(1);
            // 内容应该仍然存在（Editor.js 只是移动，不删除）
            expect(component.querySelector(".test-content")).toBe(originalContent);

            // 3. Editor.js 将元素插入到新位置：重新连接
            component.connectedCallback();
            expect((component as any).connected).toBe(true);

            // 4. 验证：应该跳过渲染（避免重复）
            expect(component.renderCallCount).toBe(1); // 仍然是 1
            expect(component.querySelector(".test-content")).toBe(originalContent); // 同一个元素

            // 5. 验证：应该重新初始化事件监听器和钩子
            expect(component.onConnectedCallCount).toBe(2); // 首次 + 重新连接
        });

        test("如果 Editor.js 清理了内容，应该重新渲染", () => {
            // 1. 首次连接
            document.body.appendChild(component);
            expect(component.renderCallCount).toBe(1);

            // 2. Editor.js 移动元素：断开连接
            component.disconnectedCallback();

            // 3. 模拟 Editor.js 清理了内容（某些情况下可能发生）
            component.innerHTML = "";

            // 4. Editor.js 将元素插入到新位置：重新连接
            component.connectedCallback();

            // 5. 验证：应该重新渲染
            expect(component.renderCallCount).toBe(2); // 渲染了两次
            expect(component.querySelector(".test-content")).toBeTruthy();
        });
    });
});
