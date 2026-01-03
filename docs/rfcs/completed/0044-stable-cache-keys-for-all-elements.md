# RFC-0044: 为所有元素提供稳定的缓存键

**状态**: Proposed
**创建日期**: 2025-01-02
**作者**: WSX Team
**依赖**: RFC-0037 (DOM Cache), RFC-0040 (Cache Reuse), RFC-0042 (Language Switcher)

## 摘要

修复元素复用机制中的关键设计缺陷：为所有JSX元素在编译时注入稳定的位置ID (`__wsxPositionId`)，消除对不稳定的运行时计数器的依赖，确保条件渲染场景下的缓存键稳定性。

## 黄金法则 (Golden Rules)

- **100% 测试覆盖率是强制要求**：所有代码必须达到 100% 的测试覆盖率（lines, functions, branches, statements）。没有测试的代码不允许提交。这是项目的铁律，没有例外。

## 目标 (Goal)

解决元素复用机制在条件渲染场景下的缓存键不稳定问题，确保：

1. **缓存键稳定性**：所有元素在任何渲染场景下都有稳定的缓存键
2. **自动化**：开发者无需手动添加 `key` 属性来解决框架问题
3. **性能优化**：避免错误的元素复用和频繁的DOM操作
4. **正确性保证**：文本内容、属性、状态在元素复用时正确更新

## 范围 (Scope)

### In-Scope

- 修改 Babel 插件为所有JSX元素注入 `__wsxPositionId`
- 优化位置ID生成算法处理边界场景
- 添加开发模式下的缓存键冲突检测
- 优化文本节点查找和复用逻辑
- 添加元数据一致性保证机制
- 100% 测试覆盖率

### Out-of-Scope

- 动态组件类型的缓存策略（单独RFC）
- 列表渲染优化算法（单独RFC）
- 缓存淘汰策略（单独RFC）

## 核心交付物 (Core Deliverables)

1. **增强的 Babel 插件**：
   - `packages/vite-plugin/src/babel-plugin-wsx-focus.ts`（为所有元素注入 `__wsxPositionId`）

2. **改进的位置ID生成算法**：
   - 支持条件渲染检测
   - 支持列表渲染检测
   - 智能退化到用户 `key` 要求

3. **开发工具增强**：
   - 缓存键冲突检测（开发模式）
   - 警告和调试信息输出

4. **优化的文本节点逻辑**：
   - `packages/core/src/utils/update-children-helpers.ts`（减少不必要的节点创建）

5. **元数据一致性保证**：
   - `packages/core/src/utils/element-update.ts`（错误处理和回滚）

6. **完整的测试套件**：
   - 条件渲染场景测试
   - 列表渲染场景测试
   - 文本节点更新测试
   - 缓存键冲突检测测试

## 成功标准 (Success Criteria)

以下所有标准必须满足才能认为 RFC 实施成功：

1. **代码质量**：
   - ✅ 零 `any` 类型警告
   - ✅ 100% 代码覆盖率（lines, functions, branches, statements）
   - ✅ 零 Lint 错误

2. **功能验证**：
   - ✅ 语言切换器在任何切换顺序下都能正确显示
   - ✅ 条件渲染场景下元素复用正确
   - ✅ 列表渲染场景下元素复用正确
   - ✅ 文本节点内容始终与状态同步

3. **性能验证**：
   - ✅ 编译时性能影响 < 10%
   - ✅ 运行时性能影响 < 5%
   - ✅ 内存占用增加 < 5%

4. **开发者体验**：
   - ✅ 无需手动添加 `key` 解决框架问题
   - ✅ 开发模式下提供清晰的警告信息
   - ✅ 文档清晰说明使用方式

## 问题分析

### 根本原因

**核心问题：运行时计数器在条件渲染时不稳定**

当前缓存键生成优先级（`packages/core/src/utils/cache-key.ts:59-88`）：
```typescript
// 优先级 1: 用户 key（最可靠）
if (userKey !== undefined && userKey !== null) {
    return `${componentId}:${tag}:key-${String(userKey)}`;
}

// 优先级 2: 索引（列表场景）
if (index !== undefined && index !== null) {
    return `${componentId}:${tag}:idx-${String(index)}`;
}

// 优先级 3: 位置 ID（编译时注入，如果有效）
if (positionId !== undefined && positionId !== null && positionId !== "no-id") {
    return `${componentId}:${tag}:${String(positionId)}`;
}

// 优先级 4: 组件级别计数器（运行时回退，不稳定！）
if (component) {
    let counter = componentElementCounters.get(component) || 0;
    counter++;
    componentElementCounters.set(component, counter);
    return `${componentId}:${tag}:auto-${counter}`;
}
```

