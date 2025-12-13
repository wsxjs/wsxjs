/**
 * WSX 响应式状态系统
 *
 * 基于浏览器原生 Proxy API 实现轻量级响应式状态，
 * 遵循 WSX 设计哲学：信任浏览器，零运行时开销
 */
import { createLogger } from "./logger";

const logger = createLogger("ReactiveSystem");

/**
 * 响应式回调函数类型
 */
export type ReactiveCallback = () => void;

/**
 * 批量更新调度器
 * 使用浏览器原生的 queueMicrotask 实现批量更新
 */
class UpdateScheduler {
    private pendingCallbacks = new Set<ReactiveCallback>();
    private isScheduled = false;

    /**
     * 调度一个更新回调
     */
    schedule(callback: ReactiveCallback): void {
        this.pendingCallbacks.add(callback);

        if (!this.isScheduled) {
            this.isScheduled = true;
            // 使用浏览器原生的微任务队列
            queueMicrotask(() => {
                this.flush();
            });
        }
    }

    /**
     * 执行所有待处理的回调
     */
    private flush(): void {
        const callbacks = Array.from(this.pendingCallbacks);
        this.pendingCallbacks.clear();
        this.isScheduled = false;

        // 执行所有回调
        callbacks.forEach((callback) => {
            try {
                callback();
            } catch (error) {
                logger.error("[WSX Reactive] Error in callback:", error);
            }
        });
    }
}

// 全局调度器实例
const scheduler = new UpdateScheduler();

// Proxy 缓存：避免为同一个对象创建多个 Proxy
// 使用 WeakMap 确保对象被垃圾回收时，对应的 Proxy 也被清理
// Key: 原始对象, Value: Proxy
const proxyCache = new WeakMap<object, unknown>();

// 反向映射：从 Proxy 到原始对象
// 用于在 set trap 中比较原始对象而不是 Proxy
const originalCache = new WeakMap<object, object>();

/**
 * 递归展开 Proxy，返回完全干净的对象（不包含任何 Proxy）
 * 用于 JSON.stringify 等需要序列化的场景
 * 使用 WeakSet 防止循环引用导致的无限递归
 */
const unwrappingSet = new WeakSet<object>();

function unwrapProxy(value: unknown): unknown {
    if (value == null || typeof value !== "object") {
        return value;
    }

    // 如果是 Proxy，获取原始对象
    let original = value;
    if (originalCache.has(value)) {
        original = originalCache.get(value)!;
    }

    // 防止循环引用
    if (unwrappingSet.has(original)) {
        return null; // 循环引用时返回 null
    }

    unwrappingSet.add(original);

    try {
        if (Array.isArray(original)) {
            return original.map((item) => unwrapProxy(item));
        }

        const result: Record<string, unknown> = {};
        // 直接访问原始对象的属性，不通过 Proxy
        for (const key in original) {
            if (Object.prototype.hasOwnProperty.call(original, key)) {
                const propValue = original[key];
                // 如果属性值是 Proxy，先获取原始对象再递归
                if (
                    propValue != null &&
                    typeof propValue === "object" &&
                    originalCache.has(propValue)
                ) {
                    result[key] = unwrapProxy(originalCache.get(propValue)!);
                } else {
                    result[key] = unwrapProxy(propValue);
                }
            }
        }

        return result;
    } finally {
        unwrappingSet.delete(original);
    }
}

/**
 * 数组变异方法列表 - 这些方法会修改数组内容
 */
const ARRAY_MUTATION_METHODS = [
    "push",
    "pop",
    "shift",
    "unshift",
    "splice",
    "sort",
    "reverse",
] as const;

/**
 * 创建响应式对象
 *
 * @param obj 要变为响应式的对象
 * @param onChange 状态变化时的回调函数
 * @returns 响应式代理对象
 */
export function reactive<T extends object>(obj: T, onChange: ReactiveCallback): T {
    // 检查缓存，避免为同一个对象创建多个 Proxy
    if (proxyCache.has(obj)) {
        return proxyCache.get(obj) as T;
    }

    // 检查是否为数组
    const isArray = Array.isArray(obj);

    const proxy = new Proxy(obj, {
        set(target: T, key: string | symbol, value: unknown): boolean {
            const oldValue = target[key as keyof T];

            // 获取原始对象进行比较（如果 oldValue 是 Proxy）
            const oldOriginal = originalCache.get(oldValue as object) || oldValue;
            const newOriginal =
                value != null && typeof value === "object"
                    ? originalCache.get(value as object) || value
                    : value;

            // 只有值真正改变时才触发更新（比较原始对象）
            if (oldOriginal !== newOriginal) {
                // 如果新值是对象或数组，确保它也被包装为响应式
                if (value != null && typeof value === "object") {
                    const reactiveValue = reactive(value as object, onChange);
                    target[key as keyof T] = reactiveValue as T[keyof T];
                } else {
                    target[key as keyof T] = value as T[keyof T];
                }

                // 调度更新
                scheduler.schedule(onChange);
            }

            return true;
        },

        get(target: T, key: string | symbol): unknown {
            // 支持 toJSON，让 JSON.stringify 使用原始对象，避免触发 Proxy trap 递归
            if (key === "toJSON") {
                return function () {
                    // 递归展开所有嵌套 Proxy，返回完全干净的对象
                    return unwrapProxy(obj);
                };
            }

            const value = target[key as keyof T];

            // 如果是数组，拦截数组变异方法
            if (
                isArray &&
                typeof key === "string" &&
                ARRAY_MUTATION_METHODS.includes(key as (typeof ARRAY_MUTATION_METHODS)[number])
            ) {
                return function (this: unknown, ...args: unknown[]) {
                    // 调用原始方法
                    const arrayMethod = Array.prototype[key as keyof Array<unknown>] as (
                        ...args: unknown[]
                    ) => unknown;
                    const result = arrayMethod.apply(target, args);

                    // 数组内容已改变，触发更新
                    scheduler.schedule(onChange);

                    return result;
                };
            }

            // 如果值是对象或数组，自动包装为响应式（支持嵌套对象）
            if (value != null && typeof value === "object") {
                // 先检查缓存，避免重复创建 Proxy
                // 如果对象已经在缓存中，直接返回缓存的 Proxy（使用相同的 onChange）
                if (proxyCache.has(value)) {
                    return proxyCache.get(value);
                }
                // 否则创建新的 Proxy
                return reactive(value, onChange);
            }

            return value;
        },

        has(target: T, key: string | symbol): boolean {
            return key in target;
        },
    });

    // 缓存 Proxy，避免重复创建
    proxyCache.set(obj, proxy);
    // 缓存反向映射：从 Proxy 到原始对象
    originalCache.set(proxy, obj);

    return proxy;
}

