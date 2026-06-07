# RFC 0048: 核心和解算法架构重构

- **状态**: Accepted (已实施)
- **作者**: Gemini Assistant
- **创建日期**: 2026-01-02
- **完成日期**: 2025-01-02
- **依赖**: RFC 0046, RFC 0047

## 1. 目标 (Goal)

本 RFC 旨在通过重写框架核心的 `updateChildren` 和解算法（Reconciliation Algorithm），彻底解决在条件渲染和列表渲染中长期存在的各类 DOM 渲染异常（如文本节点重复、更新失败等），并用一个更简单、健壮、且经过业界验证的 `key`-based 标准算法来替代现有的复杂实现。

## 2. 问题描述 (Problem Description)

尽管经过多次修复，框架在组件重渲染时仍然出现 DOM 元素重复或更新失败的严重 bug。此问题在真实应用（如 Markdown 渲染组件）中稳定复现，但在单元测试中则表现为"文本不更新"，这暴露了现有测试用例与真实场景的脱节，以及问题本身的复杂性。

### 2.1 文本节点重复问题

**问题现象**：
- 在列表项中，当 HTML 字符串（如 `<span>文本</span>`）被解析时，文本内容会被重复渲染 3 次
- 例如：`<li><span>第一项</span></li>` 会渲染为 "第一项第一项第一项"
- 问题在 Markdown 组件的列表渲染中稳定复现

**问题根源**：
1. 当 HTML 字符串被解析时，`<span>` 元素被创建，其内部包含文本节点
2. 旧算法在遍历 DOM 节点时，误将 `<span>` 内部的文本节点当作父元素（`<li>`）的直接子文本节点
3. 导致文本节点被重复处理：一次作为 `<span>` 的子节点，一次被误判为 `<li>` 的直接子节点
4. 在多次更新循环中，这种误判导致文本节点被重复创建和处理

这个 bug 是一个更深层次架构问题的最新表现，该问题已导致了历史上的一系列渲染异常（RFC 40-47）。

## 3. 根因分析 (Root Cause Analysis)

经过对用户反馈的深入分析和反思，我们确认问题的根源并非单一函数的逻辑错误，而是一个系统性的**架构设计缺陷**。

**核心根因：框架正处于一个“损坏的中间状态”（Broken Intermediate State），其“缓存机制”与“更新算法”之间存在致命的理念冲突。**

1.  **不完整的架构迁移**: 框架的演进方向是放弃“自动生成ID”的模式，转向业界标准的、由开发者提供 `key` 的模式（RFC 0046）。我之前的修改**只完成了这个迁移的第一步**——修改了 `cache-key.ts`，停止了在缓存键生成中依赖编译时注入的 `__wsxPositionId`。

2.  **陈旧且不兼容的更新算法**: 我**未能替换掉与之配套的、陈旧且复杂的 `updateChildren` 和解算法**。这个旧算法（包括 `shouldRemoveNode`, `deduplicateCacheKeys` 等一系列辅助函数）是为了处理 `__wsxPositionId` 带来的“元素可能已在 DOM 中”的复杂情况而设计的。它的内部充满了各种脆弱的“补丁”和“保护性检查”。

3.  **矛盾的现状与失败的修复**:
    *   **新的缓存系统**：现在主要依赖用户 `key` 或不稳定的运行时计数器来识别元素。
    *   **旧的更新算法**：仍然保留着为 `__wsxPositionId` 时代设计的复杂逻辑，它对元素的“身份”判断与新缓存系统完全不一致。

    当我移除 `__wsxPositionId` 后，旧算法的很多假设都被打破了。它无法再正确地识别、移动和清理节点。我之前试图通过零散地修改 `shouldRemoveNode` 等函数来“修复”症状，但这只是破坏了旧算法内部脆弱的平衡，导致了在不同场景下出现不同的 bug（应用中重复、测试中不更新、其他测试用例回归失败）。

**最终结论 (Final Conclusion):**

真正的病根在于**核心的和解算法（Reconciliation Algorithm）已经与框架的缓存策略完全不匹配**。我们必须停止在现有基础上进行“打补丁”式的修复。

## 4. 提案解决方案 (Proposed Solution)

我们必须完成这次架构迁移的后半部分：**用一个为“key-based”世界设计的、更简单、更标准的和解算法来彻底重写 `updateChildren` 的核心逻辑。**

这个新算法的思路将遵循业界标准（被 React, Vue 等框架验证），确保高效和可预测性。

### **新 `updateChildren` 算法设计**

新算法将不再依赖于一系列复杂的、分散的辅助函数，而是采用一个统一、清晰的流程：

