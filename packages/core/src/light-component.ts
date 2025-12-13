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
import { createLogger } from "./utils/logger";

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
    abstract render(): HTMLElement;

    /**
     * Web Component生命周期：连接到DOM
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
            if (stylesToApply) {
                const styleName = this.config.styleName || this.constructor.name;
                this.applyScopedStyles(styleName, stylesToApply);
            }

            // 渲染JSX内容到Light DOM
            const content = this.render();
            this.appendChild(content);

            // 初始化事件监听器
            this.initializeEventListeners();

            // 调用子类的初始化钩子
            this.onConnected?.();
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
     * 重新渲染组件
     */
    protected rerender(): void {
        if (!this.connected) {
            logger.warn(
                `[${this.constructor.name}] Component is not connected, skipping rerender.`
            );
            return;
        }

        // 1. 捕获焦点状态（在 DOM 替换之前）
        const focusState = this.captureFocusState();
        // 保存到实例变量，供 render() 使用（如果需要）
        this._pendingFocusState = focusState;

        try {
            // 重新渲染JSX内容
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

            // 确保样式元素存在
            const stylesToApply = this._autoStyles || this.config.styles;
            if (stylesToApply) {
                const styleName = this.config.styleName || this.constructor.name;
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

            // 使用 requestAnimationFrame 批量执行 DOM 操作，减少重绘
            // 在同一帧中完成添加和移除，避免中间状态
            requestAnimationFrame(() => {
                // 先添加新内容
                this.appendChild(content);

                // 立即移除旧内容（在同一帧中，浏览器会批量处理）
                const oldChildren = Array.from(this.children).filter((child) => {
                    // 保留新添加的内容
                    if (child === content) {
                        return false;
                    }
                    // 保留样式元素（如果存在）
                    if (
                        stylesToApply &&
                        child instanceof HTMLStyleElement &&
                        child.getAttribute("data-wsx-light-component") ===
                            (this.config.styleName || this.constructor.name)
                    ) {
                        return false;
                    }
                    return true;
                });
                oldChildren.forEach((child) => child.remove());

                // 确保样式元素在第一个位置
                if (stylesToApply && this.children.length > 1) {
                    const styleElement = this.querySelector(
                        `style[data-wsx-light-component="${this.config.styleName || this.constructor.name}"]`
                    );
                    if (styleElement && styleElement !== this.firstChild) {
                        this.insertBefore(styleElement, this.firstChild);
                    }
                }

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
            logger.error(`[${this.constructor.name}] Error in rerender:`, error);
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
