/**
 * Base Component for WSX Web Components
 *
 * Provides common functionality shared by WebComponent and LightComponent:
 * - Reactive state management (reactive, useState, scheduleRerender)
 * - Configuration management (getConfig, setConfig)
 * - Attribute helpers (getAttr, setAttr, removeAttr, hasAttr)
 * - Lifecycle hooks (onConnected, onDisconnected, onAttributeChanged)
 */

import { reactive as createReactive, createState, reactiveWithDebug } from "./utils/reactive";
import { DOMCacheManager } from "./dom-cache-manager";

/**
 * Type for reactive state storage
 */
interface ReactiveStateStorage {
    getter: () => unknown;
    setter: (value: unknown | ((prev: unknown) => unknown)) => void;
}

/**
 * Focus state interface for focus preservation during rerender
 */
interface FocusState {
    key: string;
    elementType: "input" | "textarea" | "select" | "contenteditable";
    value?: string;
    selectionStart?: number;
    selectionEnd?: number;
    scrollTop?: number; // For textarea
    selectedIndex?: number; // For select
}

/**
 * Base configuration interface
 */
export interface BaseComponentConfig {
    styles?: string;
    autoStyles?: string;
    styleName?: string;
    debug?: boolean;
    [key: string]: unknown;
}

/**
 * Base Component class with common functionality
 *
 * This class provides shared functionality for both WebComponent and LightComponent.
 * It should not be used directly - use WebComponent or LightComponent instead.
 */
export abstract class BaseComponent extends HTMLElement {
    protected config: BaseComponentConfig;
    protected connected: boolean = false;
    protected _isDebugEnabled: boolean = false;
    protected _reactiveStates = new Map<string, ReactiveStateStorage>();

    /**
     * Auto-injected styles from Babel plugin (if CSS file exists)
     * @internal - Managed by babel-plugin-wsx-style
     */
    protected _autoStyles?: string;

    /**
     * DOM Cache Manager for fine-grained updates (RFC 0037)
     * @internal
     */
    protected _domCache = new DOMCacheManager();

    /**
     * 当前捕获的焦点状态（用于在 render 时使用捕获的值）
     * @internal - 由 rerender() 方法管理
     */
    protected _pendingFocusState: FocusState | null = null;

    /**
     * 防抖定时器，用于延迟重渲染（当用户正在输入时）
     * @internal
     */
    private _rerenderDebounceTimer: number | null = null;

    /**
     * 待处理的重渲染标志（当用户正在输入时，标记需要重渲染但延迟执行）
     * @internal
     */
    private _pendingRerender: boolean = false;

    /**
     * 正在渲染标志（防止在 _rerender() 执行期间再次触发 scheduleRerender()）
     * @internal
     */
    protected _isRendering: boolean = false;

    /**
     * 已调度渲染标志（防止在同一事件循环中重复注册 requestAnimationFrame）
     * 用于批量更新：同一事件循环中的多个状态变化只触发一次渲染
     * @internal
     */
    private _hasScheduledRender: boolean = false;

    /**
     * 子类应该重写这个方法来定义观察的属性
     * @returns 要观察的属性名数组
     */
    static get observedAttributes(): string[] {
        return [];
    }

    constructor(config: BaseComponentConfig = {}) {
        super();

        this._isDebugEnabled = config.debug ?? false;

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const host = this;

        // Store original styles value to avoid infinite recursion in getter
        const originalStyles = config.styles;

        this.config = {
            ...config,
            get styles() {
                // Auto-detect injected styles from class property
                // Note: _defineProperty executes in constructor after super(),
                // so we check _autoStyles dynamically via getter
                // This works for both WebComponent and LightComponent
                // Priority: originalStyles > _autoStyles
                const result = originalStyles || host._autoStyles || "";
                return result;
            },
            set styles(value: string) {
                config.styles = value;
            },
        };
    }

    /**
     * 抽象方法：子类必须实现JSX渲染
     *
     * @returns JSX元素
     */
    abstract render(): HTMLElement | SVGElement;

    /**
     * 可选生命周期钩子：组件已连接
     */
    protected onConnected?(): void;

    /**
     * 可选生命周期钩子：组件渲染完成后调用
     * 在 DOM 更新完成后调用，适合执行需要访问 DOM 的操作（如语法高亮、初始化第三方库等）
     */
    protected onRendered?(): void;

    /**
     * Gets the DOMCacheManager instance.
     * @internal
     */
    public getDomCache(): DOMCacheManager {
        return this._domCache;
    }

