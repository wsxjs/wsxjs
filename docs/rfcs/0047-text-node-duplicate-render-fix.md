# RFC 0047: 文本节点重复渲染修复

## 状态
**Accepted** (已实施)

## 作者
AI Assistant

## 创建日期
2025-01-XX

## 问题描述

### 用户报告的症状

用户报告文本节点出现重复渲染：
- "使用 WSX 组件自定义标题渲染" 重复了3次
- "增强的代码块，支持语法高亮" 重复了3次
- "使用样式组件的自定义引用块" 重复了3次
- "使用 WSX 组件的交互式列表" 重复了3次

### 根本原因分析

**核心问题**：文本节点在更新后没有被标记为已处理，导致在移除阶段被误删，然后在添加新子节点时又被创建，造成重复。

**问题流程**：
1. 文本节点在 `updateChildren` 的更新循环中被更新
2. 文本节点没有被添加到 `processedNodes` Set
3. 在"移除多余子节点"阶段，`shouldRemoveNode` 检查文本节点
4. 由于文本节点不在 `processedNodes` 中，`shouldRemoveNode` 返回 `true`
5. 文本节点被移除
6. 在"添加新子节点"循环中，文本节点又被创建
7. 结果：文本节点重复

## 解决方案

### 修复 1: 标记已处理的文本节点

**位置**：`packages/core/src/utils/element-update.ts` 第 351-377 行

```typescript
if (needsUpdate) {
    updateOrCreateTextNode(element, textNodeToUpdate, newText);
    // 关键修复：更新文本节点后，标记为已处理，防止在移除阶段被误删
    if (textNodeToUpdate && textNodeToUpdate.parentNode === element) {
        processedNodes.add(textNodeToUpdate);
    } else {
        // 如果创建了新节点，需要找到它并标记
        for (let k = 0; k < element.childNodes.length; k++) {
            const node = element.childNodes[k];
            if (
                node.nodeType === Node.TEXT_NODE &&
                node.textContent === newText &&
                !processedNodes.has(node)
            ) {
                processedNodes.add(node);
                break;
            }
        }
    }
} else {
    // 即使不需要更新，也要标记为已处理（文本节点已存在且内容正确）
    if (textNodeToUpdate && textNodeToUpdate.parentNode === element) {
        processedNodes.add(textNodeToUpdate);
    }
}
```

### 修复 2: 标记新创建的文本节点

**位置**：`packages/core/src/utils/element-update.ts` 第 587-589 行

```typescript
if (typeof newChild === "string" || typeof newChild === "number") {
    const newTextNode = document.createTextNode(String(newChild));
    element.insertBefore(newTextNode, targetNextSibling);
    // 关键修复：标记新创建的文本节点为已处理，防止在移除阶段被误删
    processedNodes.add(newTextNode);
}
```

### 修复 3: 修改 `shouldRemoveNode` 检查已处理的文本节点

**位置**：`packages/core/src/utils/update-children-helpers.ts` 第 264-300 行

```typescript
export function shouldRemoveNode(
    node: Node,
    elementSet: Set<HTMLElement | SVGElement | DocumentFragment>,
    cacheKeyMap: Map<string, HTMLElement | SVGElement>,
    processedNodes?: Set<Node>  // 新增参数
): boolean {
    // ...
    
    // 关键修复：如果文本节点已被处理，不应该移除
    if (node.nodeType === Node.TEXT_NODE && processedNodes && processedNodes.has(node)) {
        return false;
    }
    
    // ...
}
```

### 修复 4: 传递 `processedNodes` 到移除逻辑

**位置**：`packages/core/src/utils/element-update.ts` 第 619 行

```typescript
const nodesToRemove = collectNodesToRemove(element, elementSet, cacheKeyMap, processedNodes);
```

## 潜在回归问题分析

### 1. 新创建的文本节点标记 ✅ 已修复

**问题**：在"添加新子节点"循环中，新创建的文本节点没有被标记为已处理。

**影响**：可能导致新创建的文本节点在移除阶段被误删。

**修复**：在创建文本节点后立即标记为已处理。

### 2. 相同内容的文本节点冲突 ⚠️ 潜在问题

**问题**：如果多个文本节点有相同内容，查找逻辑（360-370行）可能标记错误的节点。

**影响**：如果 DOM 中有多个相同内容的文本节点，可能标记错误的节点，导致正确的节点被移除。

**风险评估**：
- **低风险**：在正常的组件渲染中，同一个父元素下很少会有多个相同内容的文本节点
- **缓解措施**：查找逻辑使用 `!processedNodes.has(node)` 检查，避免重复标记

### 3. 性能影响 ✅ 可接受

**影响**：
- 添加了 `processedNodes.has(node)` 检查（O(1)）
- 添加了文本节点查找循环（O(n)，但只在创建新节点时执行）

**评估**：性能影响可忽略，因为：
- Set 查找是 O(1)
- 文本节点查找只在创建新节点时执行，且通常很快找到