**问题机制**：

1. **原 Babel 插件的局限**（`packages/vite-plugin/src/babel-plugin-wsx-focus.ts:197-199`）：
   ```typescript
   // 旧代码：只为可聚焦元素注入位置ID
   if (!isFocusableElement(elementName, hasContentEditable)) {
       return; // 跳过非可聚焦元素
   }
   ```
   - 只为 `input`, `textarea`, `select`, `button` 注入 `__wsxPositionId`
   - 普通元素（`span`, `div`, `p` 等）依赖运行时计数器

2. **运行时计数器的不稳定性**：
   - 每次渲染重置：`resetCounterForNewRenderCycle(component)` (`render-context.ts:20`)
   - 按元素创建顺序递增：`auto-1`, `auto-2`, `auto-3`...
   - **条件渲染导致序列变化**

3. **语言切换器的具体症状**：
   ```tsx
   // LanguageSwitcher.wsx
   <button>
       <span class="language-switcher-icon">🌐</span>  // 无 __wsxPositionId → auto-1
       <span class="language-switcher-text">{displayName}</span>  // 无 __wsxPositionId → auto-2
       <span class="language-switcher-arrow">{this.isOpen ? "▲" : "▼"}</span>  // 无 __wsxPositionId → auto-3
   </button>

   {this.isOpen && (  // 条件渲染影响后续元素的计数
       <div class="language-switcher-dropdown">...</div>
   )}
   ```

   **渲染序列**：
   - 下拉菜单关闭：3个 span 元素 → `auto-1`, `auto-2`, `auto-3`
   - 下拉菜单打开：3个 span + 下拉菜单 → `auto-1`, `auto-2`, `auto-3`, `auto-4`...
   - 下拉菜单关闭：3个 span 元素 → `auto-1`, `auto-2`, `auto-3` ✅

   **实际问题不在计数器序列**！问题在于：
   - 没有 `__wsxPositionId` 的元素依赖计数器
   - 虽然序列一致，但**缓存元素的文本内容没有正确更新**
   - 这是 RFC-0042 修复的问题：文本节点更新逻辑缺陷

### 次要原因

1. **Babel 插件位置ID计算的局限性**（`babel-plugin-wsx-focus.ts:103-135`）：
   ```typescript
   function calculateJSXPath(path: NodePath<t.JSXOpeningElement>): number[] {
       // 只考虑静态JSX树结构
       // 不处理 .map(), 条件表达式等动态场景
   }
   ```
   - 动态列表中的所有元素可能得到相同的位置ID
   - 条件分支中的元素可能冲突

2. **文本节点查找逻辑的复杂性**（`update-children-helpers.ts:78-149`）：
   ```typescript
   export function findTextNode(
       parent: HTMLElement | SVGElement,
       domIndex: { value: number }
   ): Node | null {
       // 使用可变的 domIndex 引用
       // 在元素复用和移动后可能不准确
   }
   ```

3. **缓存元数据在DOM更新前保存**（`element-update.ts:512-518`）：
   ```typescript
   // 先保存元数据
   cacheManager.setMetadata(element, {
       props: newProps || {},
       children: newChildren,
   });

   // 再更新DOM
   updateProps(element, oldProps, newProps, tag);
   updateChildren(element, oldChildren, newChildren, cacheManager);
   ```
   - 如果更新失败，元数据与DOM不一致

## 解决方案

### 方案一：为所有元素注入位置ID（推荐）

**技术原理**：
- 在编译时（Babel插件）为所有JSX元素注入 `__wsxPositionId` 属性
- 位置ID基于元素在JSX树中的路径计算：`ComponentName-tag-type-path`
- 利用现有的缓存键优先级机制（优先级3）

**实施步骤**：
1. 修改 `babel-plugin-wsx-focus.ts`：
   - 移除 `isFocusableElement` 检查
   - 为所有元素注入 `__wsxPositionId`
   - 仅为可聚焦元素额外注入 `data-wsx-key`（用于焦点保持）

2. 增强位置ID生成算法：
   - 检测动态场景（`.map()`, 条件表达式）
   - 返回特殊标记 `[-1]` 表示需要用户提供 `key`
   - 在开发模式下输出警告

**风险分析**：
- ✅ 优点：完全自动化，无需开发者干预
- ✅ 优点：利用现有机制，改动最小
- ⚠️ 缺点：编译时间略微增加（每个元素多一次计算）
- ⚠️ 缺点：HTML输出多一个属性（轻微内存增加）

