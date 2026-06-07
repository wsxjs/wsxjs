# RFC 0056: Shadow DOM 事件处理标准

- **作者**: WSX Core Team
- **状态**: Completed
- **创建日期**: 2026-01-21

## 摘要

本 RFC 0056 确立了在 WSX WebComponents 中处理原生 DOM 事件的标准策略，特别是针对 Shadow DOM 封装带来的挑战。它正式规范了用于修复 "下拉菜单 blur 失效" 问题所采用的模式，规定非合成事件（Non-composed events，如 `blur` 和 `focus`）必须在 `ShadowRoot`（通过 `getActiveRoot()` 获取）上进行监听，而不是在全局 `document` 上监听。

## 问题陈述

在标准 DOM 中，像 `click`、`input` 和 `keydown` 这样的事件会向上传播（冒泡），并且是 "composed"（合成的），这意味着它们可以跨越 Shadow DOM 边界，被 `document` 或 `window` 上的监听器捕获。

然而，某些关键事件——最明显的是 **`blur`** 和 **`focus`**——默认情况下是 **not composed**（非合成的）。当 Shadow DOM *内部* 的元素失去焦点时，`blur` 事件会在该元素上触发，但 **不会传播** 超出 Shadow Root 的范围。

`BaseComponent` 早期的实现是为了处理全局点击或失焦，错误地将监听器挂载到了 `document` 上：

```typescript
// 旧的错误实现
document.addEventListener("blur", this.handleGlobalBlur, true);
```

这在 WebComponents 中会失效，因为来自 Shadow DOM 内部 input 元素的 `blur` 事件会触碰到 Shadow Root 边界并停止传播。文档级别的监听器永远无法接收到该事件，导致"失焦保存"或"失焦验证"等功能无声地失败。

## 解决方案策略

WSX 组件的标准解决方案是将事件监听器附加到组件的 **active root**（活动根节点）上。

1.  **Light Components**（轻量组件）: 活动根节点是组件实例本身 (`this`)。
2.  **Web Components**: 活动根节点是 `shadowRoot`。

`BaseComponent` 提供了一个辅助方法 `getActiveRoot()` 来抽象这一逻辑：

```typescript
protected getActiveRoot(): ShadowRoot | HTMLElement {
    if ("shadowRoot" in this && this.shadowRoot) {
        return this.shadowRoot;
    }
    return this;
}
```

### 标准模式

所有需要捕获组件内部交互的事件监听器，特别是涉及非合成事件的监听器，必须附加到活动根节点上：

```typescript
// 正确实现
const root = this.getActiveRoot();
root.addEventListener("blur", this.handleGlobalBlur, { capture: true });
```

## 详细解释：为什么这样做有效

### Event Composed Flag (事件合成标志)

`Event` 对象的 `composed` 属性决定了它是否可以通过 Shadow DOM 传递到 Light DOM。

-   **`click`**: `composed: true` -> 冒泡到 document。
-   **`input`**: `composed: true` -> 冒泡到 document。
-   **`blur`**: `composed: false` -> **在 Shadow Root 处停止**。
-   **`focus`**: `composed: false` -> **在 Shadow Root 处停止**。

通过将监听器移动到 `ShadowRoot`，我们将监听器放置在了事件被困住的边界 *内部*。

### Capture Phase (捕获阶段)

对于 `blur` 和 `focus` 事件，我们使用 `{ capture: true }`（或布尔值 `true` 参数）。虽然这些事件不冒泡，但它们确实会在捕获阶段向下传播。更重要的是，使用捕获阶段允许我们在根级别拦截事件，而不需要在具体的每个目标元素上绑定监听器（尽管对于在根节点本身上的非冒泡事件，区别不大，但这是一种良好的委托实践）。

## 实现指南

1.  **使用 `initializeEventListeners`**: 在你的组件中重写此方法来设置监听器。
2.  **使用 `getActiveRoot()`**: 始终通过此辅助方法获取监听器的目标。
3.  **清理**: 确保在 `cleanup()` 或 `onDisconnected` 中从 *同一个* 根节点移除监听器。

```typescript
protected initializeEventListeners(): void {
    const root = this.getActiveRoot();
    root.addEventListener("blur", this.handler, true);
}

protected cleanup(): void {
    const root = this.getActiveRoot();
    root.removeEventListener("blur", this.handler, true);
}
```

## 采用情况

此模式已被 `BaseComponent.ts` 采纳，用于修复 WebComponents 中的标准表单行为。所有未来依赖低级事件处理的核心组件和用户界面组件都必须遵循此模式。