/**
 * 创建响应式状态钩子
 * 提供类似 useState 的 API
 *
 * @param initialValue 初始值
 * @param onChange 变化回调
 * @returns [getter, setter] 元组
 */
export function createState<T>(
    initialValue: T,
    onChange: ReactiveCallback
): [() => T, (value: T | ((prev: T) => T)) => void] {
    let currentValue = initialValue;

    const getter = (): T => currentValue;

    const setter = (value: T | ((prev: T) => T)): void => {
        const newValue =
            typeof value === "function" ? (value as (prev: T) => T)(currentValue) : value;

        if (currentValue !== newValue) {
            currentValue = newValue;
            scheduler.schedule(onChange);
        }
    };

    return [getter, setter];
}

/**
 * 开发模式下的调试工具
 */
export const ReactiveDebug = {
    /**
     * 启用调试模式
     */
    enable(): void {
        if (typeof window !== "undefined") {
            (window as Window & { __WSX_REACTIVE_DEBUG__?: boolean }).__WSX_REACTIVE_DEBUG__ = true;
        }
    },

    /**
     * 禁用调试模式
     */
    disable(): void {
        if (typeof window !== "undefined") {
            (window as Window & { __WSX_REACTIVE_DEBUG__?: boolean }).__WSX_REACTIVE_DEBUG__ =
                false;
        }
    },

    /**
     * 检查是否启用调试模式
     */
    isEnabled(): boolean {
        return (
            typeof window !== "undefined" &&
            (window as Window & { __WSX_REACTIVE_DEBUG__?: boolean }).__WSX_REACTIVE_DEBUG__ ===
                true
        );
    },

    /**
     * 调试日志
     */
    log(message: string, ...args: unknown[]): void {
        if (this.isEnabled()) {
            logger.info(`[WSX Reactive] ${message}`, ...args);
        }
    },
};

/**
 * 增强的 reactive 函数，带调试支持
 */
export function reactiveWithDebug<T extends object>(
    obj: T,
    onChange: ReactiveCallback,
    debugName?: string
): T {
    const name = debugName || obj.constructor.name || "Unknown";
    const isArray = Array.isArray(obj);

    return new Proxy(obj, {
        set(target: T, key: string | symbol, value: unknown): boolean {
            const oldValue = target[key as keyof T];

            if (oldValue !== value) {
                ReactiveDebug.log(`State change in ${name}:`, {
                    key: String(key),
                    oldValue,
                    newValue: value,
                });

                target[key as keyof T] = value as T[keyof T];
                scheduler.schedule(onChange);
            }

            return true;
        },

        get(target: T, key: string | symbol): unknown {
            // 支持 toJSON，让 JSON.stringify 使用原始对象，避免触发 Proxy trap 递归
            if (key === "toJSON") {
                return function () {
                    // 递归展开所有嵌套 Proxy，返回完全干净的对象
                    return unwrapProxy(obj);
                };
            }

            const value = target[key as keyof T];

            // 如果是数组，拦截数组变异方法
            if (
                isArray &&
                typeof key === "string" &&
                ARRAY_MUTATION_METHODS.includes(key as (typeof ARRAY_MUTATION_METHODS)[number])
            ) {
                return function (this: unknown, ...args: unknown[]) {
                    ReactiveDebug.log(`Array mutation in ${name}:`, {
                        method: key,
                        args,
                    });

                    // 调用原始方法
                    const arrayMethod = Array.prototype[key as keyof Array<unknown>] as (
                        ...args: unknown[]
                    ) => unknown;
                    const result = arrayMethod.apply(target, args);

                    // 数组内容已改变，触发更新
                    scheduler.schedule(onChange);

                    return result;
                };
            }

            // 如果值是对象或数组，自动包装为响应式（支持嵌套对象）
            if (value != null && typeof value === "object") {
                // 检查是否已经是响应式（通过检查是否有 Proxy 标记）
                // 简单检查：如果值已经是 Proxy，直接返回
                // 否则，递归包装为响应式
                return reactiveWithDebug(value, onChange, `${name}.${String(key)}`);
            }

            return value;
        },
    });
}
