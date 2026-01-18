/**
 * RFC-0030: rerender() 调度机制重构测试
 *
 * 测试 rerender() 调度机制的核心功能：
 * 1. rerender() 在组件未连接时的行为
 * 2. 防抖机制是否正常工作
 * 3. 批量更新是否生效
 * 4. rerender() 与 scheduleRerender() 的对齐
 * 5. LightComponent JSX children 保留
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// 测试需要访问私有方法，使用 any 类型是必要的

import { LightComponent } from "../light-component";
import { WebComponent } from "../web-component";
import { h } from "../jsx-factory";

// 创建一个测试用的 LightComponent 子类
class TestLightComponent extends LightComponent {
    public renderCallCount = 0;
    public _rerenderCallCount = 0;
    public scheduleRerenderCallCount = 0;

    render(): HTMLElement | SVGElement {
        this.renderCallCount++;
        return h("div", { class: "test-content" }, [
            h("h1", {}, "Test Component"),
            h("p", { id: "test-paragraph" }, "This is a test component"),
        ]);
    }

    // 暴露 _rerender 调用计数（用于测试）
    protected _rerender(): void {
        this._rerenderCallCount++;
        super._rerender();
    }

    // 暴露 scheduleRerender 调用计数（用于测试）
    protected scheduleRerender(): void {
        this.scheduleRerenderCallCount++;
        super.scheduleRerender();
    }
}

// 创建一个测试用的 WebComponent 子类
class TestWebComponent extends WebComponent {
    public renderCallCount = 0;
    public _rerenderCallCount = 0;
    public scheduleRerenderCallCount = 0;

    render(): HTMLElement | SVGElement {
        this.renderCallCount++;
        return h("div", { class: "test-content" }, [
            h("h1", {}, "Test Component"),
            h("p", { id: "test-paragraph" }, "This is a test component"),
        ]);
    }

    // 暴露 _rerender 调用计数（用于测试）
    protected _rerender(): void {
        this._rerenderCallCount++;
        super._rerender();
    }

    // 暴露 scheduleRerender 调用计数（用于测试）
    protected scheduleRerender(): void {
        this.scheduleRerenderCallCount++;
        super.scheduleRerender();
    }
}

// 注册自定义元素
if (!customElements.get("test-light-component-rerender")) {
    customElements.define("test-light-component-rerender", TestLightComponent);
}

if (!customElements.get("test-web-component-rerender")) {
    customElements.define("test-web-component-rerender", TestWebComponent);
}

describe("RFC-0030: rerender() 调度机制重构", () => {
    describe("1. rerender() 在组件未连接时的行为", () => {
        test("LightComponent: rerender() 在未连接时应该不执行渲染", (done) => {
            const component = document.createElement(
                "test-light-component-rerender"
            ) as TestLightComponent;

            // 组件未连接时调用 rerender()
            (component as any).rerender();

            // 等待 requestAnimationFrame 执行
            requestAnimationFrame(() => {
                expect(component._rerenderCallCount).toBe(0);
                expect(component.renderCallCount).toBe(0);
                done();
            });
        });

        test("WebComponent: rerender() 在未连接时应该不执行渲染", (done) => {
            const component = document.createElement(
                "test-web-component-rerender"
            ) as TestWebComponent;

            // 组件未连接时调用 rerender()
            (component as any).rerender();

            // 等待 requestAnimationFrame 执行
            requestAnimationFrame(() => {
                expect(component._rerenderCallCount).toBe(0);
                expect(component.renderCallCount).toBe(0);
                done();
            });
        });

        test("LightComponent: 连接后 rerender() 应该正常工作", (done) => {
            const component = document.createElement(
                "test-light-component-rerender"
            ) as TestLightComponent;

            document.body.appendChild(component);

            // 等待首次渲染完成
            requestAnimationFrame(() => {
                const initialRenderCount = component.renderCallCount;

                // 调用 rerender()
                (component as any).rerender();

                // 等待 requestAnimationFrame 执行
                requestAnimationFrame(() => {
                    expect(component.renderCallCount).toBe(initialRenderCount + 1);
                    done();
                });
            });
        });

        test("WebComponent: 连接后 rerender() 应该正常工作", (done) => {
            const component = document.createElement(
                "test-web-component-rerender"
            ) as TestWebComponent;

            document.body.appendChild(component);

            // 等待首次渲染完成
            requestAnimationFrame(() => {
                const initialRenderCount = component.renderCallCount;

                // 调用 rerender()
                (component as any).rerender();

                // 等待 requestAnimationFrame 执行
                requestAnimationFrame(() => {
                    expect(component.renderCallCount).toBe(initialRenderCount + 1);
                    done();
                });
            });
        });
    });

    describe("2. rerender() 与 scheduleRerender() 的对齐", () => {
        test("rerender() 应该调用 scheduleRerender()", (done) => {
            const component = document.createElement(
                "test-light-component-rerender"
            ) as TestLightComponent;

            document.body.appendChild(component);

            // 等待首次渲染完成
            requestAnimationFrame(() => {
                const initialScheduleCount = component.scheduleRerenderCallCount;

                // 调用 rerender()
                (component as any).rerender();

                // rerender() 应该立即调用 scheduleRerender()
                expect(component.scheduleRerenderCallCount).toBe(initialScheduleCount + 1);

                // 等待 requestAnimationFrame 执行
                requestAnimationFrame(() => {
                    expect(component._rerenderCallCount).toBeGreaterThan(0);
                    done();
                });
            });
        });

        test("scheduleRerender() 应该调用 _rerender() 而不是 rerender()", (done) => {
            const component = document.createElement(
                "test-light-component-rerender"
            ) as TestLightComponent;

            document.body.appendChild(component);

            // 等待首次渲染完成
            requestAnimationFrame(() => {
                const initialRerenderCount = component._rerenderCallCount;
                const initialScheduleCount = component.scheduleRerenderCallCount;

                // 直接调用 scheduleRerender()
                (component as any).scheduleRerender();

                // scheduleRerender() 应该被调用
                expect(component.scheduleRerenderCallCount).toBe(initialScheduleCount + 1);

                // 等待 requestAnimationFrame 执行
                requestAnimationFrame(() => {
                    // _rerender() 应该被调用
                    expect(component._rerenderCallCount).toBe(initialRerenderCount + 1);
                    done();
                });
            });
        });
    });

    describe("3. 防抖机制和批量更新", () => {
        test("短时间内多次调用 rerender() 应该只执行一次渲染", (done) => {
            const component = document.createElement(
                "test-light-component-rerender"
            ) as TestLightComponent;

            document.body.appendChild(component);

            // 等待首次渲染完成
            requestAnimationFrame(() => {
                const initialRenderCount = component.renderCallCount;

                // 短时间内多次调用 rerender()
                (component as any).rerender();
                (component as any).rerender();
                (component as any).rerender();

                // 等待所有 requestAnimationFrame 执行完成
                // 由于 _isRendering 标志，应该只执行一次
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        // 应该只增加一次（因为 _isRendering 标志防止重复）
                        expect(component.renderCallCount).toBe(initialRenderCount + 1);
                        done();
                    });
                });
            });
        });

        test("在输入元素获得焦点时应该延迟重渲染", (done) => {
            const component = document.createElement(
                "test-light-component-rerender"
            ) as TestLightComponent;

            document.body.appendChild(component);

            // 等待首次渲染完成
            requestAnimationFrame(() => {
                // 创建一个输入元素并添加到组件中
                const input = document.createElement("input");
                input.setAttribute("data-wsx-key", "test-input");
                component.appendChild(input);

                // 聚焦输入元素
                input.focus();

                // 调用 rerender()
                (component as any).rerender();

                // 等待 requestAnimationFrame 执行
                requestAnimationFrame(() => {
                    // 由于输入元素获得焦点，应该延迟重渲染
                    // _pendingRerender 应该被设置
                    const pendingRerender = (component as any)._pendingRerender;
                    expect(pendingRerender).toBe(true);

                    // 失去焦点后应该执行重渲染
                    input.blur();

                    // 等待 blur 事件处理
                    setTimeout(() => {
                        requestAnimationFrame(() => {
                            expect(component.renderCallCount).toBeGreaterThan(1);
                            done();
                        });
                    }, 100);
                });
            });
        });
    });

    describe("4. LightComponent JSX children 保留", () => {
        test("_rerender() 应该保留 JSX children", (done) => {
            const component = document.createElement(
                "test-light-component-rerender"
            ) as TestLightComponent;

            // 手动添加 JSX children（模拟 JSX factory 的行为）
            const jsxChild = document.createElement("wsx-view");
            jsxChild.setAttribute("route", "/test");
            component.appendChild(jsxChild);

            document.body.appendChild(component);

            // 等待首次渲染完成
            requestAnimationFrame(() => {
                // 标记 JSX children（模拟 connectedCallback 的行为）
                // 注意：markJSXChildren 是私有方法，通过类型转换访问
                (component as any).markJSXChildren();

                // 验证 JSX child 被标记
                expect(jsxChild.getAttribute("data-wsx-jsx-child")).toBe("true");

                // 调用 rerender()
                (component as any).rerender();

                // 等待 requestAnimationFrame 执行
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        // JSX child 应该仍然存在
                        const preservedChild = component.querySelector("wsx-view[route='/test']");
                        expect(preservedChild).toBe(jsxChild);
                        done();
                    });
                });
            });
        });

        test("getJSXChildren() 应该返回标记的 JSX children", () => {
            const component = document.createElement(
                "test-light-component-rerender"
            ) as TestLightComponent;

            // 手动添加 JSX children
            const jsxChild1 = document.createElement("wsx-view");
            jsxChild1.setAttribute("route", "/test1");
            jsxChild1.setAttribute("data-wsx-jsx-child", "true");
            component.appendChild(jsxChild1);

            const jsxChild2 = document.createElement("wsx-view");
            jsxChild2.setAttribute("route", "/test2");
            jsxChild2.setAttribute("data-wsx-jsx-child", "true");
            component.appendChild(jsxChild2);

            // 添加非 JSX child（没有标记）
            const normalChild = document.createElement("div");
            component.appendChild(normalChild);

            // 获取 JSX children（注意：getJSXChildren 是私有方法，通过类型转换访问）
            const jsxChildren = (component as any).getJSXChildren();

            expect(jsxChildren.length).toBe(2);
            expect(jsxChildren).toContain(jsxChild1);
            expect(jsxChildren).toContain(jsxChild2);
            expect(jsxChildren).not.toContain(normalChild);
        });
    });

    describe("5. requestAnimationFrame 调度机制", () => {
        test("scheduleRerender() 应该使用 requestAnimationFrame", (done) => {
            const component = document.createElement(
                "test-light-component-rerender"
            ) as TestLightComponent;

            document.body.appendChild(component);

            // 等待首次渲染完成
            requestAnimationFrame(() => {
                const initialRenderCount = component.renderCallCount;

                // 调用 scheduleRerender()
                (component as any).scheduleRerender();

                // 立即检查，应该还没有渲染（因为是异步的）
                expect(component.renderCallCount).toBe(initialRenderCount);

                // 等待 requestAnimationFrame 执行
                requestAnimationFrame(() => {
                    expect(component.renderCallCount).toBe(initialRenderCount + 1);
                    done();
                });
            });
        });

        test("_isRendering 标志应该防止重复渲染", (done) => {
            const component = document.createElement(
                "test-light-component-rerender"
            ) as TestLightComponent;

            document.body.appendChild(component);

            // 等待首次渲染完成
            requestAnimationFrame(() => {
                const initialRenderCount = component.renderCallCount;

                // 设置 _isRendering 标志
                (component as any)._isRendering = true;

                // 调用 scheduleRerender()
                (component as any).scheduleRerender();

                // 等待 requestAnimationFrame 执行
                requestAnimationFrame(() => {
                    // 由于 _isRendering 标志，应该不执行渲染
                    expect(component.renderCallCount).toBe(initialRenderCount);

                    // 清除标志
                    (component as any)._isRendering = false;

                    // 再次调用
                    (component as any).scheduleRerender();

                    // 等待 requestAnimationFrame 执行
                    requestAnimationFrame(() => {
                        expect(component.renderCallCount).toBe(initialRenderCount + 1);
                        done();
                    });
                });
            });
        });
    });

    describe("6. 清理和资源管理", () => {
        test("组件断开连接时应该清理定时器", (done) => {
            const component = document.createElement(
                "test-light-component-rerender"
            ) as TestLightComponent;

            document.body.appendChild(component);

            // 等待首次渲染完成
            requestAnimationFrame(() => {
                // 调用 rerender() 以设置定时器（如果有）
                (component as any).rerender();

                // 断开连接
                component.disconnectedCallback();

                // 验证 connected 状态
                expect((component as any).connected).toBe(false);

                // 等待 requestAnimationFrame 执行
                requestAnimationFrame(() => {
                    // 应该不执行渲染
                    const renderCount = component.renderCallCount;
                    expect(renderCount).toBe(1); // 只有首次渲染

                    done();
                });
            });
        });
    });

    afterEach(() => {
        // 清理 DOM
        document.body.innerHTML = "";
    });
});
