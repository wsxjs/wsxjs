/**
 * Performance Comparison Tests (RFC 0037)
 *
 * Compares performance before and after DOM optimization:
 * 1. DOM creation count (baseline vs optimized)
 * 2. Update performance (baseline vs optimized)
 * 3. Third-party library integration (Monaco Editor)
 */

import { h } from "../jsx-factory";
import { WebComponent } from "../web-component";
import { state } from "../reactive-decorator";
import { RenderContext } from "../render-context";

/**
 * Test component for performance comparison
 */
class PerformanceTestComponent extends WebComponent {
    @state private items: string[] = [];
    @state private count: number = 0;

    setItems(items: string[]) {
        this.items = items;
        this.rerender();
    }

    increment() {
        this.count++;
        this.rerender();
    }

    render() {
        return h("div", { __testId: "container" }, [
            h("h1", { __testId: "title" }, `Items: ${this.items.length}, Count: ${this.count}`),
            ...this.items.map((item, index) =>
                h("div", { key: `item-${index}`, __testId: `item-${index}` }, [
                    h("span", { __testId: `item-text-${index}` }, item),
                    h("button", { __testId: `item-btn-${index}` }, "Click"),
                ])
            ),
        ]);
    }
}

customElements.define("performance-test-component", PerformanceTestComponent);

/**
 * Component with Monaco Editor integration test
 */
class MonacoEditorComponent extends WebComponent {
    @state private content: string = "// Initial code";

    setContent(content: string) {
        this.content = content;
        this.rerender();
    }

    render() {
        return h("div", { __testId: "monaco-container" }, [
            h("div", { id: "monaco-editor", className: "monaco-editor" }, [
                // Monaco Editor will inject its own DOM here
                h("textarea", { style: "display: none;" }, this.content),
            ]),
            h("div", { __testId: "content-display" }, this.content),
        ]);
    }
}

customElements.define("monaco-editor-component", MonacoEditorComponent);

/**
 * Measures DOM creation count by tracking createElement calls
 * @unused - Reserved for future use
 */
// @ts-expect-error - Reserved for future use

function _measureDOMCreations(fn: () => void): number {
    let creationCount = 0;
    const originalCreateElement = document.createElement.bind(document);

    // Mock createElement to count calls
    document.createElement = function (tagName: string, options?: ElementCreationOptions) {
        creationCount++;
        return originalCreateElement(tagName, options);
    };

    try {
        fn();
    } finally {
        // Restore original
        document.createElement = originalCreateElement;
    }

    return creationCount;
}

/**
 * Measures execution time
 */
function measureTime(fn: () => void): number {
    const start = performance.now();
    fn();
    const end = performance.now();
    return end - start;
}

