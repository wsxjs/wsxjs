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
    abstract render(): HTMLElement;

    /**
     * Web Component生命周期：连接到DOM
     */
    connectedCallback(): void {
        this.connected = true;
        try {
            // 应用CSS样式到Shadow DOM
            // Check both _autoStyles getter and config.styles getter
            const stylesToApply = this._autoStyles || this.config.styles;
            if (stylesToApply) {
                const styleName = this.config.styleName || this.constructor.name;
                StyleManager.applyStyles(this.shadowRoot, styleName, stylesToApply);
            }

            // 渲染JSX内容到Shadow DOM
            const content = this.render();
            this.shadowRoot.appendChild(content);

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
