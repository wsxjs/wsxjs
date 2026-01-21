# RFC 0049: Key-based Reconciliation 算法实施

- **状态**: Proposed
- **作者**: WSX Team
- **创建日期**: 2025-01-02
- **依赖**: RFC 0048

## 1. 目标 (Goal)

实施 RFC 0048 提出的 key-based reconciliation 算法，替换当前基于索引的 `updateChildren` 实现。新算法将使用稳定的 key 来识别和匹配 DOM 节点，彻底解决在条件渲染、列表渲染和大批量重新渲染场景下的各类 DOM 更新异常问题。

## 2. 背景 (Background)

### 2.1 RFC 0048 的提案

RFC 0048 提出了一个全新的 key-based reconciliation 算法来替代当前基于索引的算法。新算法的核心思想是：

1. **构建旧节点 Map**：遍历当前父元素的所有子节点，根据 key 创建映射表 `Map<key, DOMNode>`
2. **主循环遍历新虚拟节点**：通过 key 匹配旧节点，更新或创建新节点
3. **清理未匹配的旧节点**：移除在新 VDOM 中不存在的旧节点
4. **放置新/更新的节点到正确位置**：按照新 VDOM 的顺序放置节点

### 2.2 当前实现状态

**问题**：当前 `updateChildren` 实现**未完全实现 RFC 0048 的 key-based reconciliation 算法**，仍在使用旧的基于索引的算法。

**当前实现**（`packages/core/src/utils/element-update.ts`）：
```typescript
export function updateChildren(
    element: HTMLElement | SVGElement,
    oldChildren: JSXChildren[],
    newChildren: JSXChildren[],
    _cacheManager?: DOMCacheManager
): void {
    const flatOld = flattenChildrenSafe(oldChildren);
    const flatNew = flattenChildrenSafe(newChildren);
    
    // 基于索引的更新算法
    const minLength = Math.min(flatOld.length, flatNew.length);
    const domIndex = { value: 0 };
    const processedNodes = new Set<Node>();
    
    for (let i = 0; i < minLength; i++) {
        // 基于索引查找和更新元素
        // ...
    }
}
```

**问题**：
1. 基于索引的算法在大量组件同时更新时，索引可能失效
2. 元素匹配依赖于 DOM 中的位置，但在并发更新时，位置可能发生变化
3. 没有使用稳定的 key 来识别元素，导致匹配失败

### 2.3 触发实施的问题场景

#### 场景 1: 语言切换触发大批量重新渲染

**问题现象**：
- 语言切换触发整个页面的所有组件同时重新渲染
- 语言切换器组件在大量组件重新渲染时，可能无法正确更新
- 组件状态已更新，但 UI 未更新

**根本原因**：
- 当前基于索引的算法在大量组件同时更新时，索引可能失效
- 元素匹配依赖于 DOM 位置，但在并发更新时，位置可能发生变化

#### 场景 2: 文本节点重复问题

**问题现象**：
- 在列表项中，文本内容会被重复渲染 3 次
- 例如：`<li><span>第一项</span></li>` 会渲染为 "第一项第一项第一项"

**根本原因**：
- 旧算法在遍历 DOM 节点时，误将元素内部的文本节点当作父元素的直接子文本节点
- 基于索引的算法无法精确识别文本节点的位置

#### 场景 3: 元素重复插入问题

**问题现象**：
- 从 HTML 字符串解析而来的元素（如 `<span>`）会出现重复插入
- 例如：`<li><span>文本</span></li>` 会渲染为 `<li><span>...</span><span>...</span><span>...</span></li>`

**根本原因**：
- HTML 字符串解析的元素没有 `__wsxCacheKey`
- 基于索引的算法无法通过 key 匹配这些元素

## 3. 解决方案 (Solution)

### 3.1 实施 RFC 0048 的 key-based reconciliation 算法

**核心方案**：完全实施 RFC 0048 的 key-based reconciliation 算法，替换当前基于索引的算法。

### 3.2 新算法设计

#### Step 1: 构建 oldNodesMap（包含文本节点 keying）

**目标**：遍历 `parentElement.childNodes`，为每个节点生成 key 并创建映射表。

