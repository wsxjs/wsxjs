# RFC 0046: Babel Plugin Focus-Only 重新设计

## 状态
**Accepted** (已实施)

## 作者
AI Assistant

## 创建日期
2025-01-XX

## 问题描述

### 当前问题

1. **`__wsxPositionId` 导致的问题**：
   - `babel-plugin-wsx-focus.ts` 原本应该只处理 focus preservation
   - 但被错误地用于生成 `__wsxPositionId` 用于 cache key 生成
   - 这导致了大量问题（见 RFC 0040-0045）
   - 插件名称是 `babel-plugin-wsx-focus`，应该只处理 focus 相关的问题

2. **设计不一致**：
   - 编译时注入 `__wsxPositionId` 与运行时的渲染复用机制不匹配
   - 导致 `updateChildren` 需要处理"元素已在 DOM 中"的复杂情况
   - 违反了单一职责原则

### 根本原因

**核心问题**：`babel-plugin-wsx-focus` 被错误地用于生成 cache key，而不是只处理 focus preservation。这违反了插件名称和设计初衷。

## 设计目标

1. **单一职责**：`babel-plugin-wsx-focus` 只处理 focus preservation，不处理 cache key 生成
2. **学习 React/Vue**：依赖用户提供的 `key` prop，而不是自动生成 position ID
3. **简化框架逻辑**：移除对 `__wsxPositionId` 的依赖，简化 `updateChildren` 逻辑

## 解决方案

### 核心原则（学习 React/Vue）

1. **用户 `key` 优先**：框架优先使用用户提供的 `key` prop
2. **运行时计数器回退**：如果没有 `key`，使用运行时计数器
3. **不自动生成 position ID**：不在编译时生成 position ID，避免与 DOM 状态不匹配

### 方案 1: Focus-Only 设计（推荐）

**核心思想**：
- `babel-plugin-wsx-focus` 只生成 `data-wsx-key` 用于 focus preservation
- 不生成 `__wsxPositionId`
- 框架的 `generateCacheKey` 移除对 `__wsxPositionId` 的依赖
- 框架依赖用户 `key` 或运行时计数器

**优点**：
- 单一职责：插件只处理 focus，框架只处理 cache
- 简化逻辑：不需要处理编译时 position ID 与运行时 DOM 状态的不匹配
- 符合 React/Vue 的设计理念：依赖用户 `key`，而不是自动生成

**缺点**：
- 失去编译时优化的优势（但这是可以接受的权衡）

## 如何依赖用户提供的 key（参考 React/Vue）

### React/Vue 的做法

**React 示例**：
```jsx
const items = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
  { id: 3, name: 'Item 3' }
];

function ItemList() {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

**Vue 示例**：
```vue
<template>
  <ul>
    <li v-for="item in items" :key="item.id">{{ item.name }}</li>
  </ul>
</template>
```

**关键点**：
1. 用户必须显式提供 `key` prop
2. `key` 应该是稳定的、唯一的标识符（如数据库 ID）
3. 框架使用 `key` 来识别和复用元素
4. `key` 不会被渲染到 DOM（是框架内部属性）

### WSX 的实现方式

**1. 框架如何提取 `key`**：

```typescript
// packages/core/src/utils/cache-key.ts
export function generateCacheKey(
    tag: string,
    props: Record<string, unknown> | null | undefined,
    componentId: string,
    component?: BaseComponent
): string {
    const userKey = props?.key;  // 从 props 中提取用户 key
    
    // 优先级 1: 用户 key（最可靠，符合 React/Vue 设计）
    if (userKey !== undefined && userKey !== null) {
        return `${componentId}:${tag}:key-${String(userKey)}`;
    }
    
    // 优先级 2: 索引（列表场景）
    // 优先级 3: 运行时计数器（回退）
    // ...
}
```

**2. 框架如何确保 `key` 不被渲染到 DOM**：

```typescript
// packages/core/src/utils/props-utils.ts
export function isFrameworkInternalProp(key: string): boolean {
    // JSX 标准：key 不应该渲染到 DOM
    if (key === "key") {
        return true;
    }
    // ...
}
```

**3. 使用示例**：

```typescript
// WSX 组件中使用 key（与 React 完全一致）
class TodoList extends BaseComponent {
    @state private todos: Todo[] = [
        { id: 1, text: 'Learn WSX' },
        { id: 2, text: 'Build app' },
        { id: 3, text: 'Deploy' }
    ];

