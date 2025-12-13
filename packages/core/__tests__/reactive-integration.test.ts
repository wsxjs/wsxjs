/**
 * 响应式系统集成测试
 * 专注于测试响应式功能的集成，不依赖完整的WebComponent环境
 */

import { describe, it, expect, jest } from "@jest/globals";
import { reactive, createState } from "../src/utils/reactive";

describe("reactive system integration", () => {
    it("should integrate reactive objects with manual rerender callbacks", () => {
        let renderCount = 0;
        const mockRerender = () => {
            renderCount++;
        };

        const state = reactive(
            {
                count: 0,
                message: "hello",
            },
            mockRerender
        );

        // 初始状态
        expect(renderCount).toBe(0);
        expect(state.count).toBe(0);

        // 修改状态
        state.count = 5;

        return new Promise<void>((resolve) => {
            queueMicrotask(() => {
                expect(renderCount).toBe(1);
                expect(state.count).toBe(5);
                resolve();
            });
        });
    });

    it("should handle multiple reactive objects with shared callback", () => {
        let renderCount = 0;
        const mockRerender = () => {
            renderCount++;
        };

        const state1 = reactive({ a: 1 }, mockRerender);
        const state2 = reactive({ b: 2 }, mockRerender);

        // 同时修改多个状态
        state1.a = 10;
        state2.b = 20;

        return new Promise<void>((resolve) => {
            queueMicrotask(() => {
                // 批量更新，只触发一次回调
                expect(renderCount).toBe(1);
                expect(state1.a).toBe(10);
                expect(state2.b).toBe(20);
                resolve();
            });
        });
    });

    it("should handle useState pattern", () => {
        let renderCount = 0;
        const mockRerender = () => {
            renderCount++;
        };

        const [getTheme, setTheme] = createState("light", mockRerender);
        const [getCount, setCount] = createState(0, mockRerender);

        // 初始状态
        expect(getTheme()).toBe("light");
        expect(getCount()).toBe(0);
        expect(renderCount).toBe(0);

        // 修改状态
        setTheme("dark");
        setCount(5);

        return new Promise<void>((resolve) => {
            queueMicrotask(() => {
                expect(renderCount).toBe(1); // 批量更新
                expect(getTheme()).toBe("dark");
                expect(getCount()).toBe(5);
                resolve();
            });
        });
    });

    it("should handle function updates in useState", () => {
        let renderCount = 0;
        const mockRerender = () => {
            renderCount++;
        };

        const [getCount, setCount] = createState(0, mockRerender);

        setCount((prev) => prev + 10);
        setCount((prev) => prev + 5);

        return new Promise<void>((resolve) => {
            queueMicrotask(() => {
                expect(renderCount).toBe(1); // 批量更新
                expect(getCount()).toBe(15);
                resolve();
            });
        });
    });

    it("should handle mixed reactive patterns", () => {
        let renderCount = 0;
        const mockRerender = () => {
            renderCount++;
        };

        // 混合使用响应式对象和useState
        const state = reactive({ ui: { loading: false } }, mockRerender);
        const [getTheme, setTheme] = createState("light", mockRerender);

        state.ui = { loading: true };
        setTheme("dark");

        return new Promise<void>((resolve) => {
            queueMicrotask(() => {
                expect(renderCount).toBe(1); // 批量更新
                expect(state.ui.loading).toBe(true);
                expect(getTheme()).toBe("dark");
                resolve();
            });
        });
    });

    it("should handle error recovery in callbacks", () => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        let goodCallbackCount = 0;
        const goodCallback = () => {
            goodCallbackCount++;
        };

        const badCallback = () => {
            throw new Error("Callback error");
        };

        const goodState = reactive({ value: 1 }, goodCallback);
        const badState = reactive({ value: 1 }, badCallback);

        goodState.value = 2;
        badState.value = 2;

        return new Promise<void>((resolve) => {
            queueMicrotask(() => {
                expect(goodCallbackCount).toBe(1);
                expect(consoleSpy).toHaveBeenCalledWith(
                    expect.stringContaining("[WSX Reactive] Error in callback:"),
                    expect.any(Error)
                );

                consoleSpy.mockRestore();
                resolve();
            });
        });
    });

    it("should handle complex state updates", () => {
        let renderCount = 0;
        const mockRerender = () => {
            renderCount++;
        };

        const state = reactive(
            {
                user: { name: "John", preferences: { theme: "light" } },
                ui: { loading: false, errors: [] as string[] },
                data: { items: [] as any[] },
            },
            mockRerender
        );

        // 复杂的状态更新
        state.user = { name: "Jane", preferences: { theme: "dark" } };
        state.ui = { loading: true, errors: ["Network error"] };
        state.data = { items: [1, 2, 3] };

        return new Promise<void>((resolve) => {
            queueMicrotask(() => {
                expect(renderCount).toBe(1); // 批量更新
                expect(state.user.name).toBe("Jane");
                expect(state.user.preferences.theme).toBe("dark");
                expect(state.ui.loading).toBe(true);
                expect(state.ui.errors).toEqual(["Network error"]);
                expect(state.data.items).toEqual([1, 2, 3]);
                resolve();
            });
        });
    });

    it("should handle performance with many rapid updates", () => {
        let renderCount = 0;
        const mockRerender = () => {
            renderCount++;
        };

        const state = reactive({ counter: 0 }, mockRerender);

        // 快速连续更新
        for (let i = 0; i < 1000; i++) {
            state.counter = i;
        }

        return new Promise<void>((resolve) => {
            queueMicrotask(() => {
                expect(renderCount).toBe(1); // 只触发一次
                expect(state.counter).toBe(999);
                resolve();
            });
        });
    });
});
