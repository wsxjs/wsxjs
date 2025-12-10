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
import { reactive as createReactive, createState, reactiveWithDebug } from "./utils/reactive";

/**
 * Web Component 配置接口
 */
export interface WebComponentConfig {
    styles?: string; // CSS内容
    styleName?: string; // 样式名称，用于缓存
    debug?: boolean; // 是否启用响应式调试模式
    preserveFocus?: boolean; // 是否在重渲染时保持焦点
    [key: string]: unknown;
}

/**
 * Type for reactive state storage
 */
interface ReactiveStateStorage {
    getter: () => unknown;
    setter: (value: unknown | ((prev: unknown) => unknown)) => void;
}

/**
 * Type for focus data saved during rerender
 */
interface FocusData {
    tagName: string;
    className: string;
    value?: string;
    selectionStart?: number;
    selectionEnd?: number;
}

/**
 * 通用 WSX Web Component 基础抽象类
 */
export abstract class WebComponent extends HTMLElement {
    declare shadowRoot: ShadowRoot;
    protected config: WebComponentConfig;
    protected connected: boolean = false;
    private _isDebugEnabled: boolean = false;
    private _preserveFocus: boolean = true;
    private _reactiveStates = new Map<string, ReactiveStateStorage>();

    /**
     * 子类应该重写这个方法来定义观察的属性
     * @returns 要观察的属性名数组
     */
    static get observedAttributes(): string[] {
        return [];
    }

    constructor(config: WebComponentConfig = {}) {
        super();

        this.config = config;
        this._isDebugEnabled = config.debug ?? false;
        this._preserveFocus = config.preserveFocus ?? true;
        this.attachShadow({ mode: "open" });

        // 自动应用CSS样式
        if (config.styles) {
            const styleName = config.styleName || this.constructor.name;
            StyleManager.applyStyles(this.shadowRoot, styleName, config.styles);
        }
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
            // 渲染JSX内容到Shadow DOM
            const content = this.render();
            this.shadowRoot.appendChild(content);

            // 调用子类的初始化钩子
            this.onConnected?.();
        } catch (error) {
            console.error(`[${this.constructor.name}] Error in connectedCallback:`, error);
            this.renderError(error);
        }
    }

    /**
     * Web Component生命周期：从DOM断开
     */
    disconnectedCallback(): void {
        this.connected = false;
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
     * 创建响应式对象
     *
     * @param obj 要变为响应式的对象
     * @param debugName 调试名称（可选）
     * @returns 响应式代理对象
     */
    protected reactive<T extends object>(obj: T, debugName?: string): T {
        const reactiveFn = this._isDebugEnabled ? reactiveWithDebug : createReactive;
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
            this._reactiveStates.set(key, {
                getter: getter as () => unknown,
                setter: setter as (value: unknown | ((prev: unknown) => unknown)) => void,
            });
        }

        const state = this._reactiveStates.get(key);
        if (!state) {
            throw new Error(`State ${key} not found`);
        }
        return [state.getter as () => T, state.setter as (value: T | ((prev: T) => T)) => void];
    }

    /**
     * 调度重渲染
     * 这个方法被响应式系统调用，开发者通常不需要直接调用
     */
    protected scheduleRerender(): void {
        if (this.connected) {
            this.rerender();
        }
    }

    /**
     * 重新渲染组件
     */
    protected rerender(): void {
        if (!this.connected) {
            console.warn(
                `[${this.constructor.name}] Component is not connected, skipping rerender.`
            );
            return;
        }

        // 保存焦点状态（如果启用）
        let focusData: FocusData | null = null;
        if (this._preserveFocus && this.shadowRoot) {
            const activeElement = this.shadowRoot.activeElement;
            focusData = this.saveFocusState(activeElement);
        }

        // 保存当前的 adopted stylesheets (jsdom may not support this)
        const adoptedStyleSheets = this.shadowRoot.adoptedStyleSheets || [];

        // 清空现有内容但保留样式
        this.shadowRoot.innerHTML = "";

        // 恢复 adopted stylesheets (避免重新应用样式)
        if (this.shadowRoot.adoptedStyleSheets) {
            this.shadowRoot.adoptedStyleSheets = adoptedStyleSheets;
        }

        // 只有在没有 adopted stylesheets 时才重新应用样式
        if (adoptedStyleSheets.length === 0 && this.config.styles) {
            const styleName = this.config.styleName || this.constructor.name;
            StyleManager.applyStyles(this.shadowRoot, styleName, this.config.styles);
        }

        // 重新渲染JSX
        try {
            const content = this.render();
            this.shadowRoot.appendChild(content);
        } catch (error) {
            console.error(`[${this.constructor.name}] Error in rerender:`, error);
            this.renderError(error);
        }

        // 恢复焦点状态
        if (this._preserveFocus && focusData && this.shadowRoot) {
            this.restoreFocusState(focusData);
        }
    }

    /**
     * 保存焦点状态
     */
    private saveFocusState(activeElement: Element | null): FocusData | null {
        if (!activeElement) {
            return null;
        }

        const focusData: FocusData = {
            tagName: activeElement.tagName.toLowerCase(),
            className: activeElement.className,
        };

        // Save selection/cursor position
        if (activeElement.hasAttribute("contenteditable")) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                focusData.selectionStart = range.startOffset;
                focusData.selectionEnd = range.endOffset;
            }
        }

        // Save input/select element state
        if (
            activeElement instanceof HTMLInputElement ||
            activeElement instanceof HTMLSelectElement
        ) {
            focusData.value = activeElement.value;
            if ("selectionStart" in activeElement) {
                focusData.selectionStart = activeElement.selectionStart ?? undefined;
                focusData.selectionEnd = activeElement.selectionEnd ?? undefined;
            }
        }

        return focusData;
    }

    /**
     * 恢复焦点状态
     */
    private restoreFocusState(focusData: FocusData): void {
        if (!focusData) return;

        try {
            let targetElement: Element | null = null;

            // Try to find by className first (most specific)
            if (focusData.className) {
                targetElement = this.shadowRoot.querySelector(
                    `.${focusData.className.split(" ")[0]}`
                );
            }

            // Fallback: find by tag name
            if (!targetElement) {
                targetElement = this.shadowRoot.querySelector(focusData.tagName);
            }

            if (targetElement) {
                // Restore focus - prevent page scroll
                (targetElement as HTMLElement).focus({ preventScroll: true });

                // Restore selection/cursor position
                if (focusData.selectionStart !== undefined) {
                    if (targetElement instanceof HTMLInputElement) {
                        targetElement.setSelectionRange(
                            focusData.selectionStart,
                            focusData.selectionEnd ?? focusData.selectionStart
                        );
                    } else if (targetElement instanceof HTMLSelectElement) {
                        targetElement.value = focusData.value ?? "";
                    } else if (targetElement.hasAttribute("contenteditable")) {
                        this.setCursorPosition(targetElement, focusData.selectionStart);
                    }
                }
            }
        } catch {
            // Silently handle focus restoration failure
        }
    }

    /**
     * 设置光标位置
     */
    private setCursorPosition(element: Element, position: number): void {
        try {
            const selection = window.getSelection();
            if (selection) {
                const range = document.createRange();
                const textNode = element.childNodes[0];
                if (textNode) {
                    const maxPos = Math.min(position, textNode.textContent?.length || 0);
                    range.setStart(textNode, maxPos);
                    range.setEnd(textNode, maxPos);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
        } catch {
            // Silently handle cursor position failure
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
