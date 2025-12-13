/**
 * 响应式状态系统测试
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { reactive, createState, ReactiveDebug } from "../src/utils/reactive";

describe("reactive", () => {
    beforeEach(() => {
        // 每个测试前清理调试状态
        ReactiveDebug.disable();
    });

    it("should create reactive object that triggers callback on property change", () => {
        let callCount = 0;
        const obj = reactive({ count: 0 }, () => {
            callCount++;
        });

        obj.count = 1;

        // 等待微任务执行
        return new Promise<void>((resolve) => {
            queueMicrotask(() => {
                expect(callCount).toBe(1);
                expect(obj.count).toBe(1);
                resolve();
            });
        });
    });

    it("should not trigger callback when setting same value", () => {
        let callCount = 0;
        const obj = reactive({ count: 0 }, () => {
            callCount++;
        });

        obj.count = 0; // 相同值

        return new Promise<void>((resolve) => {
            queueMicrotask(() => {
                expect(callCount).toBe(0);
                resolve();
            });
        });
    });

    it("should batch multiple changes into single callback", () => {
        let callCount = 0;
        const obj = reactive({ a: 1, b: 2 }, () => {
            callCount++;
        });

        // 连续修改多个属性
        obj.a = 10;
        obj.b = 20;
        obj.a = 30;

        return new Promise<void>((resolve) => {
            queueMicrotask(() => {
                expect(callCount).toBe(1); // 只调用一次
                expect(obj.a).toBe(30);
                expect(obj.b).toBe(20);
                resolve();
            });
        });
    });

    it("should handle nested object properties", () => {
        let callCount = 0;
        const obj = reactive(
            {
                user: { name: "John", age: 30 },
                settings: { theme: "light" },
            },
            () => {
                callCount++;
            }
        );

        // 修改嵌套对象的引用
        obj.user = { name: "Jane", age: 25 };

        return new Promise<void>((resolve) => {
            queueMicrotask(() => {
                expect(callCount).toBe(1);
                expect(obj.user.name).toBe("Jane");
                resolve();
            });
        });
    });

    it("should handle array operations", () => {
        let callCount = 0;
        const obj = reactive({ items: [1, 2, 3] }, () => {
            callCount++;
        });

        // 替换整个数组
        obj.items = [4, 5, 6];

        return new Promise<void>((resolve) => {
            queueMicrotask(() => {
                expect(callCount).toBe(1);
                expect(obj.items).toEqual([4, 5, 6]);
                resolve();
            });
        });
    });

    it("should handle error in callback gracefully", () => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        const obj = reactive({ count: 0 }, () => {
            throw new Error("Test error");
        });

        obj.count = 1;

        return new Promise<void>((resolve) => {
            queueMicrotask(() => {
                expect(consoleSpy).toHaveBeenCalledWith(
                    expect.stringContaining("[WSX Reactive] Error in callback:"),
                    expect.any(Error)
                );
                consoleSpy.mockRestore();
                resolve();
            });
        });
    });
});

describe("createState", () => {
    it("should create state with getter and setter", () => {
        let callCount = 0;
        const [getValue, setValue] = createState(0, () => {
            callCount++;
        });

        expect(getValue()).toBe(0);

        setValue(5);

        return new Promise<void>((resolve) => {
            queueMicrotask(() => {
                expect(callCount).toBe(1);
                expect(getValue()).toBe(5);
                resolve();
            });
        });
    });

    it("should support function updates", () => {
        let callCount = 0;
        const [getValue, setValue] = createState(10, () => {
            callCount++;
        });

        setValue((prev) => prev + 5);

        return new Promise<void>((resolve) => {
            queueMicrotask(() => {
                expect(callCount).toBe(1);
                expect(getValue()).toBe(15);
                resolve();
            });
        });
    });

    it("should not trigger callback when setting same value", () => {
        let callCount = 0;
        const [getValue, setValue] = createState("test", () => {
            callCount++;
        });

        setValue("test"); // 相同值

        return new Promise<void>((resolve) => {
            queueMicrotask(() => {
                expect(callCount).toBe(0);
                expect(getValue()).toBe("test");
                resolve();
            });
        });
    });
});

describe("ReactiveDebug", () => {
    it("should enable and disable debug mode", () => {
        expect(ReactiveDebug.isEnabled()).toBe(false);

        ReactiveDebug.enable();
        expect(ReactiveDebug.isEnabled()).toBe(true);

        ReactiveDebug.disable();
        expect(ReactiveDebug.isEnabled()).toBe(false);
    });

    it("should log debug messages when enabled", () => {
        // Mock both console.log and the logger that's actually used
        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        const infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});

        ReactiveDebug.enable();
        ReactiveDebug.log("test message", { data: "test" });

        // Check that either console.log or console.info was called with the expected message
        const wasCalled =
            consoleSpy.mock.calls.some((call) => call[0]?.includes?.("test message")) ||
            infoSpy.mock.calls.some((call) => call[0]?.includes?.("test message"));

        expect(wasCalled).toBe(true);

        consoleSpy.mockRestore();
        infoSpy.mockRestore();
        ReactiveDebug.disable();
    });

    it("should not log when disabled", () => {
        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

        ReactiveDebug.disable();
        ReactiveDebug.log("test message");

        expect(consoleSpy).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
    });
});

describe("performance and edge cases", () => {
    it("should handle rapid state changes efficiently", () => {
        let callCount = 0;
        const obj = reactive({ counter: 0 }, () => {
            callCount++;
        });

        // 快速连续修改
        for (let i = 0; i < 100; i++) {
            obj.counter = i;
        }

        return new Promise<void>((resolve) => {
            queueMicrotask(() => {
                expect(callCount).toBe(1); // 仍然只调用一次
                expect(obj.counter).toBe(99);
                resolve();
            });
        });
    });

    it("should handle object with null/undefined values", () => {
        let callCount = 0;
        const obj = reactive(
            {
                nullValue: null as any,
                undefinedValue: undefined as any,
                falseValue: false,
            },
            () => {
                callCount++;
            }
        );

        obj.nullValue = "not null";
        obj.undefinedValue = "defined";
        obj.falseValue = true;

        return new Promise<void>((resolve) => {
            queueMicrotask(() => {
                expect(callCount).toBe(1);
                expect(obj.nullValue).toBe("not null");
                expect(obj.undefinedValue).toBe("defined");
                expect(obj.falseValue).toBe(true);
                resolve();
            });
        });
    });

    it("should preserve object prototype", () => {
        class TestClass {
            value = 0;
            method() {
                return this.value * 2;
            }
        }

        const instance = new TestClass();
        const reactiveInstance = reactive(instance, () => {});

        expect(reactiveInstance instanceof TestClass).toBe(true);
        expect(reactiveInstance.method()).toBe(0);

        reactiveInstance.value = 5;
        expect(reactiveInstance.method()).toBe(10);
    });
});
