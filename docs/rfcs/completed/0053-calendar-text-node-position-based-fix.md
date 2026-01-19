# RFC 0053: 日历组件文本节点基于位置匹配修复

- **状态**: Accepted (已实施)
- **作者**: AI Assistant
- **创建日期**: 2025-01-XX
- **完成日期**: 2025-01-XX
- **依赖**: RFC 0048

## 1. 摘要

本 RFC 记录了日历组件中文本节点错误注入问题的根本原因分析和修复方案。问题表现为：当从 3 月切换到 4 月时，3 月的日期文本节点（如 "30"）被错误地保留并注入到 4 月的第一个日期位置。

## 2. 问题描述

### 2.1 用户报告的症状

在 `wsx-calendar` 组件中，当切换月份时：
- 从 3 月切换到 4 月时，4 月的第一个日期位置显示了 "30"（3 月的最后一个日期）
- 从 4 月切换到 5 月时，5 月的第一个日期位置显示了 "3"（4 月的最后一个日期）
- 问题在多次切换月份后变得更加明显，出现多个错误的文本节点注入

### 2.2 问题场景

```
3 月日历：
[1] [2] [3] ... [28] [29] [30]

切换到 4 月后（错误）：
[30] [1] [2] [3] ...  // "30" 被错误地注入到第一个位置

正确的 4 月日历应该是：
[1] [2] [3] ... [28] [29] [30]
```

## 3. 根本原因分析

### 3.1 核心问题

问题的根源在于 `updateOrCreateTextNode` 函数中的**内容匹配搜索逻辑**：

1. **内容匹配导致错误匹配**：
   - 当 `oldNode` 为 null 时（位置不匹配），函数会搜索整个 `parent.childNodes` 来查找相同内容的文本节点
   - 例如：3 月的 "30" 在底部行，4 月的第一个日期是 "1"，但代码找到了 "30" 并错误地将其匹配到 "1" 的位置

2. **位置信息丢失**：
   - `updateOrCreateTextNode` 函数不知道应该插入到哪个位置
   - 当 `oldNode` 为 null 时，`parent.insertBefore(newTextNode, oldNode || null)` 会将新节点插入到末尾，而不是正确的位置

3. **文本节点清理不彻底**：
   - 当 `oldNode` 为 null 且 `oldText === newText` 时，代码会跳过更新
   - 这导致旧的文本节点（如 3 月的 "30"）不会被标记为已处理，也不会被清理

### 3.2 问题流程

```
1. 从 3 月切换到 4 月
2. updateChildren 遍历 newChildren（4 月的日期）
3. 对于第一个日期 "1"：
   - oldChild = "30" (3 月的最后一个日期)
   - newChild = "1" (4 月的第一个日期)
   - findTextNode 返回 null（位置不匹配）
   - oldNode = null
4. updateOrCreateTextNode 被调用，oldNode 为 null
5. ❌ 旧代码：搜索相同内容的文本节点，找到 "30"，错误匹配
6. ❌ 或者：创建新节点但插入到错误位置
7. 旧的 "30" 文本节点没有被标记为已处理
8. 清理阶段：旧的 "30" 没有被移除
9. 结果：4 月的第一个位置显示了 "30"
```

## 4. 解决方案

### 4.1 核心修复原则

遵循 **RFC 0048** 的原则：**文本节点应该基于位置匹配，而不是内容匹配**。

### 4.2 修复 1: 移除内容匹配搜索逻辑

**位置**：`packages/core/src/utils/update-children-helpers.ts` - `updateOrCreateTextNode` 函数

**修复前**：
```typescript
} else {
    // 如果 oldNode 为 null，先检查是否已经存在相同内容的直接子文本节点
    if (!oldNode) {
        for (let i = 0; i < parent.childNodes.length; i++) {
            const node = parent.childNodes[i];
            if (
                node.nodeType === Node.TEXT_NODE &&
                node.parentNode === parent &&
                node.textContent === newText
            ) {
                // 找到相同内容的直接子文本节点，返回它而不是创建新节点
                return node;  // ❌ 错误：基于内容匹配
            }
        }
    }
    // ...
}
```

**修复后**：
```typescript
} else {
    // RFC 0048 & RFC 0053 关键修复：文本节点应该基于位置匹配，而不是内容匹配
    // 当 oldNode 为 null 时，直接创建新节点，不进行内容匹配搜索
    // 这防止了日历等场景中相同内容在不同位置被错误匹配的问题
    // 例如：3 月的 "30" 在底部行，4 月的第一个日期是 "1"，不应该将 "30" 错误匹配到 "1" 的位置
    // 如果 oldNode 为 null，说明在当前位置没有找到对应的文本节点，应该创建新节点

    const newTextNode = document.createTextNode(newText);
    // ...
}
```

