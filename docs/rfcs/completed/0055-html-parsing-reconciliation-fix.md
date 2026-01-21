# RFC 0055: HTML 解析与协调逻辑修复

## 摘要 (Summary)

本 RFC 记录了 `wsx-core` 中一项关键的修复，该修复解决了混合内容（如 Markdown 渲染生成的 HTML 字符串）在协调（Reconciliation）过程中被错误移除的问题。通过改进 `shouldRemoveNode` 逻辑和重复内容检测机制，确保了从字符串解析出的 DOM 元素能够被正确保留和更新。

## 背景 (Background)

在开发 `wsx-marked-components`（Markdown 渲染器）演示时，发现了一个严重问题：当 Markdown 内容包含混合的文本和 HTML 标签（例如 `**粗体**` 或 `[链接](...)`）时，首次渲染正确，但在随后的协调更新（Re-render）中，这些 HTML 元素会消失，只剩下纯文本。

WSX 框架具有自动检测字符串中 HTML 内容并将其解析为 DOM 节点的功能（`isHTMLString` 和 `parseHTMLToNodes`）。问题出在核心协调器（Reconciler）如何跟踪和清理这些动态生成的节点。

## 根本原因分析 (Root Cause Analysis)

### 1. 元素清理逻辑缺陷

在 `packages/core/src/utils/update-children-helpers.ts` 中，`shouldRemoveNode` 函数负责决定哪些 DOM 节点应该从父容器中移除。

原有的逻辑存在缺陷：它只检查了 `Text` 节点是否在 `processedNodes`（已处理节点集合）中。对于 `HTMLElement` 和 `SVGElement`，如果它们不是由框架的 `h()` 函数直接创建（即没有 `__wsxCacheKey`），且不属于 `elementSet`（新 VDOM 集合），它们就会被标记为需要移除。

由于从 HTML 字符串解析出的元素是动态生成的，它们没有 `__wsxCacheKey`，也不存在于 `elementSet` 中（因为 VDOM 中只有字符串）。因此，它们在更新时总是被错误地删除。

### 2. 重复内容检测回归

为了优化性能，协调器包含一个逻辑：如果发现 DOM 中已经存在内容完全相同的元素（且没有 Cache Key），则复用该元素，跳过新的插入操作。

然而，该逻辑存在一个回归缺陷：当它决定“复用”现有元素时，没有将该元素添加到 `processedNodes` 集合中。结合上述第 1 点的严格清理逻辑，这导致这些本来应该被“复用”的元素，随后立即被 `shouldRemoveNode` 判为“未处理”并删除。这在特定排版（如带有换行的 Markdown）下尤为明显。

## 解决方案 (Solution)

### 1. 修复元素保护逻辑

更新了 `shouldRemoveNode` 函数，使其检查**所有**节点类型的 `processedNodes` 状态。只要节点被标记为“已处理”（无论是文本还是元素），就予以保留。

```typescript
// packages/core/src/utils/update-children-helpers.ts

const isProcessed = processedNodes && processedNodes.has(node);

if (isProcessed) {
    return false; // 现在也能保护 Element 类型的节点
}
```

### 2. 修复重复检测逻辑 (Regression Fix)

在 `replaceOrInsertElementAtPosition` 函数的重复内容检测分支中，添加了缺失的 `processedNodes.add()` 调用。

```typescript
// packages/core/src/utils/update-children-helpers.ts

// 找到相同内容的元素（且都没有 cache key），不需要插入 newChild
// 这是从 HTML 字符串解析而来的重复元素
if (
    !existingCacheKey &&
    existingNode.tagName.toLowerCase() === newChildTag &&
    existingNode.textContent === newChildContent &&
    existingNode !== newChild
) {
    // 关键修复：必须将其标记为已处理，否则会被 shouldRemoveNode 移除
    if (processedNodes) processedNodes.add(existingNode);
    return;
}
```

## 验证 (Verification)

### 自动化测试
核心测试套件 (`turbo test --filter @wsxjs/wsx-core`) 全部通过，确认没有引入新的回归。

### 手动验证
使用 Marked Demo (`http://localhost:5173/marked`) 进行了验证：
-   **输入**: 包含中文、粗体、斜体、链接和代码块的复杂 Markdown 文本。
-   **结果**: 所有元素在多次渲染循环后均保持稳定，样式正确应用，未出现内容丢失现象。