**实现逻辑**：
```typescript
const oldNodesMap = new Map<string, Node>();
let textNodeIndex = 0;

for (const node of parentElement.childNodes) {
    // 跳过保留元素（style 节点等）
    if (shouldPreserveElement(node)) {
        continue;
    }
    
    // 只处理直接子节点
    if (node.parentNode !== parentElement) {
        continue;
    }
    
    if (node instanceof Text) {
        // 文本节点：使用位置索引作为 key
        const key = `__text__${textNodeIndex++}`;
        oldNodesMap.set(key, node);
    } else if (node instanceof HTMLElement || node instanceof SVGElement) {
        // 元素节点：使用 cache key
        const cacheKey = getElementCacheKey(node);
        if (cacheKey) {
            oldNodesMap.set(cacheKey, node);
        }
    }
}
```

**关键点**：
- 文本节点使用位置索引作为 key（`__text__0`, `__text__1`, ...）
- 元素节点使用 `__wsxCacheKey` 作为 key
- 只处理直接子节点（`node.parentNode === parentElement` 检查）
- 跳过保留元素（`shouldPreserveElement` 检查）

#### Step 2: 主循环遍历 newChildren，通过 key 匹配

**目标**：遍历 `flatNewChildren`，通过 key 匹配旧节点并更新。

**实现逻辑**：
```typescript
const newDomNodes: Node[] = [];
let newTextNodeIndex = 0;

for (const newChild of flatNewChildren) {
    let key: string | null = null;
    let oldNode: Node | null = null;
    
    if (typeof newChild === "string" || typeof newChild === "number") {
        // 文本节点：使用位置索引作为 key
        key = `__text__${newTextNodeIndex++}`;
        oldNode = oldNodesMap.get(key) || null;
        
        if (oldNode && oldNode instanceof Text) {
            // 更新现有文本节点
            if (oldNode.textContent !== String(newChild)) {
                oldNode.textContent = String(newChild);
            }
            newDomNodes.push(oldNode);
        } else {
            // 创建新文本节点
            const newTextNode = document.createTextNode(String(newChild));
            newDomNodes.push(newTextNode);
        }
    } else if (newChild instanceof HTMLElement || newChild instanceof SVGElement) {
        // 元素节点：使用 cache key
        key = getElementCacheKey(newChild);
        if (key) {
            oldNode = oldNodesMap.get(key) || null;
        }
        
        if (oldNode && oldNode instanceof HTMLElement || oldNode instanceof SVGElement) {
            // 检查标签名是否匹配
            if (oldNode.tagName.toLowerCase() === newChild.tagName.toLowerCase()) {
                // 更新现有元素
                updateElement(oldNode, newChild.props, newChild.children);
                newDomNodes.push(oldNode);
            } else {
                // 标签名不匹配，使用新元素
                newDomNodes.push(newChild);
            }
        } else {
            // 创建新元素
            newDomNodes.push(newChild);
        }
    }
    
    // 从 oldNodesMap 中删除已匹配的节点
    if (key && oldNode) {
        oldNodesMap.delete(key);
    }
}
```

**关键点**：
- 文本节点使用位置索引作为 key
- 元素节点使用 `__wsxCacheKey` 作为 key
- 匹配成功后从 `oldNodesMap` 中删除，标记为已处理
- 标签名不匹配时，使用新元素

#### Step 3: 清理未匹配的旧节点

**目标**：移除在新 VDOM 中不存在的旧节点。

**实现逻辑**：
```typescript
for (const [key, oldNode] of oldNodesMap) {
    // 跳过保留元素
    if (shouldPreserveElement(oldNode)) {
        continue;
    }
    
    // 从 DOM 中移除未匹配的旧节点
    if (oldNode.parentNode === parentElement) {
        parentElement.removeChild(oldNode);
    }
}
```

**关键点**：
- 只移除未匹配的旧节点（仍在 `oldNodesMap` 中的节点）
- 跳过保留元素（`shouldPreserveElement` 检查）
- 确保节点是直接子节点（`oldNode.parentNode === parentElement` 检查）

#### Step 4: 放置新/更新的节点到正确位置

