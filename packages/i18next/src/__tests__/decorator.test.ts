/**
 * decorator.ts 测试 - 100% 覆盖率
 */

import { i18nDecorator } from "../decorator";
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
const mockUnsubscribe = jest.fn();
const mockOn = jest.fn(() => mockUnsubscribe);
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

describe("decorator.ts", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockOn.mockReturnValue(mockUnsubscribe);
    });

    describe("i18nDecorator", () => {
        test("应该为类添加 t 方法", () => {
            @i18nDecorator("common")
            class TestComponent extends WebComponent {
                render() {
                    return h("div", {}, []) as HTMLElement;
                }
            }

            if (!customElements.get("test-i18n-component")) {
                customElements.define("test-i18n-component", TestComponent);
            }

            const component = document.createElement("test-i18n-component") as any;
            const result = component.t("hello");

            expect(result).toBe("common:hello");
            expect(mockT).toHaveBeenCalledWith("hello", { ns: "common" });
        });

        test("应该使用默认命名空间 'common'", () => {
            @i18nDecorator()
            class TestComponent extends WebComponent {
                render() {
                    return h("div", {}, []) as HTMLElement;
                }
            }

            if (!customElements.get("test-i18n-default")) {
                customElements.define("test-i18n-default", TestComponent);
            }

            const component = document.createElement("test-i18n-default") as any;
            component.t("test");

            expect(mockT).toHaveBeenCalledWith("test", { ns: "common" });
        });

        test("应该添加 i18n getter", () => {
            @i18nDecorator("test")
            class TestComponent extends WebComponent {
                render() {
                    return h("div", {}, []) as HTMLElement;
                }
            }

            if (!customElements.get("test-i18n-getter")) {
                customElements.define("test-i18n-getter", TestComponent);
            }

            const component = document.createElement("test-i18n-getter") as any;
            const i18nInstance = component.i18n;

            expect(i18nInstance).toBe(i18n);
        });

        test("应该在 onConnected 时订阅语言变化", (done) => {
            @i18nDecorator("common")
            class TestComponent extends WebComponent {
                rerenderCallCount = 0;
                render() {
                    return h("div", {}, []) as HTMLElement;
                }
                rerender() {
                    this.rerenderCallCount++;
                }
            }

            if (!customElements.get("test-i18n-subscribe")) {
                customElements.define("test-i18n-subscribe", TestComponent);
            }

            const component = document.createElement("test-i18n-subscribe") as any;
            component.onConnected();

            expect(mockOn).toHaveBeenCalledWith("languageChanged", expect.any(Function));

            // 触发语言变化回调
            const callback = mockOn.mock.calls[0][1];
            callback();

            // 等待 requestAnimationFrame 执行完成
            requestAnimationFrame(() => {
                expect(component.rerenderCallCount).toBe(1);
                done();
            });
        });

        test("应该在 onDisconnected 时取消订阅", () => {
            @i18nDecorator("common")
            class TestComponent extends WebComponent {
                render() {
                    return h("div", {}, []) as HTMLElement;
                }
            }

            if (!customElements.get("test-i18n-unsubscribe")) {
                customElements.define("test-i18n-unsubscribe", TestComponent);
            }

            const component = document.createElement("test-i18n-unsubscribe") as any;
            component.onConnected();
            component.onDisconnected();

            expect(mockUnsubscribe).toHaveBeenCalled();
        });

        test("应该订阅语言变化事件", () => {
            @i18nDecorator("common")
            class TestComponent extends WebComponent {
                render() {
                    return h("div", {}, []) as HTMLElement;
                }
            }

            if (!customElements.get("test-i18n-subscribe-only")) {
                customElements.define("test-i18n-subscribe-only", TestComponent);
            }

            const component = document.createElement("test-i18n-subscribe-only") as any;
            component.onConnected();

            expect(mockOn).toHaveBeenCalledWith("languageChanged", expect.any(Function));
        });

        test("应该在 onDisconnected 时取消订阅", () => {
            @i18nDecorator("common")
            class TestComponent extends WebComponent {
                render() {
                    return h("div", {}, []) as HTMLElement;
                }
            }

            if (!customElements.get("test-i18n-disconnect-cleanup")) {
                customElements.define("test-i18n-disconnect-cleanup", TestComponent);
            }

            const component = document.createElement("test-i18n-disconnect-cleanup") as any;
            component.onConnected();
            component.onDisconnected();

            expect(mockUnsubscribe).toHaveBeenCalled();
        });

        test("应该处理没有 rerender 方法的情况", () => {
            @i18nDecorator("common")
            class TestComponent extends WebComponent {
                render() {
                    return h("div", {}, []) as HTMLElement;
                }
            }

            if (!customElements.get("test-i18n-no-rerender")) {
                customElements.define("test-i18n-no-rerender", TestComponent);
            }

            const component = document.createElement("test-i18n-no-rerender") as any;
            component.onConnected();

            const callback = mockOn.mock.calls[0][1];
            // 不应该抛出错误
            expect(() => callback()).not.toThrow();
        });

        test("应该支持 LightComponent", () => {
            @i18nDecorator("test")
            class TestLightComponent extends LightComponent {
                render() {
                    return h("div", {}, []) as HTMLElement;
                }
            }

            if (!customElements.get("test-i18n-light")) {
                customElements.define("test-i18n-light", TestLightComponent);
            }

            const component = document.createElement("test-i18n-light") as any;
            const result = component.t("key");

            expect(result).toBe("test:key");
        });

        test("应该支持传递选项给 t 方法", () => {
            @i18nDecorator("common")
            class TestComponent extends WebComponent {
                render() {
                    return h("div", {}, []) as HTMLElement;
                }
            }

            if (!customElements.get("test-i18n-options")) {
                customElements.define("test-i18n-options", TestComponent);
            }

            const component = document.createElement("test-i18n-options") as any;
            component.t("key", { count: 5 });

            expect(mockT).toHaveBeenCalledWith("key", { ns: "common", count: 5 });
        });

        test("多次断开连接应该安全处理", () => {
            @i18nDecorator("common")
            class TestComponent extends WebComponent {
                render() {
                    return h("div", {}, []) as HTMLElement;
                }
            }

            if (!customElements.get("test-i18n-multiple-disconnect")) {
                customElements.define("test-i18n-multiple-disconnect", TestComponent);
            }

            const component = document.createElement("test-i18n-multiple-disconnect") as any;
            component.onConnected();
            component.onDisconnected();
            component.onDisconnected(); // 再次调用

            expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
        });
    });
});
