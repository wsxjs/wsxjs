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
     * 包含从 rerender() 方法迁移的实际渲染逻辑
     * WebComponent 使用 Shadow DOM，不存在 JSX children 问题
     *
     * @override
     */
    protected _rerender(): void {
        if (!this.connected) {
            // 如果组件未连接，清除渲染标志
            this._isRendering = false;
            return;
        }

        // 1. 捕获焦点状态（在 DOM 替换之前）
        const focusState = this.captureFocusState();
        this._pendingFocusState = focusState;

        // 2. 保存当前的 adopted stylesheets 并检测实际的样式状态
        const adoptedStyleSheets = this.shadowRoot.adoptedStyleSheets || [];
        // 自动检测模式：检查实际的 ShadowRoot 样式状态，而不仅仅是保存的数组
        // 这样可以更准确地检测样式是否真的已应用
        const hasActualAdoptedStyles =
            this.shadowRoot.adoptedStyleSheets && this.shadowRoot.adoptedStyleSheets.length > 0;
        // 检查 fallback 模式的样式元素
        const hasFallbackStyleElement = Array.from(this.shadowRoot.children).some(
            (child) => child instanceof HTMLStyleElement
        );

        try {
            // 3. 自动检测模式：只有在没有实际样式时才重新应用样式
            // 检查 adoptedStyleSheets 和 fallback 样式元素
            if (!hasActualAdoptedStyles && !hasFallbackStyleElement) {
                const stylesToApply = this._autoStyles || this.config.styles;
                if (stylesToApply) {
                    const styleName = this.config.styleName || this.constructor.name;
                    StyleManager.applyStyles(this.shadowRoot, styleName, stylesToApply);
                }
            }

            // 4. 重新渲染JSX
            const content = RenderContext.runInContext(this, () => this.render());

            // 5. 在添加到 DOM 之前恢复值
            if (focusState && focusState.key && focusState.value !== undefined) {
                const target = content.querySelector(
                    `[data-wsx-key="${focusState.key}"]`
                ) as HTMLElement;

                if (target) {
                    if (
                        target instanceof HTMLInputElement ||
                        target instanceof HTMLTextAreaElement
                    ) {
                        target.value = focusState.value;
                    }
                }
            }

            // 6. 执行 DOM 操作（同步，不使用 RAF，因为已经在 scheduleRerender 的 RAF 中）
            // 关键修复 (RFC-0042)：检查 content 是否已经在 shadowRoot 中（元素复用场景）
            // 如果 content 已经在 shadowRoot 中，不需要再次添加
            // 这样可以避免移动元素，导致文本节点更新丢失
            const isContentAlreadyInShadowRoot = content.parentNode === this.shadowRoot;

            if (!isContentAlreadyInShadowRoot) {
                // 添加新内容（仅在不在 shadowRoot 中时）
                this.shadowRoot.appendChild(content);
            }

            // 移除旧内容（保留样式元素、未标记元素和新渲染的内容）
            // 关键修复 (RFC-0042): 使用 childNodes 而不是 children，确保文本节点也被清理
            // 否则，在 Shadow DOM 根部的文本节点会发生泄漏
            const oldNodes = Array.from(this.shadowRoot.childNodes).filter((child) => {
                // 保留新添加的内容（或已经在 shadowRoot 中的 content）
                if (child === content) {
                    return false;
                }
                // 保留样式元素
                if (child instanceof HTMLStyleElement) {
                    return false;
                }
                // 保留未标记的元素（第三方库注入的元素、自定义元素）
                // 对于文本节点，shouldPreserveElement 逻辑已在 element-marking.ts 中优化
                if (shouldPreserveElement(child)) {
                    return false;
                }
                return true;
            });
            oldNodes.forEach((node) => node.remove());

            // 7. 恢复 adopted stylesheets（在 DOM 操作之后，确保样式不被意外移除）
            // 关键修复：在 DOM 操作之后恢复样式，防止样式在 DOM 操作过程中被意外清空
            // 自动检测模式：检查实际的样式状态，确保样式正确恢复
            const hasStylesAfterDOM =
                this.shadowRoot.adoptedStyleSheets && this.shadowRoot.adoptedStyleSheets.length > 0;
            const hasStyleElementAfterDOM = Array.from(this.shadowRoot.children).some(
                (child) => child instanceof HTMLStyleElement
            );

            if (adoptedStyleSheets.length > 0) {
                // 恢复保存的 adoptedStyleSheets
                this.shadowRoot.adoptedStyleSheets = adoptedStyleSheets;
            } else if (!hasStylesAfterDOM && !hasStyleElementAfterDOM) {
                // 自动检测模式：如果 DOM 操作后没有样式，自动重新应用（防止样式丢失）
                // 关键修复：在元素复用场景中，如果 _autoStyles 存在但样式未应用，需要重新应用
                const stylesToApply = this._autoStyles || this.config.styles;
                if (stylesToApply) {
                    const styleName = this.config.styleName || this.constructor.name;
                    StyleManager.applyStyles(this.shadowRoot, styleName, stylesToApply);
                }
            }

            // 8. 恢复焦点状态并清除渲染标志
            this.restoreFocusState(focusState);
            this._pendingFocusState = null;

            // 9. 调用 onRendered 生命周期钩子
            this.onRendered?.();

            // 10. 清除渲染标志，允许后续的 scheduleRerender()
            this._isRendering = false;
        } catch (error) {
            logger.error("Error in _rerender:", error);
            this.renderError(error);
            // 即使出错也要清除渲染标志，允许后续的 scheduleRerender()
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
