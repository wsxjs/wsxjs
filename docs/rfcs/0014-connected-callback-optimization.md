# RFC-0014: connectedCallback 智能渲染优化

- **RFC编号**: 0014
- **开始日期**: 2025-01-27
- **状态**: Implemented
- **作者**: WSX Team

## 摘要

优化 `WebComponent` 和 `LightComponent` 的 `connectedCallback` 方法，通过智能检测避免重复渲染，解决 Editor.js 等第三方库移动元素时产生的重复元素问题，同时确保 Slot 元素正常工作。

## 动机

### 问题描述

在 Editor.js 等第三方库中，当元素被移动时，Web Component 的 `connectedCallback` 会被多次调用，导致以下问题：

1. **重复元素问题**：
   - 每次 `connectedCallback` 调用都会执行 `render()` 和 `appendChild()`
   - 导致 DOM 中产生重复的元素
   - 影响性能和用户体验

2. **Slot 元素不工作**：
   - Slot 元素在 Shadow DOM 中，但 slot 的内容在 Light DOM 中
   - 如果每次都清空 Shadow DOM，slot 元素会被删除
   - 浏览器无法正确分配 slot 内容

### 问题场景

**修复前的代码**：
```typescript
connectedCallback(): void {
    this.connected = true;
    
    // 应用样式
    StyleManager.applyStyles(...);
    
    // ❌ 问题：每次都渲染，导致重复元素
    const content = this.render();
    this.shadowRoot.appendChild(content); // 重复添加！
}
```

**问题表现**：
```
Editor.js 移动元素流程：
1. 首次连接 → render() + appendChild() → 元素 A
2. Editor.js 移动元素
3. 断开连接 (disconnectedCallback)
4. 重新连接 (connectedCallback) → render() + appendChild() → 元素 B
5. 结果：DOM 中有元素 A 和元素 B（重复！）❌
```

### 为什么需要这个修复？

1. **Editor.js 集成问题**：quizerjs 团队报告了重复元素问题
2. **Slot 功能失效**：Slot 元素无法正常工作
3. **性能问题**：不必要的重复渲染影响性能
4. **用户体验**：重复元素导致界面混乱

## 详细设计

### 核心策略

**智能检测是否需要渲染**：
- 检查 Shadow DOM/Light DOM 中是否已有实际内容
- 排除样式元素和 slot 元素（它们不算"内容"）
- 如果有内容且没有错误，跳过渲染
- 如果没有内容或有错误，清空后重新渲染

### 实现方案

#### 1. WebComponent 实现

```typescript
connectedCallback(): void {
    this.connected = true;
    try {
        // 应用CSS样式到Shadow DOM
        const stylesToApply = this._autoStyles || this.config.styles;
        if (stylesToApply) {
            const styleName = this.config.styleName || this.constructor.name;
            StyleManager.applyStyles(this.shadowRoot, styleName, stylesToApply);
        }

        // 检查是否有实际内容（排除样式和 slot）
        const allChildren = Array.from(this.shadowRoot.children);
        const styleElements = allChildren.filter(
            (child) => child instanceof HTMLStyleElement
        );
        const slotElements = allChildren.filter(
            (child) => child instanceof HTMLSlotElement
        );
        const hasErrorElement = allChildren.some(
            (child) =>
                child instanceof HTMLElement &&
                child.style.color === "red" &&
                child.textContent?.includes("Component Error")
        );
        const hasActualContent =
            allChildren.length > styleElements.length + slotElements.length;

        if (hasActualContent && !hasErrorElement) {
            // ✅ 已经有内容且没有错误，跳过渲染（避免重复元素）
            // Slot 元素已存在，浏览器会自动重新分配 slot 内容
        } else {
            // ✅ 没有内容或有错误，清空后重新渲染
            this.shadowRoot.innerHTML = "";

            // 重新应用样式
            if (stylesToApply) {
                const styleName = this.config.styleName || this.constructor.name;
                StyleManager.applyStyles(this.shadowRoot, styleName, stylesToApply);
            }

            // 渲染JSX内容到Shadow DOM
            const content = this.render();
            this.shadowRoot.appendChild(content);
        }

        // 初始化事件监听器（无论是否渲染，都需要重新初始化）
        this.initializeEventListeners();

        // 调用子类的初始化钩子（无论是否渲染，都需要调用）
        this.onConnected?.();
    } catch (error) {
        logger.error(`Error in connectedCallback:`, error);
        this.renderError(error);
    }
}
```

#### 2. LightComponent 实现

