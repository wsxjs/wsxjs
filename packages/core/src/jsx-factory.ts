/**
 * 纯原生JSX工厂 - 零依赖的EditorJS Web Component支持
 *
 * 特点：
 * - 完全独立，不依赖React或任何框架
 * - 支持标准JSX语法
 * - 原生DOM操作，性能优异
 * - 完全通用，适用于任何Web Components
 * - TypeScript类型安全
 */

// JSX 类型声明已移至 types/wsx-types.d.ts

import { flattenChildren, type JSXChildren } from "./utils/dom-utils";
import { generateCacheKey, getComponentId } from "./utils/cache-key";
import { markElement } from "./utils/element-marking";
import { RenderContext } from "./render-context";
import { createElementWithPropsAndChildren } from "./utils/element-creation";
import { updateElement } from "./utils/element-update";
import type { BaseComponent } from "./base-component";
import type { DOMCacheManager } from "./dom-cache-manager";
import { createLogger } from "./utils/logger";
const logger = createLogger("JSX Factory");
// JSX子元素类型（从 dom-utils 重新导出以保持向后兼容）
export type { JSXChildren } from "./utils/dom-utils";

/**
 * 纯原生JSX工厂函数
 *
 * @param tag - HTML标签名或组件函数
 * @param props - 属性对象
 * @param children - 子元素
 * @returns DOM元素
 */
export function h(
    tag:
        | string
        | ((
              props: Record<string, unknown> | null,
              children: JSXChildren[]
          ) => HTMLElement | SVGElement),
    props: Record<string, unknown> | null = {},
    ...children: JSXChildren[]
): HTMLElement | SVGElement {
    // 处理组件函数（不受缓存影响）
    if (typeof tag === "function") {
        return tag(props, children);
    }

    // 检查上下文（阶段 3.2：启用缓存机制）
    const context = RenderContext.getCurrentComponent();
    const cacheManager = context ? RenderContext.getDOMCache() : null;

    if (context && cacheManager) {
        return tryUseCacheOrCreate(tag, props, children, context, cacheManager);
    }

    // 无上下文：使用旧逻辑（向后兼容）
    // 关键修复：即使没有上下文，也要标记元素，以便框架能够正确管理它
    // 否则，未标记的元素会被 shouldPreserveElement() 保留，导致重复元素
    // 调试日志：记录上下文丢失的情况，帮助定位问题（仅在开发环境输出）
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nodeEnv = (typeof (globalThis as any).process !== "undefined" &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (globalThis as any).process.env?.NODE_ENV) as string | undefined;
        if (nodeEnv === "development") {
            if (!context) {
                logger.debug(
                    `h() called without render context. Tag: "${tag}", ComponentId: "${getComponentId()}"`,
                    {
                        tag,
                        props: props ? Object.keys(props) : [],
                        hasCacheManager: !!cacheManager,
                    }
                );
            } else if (!cacheManager) {
                logger.debug(
                    `h() called with context but no cache manager. Tag: "${tag}", Component: "${context.constructor.name}"`,
                    {
                        tag,
                        component: context.constructor.name,
                    }
                );
            }
        }
    } catch {
        // 忽略环境变量检查错误
    }

    const element = createElementWithPropsAndChildren(tag, props, children);
    // 生成一个简单的 cache key（即使没有上下文）
    const componentId = getComponentId();
    const cacheKey = generateCacheKey(tag, props, componentId, context || undefined);
    markElement(element, cacheKey);
    return element;
}

/**
 * Tries to use cached element or creates a new one.
 */