    /**
     * 处理 blur 事件，在用户停止输入时执行待处理的重渲染
     * @internal
     */
    private handleGlobalBlur = (event: FocusEvent): void => {
        // 检查 blur 的元素是否在组件内
        const root = this.getActiveRoot();
        const target = event.target as HTMLElement;

        if (target && root.contains(target)) {
            // 用户停止输入，执行待处理的重渲染
            if (this._pendingRerender && this.connected) {
                // 清除防抖定时器
                if (this._rerenderDebounceTimer !== null) {
                    clearTimeout(this._rerenderDebounceTimer);
                    this._rerenderDebounceTimer = null;
                }

                // 延迟一小段时间后重渲染，确保 blur 事件完全处理
                requestAnimationFrame(() => {
                    if (this._pendingRerender && this.connected && !this._isRendering) {
                        this._pendingRerender = false;
                        // 设置渲染标志，防止在 _rerender() 执行期间再次触发
                        // 注意：_isRendering 标志会在 _rerender() 的 onRendered() 调用完成后清除
                        this._isRendering = true;
                        // 调用 _rerender() 执行实际渲染（不再调用 rerender()，避免循环）
                        // _isRendering 标志会在 _rerender() 完成所有异步操作后清除
                        this._rerender();
                    }
                });
            }
        }
    };

    /**
     * 可选生命周期钩子：组件已断开
     */
    protected onDisconnected?(): void;

    /**
     * 可选生命周期钩子：属性已更改
     */
    protected onAttributeChanged?(name: string, oldValue: string, newValue: string): void;

    /**
     * Web Component生命周期：属性变化
     */
    attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
        this.onAttributeChanged?.(name, oldValue, newValue);
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
     * 使用 queueMicrotask 进行异步调度，与 reactive() 系统保持一致
     */
    protected scheduleRerender(): void {
        // DEBUG: 追踪 scheduleRerender 调用
        console.log("[scheduleRerender] called:", {
            component: this.constructor.name,
            connected: this.connected,
            isRendering: this._isRendering,
            hasScheduledRender: this._hasScheduledRender,
        });

        if (!this.connected) {
            // 如果组件已断开，清除定时器
            if (this._rerenderDebounceTimer !== null) {
                clearTimeout(this._rerenderDebounceTimer);
                this._rerenderDebounceTimer = null;
            }
            return;
        }

        // 如果正在渲染，跳过本次调度（防止无限循环）
        if (this._isRendering) {
            console.log("[scheduleRerender] SKIPPED: already rendering");
            return;
        }

        // 如果已经调度了渲染，跳过（避免在同一事件循环中重复注册 requestAnimationFrame）
        // 这实现了批量更新：同一事件循环中的多个状态变化只触发一次渲染
        if (this._hasScheduledRender) {
            console.log("[scheduleRerender] SKIPPED: already scheduled");
            return;
        }

        // 检查是否有需要持续输入的元素获得焦点（input、textarea、select、contenteditable）
        // 按钮等其他元素应该立即重渲染，以反映状态变化
        const root = this.getActiveRoot();
        let activeElement: HTMLElement | null = null;

        if (root instanceof ShadowRoot) {
            activeElement = root.activeElement as HTMLElement | null;
        } else {
            const docActiveElement = document.activeElement;
            if (docActiveElement && root.contains(docActiveElement)) {
                activeElement = docActiveElement as HTMLElement;
            }
        }

        // 只对需要持续输入的元素跳过重渲染（input、textarea、select、contenteditable）
        // 按钮等其他元素应该立即重渲染
        // 如果元素有 data-wsx-force-render 属性，即使是要持续输入的元素也强制重渲染
        if (activeElement) {
            const isInputElement =
                activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement ||
                activeElement instanceof HTMLSelectElement ||
                activeElement.hasAttribute("contenteditable");

            // 检查是否有强制渲染属性
            const forceRender = activeElement.hasAttribute("data-wsx-force-render");

            // 如果是输入元素且没有强制渲染属性，跳过重渲染，等待 blur 事件
            if (isInputElement && !forceRender) {
                // 标记需要重渲染，但延迟到 blur 事件
                this._pendingRerender = true;

                // 清除之前的定时器（不再使用定时器，只等待 blur）
                if (this._rerenderDebounceTimer !== null) {
                    clearTimeout(this._rerenderDebounceTimer);
                    this._rerenderDebounceTimer = null;
                }

                // 不执行重渲染，等待 blur 事件
                return;
            }
            // 对于按钮等其他元素，或者有 data-wsx-force-render 属性的输入元素，继续执行重渲染（不跳过）
        }

        // 没有焦点元素，立即重渲染（使用 requestAnimationFrame 确保在下一个渲染帧执行）
        // 如果有待处理的重渲染，也立即执行
        if (this._pendingRerender) {
            this._pendingRerender = false;
        }

        // 标记已调度渲染（批量更新的关键）
        this._hasScheduledRender = true;

        // 使用 requestAnimationFrame 而不是 queueMicrotask，确保在渲染帧中执行
        // 这样可以避免在 render() 执行期间触发的 scheduleRerender() 立即执行
        requestAnimationFrame(() => {
            console.warn("[scheduleRerender] RAF callback:", {
                component: this.constructor.name,
                connected: this.connected,
                isRendering: this._isRendering,
            });

            // 重置调度标志（允许后续的状态变化调度新的渲染）
            this._hasScheduledRender = false;

            if (this.connected && !this._isRendering) {
                console.warn("[scheduleRerender] calling _rerender()");
                // 设置渲染标志，防止在 _rerender() 执行期间再次触发
                // 注意：_isRendering 标志会在 _rerender() 的 onRendered() 调用完成后清除
                this._isRendering = true;
                // 调用 _rerender() 执行实际渲染（不再调用 rerender()，避免循环）
                // _isRendering 标志会在 _rerender() 完成所有异步操作后清除
                this._rerender();
            } else if (!this.connected) {
                // 如果组件已断开，确保清除渲染标志
                this._isRendering = false;
            }
        });
    }