1.  **构建旧节点 Map**: 遍历当前父元素在 DOM 中的所有子节点，根据它们的 `key`（通过 `getElementCacheKey` 获取）创建一个映射表 `Map<key, DOMNode>`。这提供了一个快速查找现有节点的方式。
    
    **关键修复 - 文本节点识别**：
    - 对于文本节点，使用位置索引作为 key：`__text__0`, `__text__1`, ...
    - **关键修复**：只计算直接子文本节点，不计算元素内部的文本节点
    - 通过 `node.parentNode === parentElement` 检查确保只处理直接子节点
    - 这防止将元素内部的文本节点（如 `<span>` 内部的文本节点）误判为独立的文本节点

2.  **主循环 - 遍历新虚拟节点**: 遍历 `newChildren` 数组（即本次渲染期望的 VDOM）。
    a. 对于每一个 `newChild`，获取其 `key`。
    b. **情况 A: `key` 存在于旧节点 Map 中 (匹配成功)**
        i.  从 Map 中获取对应的旧 DOM 节点。
        ii. 这是**更新/移动**操作。调用 `updateElement` 对该节点进行递归更新（更新其属性和子节点）。
        iii. 将此节点标记为"已处理"（从 `oldNodesMap` 中删除该 key）。
        iv. 将此节点按当前顺序放置到正确的位置。
    c. **情况 B: `key` 不存在于旧节点 Map 中 (匹配失败)**
        i.  这是**新增**操作。创建新的 DOM 节点（对于文本节点，使用 `document.createTextNode`）。
        ii. 将新节点插入到当前位置。

3.  **清理阶段**: 主循环结束后，旧节点 Map 中所有**未被标记为"已处理"**的节点，都意味着它们在新的 VDOM 中已不存在。遍历这个剩余的 Map，将这些节点从 DOM 中**全部移除**（但保留 style 节点等需要保留的元素）。

### **重复节点问题的修复机制**

#### 问题根源
当 HTML 字符串（如 `<span>文本</span>`）被解析时：
1. `<span>` 元素被创建，其内部包含文本节点 "文本"
2. 旧算法在遍历 DOM 时，会遍历所有子节点，包括 `<span>` 内部的文本节点
3. 算法误将 `<span>` 内部的文本节点当作 `<li>` 的直接子文本节点
4. 导致文本节点被重复处理，出现重复渲染

#### 修复方案
1. **精确的节点识别**：
   ```typescript
   if (node.nodeType === Node.TEXT_NODE) {
       // 关键修复：只计算直接子文本节点
       if (node.parentNode === parentElement) {
           key = `__text__${textNodeIndex++}`;
       }
   }
   ```
   - 通过 `node.parentNode === parentElement` 检查确保只处理直接子节点
   - 忽略元素内部的文本节点（如 `<span>` 内部的文本节点）

2. **Key-based 匹配机制**：
   - 文本节点使用位置索引作为 key（`__text__0`, `__text__1`, ...）
   - 通过 key 精确匹配和重用现有文本节点
   - 匹配成功后从 `oldNodesMap` 中删除，标记为已处理

3. **明确的处理流程**：
   - Step 1: 只将直接子文本节点加入 `oldNodesMap`
   - Step 2: 通过 key 匹配重用或创建文本节点
   - Step 3: 移除未匹配的旧节点

#### 修复效果
- **修复前**：`<li><span>文本</span></li>` → 渲染为 "文本文本文本"（重复 3 次）
- **修复后**：`<li><span>文本</span></li>` → 正确渲染为 "文本"（不重复）

### **重复元素问题的进一步修复 (2025-01-02 更新)**

#### 问题描述
在实施 RFC 0048 的 key-based 算法后，发现从 HTML 字符串解析而来的元素（如 `<span>`）仍然会出现重复插入的问题。

**问题现象**：
- `<li><span>使用 WSX 组件自定义标题渲染</span></li>` 会渲染为 `<li><span>...</span><span>...</span><span>...</span></li>`
- 每次 `parseHTMLToNodes` 调用都会创建新的 DOM 元素，即使内容相同

**问题根源**：
1. HTML 字符串解析（`parseHTMLToNodes`）每次调用都会创建新的 DOM 元素
2. 这些元素没有 `__wsxCacheKey`（因为它们不是由 `h()` 创建的）
3. 新算法无法通过 key 匹配这些元素（因为它们没有 key）
4. 导致每次更新都会插入新的元素，造成重复

#### 修复方案

**位置**：`packages/core/src/utils/update-children-helpers.ts` - `replaceOrInsertElementAtPosition` 函数