**目标**：按照 `newChildren` 的顺序放置节点。

**实现逻辑**：
```typescript
// 按照 newChildren 的顺序放置节点
for (let i = 0; i < newDomNodes.length; i++) {
    const newNode = newDomNodes[i];
    const targetNextSibling = findNextSibling(parentElement, i, newDomNodes);
    
    // 如果节点已经在正确位置，跳过
    if (newNode.parentNode === parentElement && newNode.nextSibling === targetNextSibling) {
        continue;
    }
    
    // 如果节点已经在 parent 中，先移除
    if (newNode.parentNode === parentElement) {
        parentElement.removeChild(newNode);
    }
    
    // 插入到正确位置
    if (targetNextSibling) {
        parentElement.insertBefore(newNode, targetNextSibling);
    } else {
        parentElement.appendChild(newNode);
    }
}
```

**关键点**：
- 按照 `newChildren` 的顺序放置节点
- 跳过保留元素（`shouldPreserveElement` 检查）
- 如果节点已在正确位置，跳过移动操作

### 3.3 关键修复点

#### 3.3.1 文本节点 keying

**问题**：文本节点没有稳定的 key，需要基于位置索引生成 key。

**解决方案**：
- 在 Step 1 中，为每个直接子文本节点生成位置索引 key（`__text__0`, `__text__1`, ...）
- 在 Step 2 中，为每个新文本节点生成对应的位置索引 key
- 通过 key 精确匹配和重用现有文本节点

#### 3.3.2 元素节点 keying

**问题**：元素节点需要使用 `__wsxCacheKey` 作为 key。

**解决方案**：
- 在 Step 1 中，为每个元素节点获取 `__wsxCacheKey` 并加入 `oldNodesMap`
- 在 Step 2 中，为每个新元素节点获取 `__wsxCacheKey` 并在 `oldNodesMap` 中查找匹配
- 通过 key 精确匹配和重用现有元素节点

#### 3.3.3 并发更新时的稳定性

**问题**：在大量组件同时重新渲染时，key 匹配必须稳定。

**解决方案**：
- 使用稳定的 key（`__wsxCacheKey`）来识别元素
- 不依赖于 DOM 位置，只依赖于 key
- 在并发更新时，key 匹配仍然有效

## 4. 实施计划 (Implementation Plan)

### 4.1 阶段一：实施 Step 1（构建 oldNodesMap）

**步骤 1.1**: 修改 `updateChildren` 函数，实现 Step 1 逻辑
- **文件**: `packages/core/src/utils/element-update.ts`
- **函数**: `updateChildren`
- **修改**: 实现 Step 1 逻辑，构建 `oldNodesMap`，包含文本节点和元素节点的 keying
- **测试要求**: 编写测试验证 oldNodesMap 构建正确

**步骤 1.2**: 添加辅助函数
- **文件**: `packages/core/src/utils/element-update.ts`
- **函数**: `buildOldNodesMap`
- **功能**: 构建 oldNodesMap 的辅助函数
- **测试要求**: 编写测试验证函数正确性

### 4.2 阶段二：实施 Step 2（主循环遍历 newChildren）

**步骤 2.1**: 修改 `updateChildren` 函数，实现 Step 2 逻辑
- **文件**: `packages/core/src/utils/element-update.ts`
- **函数**: `updateChildren`
- **修改**: 实现 Step 2 逻辑，通过 key 匹配旧节点并更新
- **测试要求**: 编写测试验证 key 匹配和更新逻辑正确

**步骤 2.2**: 添加辅助函数
- **文件**: `packages/core/src/utils/element-update.ts`
- **函数**: `reconcileNewChildren`
- **功能**: 主循环遍历 newChildren 的辅助函数
- **测试要求**: 编写测试验证函数正确性

### 4.3 阶段三：实施 Step 3（清理未匹配的旧节点）

**步骤 3.1**: 修改 `updateChildren` 函数，实现 Step 3 逻辑
- **文件**: `packages/core/src/utils/element-update.ts`
- **函数**: `updateChildren`
- **修改**: 实现 Step 3 逻辑，清理未匹配的旧节点
- **测试要求**: 编写测试验证未匹配节点被正确清理