```typescript
connectedCallback(): void {
    this.connected = true;
    try {
        // 应用CSS样式到组件自身
        const stylesToApply = this._autoStyles || this.config.styles;
        const styleName = this.config.styleName || this.constructor.name;
        if (stylesToApply) {
            this.applyScopedStyles(styleName, stylesToApply);
        }

        // 检查是否有实际内容（排除样式元素）
        const styleElement = this.querySelector(
            `style[data-wsx-light-component="${styleName}"]`
        ) as HTMLStyleElement | null;
        const hasErrorElement = Array.from(this.children).some(
            (child) =>
                child instanceof HTMLElement &&
                child !== styleElement &&
                child.style.color === "red" &&
                child.textContent?.includes("Component Error")
        );
        const hasActualContent = Array.from(this.children).some(
            (child) => child !== styleElement
        );

        if (hasActualContent && !hasErrorElement) {
            // ✅ 已经有内容且没有错误，跳过渲染（避免重复元素）
            // 但确保样式元素在正确位置
            if (styleElement && styleElement !== this.firstChild) {
                this.insertBefore(styleElement, this.firstChild);
            }
        } else {
            // ✅ 没有内容或有错误，清空后重新渲染
            const childrenToRemove = Array.from(this.children).filter(
                (child) => child !== styleElement
            );
            childrenToRemove.forEach((child) => child.remove());

            // 渲染JSX内容到Light DOM
            const content = this.render();
            this.appendChild(content);

            // 确保样式元素在第一个位置
            if (styleElement && styleElement !== this.firstChild) {
                this.insertBefore(styleElement, this.firstChild);
            }
        }

        // 初始化事件监听器（无论是否渲染，都需要重新初始化）
        this.initializeEventListeners();

        // 调用子类的初始化钩子（无论是否渲染，都需要调用）
        this.onConnected?.();
    } catch (error) {
        logger.error(`[${this.constructor.name}] Error in connectedCallback:`, error);
        this.renderError(error);
    }
}
```

### 关键设计决策

#### 1. 为什么排除样式元素？

样式元素由 `StyleManager` 或 `applyScopedStyles` 添加，它们不是组件的内容，不应该影响渲染决策。

#### 2. 为什么排除 slot 元素？

Slot 元素在 Shadow DOM 中，但 slot 的内容在 Light DOM 中。Slot 元素本身不算"内容"，因为：
- Slot 的内容由浏览器自动从 Light DOM 分配
- 如果 slot 元素已存在，浏览器会自动重新分配内容
- 如果 slot 元素不存在，需要重新渲染以添加 slot 元素

#### 3. 为什么检测错误元素？

如果组件之前渲染失败，会显示错误信息。重新连接时，应该重新渲染以恢复正常状态。

#### 4. 为什么总是重新初始化事件监听器？

即使跳过渲染，DOM 可能被移动，事件监听器需要重新绑定。

## 实现细节

### 内容检测逻辑

```typescript
// WebComponent: Shadow DOM
const allChildren = Array.from(this.shadowRoot.children);
const styleElements = allChildren.filter(
    (child) => child instanceof HTMLStyleElement
);
const slotElements = allChildren.filter(
    (child) => child instanceof HTMLSlotElement
);
const hasActualContent =
    allChildren.length > styleElements.length + slotElements.length;

// LightComponent: Light DOM
const styleElement = this.querySelector(
    `style[data-wsx-light-component="${styleName}"]`
);
const hasActualContent = Array.from(this.children).some(
    (child) => child !== styleElement
);
```

### 错误元素检测

```typescript
const hasErrorElement = allChildren.some(
    (child) =>
        child instanceof HTMLElement &&
        child.style.color === "red" &&
        child.textContent?.includes("Component Error")
);
```

### 渲染决策

```typescript
if (hasActualContent && !hasErrorElement) {
    // 跳过渲染：避免重复元素
    // Slot 元素已存在，浏览器会自动重新分配内容
} else {
    // 清空后重新渲染
    // Slot 元素会被重新添加，浏览器会自动分配内容
}
```

## 示例用法

### 修复前的问题

```typescript
// 组件定义
class MyComponent extends WebComponent {
    render() {
        return <div class="content">Hello</div>;
    }
}

// 使用场景：Editor.js 移动元素
// 1. 首次连接 → <div class="content">Hello</div>
// 2. Editor.js 移动元素
// 3. 重新连接 → <div class="content">Hello</div> (重复！)
// 结果：DOM 中有两个 <div class="content">Hello</div> ❌
```

### 修复后的行为

```typescript
// 组件定义（相同）
class MyComponent extends WebComponent {
    render() {
        return <div class="content">Hello</div>;
    }
}

// 使用场景：Editor.js 移动元素
// 1. 首次连接 → <div class="content">Hello</div>
// 2. Editor.js 移动元素
// 3. 重新连接 → 检测到有内容，跳过渲染 ✅
// 结果：DOM 中只有一个 <div class="content">Hello</div> ✅
```

### Slot 示例

#### WebComponent Slot

```typescript
// 组件定义
class CardComponent extends WebComponent {
    render() {
        return (
            <div class="card">
                <slot name="header">Default Header</slot>
                <slot>Default Content</slot>
                <slot name="footer">Default Footer</slot>
            </div>
        );
    }
}

// 使用
<card-component>
    <span slot="header">Custom Header</span>
    <p>Card content</p>
    <button slot="footer">Action</button>
</card-component>

// 修复前：Slot 不工作 ❌
// 修复后：Slot 正常工作 ✅
// - 首次连接：slot 元素被添加，浏览器分配内容
// - 重新连接：检测到有内容，跳过渲染，slot 元素保留，浏览器重新分配内容
```