### 4.3 修复 2: 添加 insertBeforeNode 参数

**位置**：`packages/core/src/utils/update-children-helpers.ts` - `updateOrCreateTextNode` 函数签名

**修复**：
- 添加 `insertBeforeNode?: Node | null` 参数
- 使用该参数来指定新节点的插入位置，而不是插入到末尾

```typescript
export function updateOrCreateTextNode(
    parent: HTMLElement | SVGElement,
    oldNode: Node | null,
    newText: string,
    insertBeforeNode?: Node | null  // ✅ 新增参数
): Node {
    // ...
    } else {
        const newTextNode = document.createTextNode(newText);
        if (oldNode && !shouldPreserveElement(oldNode)) {
            parent.replaceChild(newTextNode, oldNode);
        } else {
            // ✅ 使用 insertBeforeNode 参数来指定插入位置
            parent.insertBefore(newTextNode, insertBeforeNode !== undefined ? insertBeforeNode : (oldNode || null));
        }
        return newTextNode;
    }
}
```

### 4.4 修复 3: 传递正确的插入位置

**位置**：`packages/core/src/utils/element-update.ts` - `updateChildren` 函数

**修复**：
- 在调用 `updateOrCreateTextNode` 时，传递基于 `domIndex` 的 `insertBeforeNode` 参数

```typescript
// RFC 0048 & RFC 0053 关键修复：传递 insertBeforeNode 参数来指定插入位置
// 当 oldNode 为 null 时，需要插入到正确的位置（基于 domIndex）
const insertBeforeNode = domIndex.value < element.childNodes.length 
    ? element.childNodes[domIndex.value] 
    : null;
const updatedNode = updateOrCreateTextNode(element, oldNode, newText, insertBeforeNode);
```

### 4.5 修复 4: 处理 oldNode 为 null 但 oldText === newText 的情况

**位置**：`packages/core/src/utils/element-update.ts` - `updateChildren` 函数

**修复**：
- 当 `oldNode` 为 null 时，即使 `oldText === newText`，也应该创建新节点
- 这确保旧的文本节点（如 3 月的 "30"）不会被错误地保留在新位置

```typescript
} else {
    // 即使不需要更新，也要标记为已处理（文本节点已存在且内容正确）
    if (oldNode && oldNode.parentNode === element) {
        processedNodes.add(oldNode);
    } else if (oldNode === null) {
        // RFC 0048 & RFC 0053 关键修复：当 oldNode 为 null 时，即使 oldText === newText，也应该创建新节点
        // 因为位置不匹配，旧的文本节点（如 3 月的 "30"）不应该被错误地保留在 4 月的位置
        // 如果 oldNode 为 null，说明在当前位置没有找到对应的文本节点，应该创建新节点
        const insertBeforeNode = domIndex.value < element.childNodes.length 
            ? element.childNodes[domIndex.value] 
            : null;
        const updatedNode = updateOrCreateTextNode(element, null, newText, insertBeforeNode);
        if (updatedNode && !processedNodes.has(updatedNode)) {
            processedNodes.add(updatedNode);
        }
    }
}
```

### 4.6 修复 5: 修复 shouldRemoveNode 对文本节点的处理

**位置**：`packages/core/src/utils/update-children-helpers.ts` - `shouldRemoveNode` 函数

**修复**：
- 文本节点应该由框架管理，不应该被 `shouldPreserveElement` 自动保留
- 只有当文本节点的父元素是保留元素时，文本节点才应该被保留

```typescript
export function shouldRemoveNode(
    node: Node,
    elementSet: Set<HTMLElement | SVGElement | DocumentFragment>,
    cacheKeyMap: Map<string, HTMLElement | SVGElement>,
    processedNodes?: Set<Node>
): boolean {
    // RFC 0048 & RFC 0053 关键修复：文本节点应该由框架管理，不应该被 shouldPreserveElement 保留
    // 文本节点本身不是元素，shouldPreserveElement 对文本节点总是返回 true
    // 但是，如果文本节点的父元素是由框架管理的，文本节点也应该由框架管理
    // 只有当文本节点的父元素是保留元素时，文本节点才应该被保留
    if (node.nodeType === Node.TEXT_NODE) {
        // 检查文本节点的父元素是否是保留元素
        const parent = node.parentNode;
        if (parent && (parent instanceof HTMLElement || parent instanceof SVGElement)) {
            if (shouldPreserveElement(parent)) {
                // 如果父元素是保留元素，文本节点也应该被保留
                return false;
            }
        }
        // 如果父元素不是保留元素，文本节点应该由框架管理
        // 继续检查是否应该被移除
    } else {
        // 对于元素节点，使用原有的逻辑
        if (shouldPreserveElement(node)) {
            return false;
        }
    }
    // ...
}
```

