# RFC-0030: rerender() 调度机制重构

- **RFC编号**: 0030
- **开始日期**: 2025-01-28
- **状态**: Proposed
- **作者**: WSX Team

## 摘要

重构 `rerender()` 方法，使其使用异步调度机制（类似 `scheduleRerender()`），避免在组件未连接时调用、减少不必要的重渲染，并统一重渲染的执行路径。

## 动机

### 问题描述

当前 `rerender()` 方法是同步执行的，导致以下问题：

1. **组件未连接时调用问题**：
   - 在 `render()` 中创建子组件时，`setAttribute` 会在元素连接到 DOM 之前被调用
   - 这会触发 `attributeChangedCallback`，进而可能调用 `rerender()`
   - 虽然 `rerender()` 会检查 `connected` 状态并跳过，但会产生警告日志
   - 例如：`CodeBlock` 组件在 `render()` 阶段被设置属性时触发警告

2. **缺少调度机制**：
   - `rerender()` 是同步执行的，没有防抖和批量更新机制
   - `scheduleRerender()` 有防抖机制（避免用户输入时频繁重渲染）和批量更新
   - 两者行为不一致，开发者容易混淆

3. **重复渲染问题**：
   - 在短时间内多次调用 `rerender()` 会导致多次 DOM 操作
   - 没有去重机制，可能造成性能问题

4. **生命周期时机问题**：
   - `rerender()` 在 DOM 更新后需要手动调用 `onRendered()` 等钩子
   - 如果使用 `scheduleRerender()`，这些钩子可能在不同时机调用

### 问题场景

**场景 1：CodeBlock 组件警告**

```typescript
// QuickStartCode.render()
<code-block
    title={t("codeExample.titleInstallation")}
    show-copy="true"
    show-try-online="true"
    try-online-url="/playground"
></code-block>

// JSX factory 调用 setAttribute
element.setAttribute("title", "...");
element.setAttribute("show-copy", "true");
// ...

// 触发 attributeChangedCallback
onAttributeChanged("title", null, "...") {
    this.codeTitle = newValue; // @state 触发 scheduleRerender()
    // 但此时组件可能还未连接
}
```

**场景 2：手动调用 rerender()**

```typescript
// 某些组件中手动调用 rerender()
protected onAttributeChanged(name: string, oldValue: string, newValue: string) {
    switch (name) {
        case "code":
            this.code = newValue;
            this.rerender(); // 同步执行，可能有问题
            break;
    }
}
```

**场景 3：死循环风险**

```typescript
// WsxView.loadComponent
container.appendChild(this.componentInstance);
// 新组件触发 connectedCallback
// 如果新组件也是 WsxView，可能形成循环
// rerender() 同步执行，没有调度保护
```

**场景 4：Light DOM 中 JSX children 丢失问题（根本原因）**

```typescript
// App.wsx
<wsx-router>
    <wsx-view route="/marked" component="marked-builder"></wsx-view>
    {/* 这些 children 通过 JSX factory 直接添加到 wsx-router 元素 */}
</wsx-router>

// WsxRouter.render()
render() {
    return <div class="router-outlet"></div>; // 空的 div，不包含 children
}

// LightComponent._rerender() 的问题：
// 1. 清空所有旧内容（除了样式元素）
// 2. 添加 render() 返回的内容（空的 div）
// 3. JSX children（<wsx-view> 元素）被清空，导致 collectViews() 找不到 views
// 4. 错误：No view found for path: /marked
```

**根本原因分析**：

在 Light DOM 中，JSX children 是通过 JSX factory 直接添加到组件元素的，而不是通过 `render()` 返回的。当 `rerender()` 被调用时：

1. `LightComponent._rerender()` 会清空所有 children（除了样式元素）
2. 然后添加 `render()` 返回的内容
3. 但是 `render()` 返回的内容不包含原来的 JSX children
4. 导致 JSX children 丢失，组件无法正常工作

这是一个**框架级别的设计问题**，不应该在组件层面修复（如 `WsxRouter` 中手动保留 children），而应该在 `LightComponent` 中智能处理。

