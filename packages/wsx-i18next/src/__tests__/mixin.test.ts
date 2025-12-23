/**
 * mixin.ts 测试 - 100% 覆盖率
 */

import { withI18n } from "../mixin";
import { i18n } from "../i18n";
import { WebComponent, LightComponent, h } from "@wsxjs/wsx-core";

/* eslint-disable @typescript-eslint/no-explicit-any */
// 设置测试环境
if (typeof window === "undefined") {
    // @ts-expect-error - 测试环境需要模拟 window 对象
    global.window = {};
}
if (typeof document === "undefined") {
    // @ts-expect-error - 测试环境需要模拟 document 对象
    global.document = {
        createElement: jest.fn((tag: string) => ({
            tagName: tag.toUpperCase(),
            appendChild: jest.fn(),
            removeChild: jest.fn(),
            querySelector: jest.fn(),
            querySelectorAll: jest.fn(),
            getAttribute: jest.fn(),
            setAttribute: jest.fn(),
            removeAttribute: jest.fn(),
            hasAttribute: jest.fn(),
            children: [],
            parentNode: null,
        })),
    };
}

// Mock i18n
const mockOn = jest.fn();
const mockT = jest.fn((key: string, options?: any) => {
    if (options?.ns) {
        return `${options.ns}:${key}`;
    }
    return key;
});

jest.mock("../i18n", () => {
    return {
        i18n: {
            get t() {
                return mockT;
            },
            get on() {
                return mockOn;
            },
        },
    };
});

