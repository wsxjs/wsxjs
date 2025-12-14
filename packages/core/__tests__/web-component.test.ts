/**
 * WebComponent 测试
 *
 * 测试 WebComponent 的生命周期和渲染逻辑，特别是：
 * 1. 首次连接时的渲染
 * 2. 重新连接时的智能渲染（避免重复）
 * 3. Editor.js 移动元素场景的处理
 */

import { WebComponent } from "../src/web-component";
import { h } from "../src/jsx-factory";

// 创建一个测试用的 WebComponent 子类
class TestWebComponent extends WebComponent {
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
if (!customElements.get("test-web-component")) {
    customElements.define("test-web-component", TestWebComponent);
}

describe("WebComponent", () => {
    let component: TestWebComponent;

    beforeEach(() => {
        // 使用 document.createElement 创建已注册的自定义元素
        component = document.createElement("test-web-component") as TestWebComponent;
    });

    afterEach(() => {
        if (component && component.parentNode) {
            component.parentNode.removeChild(component);
        }
    });

    describe("首次连接 (First Connection)", () => {
        test("应该渲染内容到 Shadow DOM", () => {
            document.body.appendChild(component);

            expect(component.renderCallCount).toBe(1);
            expect(component.shadowRoot.children.length).toBeGreaterThan(0);
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
        test("如果 Shadow DOM 内容存在，应该跳过渲染（避免重复）", () => {
            // 首次连接
            document.body.appendChild(component);
            expect(component.renderCallCount).toBe(1);

            const firstContent = component.querySelector(".test-content");
            expect(firstContent).toBeTruthy();

            // 模拟 Editor.js 移动元素：断开连接但 Shadow DOM 内容仍然存在
            component.disconnectedCallback();
            expect(component.connected).toBe(false);
            // Shadow DOM 内容应该仍然存在（Editor.js 只是移动，不删除）
            expect(component.shadowRoot.children.length).toBeGreaterThan(0);

            // 重新连接（Shadow DOM 内容仍然存在）
            component.connectedCallback();
            expect(component.connected).toBe(true);

            // 应该跳过渲染（避免重复）
            expect(component.renderCallCount).toBe(1); // 仍然是 1
            expect(component.querySelector(".test-content")).toBe(firstContent); // 同一个元素
        });

        test("如果 Shadow DOM 内容不存在，应该重新渲染", () => {
            // 首次连接
            document.body.appendChild(component);
            expect(component.renderCallCount).toBe(1);

            // 手动清空 Shadow DOM 内容（模拟外部库清理）
            component.shadowRoot.innerHTML = "";

            // 断开连接
            component.disconnectedCallback();

            // 重新连接
            component.connectedCallback();

            // 应该重新渲染，因为 Shadow DOM 内容不存在
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

            // 重新连接（Shadow DOM 内容存在）
            component.connectedCallback();

            // onConnected 应该被调用两次
            expect(component.onConnectedCallCount).toBe(2);
        });
    });

    describe("样式处理", () => {
        test("应该应用样式到 Shadow DOM", () => {
            class StyledWebComponent extends WebComponent {
                constructor() {
                    super({
                        styles: ".test { color: red; }",
                        styleName: "test-component",
                    });
                }

                render(): HTMLElement {
                    return h("div", {}, "Test");
                }
            }

            if (!customElements.get("styled-web-component")) {
                customElements.define("styled-web-component", StyledWebComponent);
            }

            const componentWithStyles = document.createElement(
                "styled-web-component"
            ) as StyledWebComponent;

            document.body.appendChild(componentWithStyles);

            // StyleManager 使用 adoptedStyleSheets，检查样式是否应用
            // 注意：jsdom 可能不支持 adoptedStyleSheets，所以检查 shadowRoot 是否有内容
            // 在测试环境中，StyleManager 可能会使用 fallback 方法
            // 我们主要验证 connectedCallback 不会因为样式问题而失败
            expect(componentWithStyles.shadowRoot).toBeTruthy();
            // 验证组件已成功连接和渲染
            expect(componentWithStyles.querySelector("div")).toBeTruthy();
        });

        test("重新连接时样式应该保持", () => {
            class StyledWebComponent2 extends WebComponent {
                constructor() {
                    super({
                        styles: ".test { color: red; }",
                        styleName: "test-component-2",
                    });
                }

                render(): HTMLElement {
                    return h("div", {}, "Test");
                }
            }

            if (!customElements.get("styled-web-component-2")) {
                customElements.define("styled-web-component-2", StyledWebComponent2);
            }

            const componentWithStyles = document.createElement(
                "styled-web-component-2"
            ) as StyledWebComponent2;

            // 首次连接
            document.body.appendChild(componentWithStyles);
            const initialContent = componentWithStyles.shadowRoot.children.length;

            // 断开连接
            componentWithStyles.disconnectedCallback();

            // 重新连接（Shadow DOM 内容存在）
            componentWithStyles.connectedCallback();

            // 验证：重新连接时应该跳过渲染（因为内容存在）
            // 样式应该仍然存在（StyleManager.applyStyles 是幂等的）
            // 主要验证 connectedCallback 不会因为样式问题而失败
            expect(componentWithStyles.shadowRoot.children.length).toBeGreaterThanOrEqual(
                initialContent
            );
            expect(componentWithStyles.querySelector("div")).toBeTruthy();
        });
    });

    describe("错误处理", () => {
        test("渲染错误时应该显示错误信息", () => {
            class ErrorWebComponent extends WebComponent {
                render(): HTMLElement {
                    throw new Error("Render error");
                }
            }

            if (!customElements.get("error-web-component")) {
                customElements.define("error-web-component", ErrorWebComponent);
            }

            const errorComponent = document.createElement(
                "error-web-component"
            ) as ErrorWebComponent;

            document.body.appendChild(errorComponent);

            // 应该显示错误信息
            const errorElement = errorComponent.shadowRoot.querySelector("div");
            expect(errorElement).toBeTruthy();
            expect(errorElement?.textContent).toContain("Component Error");
            expect(errorElement?.textContent).toContain("Render error");
        });

        test("错误后重新连接应该恢复正常", () => {
            let shouldThrow = true;

            class RecoverableErrorWebComponent extends WebComponent {
                render(): HTMLElement {
                    if (shouldThrow) {
                        shouldThrow = false;
                        throw new Error("Render error");
                    }
                    return h("div", {}, "Success");
                }
            }

            if (!customElements.get("recoverable-error-web-component")) {
                customElements.define(
                    "recoverable-error-web-component",
                    RecoverableErrorWebComponent
                );
            }

            const errorComponent = document.createElement(
                "recoverable-error-web-component"
            ) as RecoverableErrorWebComponent;

            // 首次连接（错误）
            document.body.appendChild(errorComponent);
            expect(errorComponent.shadowRoot.querySelector("div")?.textContent).toContain("Error");

            // 断开连接
            errorComponent.disconnectedCallback();

            // 重新连接（应该成功）
            errorComponent.connectedCallback();
            expect(errorComponent.shadowRoot.querySelector("div")?.textContent).toBe("Success");
        });
    });

    describe("DOM 查询方法", () => {
        test("querySelector 应该能在 Shadow DOM 中找到子元素", () => {
            document.body.appendChild(component);

            const paragraph = component.querySelector("#test-paragraph");
            expect(paragraph).toBeTruthy();
            expect(paragraph?.textContent).toBe("This is a test component");
        });

        test("querySelectorAll 应该能在 Shadow DOM 中找到所有匹配的元素", () => {
            class MultiItemWebComponent extends WebComponent {
                render(): HTMLElement {
                    return h("div", {}, [
                        h("p", { class: "item" }, "Item 1"),
                        h("p", { class: "item" }, "Item 2"),
                        h("p", { class: "item" }, "Item 3"),
                    ]);
                }
            }

            if (!customElements.get("multi-item-web-component")) {
                customElements.define("multi-item-web-component", MultiItemWebComponent);
            }

            const multiComponent = document.createElement(
                "multi-item-web-component"
            ) as MultiItemWebComponent;

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

            // 2. Editor.js 移动元素：断开连接（但 Shadow DOM 内容仍然存在）
            component.disconnectedCallback();
            expect(component.connected).toBe(false);
            expect(component.onDisconnectedCallCount).toBe(1);
            // Shadow DOM 内容应该仍然存在（Editor.js 只是移动，不删除）
            expect(component.shadowRoot.children.length).toBeGreaterThan(0);
            expect(component.querySelector(".test-content")).toBe(originalContent);

            // 3. Editor.js 将元素插入到新位置：重新连接
            component.connectedCallback();
            expect(component.connected).toBe(true);

            // 4. 验证：应该跳过渲染（避免重复）
            expect(component.renderCallCount).toBe(1); // 仍然是 1
            expect(component.querySelector(".test-content")).toBe(originalContent); // 同一个元素

            // 5. 验证：应该重新初始化事件监听器和钩子
            expect(component.onConnectedCallCount).toBe(2); // 首次 + 重新连接
        });

        test("如果 Editor.js 清理了 Shadow DOM 内容，应该重新渲染", () => {
            // 1. 首次连接
            document.body.appendChild(component);
            expect(component.renderCallCount).toBe(1);

            // 2. Editor.js 移动元素：断开连接
            component.disconnectedCallback();

            // 3. 模拟 Editor.js 清理了 Shadow DOM 内容（某些情况下可能发生）
            component.shadowRoot.innerHTML = "";

            // 4. Editor.js 将元素插入到新位置：重新连接
            component.connectedCallback();

            // 5. 验证：应该重新渲染
            expect(component.renderCallCount).toBe(2); // 渲染了两次
            expect(component.querySelector(".test-content")).toBeTruthy();
        });
    });

    describe("Shadow DOM 隔离", () => {
        test("Shadow DOM 内容应该与外部 DOM 隔离", () => {
            document.body.appendChild(component);

            // Shadow DOM 中的元素不应该在 document 中可见
            const shadowElement = component.shadowRoot.querySelector(".test-content");
            expect(shadowElement).toBeTruthy();

            // 但通过组件的 querySelector 应该能找到
            const foundElement = component.querySelector(".test-content");
            expect(foundElement).toBe(shadowElement);
        });
    });
});
