# RFC 0038: WebComponent 首次渲染时 RenderContext 缺失修复

- **RFC编号**: 0038
- **开始日期**: 2025-01-XX
- **RFC PR**: [待提交]
- **WSX Issue**: [待创建]
- **状态**: Implemented

## 摘要

修复了 `WebComponent.connectedCallback()` 中首次渲染时缺少 `RenderContext` 的问题。该问题导致首次渲染时通过 `h()` 创建的元素没有被标记 `__wsxCacheKey`，从而在重渲染时出现重复元素。

## 问题描述

### 问题表现

在使用 `WebComponent` 时，特别是使用动态标签名（如 `<TagName></TagName>`）创建自定义元素时，会出现以下问题：

1. **首次渲染时元素没有 `__wsxCacheKey` 标记**
   - 第一个语言切换器：`__wsxCacheKey` 为 `undefined`
   - 第二个语言切换器：`__wsxCacheKey` 为 `"LanguageSwitcher:default:div:key-switcher-root"`

2. **重渲染时出现重复元素**
   - 未标记的元素被 `shouldPreserveElement()` 保留
   - 新渲染的元素（有标记）被添加到 DOM
   - 导致同一个组件出现两个实例

### 问题代码

```typescript
// packages/core/src/web-component.ts (修复前)
connectedCallback(): void {
    this.connected = true;
    try {
        // ... 样式处理 ...
        
        // ❌ 问题：直接调用 render()，没有使用 RenderContext.runInContext()
        const content = this.render();
        this.shadowRoot.appendChild(content);
    } catch (error) {
        // ...
    }
}
```

### 根本原因

`WebComponent` 的 `connectedCallback()` 和 `_rerender()` 方法在调用 `render()` 时使用了不同的方式：

1. **`connectedCallback()`** (首次渲染):
   ```typescript
   const content = this.render(); // ❌ 没有上下文
   ```

2. **`_rerender()`** (重渲染):
   ```typescript
   const content = RenderContext.runInContext(this, () => this.render()); // ✅ 有上下文
   ```

这导致：
- 首次渲染时，`h()` 函数无法获取 `RenderContext`，走无上下文路径
- 虽然我们修复了无上下文路径也会标记元素，但首次渲染的元素仍然没有正确的缓存管理
- 重渲染时，新元素有正确的标记和缓存，但旧元素（无标记）被保留，导致重复

## 解决方案

### 核心修复

在 `WebComponent.connectedCallback()` 中使用 `RenderContext.runInContext()` 包装 `render()` 调用，确保首次渲染时也有上下文。

```typescript
// packages/core/src/web-component.ts (修复后)
connectedCallback(): void {
    this.connected = true;
    try {
        // ... 样式处理 ...
        
        // ✅ 修复：使用 RenderContext.runInContext() 确保 h() 能够获取上下文
        // 否则，首次渲染时创建的元素不会被标记 __wsxCacheKey，导致重复元素问题
        const content = RenderContext.runInContext(this, () => this.render());
        this.shadowRoot.appendChild(content);
    } catch (error) {
        // ...
    }
}
```

### 相关修复

#### 1. `h()` 函数无上下文时的标记修复

即使没有上下文，`h()` 函数也会标记元素，作为防御性修复：

```typescript
// packages/core/src/jsx-factory.ts
export function h(...) {
    // ...
    if (context && cacheManager) {
        return tryUseCacheOrCreate(tag, props, children, context, cacheManager);
    }

    // 无上下文：使用旧逻辑（向后兼容）
    // 关键修复：即使没有上下文，也要标记元素，以便框架能够正确管理它
    // 否则，未标记的元素会被 shouldPreserveElement() 保留，导致重复元素
    const element = createElementWithPropsAndChildren(tag, props, children);
    const componentId = getComponentId();
    const cacheKey = generateCacheKey(tag, props, componentId, context);
    markElement(element, cacheKey); // ✅ 确保标记
    return element;
}
```

#### 2. `handleCacheError` 中的标记修复

缓存失败时也确保标记元素：

```typescript
// packages/core/src/jsx-factory.ts
function handleCacheError(...) {
    // ...
    // 关键修复：即使缓存失败，也要标记元素，以便框架能够正确管理它
    const element = createElementWithPropsAndChildren(tag, props, children);
    const context = RenderContext.getCurrentComponent();
    const componentId = getComponentId();
    const cacheKey = generateCacheKey(tag, props, componentId, context);
    markElement(element, cacheKey); // ✅ 确保标记
    return element;
}
```

#### 3. 调试日志添加

在开发环境中添加调试日志，帮助定位上下文丢失问题：

