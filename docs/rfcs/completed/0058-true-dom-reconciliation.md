# RFC 0058: 真实 DOM 协调 (True DOM Reconciliation)

- **RFC编号**: 0058
- **开始日期**: 2026-01-23
- **状态**: Accepted
- **替代**: RFC 0011, RFC 0046

## 摘要

本 RFC 提议修改 `WebComponent` 的核心渲染逻辑，从目前的"全量替换 (Nuke & Pave)"迁移到基于 `packages/core/src/utils/element-update.ts` 的"真实 DOM 协调 (True DOM Reconciliation)"。这将彻底解决焦点丢失、Input 事件中断等问题，并使得 RFC 0011 (Focus Preservation) 和 RFC 0046 (Babel Plugin for Focus) 变得不再必要。

## 动机

### 当前问题

目前的 WSX 框架在 `WebComponent` 重渲染时，主要采用以下策略：
1.  **全量替换**: 生成新的 DOM 树，清空 `shadowRoot`，然后插入新 DOM。
2.  **焦点补丁**: 由于 DOM 被替换，焦点会丢失。RFC 0011 引入了复杂的 `captureFocusState` 和 `restoreFocusState` 机制来在重渲染前后保存和恢复焦点。
3.  **Babel 插件**: RFC 0046 引入（或重设计）了 Babel 插件来生成 `data-wsx-key`，以便在 DOM 替换后找到对应的元素进行焦点恢复。

虽然这套机制勉强能工作，但存在严重缺陷：
-   **Input 事件中断**: 在用户连续输入时，如果触发重渲染（例如 `onInput` 更新 state），DOM 的替换可能导致某些输入法 (IME) 或连续事件被中断。
-   **性能开销**: 销毁并重建整个 DOM 树在复杂组件中通过是昂贵的。
-   **维护成本**: 焦点管理逻辑复杂且脆弱，Babel 插件增加了构建时的复杂性。

### 解决方案：真实 DOM 协调

我们已经在 `packages/core/src/utils/element-update.ts` 中实现了基于 RFC 0037 的高效 DOM 协调工具 (`reconcileElement`, `updateChildren`)。这些工具可以比对新旧 DOM 节点：
-   如果节点类型相同，仅更新变化的属性（`updateProps`）。
-   如果节点类型不同，才进行替换。
-   文本节点仅更新文本内容。

通过将这套逻辑集成到 `WebComponent._rerender` 中，我们可以实现**原地更新** (In-place Update)。这意味着：
-   `input` 元素不会被销毁，焦点自然保持。
-   事件监听器保持绑定，不需要反复移除添加。
-   不再需要 `data-wsx-key` 来手动恢复焦点。

这将使得 RFC 0011 和 RFC 0046 的变通方案彻底过时。

## 详细设计

### 修改 `WebComponent._rerender`

当前的 `_rerender` 实现（简化版）：

```typescript
protected _rerender(): void {
    const content = this.render();
    this.shadowRoot.innerHTML = ''; // Nuke
    this.shadowRoot.appendChild(content); // Pave
    this.restoreFocusState(...); // Fix focus
}
```

新的 `_rerender` 实现：

```typescript
protected _rerender(): void {
    // 渲染新内容
    const newContent = RenderContext.runInContext(this, () => this.render());
    
    // 检查是否可以进行协调
    const oldChildren = Array.from(this.shadowRoot.children).filter(c => !isStyleElement(c));
    
    // 简单场景：单根节点对单根节点
    if (oldChildren.length === 1 && newContent instanceof HTMLElement) {
        const oldRoot = oldChildren[0] as HTMLElement;
        if (oldRoot.tagName === newContent.tagName) {
            // 原地协调！
            reconcileElement(oldRoot, newContent);
            return;
        }
    }
    
    // 复杂场景：使用 updateChildren 或者回退到替换
    // ...
}
```

### 废弃旧机制

一旦实现了上述逻辑，我们可以：
1.  标记 `RFC 0011` 和 `RFC 0046` 为 `Deprecated`。
2.  在 `BaseComponent` 中保留 `captureFocusState` 作为安全网，但在主流程中不再强依赖它。
3.  最终移除 `babel-plugin-wsx-focus`。

## 迁移计划

1.  **实现协调逻辑**: 修改 `WebComponent` 和 `LightComponent` 以优先使用 `reconcileElement`。
2.  **验证**: 确保 `input` 输入流畅，焦点不丢失。
3.  **清理**: 移除对 RFC 0046 Babel 插件的依赖（可选，或保留作为兼容性）。

## 影响

-   **性能**: 重渲染性能将大幅提升。
-   **代码量**: 删除大量用于焦点恢复的胶水代码。
-   **用户体验**: 输入体验将与原生 DOM 一致，无闪烁，无中断。
