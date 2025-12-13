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

        // 清空现有内容（包括样式元素）
        this.innerHTML = "";

        // 重新应用样式（必须在内容之前添加，确保样式优先）
        const stylesToApply = this._autoStyles || this.config.styles;
        if (stylesToApply) {
            const styleName = this.config.styleName || this.constructor.name;
            // 直接创建并添加样式元素，不检查是否存在（因为 innerHTML = "" 已经清空了）
            const styleElement = document.createElement("style");
            styleElement.setAttribute("data-wsx-light-component", styleName);
            styleElement.textContent = stylesToApply;
            // 使用 prepend 或 insertBefore 确保样式在第一个位置
            // 由于 innerHTML = "" 后 firstChild 是 null，使用 appendChild 然后调整顺序
            this.appendChild(styleElement);
        }

        // 重新渲染JSX内容
        try {
            const content = this.render();

            // 在 appendChild 之前恢复值，避免浏览器渲染状态值
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

            this.appendChild(content);

            // 确保样式元素在内容之前（如果样式存在）
            if (stylesToApply && this.children.length > 1) {
                const styleElement = this.querySelector(
                    `style[data-wsx-light-component="${this.config.styleName || this.constructor.name}"]`
                );
                if (styleElement && styleElement !== this.firstChild) {
                    // 将样式元素移到第一个位置
                    this.insertBefore(styleElement, this.firstChild);
                }
            }

            // 2. 恢复焦点状态（在 DOM 替换之后）
            // 值已经在 appendChild 之前恢复了，这里只需要恢复焦点和光标位置
            this.restoreFocusState(focusState);

            // 清除待处理的焦点状态
            this._pendingFocusState = null;
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