**代码示例**：
```typescript
// babel-plugin-wsx-focus.ts (修改后)
JSXOpeningElement(path) {
    const element = path.node;
    if (!t.isJSXIdentifier(element.name)) return;

    const elementName = element.name.name;

    // 检查是否已有用户key或位置ID
    const hasUserKey = element.attributes.some(attr =>
        t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === "key"
    );
    const hasPositionId = element.attributes.some(attr =>
        t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === "__wsxPositionId"
    );

    if (hasUserKey || hasPositionId) return;

    // 提取属性
    const props = extractPropsFromJSXAttributes(element.attributes);
    const componentName = findComponentName(path);
    const pathArray = calculateJSXPath(path);

    // 检测动态场景
    if (pathArray[0] === -1) {
        // 需要用户提供 key
        if (process.env.NODE_ENV === 'development') {
            // 添加警告注释或console.warn
        }
        return;
    }

    // 生成稳定位置ID
    const positionId = generateStableKey(elementName, componentName, pathArray, props);

    // 为所有元素添加 __wsxPositionId
    element.attributes.push(
        t.jsxAttribute(t.jsxIdentifier("__wsxPositionId"), t.stringLiteral(positionId))
    );

    // 额外为可聚焦元素添加 data-wsx-key（用于焦点保持）
    if (isFocusableElement(elementName, hasContentEditable)) {
        element.attributes.push(
            t.jsxAttribute(t.jsxIdentifier("data-wsx-key"), t.stringLiteral(positionId))
        );
    }
}
```

### 方案二：改进运行时计数器策略（不推荐）

**技术原理**：
- 保持计数器在条件渲染前后的一致性
- 为条件渲染块预留计数器范围

**实施步骤**：
1. 在编译时分析JSX树，为每个条件分支分配固定的计数器范围
2. 运行时根据分支分配范围内的计数器

**风险分析**：
- ❌ 缺点：编译时分析复杂度高
- ❌ 缺点：运行时逻辑复杂，难以维护
- ❌ 缺点：仍然不能完全避免冲突

**结论**：不推荐，复杂度高且效果不如方案一

## 实施计划 (Implementation Plan)

### 阶段一：核心修复（Babel插件）

**步骤 1.1**: 修改 Babel 插件为所有元素注入 `__wsxPositionId`
- ✅ 完成标准: `babel-plugin-wsx-focus.ts` 已修改，所有元素都注入位置ID
- ✅ 测试要求: 编写测试验证所有元素类型都注入位置ID（100% 覆盖率）
- ✅ 验证方法:
  ```bash
  pnpm --filter @wsxjs/wsx-vite-plugin test -- babel-plugin-wsx-focus
  pnpm --filter @wsxjs/wsx-vite-plugin test -- --coverage
  ```

**步骤 1.2**: 增强 `calculateJSXPath` 检测动态场景
- ✅ 完成标准: 函数能识别 `.map()`, 条件表达式，返回 `[-1]`
- ✅ 测试要求: 测试所有动态场景的识别（100% 覆盖率）
- ✅ 验证方法:
  ```bash
  pnpm --filter @wsxjs/wsx-vite-plugin test -- calculateJSXPath
  ```

**步骤 1.3**: 重新构建并测试语言切换器
- ✅ 完成标准: 语言切换器在任何切换顺序下都正确显示
- ✅ 测试要求: 手动测试所有语言切换组合
- ✅ 验证方法:
  ```bash
  pnpm --filter @wsxjs/wsx-site build
  pnpm --filter @wsxjs/wsx-site dev
  # 手动测试所有语言切换
  ```

### 阶段二：开发工具增强

**步骤 2.1**: 添加缓存键冲突检测（开发模式）
- ✅ 完成标准: `jsx-factory.ts` 在开发模式下检测并警告缓存键冲突
- ✅ 测试要求: 测试冲突检测逻辑（100% 覆盖率）
- ✅ 实现代码:
  ```typescript
  // packages/core/src/jsx-factory.ts
  function tryUseCacheOrCreate(...) {
      const cacheKey = generateCacheKey(tag, props, componentId, context);
      const cachedElement = cacheManager.get(cacheKey);

      if (process.env.NODE_ENV === 'development') {
          // 检测缓存键冲突
          const allCachedElements = cacheManager.getAll();
          const duplicates = allCachedElements.filter(([key, elem]) =>
              key === cacheKey && elem !== cachedElement
          );

          if (duplicates.length > 0) {
              console.warn(
                  `[WSX] Cache key collision detected: ${cacheKey}\n` +
                  `Found ${duplicates.length} duplicate(s).\n` +
                  `This may cause incorrect element reuse.\n` +
                  `Consider adding a 'key' prop to disambiguate.`,
                  { tag, props, componentId }
              );
          }
      }

      // ... 现有逻辑
  }
  ```