```typescript
// packages/core/src/jsx-factory.ts
if (nodeEnv === "development") {
    if (!context) {
        logger.debug(
            `h() called without render context. Tag: "${tag}", ComponentId: "${getComponentId()}"`,
            {
                tag,
                props: props ? Object.keys(props) : [],
                hasCacheManager: !!cacheManager,
            }
        );
    } else if (!cacheManager) {
        logger.debug(
            `h() called with context but no cache manager. Tag: "${tag}", Component: "${context.constructor.name}"`,
            {
                tag,
                component: context.constructor.name,
            }
        );
    }
}
```

## 验证

### 修复前

```typescript
// 首次渲染
const content = this.render(); // ❌ 没有上下文
// 结果：元素没有 __wsxCacheKey

// 重渲染
const content = RenderContext.runInContext(this, () => this.render()); // ✅ 有上下文
// 结果：新元素有 __wsxCacheKey，旧元素没有，导致重复
```

### 修复后

```typescript
// 首次渲染
const content = RenderContext.runInContext(this, () => this.render()); // ✅ 有上下文
// 结果：元素有 __wsxCacheKey

// 重渲染
const content = RenderContext.runInContext(this, () => this.render()); // ✅ 有上下文
// 结果：元素正确更新，不会重复
```

### 测试验证

- ✅ `LightComponent` 从一开始就正确使用了 `RenderContext.runInContext()`，没有此问题
- ✅ `WebComponent` 现在在首次渲染和重渲染时都正确使用 `RenderContext.runInContext()`
- ✅ 所有通过 `h()` 创建的元素都会被正确标记 `__wsxCacheKey`
- ✅ 不再出现重复元素问题
- ✅ 所有现有测试通过

## 影响范围

### 修改的文件

1. **`packages/core/src/web-component.ts`**
   - 修改 `connectedCallback()` 方法
   - 使用 `RenderContext.runInContext()` 包装 `render()` 调用

2. **`packages/core/src/jsx-factory.ts`**
   - 修复无上下文路径的元素标记
   - 修复 `handleCacheError` 中的元素标记
   - 添加调试日志

### 相关文件

- `packages/core/src/render-context.ts` - RenderContext 实现（无需修改）
- `packages/core/src/utils/element-marking.ts` - 元素标记工具（无需修改）

### 向后兼容性

- ✅ **完全向后兼容**：修复不影响现有代码
- ✅ **无破坏性变更**：所有现有功能正常工作
- ✅ **性能影响**：无负面影响，反而修复了重复元素导致的性能问题

## 设计决策

### 为什么选择在 `connectedCallback()` 中使用 `RenderContext.runInContext()`？

1. **一致性**：与 `_rerender()` 保持一致，确保首次渲染和重渲染行为一致
2. **正确性**：确保 `h()` 函数能够获取上下文，正确标记和管理元素
3. **简单性**：最小化修改，只需包装 `render()` 调用

### 为什么添加防御性修复？

1. **健壮性**：即使在某些边缘情况下上下文丢失，元素仍然能被正确标记
2. **调试友好**：通过日志帮助开发者定位问题
3. **向后兼容**：支持没有上下文的情况（向后兼容）

## 相关 RFC

- **RFC 0037**: WSXJS DOM Optimization - Smart Caching and Fine-grained Updates
  - 此修复是 RFC 0037 实现的一部分
  - 确保元素标记机制的正确性

## 附录

### 问题复现步骤

1. 创建一个 `WebComponent`，使用动态标签名：
   ```tsx
   render() {
       return (
           <div>
               {this.tags.map((tag) => {
                   const TagName = tag;
                   return <TagName></TagName>;
               })}
           </div>
       );
   }
   ```

2. 首次渲染时，检查元素的 `__wsxCacheKey`：
   ```javascript
   const element = document.querySelector('language-switcher');
   console.log(element.__wsxCacheKey); // undefined (修复前)
   ```

3. 触发重渲染（如改变状态）：
   ```javascript
   component.rerender();
   ```

4. 检查 DOM，会发现有两个相同的元素（修复前）

### 修复验证步骤

1. 使用相同的组件代码
2. 首次渲染后检查元素的 `__wsxCacheKey`：
   ```javascript
   const element = document.querySelector('language-switcher');
   console.log(element.__wsxCacheKey); // "ComponentId:language-switcher:..." (修复后)
   ```

3. 触发重渲染，检查 DOM，应该只有一个元素（修复后）

### 参考资料

- [RFC 0037: WSXJS DOM Optimization](./0037-vapor-mode-inspired-dom-optimization.md)
- [RFC 0037: Third-party Element Preservation](./0037-third-party-element-preservation.md)

---

*此 RFC 记录了 WebComponent 首次渲染时 RenderContext 缺失问题的修复过程，确保元素标记机制的正确性和一致性。*

