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

/**
 * Type for reactive state storage
 */
interface ReactiveStateStorage {
    getter: () => unknown;
    setter: (value: unknown | ((prev: unknown) => unknown)) => void;
}

/**
 * Base configuration interface
 */
export interface BaseComponentConfig {
    styles?: string;
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
     * 子类应该重写这个方法来定义观察的属性
     * @returns 要观察的属性名数组
     */
    static get observedAttributes(): string[] {
        return [];
    }

    constructor(config: BaseComponentConfig = {}) {
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
     */
    protected scheduleRerender(): void {
        if (this.connected) {
            this.rerender();
        }
    }

    /**
     * 重新渲染组件（子类需要实现）
     */
    protected abstract rerender(): void;

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
}