    /**
     * 调度重渲染（公开 API）
     *
     * 与 scheduleRerender() 对齐：所有重渲染都通过统一的调度机制
     * 使用异步调度机制，自动处理防抖和批量更新
     *
     * 注意：此方法现在是异步的，使用调度机制
     * 如果需要同步执行，使用 _rerender()（不推荐，仅内部使用）
     */
    protected rerender(): void {
        // 对齐到 scheduleRerender()，统一调度机制
        this.scheduleRerender();
    }

    /**
     * 内部重渲染实现（同步执行）
     * 由 scheduleRerender() 在适当时机调用
     *
     * @internal - 子类需要实现此方法
     */
    protected abstract _rerender(): void;

    /**
     * 清理资源（在组件断开连接时调用）
     * @internal
     */
    protected cleanup(): void {
        // 清除防抖定时器
        if (this._rerenderDebounceTimer !== null) {
            clearTimeout(this._rerenderDebounceTimer);
            this._rerenderDebounceTimer = null;
        }

        // 移除 blur 事件监听器
        document.removeEventListener("blur", this.handleGlobalBlur, true);

        // 清除待处理的重渲染标志
        this._pendingRerender = false;
    }

    /**
     * 初始化事件监听器（在组件连接时调用）
     * @internal
     */
    protected initializeEventListeners(): void {
        // 添加 blur 事件监听器，在用户停止输入时执行待处理的重渲染
        document.addEventListener("blur", this.handleGlobalBlur, true);
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

    /**
     * 清理响应式状态
     */
    protected cleanupReactiveStates(): void {
        this._reactiveStates.clear();
    }

    /**
     * 获取当前活动的 DOM 根（Shadow DOM 或 Light DOM）
     * @returns 活动的 DOM 根元素
     */
    protected getActiveRoot(): ShadowRoot | HTMLElement {
        // WebComponent 使用 shadowRoot，LightComponent 使用自身
        if ("shadowRoot" in this && this.shadowRoot) {
            return this.shadowRoot;
        }
        return this;
    }

    /**
     * 捕获当前焦点状态（在重渲染之前调用）
     * @returns 焦点状态，如果没有焦点元素则返回 null
     */
    protected captureFocusState(): FocusState | null {
        const root = this.getActiveRoot();
        let activeElement: Element | null = null;

        // 获取活动元素
        if (root instanceof ShadowRoot) {
            // Shadow DOM: 使用 shadowRoot.activeElement
            activeElement = root.activeElement;
        } else {
            // Light DOM: 检查 document.activeElement 是否在组件内
            const docActiveElement = document.activeElement;
            if (docActiveElement && root.contains(docActiveElement)) {
                activeElement = docActiveElement;
            }
        }

        if (!activeElement || !(activeElement instanceof HTMLElement)) {
            return null;
        }

        // 检查元素是否有 data-wsx-key 属性
        const key = activeElement.getAttribute("data-wsx-key");
        if (!key) {
            return null; // 元素没有 key，跳过焦点保持
        }

        const tagName = activeElement.tagName.toLowerCase();
        const state: FocusState = {
            key,
            elementType: tagName as FocusState["elementType"],
        };

        // 处理 input 和 textarea
        if (
            activeElement instanceof HTMLInputElement ||
            activeElement instanceof HTMLTextAreaElement
        ) {
            state.value = activeElement.value;
            state.selectionStart = activeElement.selectionStart ?? undefined;
            state.selectionEnd = activeElement.selectionEnd ?? undefined;

            // 对于 textarea，保存滚动位置
            if (activeElement instanceof HTMLTextAreaElement) {
                state.scrollTop = activeElement.scrollTop;
            }
        }
        // 处理 select
        else if (activeElement instanceof HTMLSelectElement) {
            state.elementType = "select";
            state.selectedIndex = activeElement.selectedIndex;
        }
        // 处理 contenteditable
        else if (activeElement.hasAttribute("contenteditable")) {
            state.elementType = "contenteditable";
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                state.selectionStart = range.startOffset;
                state.selectionEnd = range.endOffset;
            }
        }

        return state;
    }