## 详细设计

### 方案 1：统一使用 scheduleRerender()（推荐）

**核心思想**：
- 将 `rerender()` 的实际渲染逻辑提取为内部方法 `_rerender()`
- 公开的 `rerender()` 方法改为调用 `scheduleRerender()`，实现对齐
- `scheduleRerender()` 负责调度，最终调用 `_rerender()` 执行实际渲染
- 保持向后兼容，但行为改为异步调度

**关键对齐点**：
- **`rerender()` 必须与 `scheduleRerender()` 对齐**：所有重渲染都通过统一的调度机制
- 当前问题：`scheduleRerender()` 调用 `rerender()`，导致循环依赖
- 解决方案：`rerender()` 调用 `scheduleRerender()`，`scheduleRerender()` 调用 `_rerender()`

**优点**：
- 统一重渲染路径：所有重渲染（无论是通过 `rerender()` 还是 `scheduleRerender()`）都走同一个调度机制
- 自动处理防抖和批量更新
- 自动检查 `connected` 状态
- 减少重复渲染
- 消除循环依赖

**缺点**：
- 行为从同步变为异步，可能影响某些依赖同步行为的代码
- 需要仔细测试所有使用 `rerender()` 的地方

**实现**：

```typescript
// base-component.ts
export abstract class BaseComponent extends HTMLElement {
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
     * 调度重渲染
     * 
     * 统一的调度机制：
     * 1. 检查 connected 状态
     * 2. 处理输入元素的防抖（避免用户输入时频繁重渲染）
     * 3. 使用 queueMicrotask 批量处理
     * 4. 最终调用 _rerender() 执行实际渲染
     */
    protected scheduleRerender(): void {
        if (!this.connected) {
            // 如果组件已断开，清除定时器
            if (this._rerenderDebounceTimer !== null) {
                clearTimeout(this._rerenderDebounceTimer);
                this._rerenderDebounceTimer = null;
            }
            return;
        }

        // 检查是否有需要持续输入的元素获得焦点
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

        // 只对需要持续输入的元素跳过重渲染
        const isInputElement =
            activeElement &&
            (activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement ||
                activeElement instanceof HTMLSelectElement ||
                activeElement.isContentEditable);

        if (isInputElement && !activeElement.hasAttribute("data-wsx-force-render")) {
            // 用户正在输入，标记需要重渲染但延迟执行
            this._pendingRerender = true;
            return;
        }

        // 立即调度重渲染（使用 queueMicrotask 批量处理）
        if (this._pendingRerender) {
            this._pendingRerender = false;
        }
        
        queueMicrotask(() => {
            if (this.connected) {
                // 最终调用 _rerender() 执行实际渲染
                this._rerender();
            }
        });
    }
}
```

### 方案 2：rerender() 添加调度选项

**核心思想**：
- 保留 `rerender()` 的同步行为
- 添加可选参数控制是否使用调度
- 默认使用调度，但允许同步执行

**优点**：
- 向后兼容性更好
- 灵活性更高

**缺点**：
- API 更复杂
- 仍然可能被误用

**实现**：

```typescript
protected rerender(options?: { immediate?: boolean }): void {
    if (options?.immediate) {
        this._rerender();
    } else {
        this.scheduleRerender();
    }
}
```

### 方案 3：完全移除 rerender()，只使用 scheduleRerender()

**核心思想**：
- 移除 `rerender()` 方法
- 所有重渲染都通过 `scheduleRerender()`
- 重命名 `scheduleRerender()` 为 `rerender()`

**优点**：
- API 最简洁
- 行为一致

**缺点**：
- 破坏性变更
- 需要大量重构

## 推荐方案

**推荐使用方案 1**，原因：

1. **统一行为**：所有重渲染都通过调度机制，行为一致
2. **对齐关系**：`rerender()` 与 `scheduleRerender()` 完全对齐，消除循环依赖
3. **自动优化**：防抖和批量更新自动生效
4. **向后兼容**：API 保持不变，只是行为变为异步
5. **安全性**：自动检查 `connected` 状态，避免未连接时渲染

