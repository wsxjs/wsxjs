/**
 * Light DOM WSX Web Component
 *
 * 专为Light DOM设计的Web Component基类：
 * - 不使用Shadow DOM，直接在组件内部渲染
 * - 样式注入到组件自身，避免全局污染
 * - 适用于需要与外部DOM交互的场景（如EditorJS）
 */

import { h, type JSXChildren } from "./jsx-factory";
import { BaseComponent, type BaseComponentConfig } from "./base-component";
import { RenderContext } from "./render-context";
import { createLogger } from "@wsxjs/wsx-logger";
import { updateProps, updateChildren } from "./utils/element-update";
import { shouldPreserveElement } from "./utils/element-marking";

const logger = createLogger("LightComponent");

/**
 * Light DOM Component 配置接口
 */
export type LightComponentConfig = BaseComponentConfig;

/**
 * Light DOM WSX Web Component 基类
 */
export abstract class LightComponent extends BaseComponent {
    protected config!: LightComponentConfig; // Initialized by BaseComponent constructor

    constructor(config: LightComponentConfig = {}) {
        super(config);
        // BaseComponent already created this.config with getter for styles
    }

    /**
     * 抽象方法：子类必须实现JSX渲染
     *
     * @returns JSX元素
     */
    abstract render(): HTMLElement | SVGElement;

    /**
     * Web Component生命周期：连接到DOM
     *
     * 渲染策略：
     * 1. 检查组件中是否已有实际内容（排除样式元素）
     * 2. 如果有内容且完整，跳过渲染（避免重复元素和性能优化）
     * 3. 如果没有内容或不完整，清空后重新渲染
     * 4. 样式元素需要保留
     */
    connectedCallback(): void {
        this.connected = true;
        try {
            // 应用CSS样式到组件自身
            // CRITICAL: _defineProperty for class properties executes AFTER super() but BEFORE constructor body
            // However, in practice, _defineProperty may execute AFTER the constructor body
            // So we need to check _autoStyles directly first, then fallback to config.styles getter
            // The getter will dynamically check _autoStyles when accessed
            const stylesToApply = this._autoStyles || this.config.styles;
            const styleName = this.config.styleName || this.constructor.name;
            if (stylesToApply) {
                this.applyScopedStyles(styleName, stylesToApply);
            }

            // 检查是否有实际内容（排除样式元素和 slot 元素）
            // 错误元素：如果存在错误信息，需要重新渲染以恢复正常
            // Slot 元素：不算"内容"，因为 slot 的内容在 Light DOM 中（通过 JSX children 传递）
            const styleElement = this.querySelector(
                `style[data-wsx-light-component="${styleName}"]`
            ) as HTMLStyleElement | null;
            const hasErrorElement = Array.from(this.children).some(
                (child) =>
                    child instanceof HTMLElement &&
                    child !== styleElement &&
                    child.style.color === "red" &&
                    child.textContent?.includes("Component Error")
            );
            // 排除样式元素和 slot 元素
            const hasActualContent = Array.from(this.children).some(
                (child) => child !== styleElement && !(child instanceof HTMLSlotElement)
            );

            // 调用子类的初始化钩子（无论是否渲染，都需要调用，因为组件已连接）
            this.onConnected?.();

            // 如果有错误元素，需要重新渲染以恢复正常
            // 如果有实际内容且没有错误，跳过渲染（避免重复元素）
            if (hasActualContent && !hasErrorElement) {
                // 已经有内容（JSX children），标记它们
                this.markJSXChildren(); // 标记 JSX children，以便在 _rerender() 中保留
                // 但确保样式元素在正确位置
                if (styleElement && styleElement !== this.firstChild) {
                    this.insertBefore(styleElement, this.firstChild);
                }
            } else {
                // 没有内容，需要渲染
                // 清空旧内容（保留样式元素）
                const childrenToRemove = Array.from(this.childNodes).filter(
                    (node) => node !== styleElement
                );
                childrenToRemove.forEach((node) => node.remove());

                // 渲染JSX内容到Light DOM
                const content = RenderContext.runInContext(this, () => this.render());
                this.appendChild(content);

                // 确保样式元素在第一个位置（如果存在）
                if (styleElement && styleElement !== this.firstChild) {
                    this.insertBefore(styleElement, this.firstChild);
                }
            }

            // 初始化事件监听器（无论是否渲染，都需要重新初始化，因为 DOM 可能被移动）
            this.initializeEventListeners();

            // 如果进行了渲染，调用 onRendered 钩子
            if (hasActualContent === false || hasErrorElement) {
                // 使用 requestAnimationFrame 确保 DOM 已完全更新
                requestAnimationFrame(() => {
                    this.onRendered?.();
                });
            }
        } catch (error) {
            logger.error(`[${this.constructor.name}] Error in connectedCallback:`, error);
            this.renderError(error);
        }
    }