function tryUseCacheOrCreate(
    tag: string,
    props: Record<string, unknown> | null,
    children: JSXChildren[],
    context: BaseComponent,
    cacheManager: DOMCacheManager
): HTMLElement | SVGElement {
    try {
        const componentId = getComponentId();
        const cacheKey = generateCacheKey(tag, props, componentId, context);
        const cachedElement = cacheManager.get(cacheKey);

        if (cachedElement) {
            // ✅ 缓存命中：复用元素并更新内容（阶段 4：细粒度更新）
            // 缓存键已经确保了唯一性（componentId + tag + position/key/index）
            // 不需要再检查标签名（可能导致错误复用）
            const element = cachedElement as HTMLElement | SVGElement;

            updateElement(element, props, children, tag, cacheManager);

            // 关键修复（RFC-0039）：检测自定义元素（Web Components）并重新触发生命周期
            // 自定义元素有 connectedCallback 和 disconnectedCallback 方法
            // 当它们被缓存复用时，需要模拟断开/重连以触发初始化逻辑
            // 这确保了即使组件缺少 super.onConnected() 调用，框架层面也能保证正确的生命周期
            const isCustomElement = tag.includes("-") && customElements.get(tag);
            if (isCustomElement && element.isConnected) {
                // 临时从 DOM 断开以触发 disconnectedCallback
                const parent = element.parentNode;
                if (parent) {
                    parent.removeChild(element);
                    // disconnectedCallback 会在 removeChild 时自动调用

                    // 立即重新添加以触发 connectedCallback
                    // 这确保生命周期在返回元素之前就已经完成
                    parent.appendChild(element);
                    // connectedCallback 会在 appendChild 时自动调用
                }
            }

            return element;
        }

        // ❌ 缓存未命中：创建新元素
        const element = createElementWithPropsAndChildren(tag, props, children);
        cacheManager.set(cacheKey, element);
        markElement(element, cacheKey);
        // 保存初始元数据（用于下次更新）
        cacheManager.setMetadata(element, {
            props: props || {},
            children: children,
        });
        return element;
    } catch (error) {
        // 缓存失败：降级到创建新元素
        return handleCacheError(error, tag, props, children);
    }
}

/**
 * Handles cache errors by logging and falling back to creating a new element.
 */
function handleCacheError(
    error: unknown,
    tag: string,
    props: Record<string, unknown> | null,
    children: JSXChildren[]
): HTMLElement | SVGElement {
    // 在开发环境输出警告，帮助调试
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nodeEnv = (typeof (globalThis as any).process !== "undefined" &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (globalThis as any).process.env?.NODE_ENV) as string | undefined;
        if (nodeEnv === "development") {
            logger.warn("[WSX DOM Cache] Cache error, falling back to create new element:", error);
        }
    } catch {
        // 忽略环境变量检查错误
    }
    // 关键修复：即使缓存失败，也要标记元素，以便框架能够正确管理它
    const element = createElementWithPropsAndChildren(tag, props, children);
    const context = RenderContext.getCurrentComponent();
    const componentId = getComponentId();
    const cacheKey = generateCacheKey(tag, props, componentId, context || undefined);
    markElement(element, cacheKey);
    return element;
}

/**
 * JSX Fragment支持 - 用于包装多个子元素
 */
export function Fragment(_props: unknown, children: JSXChildren[]): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const flatChildren = flattenChildren(children);

    flatChildren.forEach((child) => {
        if (child === null || child === undefined || child === false) {
            return;
        }

        if (typeof child === "string" || typeof child === "number") {
            fragment.appendChild(document.createTextNode(String(child)));
        } else if (child instanceof HTMLElement || child instanceof SVGElement) {
            fragment.appendChild(child);
        } else if (child instanceof DocumentFragment) {
            fragment.appendChild(child);
        }
    });

    return fragment;
}

/**
 * JSX function for React's new JSX transform
 * Handles the new format: jsx(tag, { children: child, ...props })
 */
export function jsx(
    tag:
        | string
        | ((
              props: Record<string, unknown> | null,
              children: JSXChildren[]
          ) => HTMLElement | SVGElement),
    props: Record<string, unknown> | null
): HTMLElement | SVGElement {
    if (!props) {
        return h(tag, null);
    }

    const { children, ...restProps } = props;
    if (children !== undefined && children !== null) {
        const childrenArray = Array.isArray(children) ? children : [children];
        return h(tag, restProps, ...childrenArray);
    }
    return h(tag, restProps);
}

/**
 * JSX function for multiple children in React's new JSX transform
 * Handles the new format: jsxs(tag, { children: [child1, child2], ...props })
 */
export function jsxs(
    tag:
        | string
        | ((
              props: Record<string, unknown> | null,
              children: JSXChildren[]
          ) => HTMLElement | SVGElement),
    props: Record<string, unknown> | null
): HTMLElement | SVGElement {
    if (!props) {
        return h(tag, null);
    }

    const { children, ...restProps } = props;
    if (Array.isArray(children)) {
        return h(tag, restProps, ...children);
    } else if (children !== undefined && children !== null) {
        return h(tag, restProps, children as JSXChildren);
    }
    return h(tag, restProps);
}