**关键对齐点**：
- `rerender()` → `scheduleRerender()` → `_rerender()`
- 所有重渲染路径统一，无论是手动调用 `rerender()` 还是通过 `@state` 自动调用 `scheduleRerender()`

## 实现细节

### 1. 重构 rerender() 方法（对齐到 scheduleRerender()）

**关键变更**：
- `rerender()` 现在调用 `scheduleRerender()`，实现完全对齐
- 消除循环依赖：之前 `scheduleRerender()` 调用 `rerender()`，现在反过来
- 所有重渲染都通过统一的调度机制

```typescript
// base-component.ts
export abstract class BaseComponent extends HTMLElement {
    /**
     * 调度重渲染（公开 API）
     * 
     * 与 scheduleRerender() 对齐：所有重渲染都通过统一的调度机制
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
}
```

### 2. 更新 scheduleRerender() 调用 _rerender()（完成对齐）

**关键变更**：
- `scheduleRerender()` 不再调用 `rerender()`，而是直接调用 `_rerender()`
- 完成对齐：`rerender()` → `scheduleRerender()` → `_rerender()`
- 消除循环依赖

```typescript
// base-component.ts
protected scheduleRerender(): void {
    if (!this.connected) {
        // 如果组件已断开，清除定时器
        if (this._rerenderDebounceTimer !== null) {
            clearTimeout(this._rerenderDebounceTimer);
            this._rerenderDebounceTimer = null;
        }
        return;
    }

    // 检查是否有需要持续输入的元素获得焦点
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

    // 只对需要持续输入的元素跳过重渲染
    const isInputElement =
        activeElement &&
        (activeElement instanceof HTMLInputElement ||
            activeElement instanceof HTMLTextAreaElement ||
            activeElement instanceof HTMLSelectElement ||
            activeElement.isContentEditable);

    if (isInputElement && !activeElement.hasAttribute("data-wsx-force-render")) {
        // 用户正在输入，标记需要重渲染但延迟执行
        this._pendingRerender = true;
        return;
    }

    // 立即调度重渲染（使用 queueMicrotask 批量处理）
    if (this._pendingRerender) {
        this._pendingRerender = false;
    }
    
    queueMicrotask(() => {
        if (this.connected) {
            // 最终调用 _rerender() 执行实际渲染（不再调用 rerender()，避免循环）
            this._rerender();
        }
    });
}
```

### 3. 更新 LightComponent 和 WebComponent

#### 3.1 LightComponent 的 _rerender() 实现（关键修复）

**问题**：Light DOM 中，JSX children 是通过 JSX factory 直接添加到组件元素的，而不是通过 `render()` 返回的。当 `_rerender()` 清空旧内容时，会误删这些 JSX children。

**解决方案**：在 `_rerender()` 中，需要区分：
- `render()` 返回的内容（应该被替换）
- JSX children（应该保留，因为它们不是 `render()` 的一部分）