    /**
     * 恢复焦点状态（在重渲染之后调用）
     * @param state - 之前捕获的焦点状态
     */
    protected restoreFocusState(state: FocusState | null): void {
        if (!state || !state.key) {
            return;
        }

        const root = this.getActiveRoot();
        const target = root.querySelector(`[data-wsx-key="${state.key}"]`) as HTMLElement;

        if (!target) {
            return; // 元素未找到，跳过恢复
        }

        // 立即同步恢复值，避免闪烁
        // 这必须在 appendChild 之后立即执行，在浏览器渲染之前
        if (state.value !== undefined) {
            if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
                // 直接设置 value 属性，覆盖 render() 中设置的值
                // 使用 .value 而不是 setAttribute，因为 .value 是当前值，setAttribute 是初始值
                target.value = state.value;
            }
        }

        // 恢复 select 状态
        if (state.selectedIndex !== undefined && target instanceof HTMLSelectElement) {
            target.selectedIndex = state.selectedIndex;
        }

        // 使用 requestAnimationFrame 恢复焦点和光标位置
        // 这样可以确保 DOM 完全更新，但值已经同步恢复了
        requestAnimationFrame(() => {
            // 再次查找元素（确保元素仍然存在）
            const currentTarget = root.querySelector(
                `[data-wsx-key="${state.key}"]`
            ) as HTMLElement;

            if (!currentTarget) {
                return;
            }

            // 再次确保值正确（防止被其他代码覆盖）
            if (state.value !== undefined) {
                if (
                    currentTarget instanceof HTMLInputElement ||
                    currentTarget instanceof HTMLTextAreaElement
                ) {
                    // 只有在值不同时才更新，避免触发额外的事件
                    if (currentTarget.value !== state.value) {
                        currentTarget.value = state.value;
                    }
                }
            }

            // 聚焦元素（防止页面滚动）
            currentTarget.focus({ preventScroll: true });

            // 恢复光标/选择位置
            if (state.selectionStart !== undefined) {
                if (
                    currentTarget instanceof HTMLInputElement ||
                    currentTarget instanceof HTMLTextAreaElement
                ) {
                    const start = state.selectionStart;
                    const end = state.selectionEnd ?? start;
                    currentTarget.setSelectionRange(start, end);

                    // 恢复 textarea 滚动位置
                    if (
                        state.scrollTop !== undefined &&
                        currentTarget instanceof HTMLTextAreaElement
                    ) {
                        currentTarget.scrollTop = state.scrollTop;
                    }
                } else if (currentTarget.hasAttribute("contenteditable")) {
                    // 恢复 contenteditable 选择
                    const selection = window.getSelection();
                    if (selection) {
                        const range = document.createRange();
                        const textNode = currentTarget.childNodes[0];
                        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                            const maxPos = Math.min(
                                state.selectionStart,
                                textNode.textContent?.length || 0
                            );
                            range.setStart(textNode, maxPos);
                            range.setEnd(textNode, state.selectionEnd ?? maxPos);
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }
                    }
                }
            }
        });
    }
}