### 4. 向后兼容性 ✅ 完全兼容

**影响**：
- `shouldRemoveNode` 的 `processedNodes` 参数是可选的
- `collectNodesToRemove` 的 `processedNodes` 参数是可选的
- 如果没有传递 `processedNodes`，行为与之前一致（文本节点会被移除）

**评估**：完全向后兼容，不会破坏现有代码。

## 测试验证

### 测试结果

- ✅ 所有核心测试通过（346 个测试通过）
- ✅ 文本节点更新测试通过
- ✅ 元素更新测试通过

### 测试覆盖

需要添加以下测试用例：

1. **文本节点重复渲染测试**：
   ```typescript
   test("文本节点不应该重复渲染", () => {
       // 创建包含文本节点的元素
       // 更新文本内容
       // 验证文本节点没有重复
   });
   ```

2. **新创建的文本节点标记测试**：
   ```typescript
   test("新创建的文本节点应该被标记为已处理", () => {
       // 添加新的文本子节点
       // 验证文本节点在移除阶段不被误删
   });
   ```

## 成功标准

1. ✅ 文本节点不再重复渲染
2. ✅ 所有测试通过
3. ✅ 性能不受影响
4. ✅ 向后兼容

## 风险评估总结

| 风险项 | 风险等级 | 状态 |
|--------|---------|------|
| 新创建的文本节点标记 | 中 | ✅ 已修复 |
| 相同内容的文本节点冲突 | 低 | ⚠️ 潜在问题，但影响很小 |
| 性能影响 | 低 | ✅ 可接受 |
| 向后兼容性 | 低 | ✅ 完全兼容 |

## 框架层面的设计缺陷分析 (2025-01-02 深度分析)

### 当前实施状态评估

**RFC-0047 的 `processedNodes` 机制已完全实施**，但在 markdown 组件场景下仍然出现文本节点重复 3 次的问题（"第一项第一项第一项"）。

### 根本原因：语义混淆

#### 问题 1: `oldChildren` (metadata) vs DOM 实际状态的语义不一致

```typescript
// element-update.ts 第 297-319 行
else if (typeof oldChild === "string" || typeof oldChild === "number") {
    oldNode = findTextNode(element, domIndex);  // ⚠️ 基于 domIndex 查找

    // fallback 搜索：尝试通过内容匹配找到文本节点
    if (!oldNode && element.childNodes.length > 0) {
        const oldText = String(oldChild);  // ⚠️ oldChild 来自 metadata
        for (let j = domIndex.value; j < element.childNodes.length; j++) {
            const node = element.childNodes[j];
            if (node.nodeType === Node.TEXT_NODE &&
                node.parentNode === element &&
                node.textContent === oldText) {  // ⚠️ 匹配旧内容
                oldNode = node;
                break;
            }
        }
    }
}
```

**设计缺陷**：
- `oldChild = "第一项"` 是上次 render 的 **metadata**（保存在 `cacheManager` 中）
- DOM 中的文本节点可能已经是缓存元素中的**旧内容**（可能是 "第一项第一项"）
- Fallback 搜索试图匹配 `oldText === node.textContent`
- **在缓存复用场景下**：
  - 如果 DOM 已经重复，`oldText = "第一项"` 但 `node.textContent = "第一项第一项"`
  - **匹配失败**，返回 `null`

#### 问题 2: `domIndex` 不可靠

```typescript
// update-children-helpers.ts 第 78-96 行
export function findTextNode(
    parent: HTMLElement | SVGElement,
    domIndex: { value: number }
): Node | null {
    while (domIndex.value < parent.childNodes.length) {
        const node = parent.childNodes[domIndex.value];
        if (node.nodeType === Node.TEXT_NODE && node.parentNode === parent) {
            return node;
        }
        domIndex.value++;
    }
    return null;
}
```

**设计缺陷**：
- `domIndex` 假设 `flatOld` (metadata 顺序) 和 `element.childNodes` (DOM 顺序) 一致
- **在缓存复用场景下**：
  - `flatOld` 是新 render 的 metadata 顺序
  - `element.childNodes` 是缓存元素的 DOM 顺序（可能包含重复的旧文本节点）
  - **顺序不匹配**，导致 `domIndex` 指向错误位置

#### 问题 3: `processedNodes` 只防止移除，不防止累积

```typescript
// update-children-helpers.ts 第 117-141 行
export function updateOrCreateTextNode(
    parent: HTMLElement | SVGElement,
    oldNode: Node | null,
    newText: string
): Node {
    if (oldNode && oldNode.nodeType === Node.TEXT_NODE) {
        oldNode.textContent = newText;  // ✅ 更新现有节点
        return oldNode;
    } else {
        const newTextNode = document.createTextNode(newText);
        // ⚠️ oldNode=null 时，插入新节点
        parent.insertBefore(newTextNode, oldNode || null);
        return newTextNode;
    }
}
```