```typescript
// light-component.ts
export abstract class LightComponent extends BaseComponent {
    // 注意：rerender() 继承自 BaseComponent，已经对齐到 scheduleRerender()
    // 无需重写，子类只需要实现 _rerender()

    /**
     * 内部重渲染实现
     * @override
     */
    protected _rerender(): void {
        if (!this.connected) {
            return;
        }

        // 1. 捕获焦点状态
        const focusState = this.captureFocusState();
        this._pendingFocusState = focusState;

        // 2. 保存 JSX children（通过 JSX factory 直接添加的 children）
        // 这些 children 不是 render() 返回的内容，应该保留
        const jsxChildren = this.getJSXChildren();

        try {
            // 3. 重新渲染JSX内容
            const content = this.render();

            // 4. 在添加到 DOM 之前恢复值
            if (focusState && focusState.key && focusState.value !== undefined) {
                const target = content.querySelector(
                    `[data-wsx-key="${focusState.key}"]`
                ) as HTMLElement;
                if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
                    target.value = focusState.value;
                }
            }

            // 5. 应用样式
            const stylesToApply = this._autoStyles || this.config.styles;
            const styleName = this.config.styleName || this.constructor.name;
            // ... 样式处理 ...

            // 6. 使用 requestAnimationFrame 批量执行 DOM 操作
            requestAnimationFrame(() => {
                // 先添加新内容
                this.appendChild(content);

                // 移除旧内容（保留 JSX children 和样式元素）
                const oldChildren = Array.from(this.children).filter((child) => {
                    // 保留新添加的内容
                    if (child === content) {
                        return false;
                    }
                    // 保留样式元素
                    if (
                        stylesToApply &&
                        child instanceof HTMLStyleElement &&
                        child.getAttribute("data-wsx-light-component") === styleName
                    ) {
                        return false;
                    }
                    // 保留 JSX children（关键修复）
                    if (jsxChildren.includes(child)) {
                        return false;
                    }
                    return true;
                });
                oldChildren.forEach((child) => child.remove());

                // 确保样式元素在第一个位置
                // ... 样式元素位置处理 ...

                // 恢复焦点状态
                requestAnimationFrame(() => {
                    this.restoreFocusState(focusState);
                    this._pendingFocusState = null;
                    this.onRendered?.();
                });
            });
        } catch (error) {
            logger.error(`[${this.constructor.name}] Error in _rerender:`, error);
            this.renderError(error);
        }
    }

    /**
     * 获取 JSX children（通过 JSX factory 直接添加的 children）
     * 
     * 在 Light DOM 中，JSX children 是通过 JSX factory 直接添加到组件元素的
     * 这些 children 不是 render() 返回的内容，应该保留
     * 
     * 识别方法：
     * 1. 在 connectedCallback 中，如果 hasActualContent 为 true，说明有 JSX children
     * 2. 这些 children 在第一次渲染时就已经存在
     * 3. 它们不是 render() 返回的内容的一部分
     * 
     * 实现策略：
     * - 在 connectedCallback 中标记 JSX children
     * - 在 _rerender() 中保留这些 children
     */
    private getJSXChildren(): HTMLElement[] {
        // 策略 1：如果组件在 connectedCallback 中跳过了渲染（hasActualContent 为 true）
        // 那么所有非样式元素都是 JSX children
        // 但是，如果已经渲染过，需要区分哪些是 JSX children，哪些是 render() 返回的内容
        
        // 策略 2：在 connectedCallback 中标记 JSX children
        // 使用 data 属性标记：data-wsx-jsx-child="true"
        const jsxChildren = Array.from(this.children).filter(
            (child) =>
                child instanceof HTMLElement &&
                child.getAttribute("data-wsx-jsx-child") === "true"
        ) as HTMLElement[];

        return jsxChildren;
    }

    /**
     * 标记 JSX children（在 connectedCallback 中调用）
     */
    private markJSXChildren(): void {
        // 在 connectedCallback 中，如果 hasActualContent 为 true
        // 说明这些 children 是 JSX children，不是 render() 返回的内容
        // 标记它们，以便在 _rerender() 中保留
        const styleElement = this.querySelector(
            `style[data-wsx-light-component="${this.config.styleName || this.constructor.name}"]`
        ) as HTMLStyleElement | null;

        Array.from(this.children).forEach((child) => {
            if (
                child instanceof HTMLElement &&
                child !== styleElement &&
                !(child instanceof HTMLSlotElement)
            ) {
                child.setAttribute("data-wsx-jsx-child", "true");
            }
        });
    }
}
```

**connectedCallback 更新**：

```typescript
connectedCallback(): void {
    this.connected = true;
    try {
        // ... 样式处理 ...

        const hasActualContent = Array.from(this.children).some(
            (child) => child !== styleElement && !(child instanceof HTMLSlotElement)
        );

        if (hasActualContent && !hasErrorElement) {
            // 已经有内容（JSX children），标记它们
            this.markJSXChildren(); // 新增：标记 JSX children
            // ... 其他逻辑 ...
        } else {
            // 没有内容，需要渲染
            // ... 渲染逻辑 ...
        }
    } catch (error) {
        // ... 错误处理 ...
    }
}
```

