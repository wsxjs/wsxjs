# DOM 缓存与 Key 最佳实践

## 概述

WSXJS 使用 DOM 缓存机制来优化渲染性能，避免不必要的 DOM 元素重建。理解如何正确使用 `key` 属性对于确保应用的正确性和性能至关重要。

## 核心概念

### 什么是 DOM 缓存？

DOM 缓存是一种性能优化技术，它会：
- **复用现有的 DOM 元素**而不是销毁和重建
- **只更新变化的属性和子元素**
- **通过 cache key 识别和匹配元素**

### Cache Key 的组成

WSXJS 自动生成的缓存键格式：
```
${componentId}:${tag}:${identifier}
```

其中 `identifier` 可以是：
- 用户提供的 `key` 属性值
- 数组索引 `index`
- 自动生成的位置 ID

## ⚠️ 关键规则：避免重复 Key

**同一个 `key` 不能在不同的父容器中使用！**

### 为什么？

当同一个 key 出现在不同父容器中时：
1. DOM 元素会被**错误地共享**
2. `appendChild` 会**自动移动元素**从旧父容器到新父容器
3. 导致元素出现在**错误的位置**

### 问题示例 ❌

```tsx
class BadExample extends BaseComponent {
    render() {
        const items = [0, 1, 2, 3, 4];
        const visibleItems = items.slice(0, 3);
        const overflowItems = items.slice(3);

        return (
            <div>
                {/* 导航菜单 */}
                <nav class="nav-menu">
                    {visibleItems.map((item, index) => (
                        <wsx-link key={index}>Item {item}</wsx-link>
                        {/* ❌ 错误：使用 key={index} */}
                    ))}
                </nav>

                {/* 溢出菜单 */}
                <div class="overflow-menu">
                    {overflowItems.map((item, index) => (
                        <wsx-link key={index}>Item {item}</wsx-link>
                        {/* ❌ 错误：使用 key={index}，与 nav-menu 冲突！*/}
                    ))}
                </div>
            </div>
        );
    }
}
```

**问题**：`overflow-menu` 中的 `key={0}` 与 `nav-menu` 中的 `key={0}` 冲突，导致元素被错误地移动。

### 正确的解决方案 ✅

```tsx
class GoodExample extends BaseComponent {
    render() {
        const items = [0, 1, 2, 3, 4];
        const visibleItems = items.slice(0, 3);
        const overflowItems = items.slice(3);

        return (
            <div>
                {/* 导航菜单 */}
                <nav class="nav-menu">
                    {visibleItems.map((item, index) => (
                        <wsx-link key={`nav-${index}`}>Item {item}</wsx-link>
                        {/* ✅ 正确：使用唯一前缀 "nav-" */}
                    ))}
                </nav>

                {/* 溢出菜单 */}
                <div class="overflow-menu">
                    {overflowItems.map((item, index) => (
                        <wsx-link key={`overflow-${index}`}>Item {item}</wsx-link>
                        {/* ✅ 正确：使用唯一前缀 "overflow-" */}
                    ))}
                </div>
            </div>
        );
    }
}
```

## 最佳实践

### 1. 为不同位置使用不同的 key 前缀

```tsx
// ✅ 推荐
<wsx-link key={`nav-${index}`}>Navigation</wsx-link>
<wsx-link key={`sidebar-${index}`}>Sidebar</wsx-link>
<wsx-link key={`footer-${index}`}>Footer</wsx-link>
```

### 2. 条件渲染时保持 key 一致性

```tsx
class ConditionalRender extends BaseComponent {
    render() {
        const showMenu = this.state.isOpen;

        return (
            <div>
                {showMenu ? (
                    <nav>
                        {items.map(item => (
                            <wsx-link key={`menu-${item.id}`}>
                                {/* ✅ 使用稳定的 ID */}
                                {item.name}
                            </wsx-link>
                        ))}
                    </nav>
                ) : null}
            </div>
        );
    }
}
```

### 3. 动态容器使用语义化前缀

```tsx
class DynamicContainers extends BaseComponent {
    render() {
        return (
            <div>
                {categories.map(category => (
                    <section key={category.id}>
                        {category.items.map(item => (
                            <wsx-link key={`${category.id}-${item.id}`}>
                                {/* ✅ 结合父容器 ID */}
                                {item.name}
                            </wsx-link>
                        ))}
                    </section>
                ))}
            </div>
        );
    }
}
```