**步骤 2.2**: 添加位置ID调试信息
- ✅ 完成标准: 开发模式下可以查看每个元素的位置ID和缓存键
- ✅ 测试要求: 测试调试信息输出（100% 覆盖率）
- ✅ 实现代码:
  ```typescript
  // 在 h() 函数中
  if (process.env.NODE_ENV === 'development') {
      // 在元素上添加调试属性
      (element as any).__wsxDebug = {
          cacheKey,
          positionId: props?.__wsxPositionId,
          componentId,
          tag
      };
  }
  ```

### 阶段三：性能和稳定性优化

**步骤 3.1**: 优化文本节点查找逻辑
- ✅ 完成标准: `findTextNode` 和 `updateOrCreateTextNode` 减少不必要的节点创建
- ✅ 测试要求: 测试文本节点复用逻辑（100% 覆盖率）
- ✅ 实现代码:
  ```typescript
  // packages/core/src/utils/update-children-helpers.ts
  export function updateOrCreateTextNode(
      parent: HTMLElement | SVGElement,
      oldNode: Node | null,
      newText: string
  ): void {
      if (oldNode && oldNode.nodeType === Node.TEXT_NODE) {
          // 更新现有文本节点
          if (oldNode.textContent !== newText) {
              oldNode.textContent = newText;
          }
      } else {
          // 尝试找到可复用的文本节点
          let textNode: Node | null = null;
          for (let i = 0; i < parent.childNodes.length; i++) {
              const node = parent.childNodes[i];
              if (node.nodeType === Node.TEXT_NODE && !shouldPreserveElement(node)) {
                  textNode = node;
                  break;
              }
          }

          if (textNode) {
              // 复用找到的文本节点
              textNode.textContent = newText;
              // 如果位置不对，移动到正确位置
              if (oldNode && textNode !== oldNode) {
                  parent.insertBefore(textNode, oldNode);
              }
          } else {
              // 创建新文本节点
              const newTextNode = document.createTextNode(newText);
              if (oldNode && !shouldPreserveElement(oldNode)) {
                  parent.replaceChild(newTextNode, oldNode);
              } else {
                  parent.insertBefore(newTextNode, oldNode || null);
              }
          }
      }
  }
  ```

**步骤 3.2**: 添加元数据一致性保证
- ✅ 完成标准: `updateElement` 在更新失败时回滚元数据
- ✅ 测试要求: 测试错误处理和回滚逻辑（100% 覆盖率）
- ✅ 实现代码:
  ```typescript
  // packages/core/src/utils/element-update.ts
  export function updateElement(
      element: HTMLElement | SVGElement,
      newProps: Record<string, unknown> | null,
      newChildren: JSXChildren[],
      tag: string,
      cacheManager: DOMCacheManager
  ): void {
      const oldMetadata = cacheManager.getMetadata(element);
      const oldProps = (oldMetadata?.props as Record<string, unknown>) || null;
      const oldChildren = (oldMetadata?.children as JSXChildren[]) || [];

      try {
          // 先保存新元数据
          cacheManager.setMetadata(element, {
              props: newProps || {},
              children: newChildren,
          });

          // 更新 DOM
          updateProps(element, oldProps, newProps, tag);
          updateChildren(element, oldChildren, newChildren, cacheManager);
      } catch (error) {
          // 更新失败，回滚元数据
          cacheManager.setMetadata(element, {
              props: oldProps || {},
              children: oldChildren,
          });

          // 重新抛出错误
          throw error;
      }
  }
  ```

**步骤 3.3**: 性能基准测试
- ✅ 完成标准: 编译时和运行时性能影响在可接受范围内
- ✅ 测试要求: 运行性能测试套件
- ✅ 验证方法:
  ```bash
  # 编译时性能
  pnpm --filter @wsxjs/wsx-site build -- --profile

  # 运行时性能
  pnpm --filter @wsxjs/wsx-core test -- performance-baseline
  ```

### 阶段四：测试和文档