**步骤 3.2**: 添加辅助函数
- **文件**: `packages/core/src/utils/element-update.ts`
- **函数**: `removeUnmatchedNodes`
- **功能**: 清理未匹配旧节点的辅助函数
- **测试要求**: 编写测试验证函数正确性

### 4.4 阶段四：实施 Step 4（放置新/更新的节点）

**步骤 4.1**: 修改 `updateChildren` 函数，实现 Step 4 逻辑
- **文件**: `packages/core/src/utils/element-update.ts`
- **函数**: `updateChildren`
- **修改**: 实现 Step 4 逻辑，按照 newChildren 的顺序放置节点
- **测试要求**: 编写测试验证节点放置顺序正确

**步骤 4.2**: 添加辅助函数
- **文件**: `packages/core/src/utils/element-update.ts`
- **函数**: `placeNodesInOrder`
- **功能**: 放置节点到正确位置的辅助函数
- **测试要求**: 编写测试验证函数正确性

### 4.5 阶段五：测试和验证

**步骤 5.1**: 编写单元测试
- **文件**: `packages/core/__tests__/element-update.test.ts`
- **测试内容**:
  - 测试 key-based reconciliation 算法的各个步骤
  - 测试文本节点 keying
  - 测试元素节点 keying
  - 测试并发更新场景
  - 测试语言切换器场景
  - 测试文本节点重复场景
  - 测试元素重复插入场景

**步骤 5.2**: 集成测试
- **测试场景**: 模拟语言切换触发大批量组件重新渲染
- **验证**: 所有组件能够正确更新，包括语言切换器组件

**步骤 5.3**: 性能测试
- **测试内容**: 对比新算法和旧算法的性能
- **验证**: 新算法的性能不低于旧算法

### 4.6 阶段六：优化和文档

**步骤 6.1**: 优化性能
- 优化 key 生成和匹配的性能
- 减少不必要的 DOM 操作

**步骤 6.2**: 更新文档
- 更新 RFC 0048，记录实施状态
- 更新相关文档，说明 key-based reconciliation 算法的使用

## 5. 成功标准 (Success Criteria)

1. **功能正确性**：
   - ✅ 语言切换器组件在语言切换时能够正确更新
   - ✅ 在大量组件同时重新渲染时，所有组件都能正确更新
   - ✅ 文本节点重复问题已解决
   - ✅ 元素重复插入问题已解决
   - ✅ 所有现有测试通过

2. **性能**：
   - ✅ key-based reconciliation 算法的性能不低于当前基于索引的算法
   - ✅ 在大量组件同时重新渲染时，性能不会显著下降

3. **代码质量**：
   - ✅ 代码符合项目规范
   - ✅ 100% 测试覆盖率
   - ✅ 零 lint 错误

## 6. 风险评估 (Risk Assessment)

### 6.1 技术风险

1. **算法复杂度**：
   - **风险**: key-based reconciliation 算法可能比当前基于索引的算法更复杂
   - **缓解**: 参考 RFC 0048 的详细设计，确保算法实现正确

2. **性能影响**：
   - **风险**: key-based reconciliation 算法可能影响性能
   - **缓解**: 优化 key 生成和匹配的性能，进行性能测试

3. **兼容性**：
   - **风险**: 新算法可能与现有代码不兼容
   - **缓解**: 保持 API 兼容性，逐步迁移

### 6.2 实施风险

1. **实施时间**：
   - **风险**: 实施 key-based reconciliation 算法可能需要较长时间
   - **缓解**: 分阶段实施，逐步验证

2. **测试覆盖**：
   - **风险**: 新算法可能引入新的 bug
   - **缓解**: 编写全面的测试用例，确保 100% 覆盖率

## 7. 相关 RFC

- **RFC 0048**: 核心和解算法架构重构（提案）
- **RFC 0042**: LanguageSwitcher 立即 UI 更新修复（用例场景）
- **RFC 0047**: 文本节点重复渲染修复（用例场景）

## 8. 变更历史

- **2025-01-02**: 创建 RFC，记录 key-based reconciliation 算法的实施计划