## 5. 实施细节

### 5.1 修改的文件

1. `packages/core/src/utils/update-children-helpers.ts`
   - `updateOrCreateTextNode` 函数：移除内容匹配搜索，添加 `insertBeforeNode` 参数
   - `shouldRemoveNode` 函数：修复文本节点的处理逻辑

2. `packages/core/src/utils/element-update.ts`
   - `updateChildren` 函数：传递 `insertBeforeNode` 参数，处理 `oldNode` 为 null 的情况

### 5.2 关键修复点

1. **位置匹配优先**：文本节点匹配完全基于位置（通过 `domIndex`），不再进行内容匹配
2. **正确的插入位置**：新节点插入到基于 `domIndex` 的正确位置，而不是末尾
3. **彻底的清理**：旧的文本节点被正确标记和清理，不会残留

## 6. 测试验证

### 6.1 测试场景

1. **基本场景**：从 3 月切换到 4 月，确认 "30" 不再出现在 4 月的第一个位置
2. **多次切换**：连续切换月份多次，确认没有文本节点累积
3. **边界情况**：切换到不同年份的相同月份，确认文本节点正确更新

### 6.2 预期结果

- ✅ 切换月份时，旧的日期文本节点被正确清理
- ✅ 新的日期文本节点插入到正确的位置
- ✅ 没有文本节点重复或错误注入

## 7. 相关 RFC

- [RFC-0048](./0048-reconciliation-architecture-realignment.md): 核心和解算法架构重构
- [RFC-0047](./0047-text-node-duplicate-render-fix.md): 文本节点重复渲染修复

## 8. 完成标准

- ✅ 移除了 `updateOrCreateTextNode` 中的内容匹配搜索逻辑
- ✅ 添加了 `insertBeforeNode` 参数来指定插入位置
- ✅ 修复了 `shouldRemoveNode` 对文本节点的处理
- ✅ 处理了 `oldNode` 为 null 但 `oldText === newText` 的情况
- ✅ 所有修复都遵循 RFC 0048 的位置匹配原则

## 9. 总结

本 RFC 修复了日历组件中文本节点错误注入的问题。核心修复是遵循 RFC 0048 的原则，**完全基于位置匹配文本节点，而不是内容匹配**。这确保了在日历等场景中，相同内容在不同位置不会被错误匹配，旧的文本节点会被正确清理，新的文本节点会插入到正确的位置。

## 10. 附录：向前导航 Bug (Keyed Node Transition) 修复

### 10.1 问题描述

在修复了文本节点问题后，发现日历组件在向前导航（如 3 月 -> 4 月）时，4 月的最后一个日期丢失。

**场景**：
- 旧列表（3 月）：[A, B, C, D, E]（D, E 为跨月显示的 4 月初日期）
- 新列表（4 月）：[D, E, F, G, H]
- 预期结果：5 个节点
- 实际结果：4 个节点（H 丢失）

### 10.2 原因分析

**Off-By-One 插入错误**：
在 `element-update.ts` 中，`replaceOrInsertElement` 函数被错误调用。
该函数设计初衷是替换旧节点，因此它计算插入位置为 `oldNode.nextSibling`。
但在 `updateChildren` 循环中，我们需要精确插入到 `insertionIndex` 指定的位置（即 `insertBeforeNode` 之前）。
通过传递 `insertBeforeNode` 作为 `oldNode` 参数给 `replaceOrInsertElement`，实际上导致新节点被插入到了 `insertBeforeNode` 之后，造成错位。

### 10.3 修复方案

**位置**：`packages/core/src/utils/element-update.ts`

**修复**：
不再调用 `replaceOrInsertElement`，而是直接使用 `element.insertBefore`。

```typescript
// 旧代码
replaceOrInsertElement(element, newChild, insertBeforeNode);

// 新代码
// 确保直接插入到指定位置之前
element.insertBefore(newChild, insertBeforeNode);
```

这一修改消除了基于旧节点位置推导的歧义，严格遵循 `insertionIndex` 确定的逻辑位置。