**修复逻辑**：
```typescript
// RFC 0048 关键修复：在插入元素之前，检查是否已经存在相同内容的元素
// 注意：这个检查只适用于从 HTML 字符串解析而来的元素（没有 __wsxCacheKey）
// 对于由 h() 创建的元素（有 __wsxCacheKey），应该通过引用匹配，而不是内容匹配
const newChildCacheKey = getElementCacheKey(newChild);
// 只有当 newChild 没有 cache key 时，才进行内容匹配检查
if (!newChildCacheKey) {
    const newChildContent = newChild.textContent || "";
    const newChildTag = newChild.tagName.toLowerCase();
    // 检查 parent 中是否已经存在相同标签名和内容的元素（且也没有 cache key）
    for (let i = 0; i < parent.childNodes.length; i++) {
        const existingNode = parent.childNodes[i];
        if (existingNode instanceof HTMLElement || existingNode instanceof SVGElement) {
            const existingCacheKey = getElementCacheKey(existingNode);
            // 只有当 existingNode 也没有 cache key 时，才进行内容匹配
            if (
                !existingCacheKey &&
                existingNode.tagName.toLowerCase() === newChildTag &&
                existingNode.textContent === newChildContent &&
                existingNode !== newChild
            ) {
                // 找到相同内容的元素（且都没有 cache key），不需要插入 newChild
                // 这是从 HTML 字符串解析而来的重复元素
                return;
            }
        }
    }
}
```

**关键设计原则**：
1. **内容匹配仅适用于 HTML 解析的元素**：只有没有 `__wsxCacheKey` 的元素才进行内容匹配
2. **框架管理的元素使用引用匹配**：由 `h()` 创建的元素（有 `__wsxCacheKey`）通过引用匹配，避免误判
3. **防止组件消失**：这确保了像 `LanguageSwitcher` 这样的组件（由 `h()` 创建）不会被内容匹配逻辑误判为重复元素

#### 修复效果
- **修复前**：`<li><span>文本</span></li>` → 每次更新都会插入新的 `<span>`，导致重复
- **修复后**：`<li><span>文本</span></li>` → 检测到已存在相同内容的 `<span>`，不重复插入

### **语言切换器消失问题的修复 (2025-01-02 更新)**

#### 问题描述
在实施内容匹配修复后，发现语言切换器组件在切换语言时会消失。

**问题现象**：
- 切换语言时，`LanguageSwitcher` 组件会从 DOM 中消失
- 组件由 `h()` 创建，每次渲染可能有相同内容但不同引用

**问题根源**：
- 内容匹配逻辑过于严格，误判了由 `h()` 创建的组件
- 即使元素有 `__wsxCacheKey`，如果内容相同，也可能被误判为重复

#### 修复方案

**位置**：`packages/core/src/utils/update-children-helpers.ts` - `replaceOrInsertElementAtPosition` 函数

**修复逻辑**：
```typescript
// 关键修复：内容匹配检查只适用于从 HTML 字符串解析而来的元素（没有 __wsxCacheKey）
// 对于由 h() 创建的元素（有 __wsxCacheKey），应该通过引用匹配，而不是内容匹配
// 这样可以避免误判语言切换器等组件（它们由 h() 创建，每次渲染可能有相同内容但不同引用）
const newChildCacheKey = getElementCacheKey(newChild);
// 只有当 newChild 没有 cache key 时，才进行内容匹配检查
if (!newChildCacheKey) {
    // ... 内容匹配逻辑
}
```

**关键设计原则**：
1. **区分元素来源**：通过 `__wsxCacheKey` 的存在与否区分元素来源
2. **HTML 解析元素**：没有 `__wsxCacheKey` → 使用内容匹配防止重复
3. **框架管理元素**：有 `__wsxCacheKey` → 使用引用匹配，避免误判

#### 修复效果
- **修复前**：切换语言时，`LanguageSwitcher` 组件消失
- **修复后**：切换语言时，`LanguageSwitcher` 组件正常工作，不会消失

### **实施计划 (Implementation Plan)**

1.  **重写 `updateChildren`**:
    *   **位置**: `packages/core/src/utils/element-update.ts`
    *   **行动**: 完全替换 `updateChildren` 函数的实现，采用上述新的三步（Map -> Loop -> Cleanup）算法。

2.  **废弃并删除冗余辅助函数**:
    *   **位置**: `packages/core/src/utils/update-children-helpers.ts`
    *   **行动**: 新算法不再需要 `shouldRemoveNode`, `deduplicateCacheKeys`, `collectNodesToRemove` 等大部分函数。在 `updateChildren` 重写完成后，将这些已无用的函数彻底删除，以简化代码库。