    /**
     * Web Component生命周期：从DOM断开
     */
    disconnectedCallback(): void {
        this.connected = false;
        this.cleanup(); // 清理资源（包括防抖定时器）
        this.cleanupReactiveStates();
        this.cleanupStyles();
        this.onDisconnected?.();
    }

    /**
     * 查找组件内的元素
     *
     * @param selector - CSS选择器
     * @returns 元素或null
     */
    public querySelector<T extends HTMLElement>(selector: string): T | null {
        return HTMLElement.prototype.querySelector.call(this, selector) as T | null;
    }

    /**
     * 查找组件内的所有匹配元素
     *
     * @param selector - CSS选择器
     * @returns 元素列表
     */
    public querySelectorAll<T extends HTMLElement>(selector: string): NodeListOf<T> {
        return HTMLElement.prototype.querySelectorAll.call(this, selector) as NodeListOf<T>;
    }

    /**
     * 递归协调子元素
     * 更新现有子元素的属性和内容，而不是替换整个子树
     */
    /**
     * 内部重渲染实现
     * 包含从 rerender() 方法迁移的实际渲染逻辑
     * 处理 JSX children 的保留（Light DOM 特有）
     *
     * @override
     */
    protected _rerender(): void {
        if (!this.connected) {
            // 如果组件未连接，清除渲染标志
            this._isRendering = false;
            return;
        }

        // 1. (已移除) 捕获焦点状态
        // 根据 RFC 0061，手动焦点管理已被弃用，核心协调引擎现在负责通过 DOM 复用来保持焦点。

        // 2. 保存 JSX children（通过 JSX factory 直接添加的 children）
        // 这些 children 不是 render() 返回的内容，应该保留
        const jsxChildren = this.getJSXChildren();

        try {
            // 3. 重新渲染JSX内容
            const newContent = RenderContext.runInContext(this, () => this.render());

            // 5. 确保样式元素存在
            const stylesToApply = this._autoStyles || this.config.styles;
            const styleName = this.config.styleName || this.constructor.name;
            if (stylesToApply) {
                let styleElement = this.querySelector(
                    `style[data-wsx-light-component="${styleName}"]`
                ) as HTMLStyleElement;

                if (!styleElement) {
                    // 创建样式元素
                    styleElement = document.createElement("style");
                    styleElement.setAttribute("data-wsx-light-component", styleName);
                    styleElement.textContent = stylesToApply;
                    this.insertBefore(styleElement, this.firstChild);
                } else if (styleElement.textContent !== stylesToApply) {
                    // 更新样式内容
                    styleElement.textContent = stylesToApply;
                }
            }

            // 6. 执行 DOM 操作
            // 获取当前的 childNodes（包括文本节点，排除样式元素和 JSX children）
            const allShadowChildren = Array.from(this.childNodes);
            const oldChildren = allShadowChildren.filter((child) => {
                // 排除样式元素
                if (
                    stylesToApply &&
                    child instanceof HTMLStyleElement &&
                    child.getAttribute("data-wsx-light-component") === styleName
                ) {
                    return false;
                }
                // 排除 JSX children (RFC: 这里的 jsxChildren 现在包含 Text 节点)
                if (jsxChildren.includes(child as any)) {
                    return false;
                }
                // 排除保留元素 (RFC 0058)
                if (shouldPreserveElement(child)) {
                    return false;
                }
                return true;
            });

            // 7. True DOM Reconciliation (RFC 0058) for Light DOM
            // Similar to WebComponent but handling list of children directly

            // Case 1: Single Root => Single Root
            if (
                oldChildren.length === 1 &&
                newContent instanceof HTMLElement &&
                oldChildren[0] instanceof HTMLElement &&
                oldChildren[0].tagName === newContent.tagName
            ) {
                const oldRoot = oldChildren[0] as HTMLElement;
                const newRoot = newContent;

                if (oldRoot !== newRoot) {
                    const cacheManager = RenderContext.getDOMCache();
                    if (cacheManager) {
                        const oldMetadata = cacheManager.getMetadata(oldRoot);
                        const newMetadata = cacheManager.getMetadata(newRoot);
                        if (oldMetadata && newMetadata) {
                            updateProps(
                                oldRoot,
                                oldMetadata.props as Record<string, unknown>,
                                newMetadata.props as Record<string, unknown>,
                                oldRoot.tagName
                            );
                            updateChildren(
                                oldRoot,
                                oldMetadata.children as JSXChildren[],
                                newMetadata.children as JSXChildren[],
                                cacheManager
                            );
                        } else {
                            oldRoot.replaceWith(newRoot);
                        }
                    } else {
                        oldRoot.replaceWith(newRoot);
                    }
                }
            } else {
                // Case 2: Multi-root or mismatch
                // For now, doing smart replacement
                oldChildren.forEach((child) => child.remove());
                this.appendChild(newContent);
            }

            // 确保样式元素存在并在第一个位置 (re-verify)
            if (stylesToApply) {
                let styleEl = this.querySelector(
                    `style[data-wsx-light-component="${styleName}"]`
                ) as HTMLStyleElement | null;

                if (!styleEl) {
                    styleEl = document.createElement("style");
                    styleEl.setAttribute("data-wsx-light-component", styleName);
                    styleEl.textContent = stylesToApply;
                    this.insertBefore(styleEl, this.firstChild);
                } else if (styleEl !== this.firstChild) {
                    this.insertBefore(styleEl, this.firstChild);
                }
            }

            // 恢复焦点状态 (已根据 RFC 0061 移除)
            // this.restoreFocusState(focusState);
            // this._pendingFocusState = null;
            // 调用 onRendered 生命周期钩子
            this.onRendered?.();
            // 在 onRendered() 完成后清除渲染标志，允许后续的 scheduleRerender()
            this._isRendering = false;
        } catch (error) {
            logger.error(`[${this.constructor.name}] Error in _rerender:`, error);
            this.renderError(error);
            // 即使出错也要清除渲染标志，允许后续的 scheduleRerender()
            this._isRendering = false;
        }
    }