describe("mixin.ts", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockOn.mockClear();
    });

    describe("withI18n", () => {
        test("应该为 WebComponent 添加 t 方法", () => {
            const EnhancedComponent = withI18n(WebComponent, "common");

            class TestComponent extends EnhancedComponent {
                render() {
                    return h("div", {}, []) as HTMLElement;
                }
            }

            if (!customElements.get("test-mixin-web")) {
                customElements.define("test-mixin-web", TestComponent);
            }

            const component = document.createElement("test-mixin-web") as any;
            const result = component.t("hello");

            expect(result).toBe("common:hello");
            expect(mockT).toHaveBeenCalledWith("hello", { ns: "common" });
        });

        test("应该为 LightComponent 添加 t 方法", () => {
            const EnhancedComponent = withI18n(LightComponent, "test");

            class TestComponent extends EnhancedComponent {
                render() {
                    return h("div", {}, []) as HTMLElement;
                }
            }

            if (!customElements.get("test-mixin-light")) {
                customElements.define("test-mixin-light", TestComponent);
            }

            const component = document.createElement("test-mixin-light") as any;
            const result = component.t("key");

            expect(result).toBe("test:key");
            expect(mockT).toHaveBeenCalledWith("key", { ns: "test" });
        });

        test("应该使用默认命名空间 'common'", () => {
            const EnhancedComponent = withI18n(WebComponent);

            class TestComponent extends EnhancedComponent {
                render() {
                    return h("div", {}, []) as HTMLElement;
                }
            }

            if (!customElements.get("test-mixin-default")) {
                customElements.define("test-mixin-default", TestComponent);
            }

            const component = document.createElement("test-mixin-default") as any;
            component.t("test");

            expect(mockT).toHaveBeenCalledWith("test", { ns: "common" });
        });

        test("应该支持指定命名空间参数", () => {
            const EnhancedComponent = withI18n(WebComponent, "home");

            class TestComponent extends EnhancedComponent {
                render() {
                    return h("div", {}, []) as HTMLElement;
                }
            }

            if (!customElements.get("test-mixin-ns")) {
                customElements.define("test-mixin-ns", TestComponent);
            }

            const component = document.createElement("test-mixin-ns") as any;
            component.t("title", "custom");

            expect(mockT).toHaveBeenCalledWith("title", { ns: "custom" });
        });

        test("应该添加 i18n getter", () => {
            const EnhancedComponent = withI18n(WebComponent, "test");

            class TestComponent extends EnhancedComponent {
                render() {
                    return h("div", {}, []) as HTMLElement;
                }
            }

            if (!customElements.get("test-mixin-getter")) {
                customElements.define("test-mixin-getter", TestComponent);
            }

            const component = document.createElement("test-mixin-getter") as any;
            const i18nInstance = component.i18n;

            expect(i18nInstance).toBe(i18n);
        });

        test("应该在 onConnected 时订阅语言变化", () => {
            const EnhancedComponent = withI18n(WebComponent, "common");

            class TestComponent extends EnhancedComponent {
                rerenderCallCount = 0;
                render() {
                    return h("div", {}, []) as HTMLElement;
                }
                rerender() {
                    this.rerenderCallCount++;
                }
            }

            if (!customElements.get("test-mixin-subscribe")) {
                customElements.define("test-mixin-subscribe", TestComponent);
            }

            const component = document.createElement("test-mixin-subscribe") as any;
            component.onConnected();

            expect(mockOn).toHaveBeenCalledWith("languageChanged", expect.any(Function));

            // 触发语言变化回调
            const callback = mockOn.mock.calls[0][1];
            callback();

            expect(component.rerenderCallCount).toBe(1);
        });

        test("应该订阅语言变化事件", () => {
            const EnhancedComponent = withI18n(WebComponent, "common");

            class TestComponent extends EnhancedComponent {
                render() {
                    return h("div", {}, []) as HTMLElement;
                }
            }

            if (!customElements.get("test-mixin-subscribe-only")) {
                customElements.define("test-mixin-subscribe-only", TestComponent);
            }

            const component = document.createElement("test-mixin-subscribe-only") as any;
            component.onConnected();

            expect(mockOn).toHaveBeenCalledWith("languageChanged", expect.any(Function));
        });

        test("应该处理没有 rerender 方法的情况", () => {
            const EnhancedComponent = withI18n(WebComponent, "common");

            class TestComponent extends EnhancedComponent {
                render() {
                    return h("div", {}, []) as HTMLElement;
                }
            }

            if (!customElements.get("test-mixin-no-rerender")) {
                customElements.define("test-mixin-no-rerender", TestComponent);
            }

            const component = document.createElement("test-mixin-no-rerender") as any;
            component.onConnected();

            const callback = mockOn.mock.calls[0][1];
            // 不应该抛出错误
            expect(() => callback()).not.toThrow();
        });

        test("应该处理命名空间为 undefined 的情况", () => {
            const EnhancedComponent = withI18n(WebComponent, "common");

            class TestComponent extends EnhancedComponent {
                render() {
                    return h("div", {}, []) as HTMLElement;
                }
            }

            if (!customElements.get("test-mixin-undefined-ns")) {
                customElements.define("test-mixin-undefined-ns", TestComponent);
            }

            const component = document.createElement("test-mixin-undefined-ns") as any;
            // 传递 undefined 作为命名空间，应该使用默认命名空间
            component.t("key", undefined);

            expect(mockT).toHaveBeenCalledWith("key", { ns: "common" });
        });

        test("应该支持传递选项给 t 方法", () => {
            const EnhancedComponent = withI18n(WebComponent, "common");

            class TestComponent extends EnhancedComponent {
                render() {
                    return h("div", {}, []) as HTMLElement;
                }
            }

            if (!customElements.get("test-mixin-options")) {
                customElements.define("test-mixin-options", TestComponent);
            }

            const component = document.createElement("test-mixin-options") as any;
            component.t("key", undefined, { count: 5 });

            expect(mockT).toHaveBeenCalledWith("key", { ns: "common", count: 5 });
        });

        test("应该支持命名空间覆盖", () => {
            const EnhancedComponent = withI18n(WebComponent, "default");

            class TestComponent extends EnhancedComponent {
                render() {
                    return h("div", {}, []) as HTMLElement;
                }
            }

            if (!customElements.get("test-mixin-override")) {
                customElements.define("test-mixin-override", TestComponent);
            }

            const component = document.createElement("test-mixin-override") as any;
            component.t("key", "override");

            expect(mockT).toHaveBeenCalledWith("key", { ns: "override" });
        });

        test("应该保持类型兼容性", () => {
            const EnhancedComponent = withI18n(WebComponent, "common");

            expect(EnhancedComponent).toBeDefined();
            expect(typeof EnhancedComponent).toBe("function");
        });
    });
});