**步骤 4.1**: 添加完整的测试覆盖
- ✅ 完成标准: 所有修改的文件达到 100% 测试覆盖率
- ✅ 测试清单:
  - [ ] `babel-plugin-wsx-focus.ts`：100% 覆盖率
  - [ ] `cache-key.ts`：100% 覆盖率
  - [ ] `element-update.ts`：100% 覆盖率
  - [ ] `update-children-helpers.ts`：100% 覆盖率
  - [ ] `jsx-factory.ts`：100% 覆盖率
  - [ ] 条件渲染场景测试
  - [ ] 列表渲染场景测试
  - [ ] 缓存键冲突检测测试
- ✅ 验证方法:
  ```bash
  pnpm --filter @wsxjs/wsx-core test -- --coverage
  pnpm --filter @wsxjs/wsx-vite-plugin test -- --coverage
  ```

**步骤 4.2**: 更新文档
- ✅ 完成标准: 文档清晰说明缓存机制和最佳实践
- ✅ 文档清单:
  - [ ] `docs/guide/CACHE_MECHANISM.md`（新建）：缓存机制详细说明
  - [ ] `docs/guide/WEB_COMPONENT_GUIDE.md`：更新元素复用说明
  - [ ] `site/public/docs/guide/BEST_PRACTICES.md`：添加 key 使用最佳实践
- ✅ 验证方法: 文档审查

**步骤 4.3**: 创建示例项目
- ✅ 完成标准: 示例项目演示所有边界场景
- ✅ 示例清单:
  - [ ] 条件渲染示例
  - [ ] 列表渲染示例
  - [ ] 复杂状态管理示例
  - [ ] 缓存键冲突示例（开发模式警告）

## 潜在风险和缓解策略

### 风险 1: 编译时性能影响

**风险描述**: 为所有元素计算位置ID可能增加编译时间

**缓解策略**:
- 缓存位置ID计算结果（同一路径只计算一次）
- 优化 `calculateJSXPath` 算法复杂度
- 性能基准测试确保影响 < 10%

### 风险 2: 位置ID冲突

**风险描述**: 动态场景下可能产生相同的位置ID

**缓解策略**:
- 检测动态场景，要求开发者提供 `key`
- 开发模式下检测并警告冲突
- 用户 `key` 优先级最高，可覆盖位置ID

### 风险 3: 向后兼容性

**风险描述**: 现有代码可能依赖运行时计数器的行为

**缓解策略**:
- 位置ID优先级低于用户 `key`，不影响现有代码
- 运行时计数器作为最后回退，保持向后兼容
- 渐进式迁移，旧代码仍然可用

### 风险 4: 内存占用增加

**风险描述**: 每个元素多一个属性可能增加内存占用

**缓解策略**:
- 属性值是字符串，内存占用很小
- 相比错误的元素复用导致的问题，这个代价是值得的
- 性能测试确保影响 < 5%

## 成功验收

RFC 实施成功的标准：

### 功能验收
- [x] 步骤 1.1 完成：Babel 插件为所有元素注入位置ID
- [ ] 步骤 1.2 完成：动态场景检测正常工作
- [ ] 步骤 1.3 完成：语言切换器在所有场景下正确显示
- [ ] 步骤 2.1 完成：缓存键冲突检测正常工作
- [ ] 步骤 2.2 完成：调试信息输出正确
- [ ] 步骤 3.1 完成：文本节点复用逻辑优化
- [ ] 步骤 3.2 完成：元数据一致性保证
- [ ] 步骤 3.3 完成：性能基准测试通过
- [ ] 步骤 4.1 完成：100% 测试覆盖率
- [ ] 步骤 4.2 完成：文档更新
- [ ] 步骤 4.3 完成：示例项目创建

### 质量验收
- [ ] 所有测试通过（100% 通过率）
- [ ] 代码覆盖率达到 100%
- [ ] 零 Lint 错误
- [ ] 零 TypeScript 类型错误

### 性能验收
- [ ] 编译时性能影响 < 10%
- [ ] 运行时性能影响 < 5%
- [ ] 内存占用增加 < 5%

## 参考资料

- [RFC-0037: DOM Cache](./0037-dom-cache.md)
- [RFC-0040: Cache Reuse Element Order](./0040-cache-reuse-element-order-and-ref-callback-fixes.md)
- [RFC-0042: Language Switcher Immediate UI Update](./0042-language-switcher-immediate-ui-update.md)
- [Element Marking Utilities](../../packages/core/src/utils/element-marking.ts)
- [Cache Key Generation](../../packages/core/src/utils/cache-key.ts)
- [Babel Plugin WSX Focus](../../packages/vite-plugin/src/babel-plugin-wsx-focus.ts)

## 变更历史

- 2025-01-02: RFC 创建