    render(): HTMLElement {
        return (
            <ul>
                {this.todos.map(todo => (
                    <li key={todo.id}>{todo.text}</li>
                ))}
            </ul>
        );
    }
}
```

**4. 框架的工作流程**：

```
1. 用户编写 JSX: <li key={todo.id}>{todo.text}</li>
2. JSX 转换为 h() 调用: h("li", { key: todo.id }, todo.text)
3. generateCacheKey() 提取 key: props.key = todo.id
4. 生成 cache key: "TodoList:123:li:key-1"
5. 框架使用 cache key 来复用元素
6. key 不会被渲染到 DOM（isFrameworkInternalProp 过滤）
```

### 与 React/Vue 的对比

| 特性 | React | Vue | WSX (当前实现) |
|------|-------|-----|----------------|
| 用户提供 `key` | ✅ 必须 | ✅ 必须 | ✅ 推荐 |
| 自动生成 position ID | ❌ 不支持 | ❌ 不支持 | ❌ 已移除 |
| `key` 渲染到 DOM | ❌ 不会 | ❌ 不会 | ❌ 不会 |
| 运行时计数器回退 | ✅ 支持 | ✅ 支持 | ✅ 支持 |
| 列表场景使用索引 | ⚠️ 不推荐 | ⚠️ 不推荐 | ✅ 支持（`__wsxIndex`） |

### 最佳实践

**1. 列表渲染时总是提供 `key`**：

```typescript
// ✅ 好：使用稳定的唯一标识符
{items.map(item => (
    <div key={item.id}>{item.name}</div>
))}

// ❌ 不好：使用数组索引（除非列表不会重新排序）
{items.map((item, index) => (
    <div key={index}>{item.name}</div>
))}
```

**2. `key` 应该是稳定的**：

```typescript
// ✅ 好：使用数据库 ID
{users.map(user => (
    <UserCard key={user.id} user={user} />
))}

// ❌ 不好：使用随机数或时间戳
{items.map(item => (
    <Item key={Math.random()}>{item.name}</Item>
))}
```

**3. 条件渲染时也可以使用 `key`**：

```typescript
// 使用 key 强制重新创建元素（而不是复用）
{isEditing ? (
    <EditForm key="edit" />
) : (
    <ViewForm key="view" />
)}
```

## 实施计划

### 阶段 1: 修改 babel-plugin-wsx-focus.ts ✅
- [x] 移除 `__wsxPositionId` 的生成（插件只生成 `data-wsx-key`）
- [x] 只生成 `data-wsx-key` 用于 focus preservation
- [x] 更新注释说明插件只处理 focus

### 阶段 2: 修改 generateCacheKey ✅
- [x] 移除对 `__wsxPositionId` 的依赖
- [x] 优先级：用户 `key` > 运行时计数器
- [x] 移除 `POSITION_ID_KEY` 常量
- [x] 更新测试移除对 `__wsxPositionId` 的测试

### 阶段 3: 简化 updateChildren
- [ ] 移除对"元素已在 DOM 中"的特殊处理（用户已撤销更改，保持当前状态）
- [ ] 恢复简单的"新元素"和"旧元素"对比逻辑（用户已撤销更改，保持当前状态）

## 成功标准

1. ✅ `babel-plugin-wsx-focus` 只处理 focus preservation
2. ✅ 框架不再依赖 `__wsxPositionId`
3. ✅ 所有测试通过
4. ✅ 渲染性能不受影响
5. ✅ 用户可以通过 `key` prop 控制元素复用（与 React/Vue 一致）

## 风险评估

- **低风险**：移除 `__wsxPositionId` 会简化逻辑，减少问题
- **性能影响**：失去编译时优化，但运行时计数器仍然高效
- **兼容性**：向后兼容，不影响现有代码（如果用户提供了 `key`）
- **用户体验**：需要用户显式提供 `key`（与 React/Vue 一致，这是好的实践）

## 总结

通过移除 `__wsxPositionId` 并依赖用户提供的 `key`，WSX 框架现在：

1. ✅ **与 React/Vue 一致**：使用相同的 `key` prop 机制
2. ✅ **单一职责**：`babel-plugin-wsx-focus` 只处理 focus
3. ✅ **简化逻辑**：不需要处理编译时 position ID 与运行时 DOM 状态的不匹配
4. ✅ **更好的用户体验**：用户可以通过 `key` 显式控制元素复用

这是更好的设计，符合业界最佳实践。
