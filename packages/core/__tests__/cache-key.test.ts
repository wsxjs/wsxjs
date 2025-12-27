/**
 * Cache Key Generation Tests
 *
 * Tests for cache key generation utilities (RFC 0037).
 */

import { generateCacheKey, getComponentId } from "../src/utils/cache-key";
import { RenderContext } from "../src/render-context";
import { BaseComponent } from "../src/base-component";

class MockComponent extends BaseComponent {
    render() {
        return document.createElement("div");
    }

    _rerender() {
        // Mock implementation
    }
}

customElements.define("test-cache-key-component", MockComponent);

describe("Cache Key Generation", () => {
    describe("generateCacheKey", () => {
        const componentId = "TestComponent:123";

        test("应该使用用户提供的 key（优先级最高）", () => {
            const props = { key: "user-key-1" };
            const cacheKey = generateCacheKey("div", props, componentId);
            expect(cacheKey).toBe("TestComponent:123:div:key-user-key-1");
        });

        test("应该使用索引（当没有 key 时）", () => {
            const props = { __wsxIndex: 5 };
            const cacheKey = generateCacheKey("li", props, componentId);
            expect(cacheKey).toBe("TestComponent:123:li:idx-5");
        });

        test("应该使用位置 ID（当没有 key 和 index 时）", () => {
            const props = { __wsxPositionId: "pos-1" };
            const cacheKey = generateCacheKey("div", props, componentId);
            expect(cacheKey).toBe("TestComponent:123:div:pos-1");
        });

        test("应该回退到 'no-id'（当没有任何标识符时）", () => {
            const props = {};
            const cacheKey = generateCacheKey("span", props, componentId);
            expect(cacheKey).toBe("TestComponent:123:span:no-id");
        });

        test("应该处理 null props", () => {
            const cacheKey = generateCacheKey("div", null, componentId);
            expect(cacheKey).toBe("TestComponent:123:div:no-id");
        });

        test("应该处理 undefined props", () => {
            const cacheKey = generateCacheKey("div", undefined, componentId);
            expect(cacheKey).toBe("TestComponent:123:div:no-id");
        });

        test("key 优先级高于 index", () => {
            const props = { key: "user-key", __wsxIndex: 5 };
            const cacheKey = generateCacheKey("li", props, componentId);
            expect(cacheKey).toBe("TestComponent:123:li:key-user-key");
        });

        test("key 优先级高于 position ID", () => {
            const props = { key: "user-key", __wsxPositionId: "pos-1" };
            const cacheKey = generateCacheKey("div", props, componentId);
            expect(cacheKey).toBe("TestComponent:123:div:key-user-key");
        });

        test("index 优先级高于 position ID", () => {
            const props = { __wsxIndex: 3, __wsxPositionId: "pos-1" };
            const cacheKey = generateCacheKey("li", props, componentId);
            expect(cacheKey).toBe("TestComponent:123:li:idx-3");
        });

        test("应该处理数字 key", () => {
            const props = { key: 123 };
            const cacheKey = generateCacheKey("div", props, componentId);
            expect(cacheKey).toBe("TestComponent:123:div:key-123");
        });

        test("应该处理字符串 key", () => {
            const props = { key: "item-1" };
            const cacheKey = generateCacheKey("div", props, componentId);
            expect(cacheKey).toBe("TestComponent:123:div:key-item-1");
        });

        test("应该处理 null key（不使用 key）", () => {
            const props = { key: null, __wsxIndex: 2 };
            const cacheKey = generateCacheKey("li", props, componentId);
            expect(cacheKey).toBe("TestComponent:123:li:idx-2");
        });

        test("应该处理 undefined key（不使用 key）", () => {
            const props = { key: undefined, __wsxIndex: 2 };
            const cacheKey = generateCacheKey("li", props, componentId);
            expect(cacheKey).toBe("TestComponent:123:li:idx-2");
        });

        test("应该处理不同的标签名", () => {
            const props = { key: "same-key" };
            const divKey = generateCacheKey("div", props, componentId);
            const spanKey = generateCacheKey("span", props, componentId);
            expect(divKey).toBe("TestComponent:123:div:key-same-key");
            expect(spanKey).toBe("TestComponent:123:span:key-same-key");
            expect(divKey).not.toBe(spanKey);
        });

        test("应该处理不同的组件 ID", () => {
            const props = { key: "same-key" };
            const key1 = generateCacheKey("div", props, "Component1:123");
            const key2 = generateCacheKey("div", props, "Component2:456");
            expect(key1).toBe("Component1:123:div:key-same-key");
            expect(key2).toBe("Component2:456:div:key-same-key");
            expect(key1).not.toBe(key2);
        });
    });

    describe("getComponentId", () => {
        test("应该在没有上下文时返回 'unknown'", () => {
            const componentId = getComponentId();
            expect(componentId).toBe("unknown");
        });

        test("应该从 RenderContext 获取组件 ID", () => {
            const component = new MockComponent();
            // @ts-ignore - 测试需要设置内部属性
            component._instanceId = "abc123";

            RenderContext.runInContext(component, () => {
                const componentId = getComponentId();
                expect(componentId).toBe("MockComponent:abc123");
            });
        });

        test("应该使用默认 instance ID（当没有 _instanceId 时）", () => {
            const component = new MockComponent();

            RenderContext.runInContext(component, () => {
                const componentId = getComponentId();
                expect(componentId).toBe("MockComponent:default");
            });
        });

        test("应该处理嵌套上下文", () => {
            const component1 = new MockComponent();
            const component2 = new MockComponent();
            // @ts-ignore - 测试需要设置内部属性
            component1._instanceId = "comp1";
            // @ts-ignore - 测试需要设置内部属性
            component2._instanceId = "comp2";

            RenderContext.runInContext(component1, () => {
                const id1 = getComponentId();
                expect(id1).toBe("MockComponent:comp1");

                RenderContext.runInContext(component2, () => {
                    const id2 = getComponentId();
                    expect(id2).toBe("MockComponent:comp2");
                });

                const id1Again = getComponentId();
                expect(id1Again).toBe("MockComponent:comp1");
            });
        });

        test("应该在上下文外返回 'unknown'", () => {
            const component = new MockComponent();

            RenderContext.runInContext(component, () => {
                expect(getComponentId()).toBe("MockComponent:default");
            });

            expect(getComponentId()).toBe("unknown");
        });
    });
});