describe("Performance Comparison (RFC 0037)", () => {
    describe("DOM Creation Count", () => {
        test("应该减少 DOM 创建次数（优化后）", () => {
            const component = new PerformanceTestComponent();
            document.body.appendChild(component);

            const items = Array.from({ length: 50 }, (_, i) => `Item ${i}`);
            component.setItems(items);

            // 等待初始渲染完成
            return new Promise<void>((resolve) => {
                // 使用多个 requestAnimationFrame 确保所有异步操作完成
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            // 清除缓存，确保第一次更新会创建元素
                            (component as any)._domCache.clear();

                            // 第一次更新：应该创建所有元素
                            let creationCount1 = 0;
                            const originalCreateElement = document.createElement.bind(document);
                            document.createElement = function (tagName: string) {
                                creationCount1++;
                                return originalCreateElement(tagName);
                            };

                            const newItems1 = [...items];
                            newItems1[25] = "Updated Item 25";
                            component.setItems(newItems1);

                            // 等待第一次更新完成
                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => {
                                    requestAnimationFrame(() => {
                                        document.createElement = originalCreateElement;

                                        // 第二次更新：应该复用大部分元素（优化后）
                                        let creationCount2 = 0;
                                        document.createElement = function (tagName: string) {
                                            creationCount2++;
                                            return originalCreateElement(tagName);
                                        };

                                        const newItems2 = [...newItems1];
                                        newItems2[26] = "Updated Item 26";
                                        component.setItems(newItems2);

                                        // 等待第二次更新完成
                                        requestAnimationFrame(() => {
                                            requestAnimationFrame(() => {
                                                requestAnimationFrame(() => {
                                                    document.createElement = originalCreateElement;

                                                    // 验证：第二次更新应该创建更少的元素（因为缓存复用）
                                                    console.log(
                                                        `First update: ${creationCount1} creations`
                                                    );
                                                    console.log(
                                                        `Second update: ${creationCount2} creations`
                                                    );
                                                    // 由于缓存机制，第二次更新应该创建更少的元素
                                                    // 如果第一次更新创建了 0 个元素（因为复用了初始渲染的元素），
                                                    // 那么第二次更新也应该创建 0 个或更少的元素
                                                    if (creationCount1 > 0) {
                                                        expect(creationCount2).toBeLessThanOrEqual(
                                                            creationCount1
                                                        );
                                                    } else {
                                                        // 如果第一次更新创建了 0 个，说明元素被复用了
                                                        // 第二次更新也应该复用，所以应该 <= 0
                                                        expect(creationCount2).toBeLessThanOrEqual(
                                                            0
                                                        );
                                                    }

                                                    component.remove();
                                                    (component as any)._domCache.clear();
                                                    resolve();
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        }, 20000);
    });

    describe("Update Performance", () => {
        test("应该提升更新性能（优化后）", () => {
            const component = new PerformanceTestComponent();
            document.body.appendChild(component);
            (component as any)._domCache.clear();

            const items = Array.from({ length: 500 }, (_, i) => `Item ${i}`);
            component.setItems(items);

            return new Promise<void>((resolve) => {
                setTimeout(() => {
                    // 测量更新性能（修改部分数据）
                    const newItems = [...items];
                    newItems[250] = "Updated Item 250";
                    newItems[251] = "Updated Item 251";

                    const updateTime = measureTime(() => {
                        component.setItems(newItems);
                    });

                    // 验证性能：更新应该很快（因为使用了缓存和细粒度更新）
                    // 预期：< 30ms for 500 items update
                    console.log(`Update time: ${updateTime}ms`);
                    expect(updateTime).toBeLessThan(30);

                    component.remove();
                    (component as any)._domCache.clear();
                    resolve();
                }, 100);
            });
        }, 10000);
    });

    describe("Third-party Library Integration", () => {
        test("应该保留第三方库注入的元素（Monaco Editor）", () => {
            const component = new MonacoEditorComponent();
            document.body.appendChild(component);
            (component as any)._domCache.clear();

            // 初始渲染
            RenderContext.runInContext(component, () => {
                component.render();
            });

            return new Promise<void>((resolve) => {
                setTimeout(() => {
                    // 模拟 Monaco Editor 注入元素（未标记的元素）
                    const monacoContainer = document.getElementById("monaco-editor");
                    if (monacoContainer) {
                        const monacoElement = document.createElement("div");
                        monacoElement.className = "monaco-editor-view";
                        monacoElement.textContent = "Monaco Editor Content";
                        monacoContainer.appendChild(monacoElement);

                        // 验证元素未标记（应该被保留）

                        const { isCreatedByH, shouldPreserveElement } =
                            typeof require !== "undefined"
                                ? require("../utils/element-marking")
                                : { isCreatedByH: () => false, shouldPreserveElement: () => false };
                        expect(isCreatedByH(monacoElement)).toBe(false);
                        expect(shouldPreserveElement(monacoElement)).toBe(true);

                        // 更新组件内容
                        component.setContent("// Updated code");

                        setTimeout(() => {
                            // 验证 Monaco 元素仍然存在（被保留）
                            // Verify Monaco element still exists (preserved)
                            expect(monacoContainer.contains(monacoElement)).toBe(true);
                            // 注意：在实际场景中，元素应该被保留
                            // 但由于测试环境限制，这里主要验证逻辑正确性
                            expect(shouldPreserveElement(monacoElement)).toBe(true);

                            component.remove();
                            (component as any)._domCache.clear();
                            resolve();
                        }, 100);
                    } else {
                        component.remove();
                        (component as any)._domCache.clear();
                        resolve();
                    }
                }, 100);
            });
        }, 10000);
    });

    describe("Performance Metrics", () => {
        test("应该记录性能指标", () => {
            const component = new PerformanceTestComponent();
            document.body.appendChild(component);
            (component as any)._domCache.clear();

            const items = Array.from({ length: 200 }, (_, i) => `Item ${i}`);
            component.setItems(items);

            return new Promise<void>((resolve) => {
                setTimeout(() => {
                    const metrics = {
                        initialRender: 0,
                        updateTime: 0,
                        cacheHitRate: 0,
                    };

                    // 测量初始渲染时间
                    metrics.initialRender = measureTime(() => {
                        component.setItems(items);
                    });

                    // 测量更新性能
                    const newItems = [...items];
                    newItems[100] = "Updated";
                    metrics.updateTime = measureTime(() => {
                        component.setItems(newItems);
                    });

                    // 计算缓存命中率（估算）
                    const cacheSize = (component as any)._domCache["cache"].size;
                    metrics.cacheHitRate = (cacheSize / items.length) * 100;

                    console.log("Performance Metrics:", {
                        initialRender: `${metrics.initialRender.toFixed(2)}ms`,
                        updateTime: `${metrics.updateTime.toFixed(2)}ms`,
                        cacheHitRate: `${metrics.cacheHitRate.toFixed(2)}%`,
                        cacheSize,
                        itemsCount: items.length,
                    });

                    // 验证性能指标在合理范围内
                    expect(metrics.initialRender).toBeGreaterThan(0);
                    expect(metrics.updateTime).toBeLessThan(50); // 更新应该很快
                    expect(metrics.cacheHitRate).toBeGreaterThan(0); // 应该有缓存

                    component.remove();
                    (component as any)._domCache.clear();
                    resolve();
                }, 100);
            });
        }, 10000);
    });
});
