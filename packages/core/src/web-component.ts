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
import { createLogger } from "./utils/logger";

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

            // 如果有错误元素，需要重新渲染以恢复正常
            // 如果有实际内容且没有错误，跳过渲染（避免重复元素）
            if (hasActualContent && !hasErrorElement) {
                // 已经有内容且没有错误，跳过渲染（避免重复元素）
                // 样式已在上方应用（StyleManager.applyStyles 是幂等的）
                // Slot 元素已存在，浏览器会自动将 Light DOM 中的内容分配到 slot
            } else {
                // 没有内容，需要渲染
                // 清空 Shadow DOM（包括可能的旧内容）
                this.shadowRoot.innerHTML = "";

                // 重新应用样式（因为上面清空了）
                if (stylesToApply) {
                    const styleName = this.config.styleName || this.constructor.name;
                    StyleManager.applyStyles(this.shadowRoot, styleName, stylesToApply);
                }

                // 渲染JSX内容到Shadow DOM
                // render() 应该返回包含 slot 元素的内容（如果需要）
                // 浏览器会自动将 Light DOM 中的内容分配到 slot
                const content = this.render();
                this.shadowRoot.appendChild(content);
            }

            // 初始化事件监听器
            this.initializeEventListeners();

            // 调用子类的初始化钩子
            this.onConnected?.();
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
     * 重新渲染组件
     */
    protected rerender(): void {
        if (!this.connected) {
            logger.warn("Component is not connected, skipping rerender.");
            return;
        }

        // 1. 捕获焦点状态（在 DOM 替换之前）
        const focusState = this.captureFocusState();
        // 保存到实例变量，供 render() 使用（如果需要）
        this._pendingFocusState = focusState;

        // 保存当前的 adopted stylesheets (jsdom may not support this)
        const adoptedStyleSheets = this.shadowRoot.adoptedStyleSheets || [];

        try {
            // 只有在没有 adopted stylesheets 时才重新应用样式
            // Check both _autoStyles getter and config.styles getter
            if (adoptedStyleSheets.length === 0) {
                const stylesToApply = this._autoStyles || this.config.styles;
                if (stylesToApply) {
                    const styleName = this.config.styleName || this.constructor.name;
                    StyleManager.applyStyles(this.shadowRoot, styleName, stylesToApply);
                }
            }

            // 重新渲染JSX
            const content = this.render();

            // 在添加到 DOM 之前恢复值，避免浏览器渲染状态值
            // 这样可以确保值在元素添加到 DOM 之前就是正确的
            if (focusState && focusState.key && focusState.value !== undefined) {
                // 在 content 树中查找目标元素
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

            // 恢复 adopted stylesheets (避免重新应用样式)
            if (this.shadowRoot.adoptedStyleSheets) {
                this.shadowRoot.adoptedStyleSheets = adoptedStyleSheets;
            }

            // 使用 requestAnimationFrame 批量执行 DOM 操作，减少重绘
            // 在同一帧中完成添加和移除，避免中间状态
            requestAnimationFrame(() => {
                // 先添加新内容
                this.shadowRoot.appendChild(content);

                // 立即移除旧内容（在同一帧中，浏览器会批量处理）
                const oldChildren = Array.from(this.shadowRoot.children).filter(
                    (child) => child !== content
                );
                oldChildren.forEach((child) => child.remove());

                // 恢复焦点状态（在 DOM 替换之后）
                // 值已经在添加到 DOM 之前恢复了，这里只需要恢复焦点和光标位置
                // 使用另一个 requestAnimationFrame 确保 DOM 已完全更新
                requestAnimationFrame(() => {
                    this.restoreFocusState(focusState);
                    // 清除待处理的焦点状态
                    this._pendingFocusState = null;
                });
            });
        } catch (error) {
            logger.error("Error in rerender:", error);
            this.renderError(error);
        }
    }

    /**
     * 渲染错误信息
     *
     * @param error - 错误对象
     */
    private renderError(error: unknown): void {
        // 清空现有内容
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