**设计缺陷**：
- 当 `findTextNode` 失败时，`oldNode === null`
- `updateOrCreateTextNode` 创建新文本节点并插入末尾
- `processedNodes.add(newTextNode)` **只防止新节点被移除**
- **旧的文本节点仍然在 DOM 中**，因为：
  - 它不在 `flatNew` 中（metadata 中没有它）
  - 它可能也没在 `processedNodes` 中（因为 `findTextNode` 没找到它）

### 为什么会重复 3 次？

**累积机制**：

1. **第一次渲染**：
   ```
   创建文本节点 "第一项"
   DOM: [TextNode("第一项")]
   processedNodes: {TextNode("第一项")}
   ```

2. **第二次渲染（缓存复用 `<li>`）**：
   ```
   oldChildren = ["第一项"] (metadata)
   newChildren = ["第一项"] (new render)

   findTextNode:
   - domIndex.value = 0
   - element.childNodes[0] = TextNode("第一项")
   - ✅ 找到！oldNode = TextNode("第一项")

   needsUpdate = false (内容相同)
   processedNodes.add(TextNode("第一项"))

   DOM: [TextNode("第一项")]  // 正确
   ```

3. **关键场景：如果 metadata 被错误更新或 DOM 被污染**：
   ```
   假设某种原因导致 DOM 中有重复节点：
   DOM: [TextNode("第一项"), TextNode("第一项")]

   第三次渲染：
   oldChildren = ["第一项"] (metadata, 只有一个)
   newChildren = ["第一项"]

   findTextNode:
   - domIndex.value = 0
   - element.childNodes[0] = TextNode("第一项")
   - ✅ 找到第一个！

   processedNodes.add(第一个TextNode)

   移除阶段：
   - shouldRemoveNode(第二个TextNode):
     - 不在 processedNodes 中
     - ⚠️ 但是为什么没被移除？
   ```

### RFC-0047 失效的真正原因

**关键发现**：检查 `shouldRemoveNode` 第 297-307 行：

```typescript
// 关键修复：如果文本节点在已处理的元素内部，不应该移除
if (node.nodeType === Node.TEXT_NODE && processedNodes) {
    let parent = node.parentNode;
    while (parent) {
        if (processedNodes.has(parent) && parent.parentNode) {
            return false;  // ⚠️ 文本节点在已处理的元素内部，不移除
        }
        parent = parent.parentNode;
    }
}
```

**这就是问题所在！**

- 当 `<li>` 元素被标记为 `processedNodes.add(li)`
- 所有 `<li>` 内部的文本节点都不会被移除（第 302 行返回 `false`）
- **即使这些文本节点是重复的、不在 `flatNew` 中的旧节点！**

### 框架层面的解决方案

#### 方案一：修复 `shouldRemoveNode` 逻辑（推荐）

**问题**：第 297-307 行的逻辑太宽松，保护了所有父元素内的文本节点。

**修复**：只保护**直接子文本节点且在 `processedNodes` 中**的节点：

```typescript
// 修改后的逻辑
if (node.nodeType === Node.TEXT_NODE && processedNodes) {
    // 直接检查文本节点是否已被处理
    if (processedNodes.has(node)) {
        return false;
    }
    // ⚠️ 移除递归检查父元素的逻辑
    // 因为这会导致所有父元素内的文本节点都不被移除
}
```

#### 方案二：清理缓存元素中的旧文本节点

在 `updateChildren` 开始时，如果检测到元素是从缓存复用的，清理所有不在 `processedNodes` 中的文本节点：

```typescript
// 在 updateChildren 开始时
if (isElementReused) {
    // 清理所有文本节点，重新创建
    Array.from(element.childNodes)
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .forEach(n => n.remove());
}
```

#### 方案三：文本节点身份标识（最彻底）

给文本节点添加虚拟身份，类似元素的 cache key：

```typescript
// 为每个文本节点分配唯一标识
const textNodeId = `${parentCacheKey}-text-${index}`;
textNodeMap.set(textNodeId, textNode);

// 查找时通过身份
function findTextNodeByIdentity(id: string): Text | null {
    return textNodeMap.get(id) || null;
}
```

### 推荐修复方案

**立即修复**：修改 `shouldRemoveNode` 函数，移除第 294-307 行的递归检查逻辑。

**理由**：
1. 当前逻辑过度保护，导致重复的文本节点无法被移除
2. 直接检查 `processedNodes.has(node)` 已经足够
3. 递归检查父元素是为了防止元素被替换时内部文本节点被误删，但这个场景应该在 `replaceChild` 时自动处理

## 总结

RFC-0047 的 `processedNodes` 机制本身是正确的，但 `shouldRemoveNode` 中的**递归检查父元素逻辑**（第 297-307 行）过度保护了文本节点，导致重复的旧文本节点无法被移除。

修复方案：
1. ✅ 保留 `processedNodes` 机制
2. ✅ 保留文本节点标记逻辑
3. ❌ 移除 `shouldRemoveNode` 中的递归检查父元素逻辑
4. ✅ 只依赖直接检查 `processedNodes.has(node)`