#### 3.2 WebComponent 的 _rerender() 实现

**关键点**：
- WebComponent 使用 Shadow DOM，不存在 JSX children 问题（所有内容都在 shadowRoot 中）
- `rerender()` 继承自 `BaseComponent`，已经对齐到 `scheduleRerender()`，无需重写
- `_rerender()` 包含实际的渲染逻辑（从当前的 `rerender()` 方法迁移）

```typescript
// web-component.ts
export abstract class WebComponent extends BaseComponent {
    // 注意：rerender() 继承自 BaseComponent，已经对齐到 scheduleRerender()
    // 无需重写，除非有特殊需求

    /**
     * 内部重渲染实现
     * 包含从当前 rerender() 方法迁移的实际渲染逻辑
     * 
     * @override
     */
    protected _rerender(): void {
        if (!this.connected) {
            return;
        }

        // 1. 捕获焦点状态（在 DOM 替换之前）
        const focusState = this.captureFocusState();
        this._pendingFocusState = focusState;

        // 2. 保存当前的 adopted stylesheets
        const adoptedStyleSheets = this.shadowRoot.adoptedStyleSheets || [];

        try {
            // 3. 只有在没有 adopted stylesheets 时才重新应用样式
            if (adoptedStyleSheets.length === 0) {
                const stylesToApply = this._autoStyles || this.config.styles;
                if (stylesToApply) {
                    const styleName = this.config.styleName || this.constructor.name;
                    StyleManager.applyStyles(this.shadowRoot, styleName, stylesToApply);
                }
            }

            // 4. 重新渲染JSX
            const content = this.render();

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

            // 6. 恢复 adopted stylesheets
            if (this.shadowRoot.adoptedStyleSheets) {
                this.shadowRoot.adoptedStyleSheets = adoptedStyleSheets;
            }

            // 7. 使用 requestAnimationFrame 批量执行 DOM 操作
            requestAnimationFrame(() => {
                // 添加新内容
                this.shadowRoot.appendChild(content);

                // 移除旧内容
                const oldChildren = Array.from(this.shadowRoot.children).filter(
                    (child) => child !== content
                );
                oldChildren.forEach((child) => child.remove());

                // 恢复焦点状态
                requestAnimationFrame(() => {
                    this.restoreFocusState(focusState);
                    this._pendingFocusState = null;
                    // 调用 onRendered 生命周期钩子
                    this.onRendered?.();
                });
            });
        } catch (error) {
            logger.error("Error in _rerender:", error);
            this.renderError(error);
        }
    }
}
```

**WebComponent 与 LightComponent 的区别**：
- **WebComponent**：使用 Shadow DOM，所有内容都在 `shadowRoot` 中，不存在 JSX children 问题
- **LightComponent**：使用 Light DOM，JSX children 直接添加到组件元素，需要特殊处理
- **共同点**：两者都遵循相同的对齐关系：`rerender()` → `scheduleRerender()` → `_rerender()`

### 4. 迁移指南

**对于使用 `rerender()` 的代码**：

```typescript
// 之前
protected onAttributeChanged(name: string, oldValue: string, newValue: string) {
    this.code = newValue;
    this.rerender(); // 同步执行
}

// 之后（行为自动变为异步，无需修改代码）
protected onAttributeChanged(name: string, oldValue: string, newValue: string) {
    this.code = newValue;
    this.rerender(); // 异步调度执行（自动对齐到 scheduleRerender()）
}
```

**推荐做法：使用 `@state` 装饰器**：

```typescript
// 最佳实践：使用 @state 装饰器，自动触发 scheduleRerender()
@state private code: string = "";

protected onAttributeChanged(name: string, oldValue: string, newValue: string) {
    if (!this.connected) {
        return; // 避免在未连接时更新状态
    }
    
    switch (name) {
        case "code":
            this.code = newValue; // @state 自动调用 scheduleRerender()
            break;
    }
}
```

