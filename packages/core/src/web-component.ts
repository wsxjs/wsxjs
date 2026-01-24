/**
 * 通用 WSX Web Component 基础抽象类
 *
 * 提供JSX + CSS文件支持的通用基础类：
 * - 抽象render方法强制子类实现JSX渲染
 * - 自动集成StyleManager处理外部CSS
 * - 提供完整的Web Component生命周期
 * - 完全通用，不依赖任何特定框架
 */

import { h, type JSXChildren } from "./jsx-factory";
import { StyleManager } from "./styles/style-manager";
import { BaseComponent, type BaseComponentConfig } from "./base-component";
import { RenderContext } from "./render-context";
import { shouldPreserveElement } from "./utils/element-marking";
import { updateProps, updateChildren } from "./utils/element-update";
import { createLogger } from "@wsxjs/wsx-logger";

const logger = createLogger("WebComponent");

/**
 * Web Component 配置接口
 */
export type WebComponentConfig = BaseComponentConfig;

/**
 * 通用 WSX Web Component 基础抽象类
 */
export abstract class WebComponent extends BaseComponent {
    declare shadowRoot: ShadowRoot;
    protected config!: WebComponentConfig; // Initialized by BaseComponent constructor

    constructor(config: WebComponentConfig = {}) {
        super(config);
        // BaseComponent already created this.config with getter for styles
        this.attachShadow({ mode: "open" });
        // Styles are applied in connectedCallback for consistency with LightComponent
        // and to ensure all class properties (including getters) are initialized
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
     * 1. 检查 Shadow DOM 中是否已有实际内容（排除样式和 slot）
     * 2. 如果有内容，先清空再渲染（避免重复元素）
     * 3. 如果没有内容，直接渲染
     * 4. Slot 元素会被重新添加，浏览器会自动将 Light DOM 中的内容分配到 slot
     */
    connectedCallback(): void {
        this.connected = true;
        try {
            // 应用CSS样式到Shadow DOM（先应用，因为样式可能使用 fallback 添加 style 元素）
            const stylesToApply = this._autoStyles || this.config.styles;
            if (stylesToApply) {
                const styleName = this.config.styleName || this.constructor.name;
                StyleManager.applyStyles(this.shadowRoot, styleName, stylesToApply);
            }

            // 检查是否有实际内容（排除样式和 slot）
            // 样式元素：可能由 StyleManager fallback 添加
            // Slot 元素：不算"内容"，因为 slot 的内容在 Light DOM 中
            // 错误元素：如果存在错误信息，需要重新渲染以恢复正常
            const allChildren = Array.from(this.shadowRoot.children);
            const styleElements = allChildren.filter((child) => child instanceof HTMLStyleElement);
            const slotElements = allChildren.filter((child) => child instanceof HTMLSlotElement);
            const hasErrorElement = allChildren.some(
                (child) =>
                    child instanceof HTMLElement &&
                    child.style.color === "red" &&
                    child.textContent?.includes("Component Error")
            );
            const hasActualContent =
                allChildren.length > styleElements.length + slotElements.length;

            // 调用子类的初始化钩子
            this.onConnected?.();

            // 如果有错误元素，需要重新渲染以恢复正常
            // 如果有实际内容且没有错误，跳过渲染（避免重复元素）
            if (hasActualContent && !hasErrorElement) {
                // 已经有内容且没有错误，跳过渲染（避免重复元素）
                // 样式已在上方应用（StyleManager.applyStyles 是幂等的）
                // Slot 元素已存在，浏览器会自动将 Light DOM 中的内容分配到 slot
            } else {
                // 没有内容，需要渲染
                // 清空 Shadow DOM（包括可能的旧内容）
                // Note: innerHTML is used here for framework-level DOM management
                // This is an exception to the no-inner-html rule for framework code
                this.shadowRoot.innerHTML = "";

                // 重新应用样式（因为上面清空了）
                if (stylesToApply) {
                    const styleName = this.config.styleName || this.constructor.name;
                    StyleManager.applyStyles(this.shadowRoot, styleName, stylesToApply);
                }

                // 渲染JSX内容到Shadow DOM
                // render() 应该返回包含 slot 元素的内容（如果需要）
                // 浏览器会自动将 Light DOM 中的内容分配到 slot
                // 关键修复：使用 RenderContext.runInContext() 确保 h() 能够获取上下文
                // 否则，首次渲染时创建的元素不会被标记 __wsxCacheKey，导致重复元素问题
                const content = RenderContext.runInContext(this, () => this.render());
                this.shadowRoot.appendChild(content);
            }

            // 初始化事件监听器
            this.initializeEventListeners();

            // 如果进行了渲染，调用 onRendered 钩子
            if (hasActualContent === false || hasErrorElement) {
                // 使用 requestAnimationFrame 确保 DOM 已完全更新
                requestAnimationFrame(() => {
                    this.onRendered?.();
                });
            }
        } catch (error) {
            logger.error(`Error in connectedCallback:`, error);
            this.renderError(error);
        }
    }

    /**
     * Web Component生命周期：从DOM断开
     */
    disconnectedCallback(): void {
        this.connected = false;
        this.cleanup(); // 清理资源（包括防抖定时器）
        this.onDisconnected?.();
    }

    /**
     * 查找Shadow DOM内的元素
     *
     * @param selector - CSS选择器
     * @returns 元素或null
     */
    public querySelector<T extends HTMLElement>(selector: string): T | null {
        return this.shadowRoot.querySelector<T>(selector);
    }

    /**
     * 查找Shadow DOM内的所有匹配元素
     *
     * @param selector - CSS选择器
     * @returns 元素列表
     */
    public querySelectorAll<T extends HTMLElement>(selector: string): NodeListOf<T> {
        return this.shadowRoot.querySelectorAll<T>(selector);
    }

    /**
     * 内部重渲染实现
     * 使用真实 DOM 协调 (RFC 0058) 替代全量替换
     *
     * 策略：
     * 1. 尝试原地更新 (Reconciliation)
     * 2. 只有在结构完全不匹配时才回退到替更新
     *
     * @override
     */
    protected _rerender(): void {
        if (!this.connected) {
            this._isRendering = false;
            return;
        }

        // 1. (已移除) 捕获焦点状态
        // 根据 RFC 0061，手动焦点管理已被弃用。

        // 2. Render new content
        const content = RenderContext.runInContext(this, () => this.render());

        try {
            // 3. Get existing content (excluding styles and preserved elements)
            const allChildren = Array.from(this.shadowRoot.childNodes);
            const oldChildren = allChildren.filter((child) => {
                if (child instanceof HTMLStyleElement) return false;
                if (shouldPreserveElement(child)) return false;
                return true;
            });

            // 4. Try Reconciliation (Single Root Optimization)
            // Most components render a single root element
            if (
                oldChildren.length === 1 &&
                oldChildren[0] instanceof HTMLElement &&
                content instanceof HTMLElement &&
                oldChildren[0].tagName === content.tagName
            ) {
                const oldRoot = oldChildren[0] as HTMLElement;
                const newRoot = content as HTMLElement;

                // 4.1 Check Instance Equality
                // If h() returned the same instance (cached), it already updated it!
                if (oldRoot === newRoot) {
                    // h() in render() already called updateElement, which updated props and children.
                    // We only need to ensure styles are correct.
                } else {
                    // 4.2 Different Instance, Same Tag -> Sync intelligently
                    // We use the framework's update logic to sync the oldRoot to the newRoot's state
                    // This preserves the oldRoot's identity (focus, scroll) while giving it the new state

                    const cacheManager = RenderContext.getDOMCache();
                    if (cacheManager) {
                        const oldMetadata = cacheManager.getMetadata(oldRoot);
                        const newMetadata = cacheManager.getMetadata(newRoot);

                        if (oldMetadata && newMetadata) {
                            // Use framework core update logic
                            updateProps(
                                oldRoot,
                                oldMetadata.props as any,
                                newMetadata.props as any,
                                oldRoot.tagName
                            );
                            updateChildren(
                                oldRoot,
                                oldMetadata.children as any,
                                newMetadata.children as any,
                                cacheManager
                            );

                            // DISCARD newRoot as we've synced oldRoot to replace it
                            // But we should NOT destroy it yet, just don't use it.
                        } else {
                            // Fallback to manual sync or replacement if metadata missing
                            oldRoot.replaceWith(newRoot);
                        }
                    } else {
                        oldRoot.replaceWith(newRoot);
                    }
                }

                // 4.3 Check styles (auto-detect)
                const hasStylesOriginal =
                    (this.shadowRoot.adoptedStyleSheets &&
                        this.shadowRoot.adoptedStyleSheets.length > 0) ||
                    Array.from(this.shadowRoot.childNodes).some(
                        (c) => c instanceof HTMLStyleElement
                    );

                if (!hasStylesOriginal) {
                    const stylesToApply = this._autoStyles || this.config.styles;
                    if (stylesToApply) {
                        const styleName = this.config.styleName || this.constructor.name;
                        StyleManager.applyStyles(this.shadowRoot, styleName, stylesToApply);
                    }
                }
            } else {
                // 5. Fallback: Full Replacement (for Fragment root or type mismatch)
                // This mimics the old "Nuke & Pave" but strictly for the content part

                // Remove old content
                oldChildren.forEach((child) => child.remove());

                // Append new content
                if (content.parentNode !== this.shadowRoot) {
                    this.shadowRoot.appendChild(content);
                }

                // Restore styles if missing
                const hasStylesAfter =
                    (this.shadowRoot.adoptedStyleSheets &&
                        this.shadowRoot.adoptedStyleSheets.length > 0) ||
                    Array.from(this.shadowRoot.children).some((c) => c instanceof HTMLStyleElement);

                if (!hasStylesAfter) {
                    const stylesToApply = this._autoStyles || this.config.styles;
                    if (stylesToApply) {
                        const styleName = this.config.styleName || this.constructor.name;
                        StyleManager.applyStyles(this.shadowRoot, styleName, stylesToApply);
                    }
                }
            }

            // 6. (已移除) 恢复焦点状态
            // 根据 RFC 0061，手动焦点管理已被弃用。
            // if (this._pendingFocusState) {
            //    this.restoreFocusState(this._pendingFocusState);
            //    this._pendingFocusState = null;
            // }

            this.onRendered?.();
            this._isRendering = false;
        } catch (error) {
            logger.error("Error in _rerender:", error);
            this.renderError(error);
            this._isRendering = false;
        }
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
        this.shadowRoot.innerHTML = "";

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

        this.shadowRoot.appendChild(errorElement);
    }
}

// 导出JSX助手
export { h };
export type { JSXChildren };
