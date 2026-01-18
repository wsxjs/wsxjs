import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Import to register the component
import "../WsxView.wsx";
// Import type for proper typing
import type WsxView from "../WsxView.wsx";

describe("WsxView", () => {
    let view: WsxView;

    beforeEach(() => {
        // Create view instance using custom element
        view = document.createElement("wsx-view") as WsxView;
        document.body.appendChild(view);
    });

    afterEach(() => {
        document.body.removeChild(view);
        vi.clearAllMocks();
    });

    it("should create view instance", () => {
        expect(view.tagName.toLowerCase()).toBe("wsx-view");
        expect(view).toBeInstanceOf(HTMLElement);
    });

    it("should not have shadow DOM (uses LightComponent)", () => {
        // WsxView uses LightComponent, so it doesn't have shadowRoot
        expect(view.shadowRoot).toBeNull();
    });

    it("should update component attribute", () => {
        // Use property directly, WSX framework will handle it
        view.component = "home-page";
        view.connectedCallback();

        expect(view.component).toBe("home-page");
    });

    it("should update route attribute", () => {
        // Route is not a property, so use setAttribute
        view.setAttribute("route", "/users");
        view.connectedCallback();

        expect(view.getAttribute("route")).toBe("/users");
    });

    it("should handle params attribute", () => {
        // Use property directly, WSX framework will handle it
        view.params = { id: "123", name: "test" };
        view.connectedCallback();

        expect(view.params).toEqual({ id: "123", name: "test" });
    });

    it("should render route view container", () => {
        view.connectedCallback();

        // WsxView uses LightComponent, so querySelector is used instead of shadowRoot
        const container = view.querySelector(".route-view");
        expect(container).toBeTruthy();
    });

    it("should have route view structure", () => {
        // Test the view container structure
        view.connectedCallback();

        // WsxView uses LightComponent, so querySelector is used instead of shadowRoot
        const container = view.querySelector(".route-view");
        expect(container).toBeTruthy();
    });

    describe("组件加载", () => {
        it("应该在 onConnected() 中尝试加载组件", async () => {
            // 注册一个测试组件
            class TestComponent extends HTMLElement {
                connectedCallback() {
                    this.textContent = "Test Component";
                }
            }
            customElements.define("test-component", TestComponent);

            // Use property directly, WSX framework will handle it
            view.component = "test-component";
            view.connectedCallback();

            // 等待 requestAnimationFrame 和组件加载完成
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        resolve(undefined);
                    }, 50);
                });
            });

            // 验证组件容器存在
            const container = view.querySelector(".route-view");
            expect(container).toBeTruthy();

            // 验证组件实例被创建
            expect(container?.children.length).toBeGreaterThan(0);
        });

        it("应该处理组件未注册的情况", async () => {
            view.setAttribute("component", "non-existent-component");
            view.connectedCallback();

            // 等待 requestAnimationFrame 执行
            await new Promise((resolve) => setTimeout(resolve, 100));

            // 验证不会崩溃，组件容器仍然存在
            const container = view.querySelector(".route-view");
            expect(container).toBeTruthy();

            // 验证组件实例没有被创建（因为组件未注册）
            expect(container?.children.length).toBe(0);
        });

        it("应该防止重复加载组件", async () => {
            class TestComponent extends HTMLElement {
                connectedCallback() {
                    this.textContent = "Test Component";
                }
            }
            customElements.define("test-component-2", TestComponent);

            // Use property directly, WSX framework will handle it
            view.component = "test-component-2";
            view.connectedCallback();

            // 等待第一次加载完成
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        resolve(undefined);
                    }, 50);
                });
            });

            const container = view.querySelector(".route-view");
            const initialChildrenCount = container?.children.length || 0;

            // 尝试再次触发加载（通过设置相同的 component property）
            view.component = "test-component-2";

            // 等待
            await new Promise((resolve) => setTimeout(resolve, 100));

            // 验证组件实例数量没有增加（防止重复加载）
            expect(container?.children.length).toBe(initialChildrenCount);
        });

        it.skip("应该处理 params 属性变化", async () => {
            class TestComponent extends HTMLElement {
                connectedCallback() {
                    this.textContent = "Test Component";
                }
            }
            customElements.define("test-component-3", TestComponent);

            // Use property directly, WSX framework will handle it
            view.component = "test-component-3";
            view.connectedCallback();

            // 等待组件加载完成
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        resolve(undefined);
                    }, 50);
                });
            });

            // Use property directly for params
            view.params = { id: "123", name: "test" };

            // 等待参数设置完成
            await new Promise((resolve) => setTimeout(resolve, 50));

            // 验证参数被正确解析和传递
            const container = view.querySelector(".route-view");
            expect(container).toBeTruthy();

            // 验证组件实例存在
            const componentInstance = container?.firstElementChild;
            expect(componentInstance).toBeTruthy();
            expect(componentInstance?.getAttribute("id")).toBe("123");
            expect(componentInstance?.getAttribute("name")).toBe("test");
        });

        it("应该在组件未连接时跳过属性变化处理", () => {
            // 不调用 connectedCallback，直接设置 property
            view.component = "test-component";

            // 验证不会崩溃
            expect(view.component).toBe("test-component");
        });

        it("应该在 onDisconnected() 中清理组件实例", async () => {
            class TestComponent extends HTMLElement {
                connectedCallback() {
                    this.textContent = "Test Component";
                }
            }
            customElements.define("test-component-4", TestComponent);

            // Use property directly, WSX framework will handle it
            view.component = "test-component-4";
            view.connectedCallback();

            // 等待组件加载完成
            await new Promise((resolve) => {
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        resolve(undefined);
                    }, 50);
                });
            });

            // 验证组件实例存在
            const container = view.querySelector(".route-view");
            expect(container?.children.length).toBeGreaterThan(0);

            // 断开连接
            view.disconnectedCallback();

            // 验证组件实例被清理
            expect(container?.children.length).toBe(0);
        });

        it("应该在 component 属性变化时重新加载组件", async () => {
            class TestComponent1 extends HTMLElement {
                connectedCallback() {
                    this.textContent = "Component 1";
                }
            }
            class TestComponent2 extends HTMLElement {
                connectedCallback() {
                    this.textContent = "Component 2";
                }
            }
            customElements.define("test-component-5", TestComponent1);
            customElements.define("test-component-6", TestComponent2);

            view.setAttribute("component", "test-component-5");
            view.connectedCallback();

            // 等待第一次加载完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            // 更改 component property
            view.component = "test-component-6";

            // 等待第二次加载完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            // 验证新组件被加载
            const container = view.querySelector(".route-view");
            expect(container?.children.length).toBe(1);
        });
    });
});
