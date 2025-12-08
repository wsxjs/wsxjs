/**
 * Light DOM WSX Web Component
 *
 * 专为Light DOM设计的Web Component基类：
 * - 不使用Shadow DOM，直接在组件内部渲染
 * - 样式注入到组件自身，避免全局污染
 * - 适用于需要与外部DOM交互的场景（如EditorJS）
 */

import { h, type JSXChildren } from "./jsx-factory";
import { reactive, createState, reactiveWithDebug } from "./utils/reactive";
import { createLogger } from "./utils/logger";

const logger = createLogger("LightComponent");

/**
 * Light DOM Component 配置接口
 */
export interface LightComponentConfig {
    styles?: string; // CSS内容
    styleName?: string; // 样式名称，用于缓存
    debug?: boolean; // 是否启用响应式调试模式
    [key: string]: unknown;
}

/**
 * Light DOM WSX Web Component 基类
 */
export abstract class LightComponent extends HTMLElement {
    protected config: LightComponentConfig;
    protected connected: boolean = false;
    private _isDebugEnabled: boolean = false;
    private _reactiveStates = new Map<string, any>();

    /**
     * 子类应该重写这个方法来定义观察的属性
     * @returns 要观察的属性名数组
     */
    static get observedAttributes(): string[] {
        return [];
    }

    constructor(config: LightComponentConfig = {}) {
        super();

        this.config = config;
        this._isDebugEnabled = config.debug ?? false;
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
            if (this.config.styles) {
                const styleName = this.config.styleName || this.constructor.name;
                this.applyScopedStyles(styleName, this.config.styles);
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
     * Web Component生命周期：属性变化
     */
    attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
        this.onAttributeChanged?.(name, oldValue, newValue);
    }

    /**
     * 可选生命周期钩子：组件已连接
     */
    protected onConnected?(): void;

    /**
     * 可选生命周期钩子：组件已断开
     */
    protected onDisconnected?(): void;

    /**
     * 可选生命周期钩子：属性已更改
     */
    protected onAttributeChanged?(name: string, oldValue: string, newValue: string): void;

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
     * 创建响应式对象
     *
     * @param obj 要变为响应式的对象
     * @param debugName 调试名称（可选）
     * @returns 响应式代理对象
     */
    protected reactive<T extends object>(obj: T, debugName?: string): T {
        const reactiveFn = this._isDebugEnabled ? reactiveWithDebug : reactive;
        const name = debugName || `${this.constructor.name}.reactive`;

        return this._isDebugEnabled
            ? reactiveFn(obj, () => this.scheduleRerender(), name)
            : reactiveFn(obj, () => this.scheduleRerender());
    }

    /**
     * 创建响应式状态
     *
     * @param key 状态标识符
     * @param initialValue 初始值
     * @returns [getter, setter] 元组
     */
    protected useState<T>(
        key: string,
        initialValue: T
    ): [() => T, (value: T | ((prev: T) => T)) => void] {
        if (!this._reactiveStates.has(key)) {
            const [getter, setter] = createState(initialValue, () => this.scheduleRerender());
            this._reactiveStates.set(key, { getter, setter });
        }

        const state = this._reactiveStates.get(key);
        return [state.getter, state.setter];
    }

    /**
     * 调度重渲染
     * 这个方法被响应式系统调用，开发者通常不需要直接调用
     */
    protected scheduleRerender(): void {
        // 确保组件已连接到 DOM
        if (this.connected) {
            this.rerender();
        }
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

        // 清空现有内容（包括样式元素）
        this.innerHTML = "";

        // 重新应用样式（必须在内容之前添加，确保样式优先）
        if (this.config.styles) {
            const styleName = this.config.styleName || this.constructor.name;
            // 直接创建并添加样式元素，不检查是否存在（因为 innerHTML = "" 已经清空了）
            const styleElement = document.createElement("style");
            styleElement.setAttribute("data-wsx-light-component", styleName);
            styleElement.textContent = this.config.styles;
            // 使用 prepend 或 insertBefore 确保样式在第一个位置
            // 由于 innerHTML = "" 后 firstChild 是 null，使用 appendChild 然后调整顺序
            this.appendChild(styleElement);
        }

        // 重新渲染JSX内容
        try {
            const content = this.render();
            this.appendChild(content);

            // 确保样式元素在内容之前（如果样式存在）
            if (this.config.styles && this.children.length > 1) {
                const styleElement = this.querySelector(
                    `style[data-wsx-light-component="${this.config.styleName || this.constructor.name}"]`
                );
                if (styleElement && styleElement !== this.firstChild) {
                    // 将样式元素移到第一个位置
                    this.insertBefore(styleElement, this.firstChild);
                }
            }
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
     * 获取配置值
     *
     * @param key - 配置键
     * @param defaultValue - 默认值
     * @returns 配置值
     */
    protected getConfig<T>(key: string, defaultValue?: T): T {
        return (this.config[key] as T) ?? (defaultValue as T);
    }

    /**
     * 设置配置值
     *
     * @param key - 配置键
     * @param value - 配置值
     */
    protected setConfig(key: string, value: unknown): void {
        this.config[key] = value;
    }

    /**
     * 清理响应式状态
     */
    private cleanupReactiveStates(): void {
        this._reactiveStates.clear();
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

    /**
     * 获取属性值
     *
     * @param name - 属性名
     * @param defaultValue - 默认值
     * @returns 属性值
     */
    protected getAttr(name: string, defaultValue = ""): string {
        return this.getAttribute(name) || defaultValue;
    }

    /**
     * 设置属性值
     *
     * @param name - 属性名
     * @param value - 属性值
     */
    protected setAttr(name: string, value: string): void {
        this.setAttribute(name, value);
    }

    /**
     * 移除属性
     *
     * @param name - 属性名
     */
    protected removeAttr(name: string): void {
        this.removeAttribute(name);
    }

    /**
     * 检查是否有属性
     *
     * @param name - 属性名
     * @returns 是否存在
     */
    protected hasAttr(name: string): boolean {
        return this.hasAttribute(name);
    }
}

// 导出JSX助手
export { h };
export type { JSXChildren };