**对于需要同步执行的场景**（不推荐，但保留可能性）：

```typescript
// 如果确实需要同步执行（非常罕见，仅用于特殊场景）
protected someMethod() {
    this._rerender(); // 内部方法，不推荐使用，绕过调度机制
}
```

**迁移检查清单**：
- [ ] 检查所有 `rerender()` 调用，确认它们可以接受异步行为
- [ ] 优先使用 `@state` 装饰器，而不是手动调用 `rerender()`
- [ ] 在 `onAttributeChanged` 中添加 `connected` 检查，避免未连接时更新状态
- [ ] 测试所有使用 `rerender()` 的组件，确保异步行为不影响功能

## 测试计划

1. **单元测试**：
   - 测试 `rerender()` 在组件未连接时的行为
   - 测试防抖机制是否正常工作
   - 测试批量更新是否生效

2. **集成测试**：
   - 测试 `CodeBlock` 组件不再产生警告
   - 测试所有使用 `rerender()` 的组件
   - 测试 `WsxView` 不再出现死循环

3. **性能测试**：
   - 测试频繁调用 `rerender()` 的性能
   - 测试防抖机制的效果

## 向后兼容性

- ✅ API 保持不变：`rerender()` 方法仍然存在
- ⚠️ 行为变化：从同步变为异步
- ✅ 自动优化：防抖和批量更新自动生效
- ✅ 安全性提升：自动检查 `connected` 状态

## 替代方案

如果方案 1 不可行，可以考虑：

1. **方案 2**：添加选项参数，保持灵活性
2. **方案 3**：完全重构，但需要更多工作

## 相关 RFC

- RFC-0014: connectedCallback 智能渲染优化
- RFC-0004: 响应式状态系统

## 未解决的问题

1. 是否有场景必须使用同步 `rerender()`？
2. 异步行为是否会影响某些第三方库集成？
3. 是否需要提供同步执行的选项？
4. **Light DOM JSX children 识别策略**：
   - 如何准确识别哪些 children 是 JSX children，哪些是 `render()` 返回的内容？
   - 如果 `render()` 返回的内容也包含相同的元素类型，如何区分？
   - 是否需要更智能的标记机制（如使用 WeakMap）？
5. **性能影响**：
   - 标记和保留 JSX children 是否会影响性能？
   - 是否需要优化 `getJSXChildren()` 的实现？

## 总结

通过将 `rerender()` 重构为使用调度机制，可以：
- 解决组件未连接时的警告问题
- **统一重渲染行为：`rerender()` 与 `scheduleRerender()` 完全对齐**
- 自动优化性能（防抖、批量更新）
- 提高代码安全性
- **解决 Light DOM 中 JSX children 丢失的根本问题**（框架级别修复，而非组件级别）

### 关键改进点

1. **统一调度机制**：所有重渲染都通过 `scheduleRerender()` 进行异步调度
   - `rerender()` → `scheduleRerender()` → `_rerender()`
   - 消除循环依赖：之前 `scheduleRerender()` 调用 `rerender()`，现在反过来
   - 无论是手动调用 `rerender()` 还是通过 `@state` 自动调用 `scheduleRerender()`，都走同一个路径

2. **对齐关系**：
   - `rerender()` 现在调用 `scheduleRerender()`，实现完全对齐
   - `scheduleRerender()` 调用 `_rerender()`，不再调用 `rerender()`，避免循环
   - 所有重渲染路径统一，行为一致

3. **Light DOM children 保护**：在 `_rerender()` 中智能识别并保留 JSX children

4. **框架级别修复**：不在组件层面修复（如 `WsxRouter` 中手动保留 children），而是在框架层面解决

这是一个重要的架构改进，建议尽快实施。特别是：
- **`rerender()` 与 `scheduleRerender()` 的对齐**：这是核心架构改进，消除循环依赖，统一重渲染路径
- **Light DOM children 处理问题**：这是一个框架级别的设计缺陷，必须在框架层面修复，而不是在组件层面修复