### 4. 列表项使用唯一标识符

```tsx
// ✅ 推荐：使用唯一 ID
items.map(item => <wsx-link key={item.id}>{item.name}</wsx-link>)

// ⚠️ 可接受：如果确保不会在其他地方使用相同索引
items.map((item, index) => <wsx-link key={`list-${index}`}>{item.name}</wsx-link>)

// ❌ 避免：纯索引，容易在多个列表中冲突
items.map((item, index) => <wsx-link key={index}>{item.name}</wsx-link>)
```

## 运行时警告

WSXJS 会自动检测重复 key 问题并在控制台输出警告：

```
[DOMCacheManager] Duplicate key "0" detected in different parent containers!
  Previous parent: nav.nav-menu
  Current parent:  div.overflow-menu

This may cause elements to appear in wrong containers or be moved unexpectedly.

Solution: Use unique key prefixes for different locations:
  Example: <wsx-link key="nav-0"> vs <wsx-link key="overflow-0">

See https://wsxjs.dev/docs/guide/DOM_CACHE_GUIDE for best practices.
```

**重要**：
- ⚠️ 此警告在**所有环境**（开发和生产）中都会出现
- 🔧 必须立即修复，这是正确性问题，不仅仅是性能问题
- 📝 使用唯一的 key 前缀来解决

## 编译时检查

除了运行时警告，WSXJS 还提供 ESLint 规则来在编译时检测重复 key：

### 安装和配置

```bash
npm install --save-dev @wsxjs/eslint-plugin-wsx
```

```javascript
// .eslintrc.js
module.exports = {
    plugins: ['wsx'],
    rules: {
        'wsx/no-duplicate-keys': 'error',
    },
};
```

### ESLint 错误示例

```tsx
// ❌ ESLint 会报错
render() {
    return (
        <div>
            <nav>{items.map((item, i) => <a key={i}>{item}</a>)}</nav>
            <div>{otherItems.map((item, i) => <a key={i}>{item}</a>)}</div>
            {/* 错误：Duplicate key "i" in different parent containers */}
        </div>
    );
}
```

## 常见问题

### Q: 为什么不能在不同父容器中使用相同的 key？

A: 因为 DOM 元素在 JavaScript 中只能有一个父节点。当你调用 `appendChild` 时，如果元素已经在 DOM 树的其他位置，它会被自动**移动**而不是复制。WSXJS 的缓存机制依赖于唯一的 cache key，重复的 key 会导致元素被错误地共享和移动。

### Q: 我的应用中所有列表都使用 `key={index}`，会有问题吗？

A: 如果这些列表在不同的父容器中（例如不同的 `<nav>`、`<div>`、`<section>`），那么会有问题！解决方案是为每个列表添加唯一前缀，例如 `key={`nav-${index}`}` 和 `key={`sidebar-${index}`}`。

### Q: 条件渲染时需要更改 key 吗？

A: 不需要。如果元素的 key 保持不变，DOM 元素会被正确地复用。只需确保同一个 key 不会出现在不同的父容器中即可。

### Q: 如果我的数据项没有唯一 ID 怎么办？

A: 有几个选择：
1. **推荐**：为数据项生成唯一 ID（例如使用 UUID）
2. 使用索引但添加语义化前缀：`key={`${containerName}-${index}`}`
3. 使用数据项的组合属性创建唯一键：`key={`${item.name}-${item.type}`}`

## 总结

| 规则 | 说明 | 示例 |
|------|------|------|
| ❌ 禁止重复 | 不要在不同父容器中使用相同的 key | `key={0}` 同时出现在 nav 和 div 中 |
| ✅ 使用前缀 | 为不同位置的元素添加唯一前缀 | `key="nav-0"` vs `key="overflow-0"` |
| ✅ 保持一致 | 条件渲染时保持 key 不变 | `key={item.id}` 在显示/隐藏时保持一致 |
| ⚠️ 监听警告 | 重视运行时警告，立即修复 | 查看浏览器控制台的 DOMCacheManager 警告 |

## 相关资源

- [快速开始指南](./QUICK_START.md)
- [Web Component 指南](./WEB_COMPONENT_GUIDE.md)
- [Light Component 指南](./LIGHT_COMPONENT_GUIDE.md)
- [TypeScript 配置](./TYPESCRIPT_SETUP.md)

---

> 💡 **提示**：正确使用 key 不仅能避免 bug，还能充分发挥 DOM 缓存的性能优势！