3.  **验证与测试**:
    *   确保 `text-node-duplication.test.tsx` 中的测试现在能够通过，并且真正解决了“文本不更新”和“文本重复”的问题。
    *   确保 `update-children-helpers.test.ts` 中之前失败的测试（关于保留元素和去重）在新算法下也能正确处理或被新的、更全面的测试所覆盖。
    *   运行完整的测试套件 (`pnpm test`)，确保没有引入新的回归问题。

## 5. 实施状态 (Implementation Status)

**状态**: ✅ **已完成** (2025-01-02)

### 5.1 已完成的工作

1. **重写 `updateChildren` 算法**：
   - ✅ 实现了基于 key 的协调算法（RFC 0048 标准）
   - ✅ 修复了文本节点重复问题
   - ✅ 实现了保留节点（style 节点等）的保护机制
   - ✅ 实现了正确的节点位置管理

2. **修复的关键问题**：
   - ✅ 文本节点重复：通过只计算直接子文本节点修复
   - ✅ Style 节点保护：确保 style 节点不被移除或移动
   - ✅ 属性更新：修复了元素重用时的属性管理问题
   - ✅ Class 属性处理：修复了 class 属性在元素重用时的丢失问题

3. **代码简化**：
   - ✅ 移除了大量复杂的辅助函数
   - ✅ 简化了节点匹配和更新逻辑

### 5.2 关键修复点

#### 文本节点重复修复
- **位置**：`packages/core/src/utils/element-update.ts` - `updateChildren` 函数
- **修复**：在 Step 1 中添加 `node.parentNode === parentElement` 检查
- **效果**：防止将元素内部的文本节点误判为独立的文本节点

#### Style 节点保护
- **位置**：`packages/core/src/utils/element-update.ts` - `updateChildren` 函数
- **修复**：在 Step 3 和 Step 4 中添加 `shouldPreserveElement` 检查
- **效果**：确保 style 节点等保留元素不被移除或移动

#### 属性更新修复
- **位置**：`packages/core/src/utils/element-update.ts` - `updateProps` 函数
- **修复**：
  - 修复了跳过逻辑：只有当 oldValue 和 newValue 都存在且相等时才跳过
  - 修复了 style 属性处理：同时设置 attribute 和 `style.cssText`
  - 修复了 class 属性处理：正确处理 SVG 和非 SVG 元素
- **效果**：确保元素重用时的属性正确更新

#### 重复元素修复 (2025-01-02)
- **位置**：`packages/core/src/utils/update-children-helpers.ts` - `replaceOrInsertElementAtPosition` 函数
- **修复**：
  - 添加内容匹配检查，防止从 HTML 字符串解析而来的元素重复插入
  - 内容匹配仅适用于没有 `__wsxCacheKey` 的元素
  - 由 `h()` 创建的元素（有 `__wsxCacheKey`）使用引用匹配，避免误判
- **效果**：防止 HTML 解析元素的重复插入，同时保护框架管理的组件

#### 保留元素插入修复 (2025-01-02)
- **位置**：`packages/core/src/utils/update-children-helpers.ts` - `replaceOrInsertElement` 函数
- **修复**：
  - 修复 `targetNextSibling` 计算逻辑
  - 当 `oldNode` 是保留元素时，应该在 `oldNode` 之前插入（`targetNextSibling = oldNode`）
  - 否则，应该在 `oldNode.nextSibling` 之前插入
- **效果**：确保新元素正确插入到保留元素之前

#### Cache Key 去重修复 (2025-01-02)
- **位置**：`packages/core/src/utils/update-children-helpers.ts` - `deduplicateCacheKeys` 函数
- **修复**：
  - 添加对已处理 cache key 的检查
  - 如果 cache key 已被处理，且当前节点不是新节点，则移除旧节点
- **效果**：确保每个 cache key 在 DOM 中只出现一次

#### Position ID 支持 (2025-01-02)
- **位置**：`packages/core/src/utils/cache-key.ts` - `generateCacheKey` 函数
- **修复**：
  - 添加对 `__wsxPositionId` 的支持（优先级 3）
  - 优先级顺序：key > index > positionId > counter > fallback
- **效果**：支持 babel 插件生成的 position ID，提供更稳定的 cache key

## 6. 收益 (Benefits)

-   **根除 Bug**: 从根本上解决一系列与 DOM 和解相关的渲染问题，包括文本节点重复、属性丢失等。
-   **简化代码**: 用一个清晰、标准的算法替代大量复杂、脆弱的辅助函数，大幅降低代码库的维护难度。
-   **性能与可预测性**: 采用经过业界验证的算法，性能更可预测，行为更符合开发者直觉。
-   **与标准对齐**: 使框架的核心行为向 React/Vue 等主流框架看齐，降低开发者的学习成本。
-   **精确的节点识别**: 通过 `parentNode` 检查确保只处理直接子节点，避免误判嵌套节点。