    /**
     * 获取 JSX children（通过 JSX factory 直接添加的 children）
     *
     * 在 Light DOM 中，JSX children 是通过 JSX factory 直接添加到组件元素的
     * 这些 children 不是 render() 返回的内容，应该保留
     */
    private getJSXChildren(): Node[] {
        // 在 connectedCallback 中标记的 JSX children
        // 使用 data 属性或内部属性标记
        const jsxChildren = Array.from(this.childNodes).filter((node) => {
            if (node instanceof HTMLElement) {
                return node.getAttribute("data-wsx-jsx-child") === "true";
            }
            if (node.nodeType === Node.TEXT_NODE) {
                return (node as Text & { __wsxJsxChild?: boolean }).__wsxJsxChild === true;
            }
            return false;
        });

        return jsxChildren;
    }

    /**
     * 标记 JSX children（在 connectedCallback 中调用）
     */
    private markJSXChildren(): void {
        // 在 connectedCallback 中，如果 hasActualContent 为 true
        // 说明这些 children 是 JSX children，不是 render() 返回的内容
        // 标记它们，以便在 _rerender() 中保留
        const styleName = this.config.styleName || this.constructor.name;
        const styleElement = this.querySelector(
            `style[data-wsx-light-component="${styleName}"]`
        ) as HTMLStyleElement | null;

        Array.from(this.childNodes).forEach((node) => {
            if (node !== styleElement && !(node instanceof HTMLSlotElement)) {
                if (node instanceof HTMLElement) {
                    node.setAttribute("data-wsx-jsx-child", "true");
                } else if (node.nodeType === Node.TEXT_NODE) {
                    (node as Text & { __wsxManaged?: boolean }).__wsxManaged = true;
                    // For text nodes, we also use a custom property to identify them as JSX children
                    (node as Text & { __wsxJsxChild?: boolean }).__wsxJsxChild = true;
                }
            }
        });
    }

    /**
     * 渲染错误信息
     *
     * @param error - 错误对象
     */
    private renderError(error: unknown): void {
        // 清空现有内容
        // Note: innerHTML is used here for framework-level error handling
        // This is an exception to the no-inner-html rule for framework code
        this.innerHTML = "";

        const errorElement = h(
            "div",
            {
                style: "color: red; padding: 10px; border: 1px solid red; background: #ffe6e6; font-family: monospace;",
            },
            [
                h("strong", {}, `[${this.constructor.name}] Component Error:`),
                h("pre", { style: "margin: 10px 0; white-space: pre-wrap;" }, String(error)),
            ]
        );

        this.appendChild(errorElement);
    }

    /**
     * 为Light DOM组件应用样式
     * 直接将样式注入到组件自身，避免全局污染
     */
    private applyScopedStyles(styleName: string, cssText: string): void {
        // 检查是否已经有该样式
        const existingStyle = this.querySelector(`style[data-wsx-light-component="${styleName}"]`);
        if (existingStyle) {
            return; // 已经存在，不重复添加
        }

        // 创建样式标签并添加到组件自身
        const styleElement = document.createElement("style");
        styleElement.setAttribute("data-wsx-light-component", styleName);
        styleElement.textContent = cssText;

        // 将样式元素添加为第一个子元素，确保样式优先加载
        this.insertBefore(styleElement, this.firstChild);
    }

    /**
     * 清理组件样式
     */
    private cleanupStyles(): void {
        const styleName = this.config.styleName || this.constructor.name;
        const existingStyle = this.querySelector(`style[data-wsx-light-component="${styleName}"]`);
        if (existingStyle) {
            existingStyle.remove();
        }
    }
}

// 导出JSX助手
export { h };
export type { JSXChildren };