#### LightComponent Slot

```typescript
// 组件定义
class CardComponent extends LightComponent {
    render() {
        return (
            <div class="card">
                <slot name="header">Default Header</slot>
                <slot>Default Content</slot>
                <slot name="footer">Default Footer</slot>
            </div>
        );
    }
}

// 使用（相同语法）
<card-component>
    <span slot="header">Custom Header</span>
    <p>Card content</p>
    <button slot="footer">Action</button>
</card-component>
```

#### 混合使用示例

```typescript
// WebComponent 包含 LightComponent with slots
class ContainerComponent extends WebComponent {
    render() {
        return (
            <div>
                <slot-card-light>
                    <span slot="header">Header from WebComponent</span>
                    <p>Content from WebComponent</p>
                    <button slot="footer">Button</button>
                </slot-card-light>
            </div>
        );
    }
}

// LightComponent 包含 WebComponent with slots
class AppComponent extends LightComponent {
    render() {
        return (
            <div>
                <slot-card-web>
                    <span slot="header">Header from LightComponent</span>
                    <p>Content from LightComponent</p>
                    <button slot="footer">Button</button>
                </slot-card-web>
            </div>
        );
    }
}
```

**完整示例**：查看 `packages/examples/src/components/SlotExamples.wsx` 了解所有 slot 使用场景。

## 向后兼容性

### 破坏性变更

无。这是一个内部优化，不影响公开 API。

### 行为变更

- **之前**：每次 `connectedCallback` 都会渲染
- **现在**：智能检测，有内容时跳过渲染

这个变更对用户是透明的，不会影响现有代码。

## 测试策略

### 测试用例

1. **首次连接**：
   - 应该渲染内容
   - 应该调用 `onConnected` 钩子

2. **重新连接（内容存在）**：
   - 应该跳过渲染（避免重复）
   - 应该重新初始化事件监听器
   - 应该调用 `onConnected` 钩子

3. **重新连接（内容不存在）**：
   - 应该重新渲染
   - 应该调用 `onConnected` 钩子

4. **错误恢复**：
   - 错误后重新连接应该恢复正常
   - 应该重新渲染

5. **Slot 功能**：
   - Slot 元素应该被正确添加
   - Slot 内容应该被正确分配
   - 重新连接时 slot 应该继续工作

6. **Editor.js 场景**：
   - 移动元素时不应该产生重复元素
   - 移动元素后内容应该保持正确

### 测试覆盖

所有测试用例已通过：
- `packages/core/__tests__/web-component.test.ts`: 16 个测试通过
- `packages/core/__tests__/light-component.test.ts`: 16 个测试通过

## 性能影响

### 性能优化

1. **减少不必要的渲染**：
   - 有内容时跳过 `render()` 调用
   - 减少 DOM 操作

2. **保持事件监听器**：
   - 即使跳过渲染，也重新初始化事件监听器
   - 确保事件处理正确

### 性能指标

- **首次连接**：性能不变（仍然渲染）
- **重新连接（有内容）**：性能提升（跳过渲染）
- **重新连接（无内容）**：性能不变（仍然渲染）

## 已知限制

### 限制说明

1. **内容检测基于元素类型**：
   - 如果组件渲染的元素类型发生变化，可能需要重新渲染
   - 当前实现假设元素类型不变

2. **错误检测基于样式**：
   - 错误元素检测基于红色样式和错误文本
   - 如果错误信息格式变化，可能需要更新检测逻辑

3. **Slot 内容分配**：
   - Slot 内容分配由浏览器自动处理
   - 如果 Light DOM 中的 slot 内容被外部修改，可能需要重新渲染

## 未来改进

### 可能的增强

1. **更智能的内容检测**：
   - 比较内容哈希，检测内容是否真正变化
   - 只在内容变化时重新渲染

2. **配置选项**：
   - 允许组件选择是否启用智能渲染
   - 某些组件可能需要每次都渲染

3. **性能监控**：
   - 添加性能指标，监控渲染次数
   - 帮助识别性能瓶颈

## 总结

这个 RFC 解决了 Editor.js 等第三方库移动元素时产生的重复元素问题，同时确保 Slot 元素正常工作。通过智能检测是否需要渲染，我们避免了不必要的重复渲染，提升了性能和用户体验。

### 关键成果

1. ✅ **解决重复元素问题**：Editor.js 移动元素时不再产生重复元素
2. ✅ **Slot 正常工作**：Slot 元素被正确处理，浏览器自动分配内容
3. ✅ **性能优化**：减少不必要的渲染，提升性能
4. ✅ **错误恢复**：错误后重新连接可以恢复正常
5. ✅ **向后兼容**：不影响现有代码，对用户透明

### 实现状态

- ✅ WebComponent 实现完成
- ✅ LightComponent 实现完成
- ✅ 测试覆盖完成（32 个测试通过）
- ✅ 文档更新完成

---

**RFC-0014** - connectedCallback 智能渲染优化 | Implemented | 2025-01-27

