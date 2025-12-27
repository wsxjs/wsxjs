# RFC 0037: WSXJS DOM Optimization - Smart Caching and Fine-grained Updates

- **RFC编号**: 0037
- **开始日期**: 2024-12-26
- **RFC PR**: [待提交]
- **WSX Issue**: [待创建]
- **状态**: Draft

## 摘要

WSXJS 作为原创的 Web Components 框架，需要实现细粒度的 DOM 更新机制，避免每次渲染时重建整个 DOM 树，从而显著减少 DOM 操作开销，提升性能和内存效率。

**核心设计原则**：完全自动、零配置、零侵入。框架自动处理所有优化，开发者无需修改现有代码或学习新 API。所有优化在框架层面自动完成，对开发者完全透明。

**标记识别机制（核心规则）**：
- **`h()` 创建的 DOM 元素必须被标记**：所有通过 `h()` 函数创建的 DOM 元素都会被标记 `__wsxCacheKey`，用于缓存管理和更新识别
- **未标记的 DOM 元素自动保留**：任何没有 `__wsxCacheKey` 标记的 DOM 元素（如自定义元素、第三方库注入的元素）都会被自动识别并保留，不会被框架移除或更新

**WSXJS 原创设计**：此优化方案是 WSXJS 框架的原创设计，基于 WSXJS 的核心理念和实际需求，不依赖任何外部框架或标准。

## 动机

### WSXJS 当前渲染机制的问题

WSXJS 作为原创的 Web Components 框架，当前渲染机制存在以下问题，需要通过原创的优化方案来解决：

#### 1. 全量 DOM 替换

```typescript
// packages/core/src/web-component.ts
protected _rerender(): void {
    // 1. 调用 render() 生成新的 DOM 树
    const content = this.render();
    
    // 2. 添加新内容
    this.shadowRoot.appendChild(content);
    
    // 3. 移除所有旧内容
    const oldChildren = Array.from(this.shadowRoot.children).filter(
        (child) => child !== content
    );
    oldChildren.forEach((child) => child.remove());
}
```

**问题**：
- 每次 `render()` 调用都会创建全新的 DOM 树
- 即使只有一小部分数据变化，也会替换整个 DOM
- 导致不必要的 DOM 创建和销毁开销

#### 2. 无法利用 DOM 复用

```tsx
// 示例：列表组件
render() {
    return (
        <ul>
            {this.items.map((item, index) => (
                <li key={index}>{item.name}</li>
            ))}
        </ul>
    );
}
```

**问题**：
- 当 `items` 数组只有一项变化时，所有 `<li>` 元素都会被销毁和重建
- 无法复用未变化的 DOM 节点
- 导致焦点、滚动位置、输入状态等丢失

#### 3. 后注入元素丢失问题

在某些场景下，元素是在 `render()` 之后被注入到 DOM 的：

```tsx
// 场景1: onRendered() 钩子中注入元素
class CodeBlock extends WebComponent {
    render() {
        return <pre><code>{this.code}</code></pre>;
    }
    
    protected onRendered() {
        // 第三方库（如 Prism.js）在渲染后注入语法高亮元素
        Prism.highlightElement(this.querySelector('code'));
        // 问题：如果组件重新渲染，这些注入的元素会丢失
    }
}

// 场景2: 异步加载的组件
class WsxView extends WebComponent {
    render() {
        return <div class="route-view"></div>;
    }
    
    private async loadComponent(name: string) {
        const component = document.createElement(name);
        const container = this.querySelector('.route-view');
        container.appendChild(component); // 后注入的元素
        // 问题：如果父组件重新渲染，这个 component 会丢失
    }
}

// 场景3: 第三方库动态注入
class ChartComponent extends WebComponent {
    render() {
        return <div id="chart-container"></div>;
    }
    
    protected onRendered() {
        // Chart.js 会在容器中注入 canvas 元素
        new Chart(this.querySelector('#chart-container'), { ... });
        // 问题：重新渲染会导致 canvas 元素丢失，图表需要重新初始化
    }
}
```

**问题**：
- 重新渲染会清空所有内容，包括后注入的元素
- 导致第三方库需要重新初始化
- 可能导致状态丢失、性能问题、用户体验下降

#### 4. 性能开销

- **DOM 创建开销**：每次渲染都要创建大量 DOM 节点
- **内存开销**：旧的 DOM 树在垃圾回收前占用内存
- **浏览器重排/重绘**：全量替换触发大量重排和重绘
- **事件监听器丢失**：需要重新绑定事件监听器

### 实际场景示例

```tsx
// 场景1: 大型列表更新
class TodoList extends WebComponent {
    @state private todos: Todo[] = [];
    
    render() {
        return (
            <div>
                {this.todos.map(todo => (
                    <TodoItem key={todo.id} todo={todo} />
                ))}
            </div>
        );
    }
}

// 问题：当添加一个新 todo 时，所有现有的 TodoItem 都会被重建
```

```tsx
// 场景2: 表单输入
class FormComponent extends WebComponent {
    @state private name: string = "";
    @state private email: string = "";
    
    render() {
        return (
            <form>
                <input value={this.name} onInput={(e) => this.name = e.target.value} />
                <input value={this.email} onInput={(e) => this.email = e.target.value} />
            </form>
        );
    }
}

// 问题：当 name 变化时，email 输入框也会被重建，导致焦点丢失
```

```tsx
// 场景3: 后注入元素丢失
class CodeEditor extends WebComponent {
    @state private code: string = "";
    private editorInstance: any; // Monaco Editor 实例
    
    render() {
        return <div id="editor-container"></div>;
    }
    
    protected onRendered() {
        // Monaco Editor 在容器中注入大量 DOM 元素
        this.editorInstance = monaco.editor.create(
            this.querySelector('#editor-container'),
            { value: this.code }
        );
        // 问题：如果 code 变化触发重新渲染，Monaco 注入的所有元素都会丢失
        // 需要重新创建编辑器实例，导致性能问题和用户体验下降
    }
}
```

### 为什么重要

- **性能**：减少 DOM 操作可以显著提升应用性能，特别是在大型应用中
- **用户体验**：避免不必要的焦点丢失、滚动位置重置等问题
- **内存效率**：减少 DOM 节点的创建和销毁，降低内存占用
- **浏览器优化**：让浏览器能够更好地优化 DOM 更新
- **第三方库兼容性**：保护后注入的元素，避免第三方库需要重新初始化
- **状态保持**：保持 DOM 中的动态状态（如编辑器内容、图表数据等）

## 崩溃原因分析（背景）

### 🔴 根本原因

**问题代码**（packages/core/src/jsx-factory.ts）：
```typescript
// 移除多余的旧节点
while (element.childNodes.length > newChildren.length) {
    const lastChild = element.lastChild;

    // ❌ 问题：遇到未标记元素直接 break
    if (shouldPreserveElement(lastChild)) {
        break;  // ← 导致后续节点无法删除！
    }

    if (isCreatedByH(lastChild)) {
        element.removeChild(lastChild);
    }
}
```

**为什么会崩溃**：
1. DOM 中有 10 个子节点
2. newChildren 只有 5 个
3. 需要删除后 5 个节点
4. 但第 6 个节点恰好是"未标记"的
5. 遇到未标记节点 → break → 后 4 个节点没删除
6. DOM 结构不匹配 → 渲染混乱 → 页面崩溃

### ✅ 正确的逻辑

```typescript
while (element.childNodes.length > newChildren.length) {
    const lastChild = element.lastChild;

    if (shouldPreserveElement(lastChild)) {
        // ✅ 不删除，但移到一个临时位置
        // 或者标记为"需要保留"，稍后处理
        // 不应该直接 break
    } else {
        element.removeChild(lastChild);
    }
}
```

## 详细设计

### **WSXJS 的核心定位：真实 DOM + 智能缓存**

**WSXJS 的优化目标**：
- ✅ **DOM 复用**：避免销毁和重新创建 DOM 节点
- ✅ **最小化 DOM 操作**：只更新变化的属性和文本
- ✅ **智能缓存**：通过编译时位置 ID 和运行时组件 ID 实现高效缓存
- ✅ **细粒度更新**：只更新实际变化的部分，不重建整个树
- ❌ **不做 Virtual DOM**：直接操作真实 DOM，不引入虚拟 DOM 抽象层

### 核心概念

#### 1. DOM 缓存与复用（DOM Caching & Reuse）

**核心思想**：`h()` 函数不是每次都创建新 DOM，而是智能复用。

```typescript
// 当前实现（每次创建新 DOM）
export function h(tag, props, ...children): HTMLElement {
    const element = document.createElement(tag);  // ← 每次创建新元素
    applyProps(element, props);
    appendChildren(element, children);
    return element;
}

// 优化后（智能复用 DOM）
export function h(tag, props, ...children): HTMLElement {
    // 1. 生成缓存键（基于位置）
    const cacheKey = generateCacheKey(tag, props);

    // 2. 检查缓存
    let element = domCacheManager.get(cacheKey);

    if (element) {
        // 3. 复用 DOM，只更新变化的部分
        updateElement(element, props, children);
    } else {
        // 4. 首次渲染，创建新 DOM
        element = document.createElement(tag);
        applyProps(element, props);
        appendChildren(element, children);

        // 5. 缓存元素
        domCacheManager.set(cacheKey, element);

        // 6. **标记元素**：保存缓存键到元素上（用于识别和管理）
        // 核心规则：所有由 h() 创建的 DOM 元素都必须有 __wsxCacheKey 标记
        // 未标记的元素（自定义元素、第三方库注入）应该被自动保留
        (element as any).__wsxCacheKey = cacheKey;
    }

    return element;
}
```

**关键点**：
- ✅ **不依赖 Virtual DOM**：直接操作真实 DOM
- ✅ **编译时 + 运行时**：编译时注入位置 ID，运行时缓存 DOM
- ✅ **零配置**：开发者不需要做任何事情
- ✅ **标记机制**：所有由 `h()` 创建的 DOM 元素都会被标记 `__wsxCacheKey`，用于识别和管理
- ✅ **自动保留**：未标记的 DOM 元素（自定义元素、第三方库注入）自动被保留，不会被移除

#### 2. 元素标识策略（Element Identity）

**核心问题**：如何唯一标识一个 JSX 元素？

**方案：编译时位置 ID + 运行时组件 ID**

```typescript
// 开发者代码（零配置）
class MyComponent extends WebComponent {
    render() {
        return (
            <div>
                <h1>{this.title}</h1>     // ← 位置 1
                <p>{this.description}</p>  // ← 位置 2
            </div>                         // ← 位置 0
        );
    }
}

// Babel 插件编译后（自动注入位置 ID）
class MyComponent extends WebComponent {
    render() {
        return h('div', { [POSITION]: 0 },
            h('h1', { [POSITION]: 1 }, this.title),
            h('p', { [POSITION]: 2 }, this.description)
        );
    }
}

// 缓存键生成
function generateCacheKey(tag, props) {
    const componentId = getCurrentComponentId(); // "MyComponent:abc123"
    const positionId = props[POSITION];           // 1

    return `${componentId}:${positionId}`;        // "MyComponent:abc123:1"
}

// 运行时组件 ID 生成策略
function getCurrentComponentId(): string {
    // 阶段 0 原型：使用 __testId 或手动传递（简化实现）
    // 阶段 1 实现：以下三种方案可选
    
    // 方案 1: 基于调用栈追踪（开发模式，性能较低）
    // const stack = new Error().stack;
    // const match = stack?.match(/at (\w+)\.render/);
    // return match ? `${match[1]}:${Date.now()}` : `unknown:${Math.random()}`;
    
    // 方案 2: 通过 render() 调用上下文传递（推荐，性能最优）
    // 在 BaseComponent._rerender() 中设置全局上下文
    // const context = (globalThis as any).__wsxRenderContext;
    // return context ? `${context.componentName}:${context.instanceId}` : 'unknown';
    
    // 方案 3: 组件实例唯一 ID（最可靠，需要修改 BaseComponent）
    // 在 BaseComponent 构造函数中生成唯一 ID
    // return (this as any).__wsxInstanceId || 'unknown';
    
    // 阶段 0 临时实现：从 props 中获取或使用默认值
    return props?.__componentId || 'prototype';
}
```

**优点**：
- ✅ **完全自动**：编译器注入位置 ID，运行时生成缓存键
- ✅ **零配置**：开发者不需要写任何额外代码
- ✅ **可靠唯一**：组件实例 + JSX 位置 = 全局唯一

#### 3. 列表场景处理（List Handling）

**关键需求**：
- ✅ **支持动态列表**（增删元素）
- ✅ **必须支持 input**（保持焦点、输入状态）
- ✅ **精确 DOM 复用**（通过 `key` 标识业务实体）
- ⚠️ **不做 Virtual DOM diff**（只做缓存查找，不做复杂的树对比和移动）

**为什么必须支持 `key`？**

```tsx
// 场景：可编辑的待办事项列表
class TodoList extends WebComponent {
    @state private items = [
        { id: 1, text: 'Buy milk', editing: true },
        { id: 2, text: 'Write code', editing: false }
    ];

    render() {
        return (
            <ul>
                {this.items.map(item => (
                    <li>
                        {item.editing ? (
                            <input
                                type="text"
                                value={item.text}
                                autoFocus  // ← 必须保持焦点！
                            />
                        ) : (
                            <span>{item.text}</span>
                        )}
                    </li>
                ))}
            </ul>
        );
    }
}

// 问题：如果用户在编辑"Buy milk"时，列表重新排序或其他项变化
// - 没有 key：input 的焦点会丢失（因为 DOM 被替换）
// - 有 key：input 的 DOM 被精确复用，焦点保持 ✅
```

**WSXJS 的 `key` 设计**：

| 维度 | WSXJS 的实现 |
|------|-------------|
| **目的** | DOM 缓存查找和精确复用 |
| **算法** | 简单的 Map.get() 查找 |
| **性能** | O(1) 查找，O(n) 重排序 |
| **实现** | 缓存复用 + DOM 位置调整 |

**实现方式**：

```typescript
// 场景 1: 简单列表（无 key，使用索引）
render() {
    return (
        <ul>
            {this.items.map(item => (
                <li>{item.name}</li>
            ))}
        </ul>
    );
}

// 编译后（自动注入索引）
render() {
    return h('ul', { [POSITION]: 0 },
        this.items.map((item, index) =>
            h('li', {
                [POSITION]: 1,
                [INDEX]: index  // ← 自动注入索引
            }, item.name)
        )
    );
}

// 缓存键 = "componentId:position:index"
// - items[0] → "comp:1:0"
// - items[1] → "comp:1:1"

// 场景 2: 带 input 的列表（有 key，精确复用）
render() {
    return (
        <ul>
            {this.items.map(item => (
                <li key={item.id}>  {/* ← 开发者提供 key */}
                    <input value={item.text} />
                </li>
            ))}
        </ul>
    );
}

// 编译后（保留用户的 key）
render() {
    return h('ul', { [POSITION]: 0 },
        this.items.map((item, index) =>
            h('li', {
                [POSITION]: 1,
                [INDEX]: index,
                key: item.id  // ← 用户的 key 保留
            },
                h('input', {
                    [POSITION]: 2,
                    value: item.text
                })
            )
        )
    );
}

// 缓存键生成逻辑（支持 key）
function generateCacheKey(tag, props, componentId) {
    const positionId = props[POSITION];
    const userKey = props.key;      // 用户提供的 key
    const index = props[INDEX];     // 自动注入的索引

    // 优先级 1: 用户提供了 key → 使用 key
    if (userKey !== undefined) {
        return `${componentId}:${positionId}:key-${userKey}`;
    }

    // 优先级 2: 列表场景 → 使用索引
    if (index !== undefined) {
        return `${componentId}:${positionId}:idx-${index}`;
    }

    // 优先级 3: 普通元素 → 只使用位置
    return `${componentId}:${positionId}`;
}
```

**行为对比**：

```typescript
// 场景 1: 无 key（索引标识）
items = [{id:1, text:'A'}, {id:2, text:'B'}]

// 反转列表
items.reverse();  // [{id:2, text:'B'}, {id:1, text:'A'}]

// 缓存键：
// - items[0] → "comp:1:idx-0" → 复用之前 index 0 的 DOM
//   - 之前内容：'A' → 新内容：'B' → 更新文本
// - items[1] → "comp:1:idx-1" → 复用之前 index 1 的 DOM
//   - 之前内容：'B' → 新内容：'A' → 更新文本

// 结果：✅ DOM 复用，但需要更新内容
//       ⚠️ 如果有 input，焦点会错乱

// 场景 2: 有 key（业务 ID 标识 + DOM 重排序）⭐ **必须支持**
items = [{id:1, text:'A'}, {id:2, text:'B'}]
// 初始 DOM 顺序: [<li key=1>A</li>, <li key=2>B</li>]
// 缓存: Map { "key-1" => DOM_A, "key-2" => DOM_B }

// 反转列表
items.reverse();  // [{id:2, text:'B'}, {id:1, text:'A'}]

// 重排序逻辑：
// 1. 遍历新顺序: [id=2, id=1]
// 2. 查找缓存的 DOM 元素
// 3. 检测位置变化，移动 DOM

// 执行步骤：
// - items[0] (id=2) → 缓存 "key-2" → 找到 DOM_B
//   - 期望位置: 0，当前位置: 1
//   - 操作: container.insertBefore(DOM_B, container.children[0])
//
// - items[1] (id=1) → 缓存 "key-1" → 找到 DOM_A
//   - 期望位置: 1，当前位置: 0（已被 DOM_B 移动后自动调整）
//   - 操作: 无需移动（已在正确位置）

// 最终 DOM 顺序: [<li key=2>B</li>, <li key=1>A</li>]

// 结果：✅ DOM 精确复用
//       ✅ 移动 DOM 位置（insertBefore），不更新内容
//       ✅ 如果有 input，焦点保持正确
//       ✅ 性能：O(n) 时间，n 次 insertBefore 操作
```

**DOM 重排序算法（简单高效）**：

```typescript
// 不需要复杂的 Virtual DOM diff！
// 只需要简单的 Map 查找 + insertBefore

function reorderChildren(
    container: HTMLElement,
    newOrder: { key: string; element: Element }[]
): void {
    // 遍历新顺序，逐个调整位置
    newOrder.forEach((item, targetIndex) => {
        const element = item.element;
        const currentIndex = Array.from(container.children).indexOf(element);

        // 如果不在目标位置，移动它
        if (currentIndex !== targetIndex) {
            const refNode = container.children[targetIndex];
            if (refNode && refNode !== element) {
                container.insertBefore(element, refNode);
            } else {
                container.appendChild(element);
            }
        }
    });
}

// 时间复杂度：O(n)
// DOM 操作：最多 n 次 insertBefore
// 空间复杂度：O(1)（不需要额外存储）

// WSXJS 的设计优势：
// - 简单高效：不需要复杂的树对比算法
// - 性能优秀：O(n) 时间复杂度，常数小
// - 代码清晰：实现简单，易于维护
```

**关键实现细节**：

```typescript
// 1. h() 函数处理 key（不渲染到 DOM）
export function h(tag, props, ...children) {
    // 提取 key（框架内部使用，不应用到 DOM）
    const { key, ref, ...domProps } = props || {};

    // 生成缓存键
    const cacheKey = generateCacheKey(tag, props, getCurrentComponentId());

    // 查找缓存
    let element = domCacheManager.get(cacheKey);

    if (element) {
        // 复用 DOM，只更新变化
        updateElement(element, domProps, children);
    } else {
        // 创建新 DOM
        element = document.createElement(tag);
        applyProps(element, domProps);  // ← 只应用 domProps，不包含 key
        appendChildren(element, children);

        // 缓存
        domCacheManager.set(cacheKey, element);

        // 保存缓存键到元素上（用于 getCacheKey 函数）
        (element as any).__wsxCacheKey = cacheKey;
    }

    return element;
}

// 2. key 永远不渲染到 DOM
// ✅ 正确：<li>Content</li>
// ❌ 错误：<li key="123">Content</li>
```

#### 3.5. Cache Key 使用规范与防重复策略

**关键规则：同一个 `key` 不能用于不同的父容器！**

##### 问题场景

当同一个 cache key 在不同的父容器中使用时，会导致元素被错误地复用和移动：

```tsx
// ❌ 错误示例：ResponsiveNav 组件的 bug
class ResponsiveNav extends WebComponent {
    render() {
        return (
            <div class="nav-menu">
                {/* 所有导航项（包括溢出的） */}
                {this.items.map((item, index) => (
                    <wsx-link key={index} class="nav-link">
                        {item.label}
                    </wsx-link>
                ))}

                {/* 溢出菜单 */}
                <div class="nav-overflow-menu">
                    {this.hiddenItems.map((item, idx) => {
                        const originalIndex = this.hiddenItemIndices[idx];
                        return (
                            <wsx-link key={originalIndex} class="nav-overflow-link">
                                {item.label}
                            </wsx-link>
                        );
                    })}
                </div>
            </div>
        );
    }
}

// 问题：nav-menu 中的 key={5} 和 nav-overflow-menu 中的 key={5} 是同一个缓存键！
// 结果：两处共享同一个 DOM 元素，导致元素在渲染时被反复移动到错误的容器
```

**为什么会出现问题？**

1. **缓存键生成逻辑**：
   ```typescript
   // 对于 key={5}，生成的缓存键是：
   "ResponsiveNav:abc123:wsx-link:key-5"

   // nav-menu 和 nav-overflow-menu 中的 wsx-link 都使用 key={5}
   // 它们得到的是同一个缓存键！
   ```

2. **DOM 操作顺序**：
   ```typescript
   // 第1步：nav-overflow-menu 创建并 appendChild(wsx-link[key=5])
   //   → wsx-link 被添加到 nav-overflow-menu ✅

   // 第2步：nav-menu 渲染所有子元素，包括 appendChild(wsx-link[key=5])
   //   → wsx-link 被移动到 nav-menu ❌ (appendChild 自动从旧父容器移除)

   // 结果：wsx-link 最终在 nav-menu 中，而不是 nav-overflow-menu！
   ```

##### ✅ 正确的解决方案

使用**不同的 key 前缀**来区分不同位置的元素：

```tsx
// ✅ 正确示例：使用不同的 key 前缀
class ResponsiveNav extends WebComponent {
    render() {
        return (
            <div class="nav-menu">
                {/* 导航栏中的项：使用 "nav-" 前缀 */}
                {this.items.map((item, index) => (
                    <wsx-link key={`nav-${index}`} class="nav-link">
                        {item.label}
                    </wsx-link>
                ))}

                {/* 溢出菜单中的项：使用 "overflow-" 前缀 */}
                <div class="nav-overflow-menu">
                    {this.hiddenItems.map((item, idx) => {
                        const originalIndex = this.hiddenItemIndices[idx];
                        return (
                            <wsx-link key={`overflow-${originalIndex}`} class="nav-overflow-link">
                                {item.label}
                            </wsx-link>
                        );
                    })}
                </div>
            </div>
        );
    }
}

// 现在缓存键是：
// - nav-menu 中：   "ResponsiveNav:abc123:wsx-link:key-nav-5"
// - overflow-menu 中："ResponsiveNav:abc123:wsx-link:key-overflow-5"
// ✅ 两个不同的缓存键，两个独立的 DOM 元素！
```

##### 最佳实践

1. **为不同位置的元素使用不同的 key 前缀**：
   ```tsx
   // ✅ 好的实践
   <div class="main-list">
       {items.map(item => <Item key={`main-${item.id}`} />)}
   </div>
   <div class="archived-list">
       {archived.map(item => <Item key={`archived-${item.id}`} />)}
   </div>

   // ❌ 避免
   <div class="main-list">
       {items.map(item => <Item key={item.id} />)}
   </div>
   <div class="archived-list">
       {archived.map(item => <Item key={item.id} />)}  // ← 重复的 key！
   </div>
   ```

2. **条件渲染时保持 key 一致性**：
   ```tsx
   // ✅ 正确：同一个元素在不同条件下使用相同的 key
   {isEditing ? (
       <input key="name-input" value={name} />
   ) : (
       <span key="name-display">{name}</span>
   )}

   // ❌ 错误：同一个逻辑元素使用不同的 key
   {isEditing ? (
       <input key="input" value={name} />
   ) : (
       <input key="display" disabled value={name} />
   )}
   ```

3. **动态容器时使用语义化前缀**：
   ```tsx
   // ✅ 使用语义化的前缀区分不同的渲染位置
   {currentTab === 'active' ? (
       <List>{items.map(item => <Item key={`active-${item.id}`} />)}</List>
   ) : (
       <List>{items.map(item => <Item key={`completed-${item.id}`} />)}</List>
   )}
   ```

##### 运行时警告机制

WSXJS 框架会在运行时自动检测重复的 cache key 问题，并在控制台输出警告：

```typescript
// DOMCacheManager 会在所有环境中检测重复 key
[WSXJS Cache Warning] Duplicate key "ResponsiveNav:123:wsx-link:key-5" detected in different parent containers!
  Previous parent: div.nav-menu
  Current parent:  div.nav-overflow-menu

This may cause elements to appear in wrong containers or be moved unexpectedly.

Solution: Use unique key prefixes for different locations:
  Example: <wsx-link key="nav-0"> vs <wsx-link key="overflow-0">

See RFC 0037 documentation for cache key best practices.
```

**如何使用警告修复问题：**

1. 查看控制台警告，识别重复的 cache key
2. 检查警告中显示的两个父容器
3. 为不同位置的元素添加不同的 key 前缀
4. 重新测试，确认警告消失

##### 总结

| 规则 | 说明 | 示例 |
|------|------|------|
| **禁止重复** | 同一个 key 不能在不同父容器中使用 | `<A><Item key="1"/></A>` vs `<B><Item key="1"/></B>` ❌ |
| **使用前缀** | 为不同位置的元素添加语义化前缀 | `key="nav-1"` vs `key="overflow-1"` ✅ |
| **保持一致** | 同一元素在条件渲染中使用相同 key | `{cond ? <Input key="x"/> : <Input key="x"/>}` ✅ |
| **监听警告** | 运行时警告会自动检测并提示问题 | 见控制台输出 |

#### 4. DOM 更新策略（Update Strategy）

**只更新变化的部分**，不重建整个元素：

```typescript
// 使用 WeakMap 存储元数据，避免污染 DOM，支持垃圾回收
const metadataMap = new WeakMap<HTMLElement, {
    props: Record<string, unknown>,
    children: unknown[]
}>();

function getCachedMetadata(element: HTMLElement) {
    let metadata = metadataMap.get(element);
    if (!metadata) {
        metadata = { props: {}, children: [] };
        metadataMap.set(element, metadata);
    }
    return metadata;
}

function updateElement(
    element: HTMLElement,
    newProps: Record<string, unknown>,
    newChildren: unknown[]
): void {
    // 1. 获取上次渲染的 props 和 children（从缓存元数据）
    const cached = getCachedMetadata(element);
    const oldProps = cached.props;
    const oldChildren = cached.children;

    // 2. 对比 props，只更新变化的属性
    updateProps(element, oldProps, newProps);

    // 3. 对比 children，只更新变化的子节点
    updateChildren(element, oldChildren, newChildren);

    // 4. 更新缓存元数据
    cached.props = newProps;
    cached.children = newChildren;
}

function updateProps(
    element: HTMLElement,
    oldProps: Record<string, unknown>,
    newProps: Record<string, unknown>
): void {
    // 移除旧属性
    for (const key in oldProps) {
        if (!(key in newProps)) {
            element.removeAttribute(key);
        }
    }

    // 添加/更新新属性
    for (const key in newProps) {
        if (oldProps[key] !== newProps[key]) {
            applyProp(element, key, newProps[key]);
        }
    }
}

function updateChildren(
    element: HTMLElement,
    oldChildren: unknown[],
    newChildren: unknown[]
): void {
    // 策略 1: 检测是否有 keyed 子元素（列表场景）
    const hasKeys = newChildren.some(child =>
        child instanceof HTMLElement && getCacheKey(child)
    );

    if (hasKeys) {
        // 有 key：支持重排序
        updateChildrenWithReorder(element, oldChildren, newChildren);
    } else {
        // 无 key：简单的位置更新
        updateChildrenByPosition(element, oldChildren, newChildren);
    }
}

// 方案 A: 无 key，按位置更新（简单场景）
function updateChildrenByPosition(
    element: HTMLElement,
    oldChildren: unknown[],
    newChildren: unknown[]
): void {
    const oldLen = oldChildren.length;
    const newLen = newChildren.length;
    const minLen = Math.min(oldLen, newLen);

    // 更新相同位置的子节点
    for (let i = 0; i < minLen; i++) {
        if (oldChildren[i] !== newChildren[i]) {
            // 文本节点：直接更新
            if (typeof newChildren[i] === 'string' || typeof newChildren[i] === 'number') {
                element.childNodes[i].textContent = String(newChildren[i]);
            }
            // 元素节点：替换（已通过 h() 复用）
            else if (newChildren[i] instanceof HTMLElement) {
                element.replaceChild(newChildren[i], element.childNodes[i]);
            }
        }
    }

    // 移除多余的子节点
    while (element.childNodes.length > newLen) {
        element.lastChild?.remove();
    }

    // 添加新的子节点
    for (let i = minLen; i < newLen; i++) {
        if (typeof newChildren[i] === 'string' || typeof newChildren[i] === 'number') {
            element.appendChild(document.createTextNode(String(newChildren[i])));
        } else if (newChildren[i] instanceof HTMLElement) {
            element.appendChild(newChildren[i]);
        }
    }
}

// 方案 B: 有 key，支持重排序 ⭐ **必须支持**
function updateChildrenWithReorder(
    element: HTMLElement,
    oldChildren: unknown[],
    newChildren: unknown[]
): void {
    // 1. 构建当前位置映射（优化：避免每次 indexOf，O(n) → O(1) 查找）
    const currentIndexMap = new Map<Element, number>();
    Array.from(element.children).forEach((child, index) => {
        currentIndexMap.set(child, index);
    });

    // 2. 构建新的 key 到元素的映射
    const newKeyToElement = new Map<string, HTMLElement>();
    const newElements: HTMLElement[] = [];

    newChildren.forEach(child => {
        if (child instanceof HTMLElement) {
            const key = getCacheKey(child);
            if (key) {
                newKeyToElement.set(key, child);
            }
            newElements.push(child);
        }
    });

    // 3. 调整 DOM 顺序（重排序）
    newElements.forEach((newElement, targetIndex) => {
        const currentIndex = currentIndexMap.get(newElement) ?? -1;

        // 如果元素不在目标位置，移动它
        if (currentIndex !== targetIndex) {
            const referenceNode = element.children[targetIndex];
            if (referenceNode && referenceNode !== newElement) {
                element.insertBefore(newElement, referenceNode);
                // 更新位置映射
                currentIndexMap.set(newElement, targetIndex);
            } else {
                element.appendChild(newElement);
            }
        }
    });

    // 4. 移除不再存在的元素（只移除由 h() 创建的元素）
    const newKeys = new Set(newKeyToElement.keys());
    Array.from(element.children).forEach(child => {
        if (child instanceof HTMLElement) {
            const key = getCacheKey(child);
            // 核心规则：只有由 h() 创建的元素（有 key）才能被移除
            // 未标记的元素（自定义元素、第三方库注入）应该被保留
            if (key && !newKeys.has(key)) {
                // 这是由 h() 创建的元素，且不在新列表中，可以安全移除
                child.remove();
            }
            // 如果元素没有 key（未标记），自动保留（不执行 remove）
        }
    });
}

// 时间复杂度：O(n)（优化后，避免了 O(n²) 的 indexOf 调用）
// 空间复杂度：O(n)（currentIndexMap）

// 辅助函数：获取元素的缓存 key
function getCacheKey(element: HTMLElement): string | null {
    // 从元素的内部属性中获取缓存 key
    // 这个 key 在 h() 函数中设置
    // 核心规则：只有由 h() 创建的元素才有 __wsxCacheKey
    // 没有这个标记的元素（自定义元素、第三方库注入）应该被保留
    return (element as any).__wsxCacheKey || null;
}

// 检查元素是否由 h() 创建（用于判断是否应该被保留）
function isCreatedByH(element: HTMLElement): boolean {
    // 核心规则：有 __wsxCacheKey 标记 = 由 h() 创建 = 可以由框架管理
    // 没有标记 = 自定义元素或第三方库注入 = 应该被保留
    return (element as any).__wsxCacheKey !== undefined;
}
```

**关键点**：
- ✅ **最小化 DOM 操作**：只更新变化的属性和子节点
- ✅ **保留 DOM 结构**：不销毁和重建，只修改
- ✅ **简单高效**：不需要复杂的 diff 算法

#### 3. DOM Swap 策略（DOM Swapping Strategy）

为了避免后注入元素丢失，采用 DOM swap 而不是完全重建：

```typescript
// 当前实现（全量替换，会丢失后注入元素）
protected _rerender(): void {
    const content = this.render(); // 创建新树
    this.shadowRoot.appendChild(content);
    // 移除旧树 - 这会丢失所有后注入的元素
    const oldChildren = Array.from(this.shadowRoot.children).filter(
        (child) => child !== content
    );
    oldChildren.forEach((child) => child.remove());
}

// DOM Swap 策略（保留后注入元素）
protected _rerender(): void {
    const newContent = this.render(); // 创建新树（在内存中）
    const oldContent = this.shadowRoot.firstElementChild; // 当前 DOM 树
    
    // 1. 识别需要保留的元素（后注入的元素）
    const preservedElements = this.identifyPreservedElements(oldContent);
    
    // 2. 执行 DOM diff，只更新变化的部分
    const changes = this.diffDOM(oldContent, newContent);
    
    // 3. 应用变更（而不是全量替换）
    changes.forEach(change => {
        switch (change.type) {
            case 'update':
                // 更新属性或文本内容
                this.updateNode(change.oldNode, change.newNode);
                break;
            case 'insert':
                // 插入新节点
                this.insertNode(change.newNode, change.parent, change.index);
                break;
            case 'remove':
                // 移除节点（但保留未标记的元素）
                // 核心规则：只有由 h() 创建的元素（有 __wsxCacheKey 标记）才能被移除
                // 未标记的元素（自定义元素、第三方库注入）应该被保留
                if (isCreatedByH(change.node) && !this.isPreservedElement(change.node, preservedElements)) {
                    change.node.remove();
                }
                // 如果元素没有标记，自动保留（不执行 remove）
                break;
            case 'move':
                // 移动节点位置
                this.moveNode(change.node, change.newParent, change.newIndex);
                break;
        }
    });
    
    // 4. 确保后注入的元素仍然存在
    this.restorePreservedElements(preservedElements);
}
```

**核心设计原则：标记识别机制**

**关键规则**：
1. **`h()` 创建的 DOM 元素必须被标记**：所有通过 `h()` 函数创建的 DOM 元素都会被标记 `__wsxCacheKey`，用于缓存管理和更新识别
2. **未标记的 DOM 元素应该被保留**：任何没有 `__wsxCacheKey` 标记的 DOM 元素（如自定义元素、第三方库注入的元素）都应该被视为"后注入元素"并被自动保留

**标记机制**：

```typescript
// h() 函数自动标记所有创建的 DOM 元素
export function h(tag, props, ...children) {
    // ... 创建或复用 DOM 元素 ...
    
    // 标记：所有由 h() 创建的 DOM 元素都必须有 __wsxCacheKey
    (element as any).__wsxCacheKey = cacheKey;
    
    return element;
}

// 识别：检查元素是否由 h() 创建
function isCreatedByH(element: HTMLElement): boolean {
    return (element as any).__wsxCacheKey !== undefined;
}

// 保留策略：未标记的元素应该被保留
function shouldPreserveElement(element: HTMLElement): boolean {
    // 规则 1: 没有 __wsxCacheKey 标记的元素 → 保留（自定义元素、第三方库注入）
    if (!isCreatedByH(element)) {
        return true;
    }
    
    // 规则 2: 有 data-wsx-preserve 属性的元素 → 保留（开发者显式标记）
    if (element.hasAttribute('data-wsx-preserve')) {
        return true;
    }
    
    // 规则 3: 第三方库特征元素 → 保留（Monaco Editor, Chart.js 等）
    if (isThirdPartyLibraryElement(element)) {
        return true;
    }
    
    // 规则 4: 由 h() 创建的元素 → 不保留（由框架管理）
    return false;
}
```

**关键点**：
- **标记识别**：通过 `__wsxCacheKey` 标记区分 `h()` 创建的元素和其他元素
- **智能 diff**：只更新实际变化的部分
- **保留策略**：自动保护未标记的元素（自定义元素、第三方库注入）

**后注入元素识别机制（详细实现）**：

```typescript
// 后注入元素识别策略（核心：基于标记识别）
function identifyPreservedElements(rootElement: HTMLElement): Set<HTMLElement> {
    const preserved = new Set<HTMLElement>();
    
    // 核心策略：遍历所有元素，识别未标记的元素
    function traverseAndIdentify(element: HTMLElement): void {
        // 检查当前元素
        if (shouldPreserveElement(element)) {
            preserved.add(element);
        }
        
        // 递归检查子元素
        Array.from(element.children).forEach((child) => {
            if (child instanceof HTMLElement) {
                traverseAndIdentify(child);
            }
        });
    }
    
    traverseAndIdentify(rootElement);
    
    return preserved;
}

// 判断元素是否应该被保留（核心逻辑）
function shouldPreserveElement(element: HTMLElement): boolean {
    // 规则 1（最重要）：没有 __wsxCacheKey 标记的元素 → 保留
    // 这些元素不是由 h() 创建的，可能是：
    // - 自定义元素（custom elements）
    // - 第三方库注入的元素（Monaco Editor, Chart.js 等）
    // - 手动创建的 DOM 元素
    if (!isCreatedByH(element)) {
        return true;
    }
    
    // 规则 2: 有 data-wsx-preserve 属性的元素 → 保留（开发者显式标记）
    if (element.hasAttribute('data-wsx-preserve')) {
        return true;
    }
    
    // 规则 3: 第三方库特征元素 → 保留（即使有标记，也保留）
    if (isThirdPartyLibraryElement(element)) {
        return true;
    }
    
    // 规则 4: 由 h() 创建的元素 → 不保留（由框架管理，可以更新/移除）
    return false;
}

// 检查元素是否由 h() 创建
function isCreatedByH(element: HTMLElement): boolean {
    return (element as any).__wsxCacheKey !== undefined;
}

// 识别第三方库元素（辅助策略）
function isThirdPartyLibraryElement(element: HTMLElement): boolean {
    // 检查类名、ID、属性等特征
    const className = element.className;
    const id = element.id;
    const tagName = element.tagName.toLowerCase();
    
    // Monaco Editor
    if (className.includes('monaco-editor') || id.includes('monaco')) {
        return true;
    }
    
    // Chart.js
    if (tagName === 'canvas' && (element.hasAttribute('data-chart') || id.includes('chart'))) {
        return true;
    }
    
    // Prism.js
    if (element.hasAttribute('data-prism') || className.includes('prism')) {
        return true;
    }
    
    // Ace Editor
    if (className.includes('ace_editor') || id.includes('ace')) {
        return true;
    }
    
    // CodeMirror
    if (className.includes('CodeMirror') || id.includes('codemirror')) {
        return true;
    }
    
    return false;
}

// 检查元素是否应该被保留（简化版本：直接检查标记）
function isPreservedElement(
    element: HTMLElement,
    preservedElements: Set<HTMLElement>
): boolean {
    // 方法 1: 检查是否在保留集合中
    if (preservedElements.has(element)) {
        return true;
    }
    
    // 方法 2: 直接检查标记（更高效）
    // 没有 __wsxCacheKey 标记的元素应该被保留
    if (!isCreatedByH(element)) {
        return true;
    }
    
    // 方法 3: 检查是否是保留元素的子元素
    let current: HTMLElement | null = element;
    while (current && current !== document.body) {
        if (preservedElements.has(current)) {
            return true;
        }
        current = current.parentElement;
    }
    
    return false;
}
```

#### 4. 编译时优化（Compile-time Optimization）

在编译阶段（通过 Babel 插件）分析 JSX，生成优化的更新代码。

**重要说明**：WSXJS 当前使用 `h` 函数（jsx-factory）处理 JSX。优化方案有两种选择：

##### 方案 A: 保持 `h` 函数，运行时优化（推荐）

继续使用 `h` 函数，但在运行时进行智能优化：

```tsx
// 原始 JSX
render() {
    return (
        <div>
            <h1>{this.title}</h1>
            <p>{this.description}</p>
        </div>
    );
}

// 当前编译结果（使用 h 函数）
render() {
    return h('div', null,
        h('h1', null, this.title),
        h('p', null, this.description)
    );
}

// 优化后：h 函数内部进行智能缓存和更新
// h() 函数会：
// 1. 检查是否已有对应的 DOM 节点（通过 key 或位置）
// 2. 如果存在，只更新变化的部分
// 3. 如果不存在，创建新节点
```

**优点**：
- ✅ 保持现有架构，兼容性好
- ✅ `h` 函数可以统一处理所有优化逻辑
- ✅ 不需要大幅修改编译流程
- ✅ 向后兼容，现有代码无需修改

**缺点**：
- ⚠️ `h` 函数调用仍有轻微开销
- ⚠️ 需要在运行时进行判断

##### 方案 B: 编译时直接生成优化代码（已拒绝 ❌）

在编译时直接生成优化的 DOM 操作代码，**完全跳过 `h` 函数**：

**⚠️ 重要警告**：此方案会导致代码体积增加 10-30%，这是一个**关键问题（NOGO）**，因此不推荐采用。

```tsx
// 原始 JSX
render() {
    return (
        <div>
            <h1>{this.title}</h1>
            <p>{this.description}</p>
        </div>
    );
}

// 当前编译结果（使用 h 函数）
render() {
    return h('div', null,
        h('h1', null, this.title),
        h('p', null, this.description)
    );
}

// 方案 B 编译后（直接生成优化代码，跳过 h）
render() {
    if (!this._domTree) {
        // 首次渲染：创建 DOM 树
        this._domTree = {
            root: document.createElement('div'),
            title: document.createElement('h1'),
            description: document.createElement('p')
        };
        this._domTree.root.appendChild(this._domTree.title);
        this._domTree.root.appendChild(this._domTree.description);
    } else {
        // 后续渲染：只更新文本内容
        this._domTree.title.textContent = this.title;
        this._domTree.description.textContent = this.description;
    }
    return this._domTree.root;
}
```

#### 方案 B vs `h` 函数的详细对比

##### 1. **执行流程对比**

**使用 `h` 函数（方案 A）**：
```
JSX → Babel 编译 → h('div', props, ...children) 
  → h() 函数调用 
    → 检查缓存 
    → 创建/更新 DOM 
    → 返回 DOM 节点
```

**跳过 `h` 函数（方案 B）**：
```
JSX → Babel 编译（直接生成 DOM 操作代码）
  → 检查缓存（内联代码）
  → 创建/更新 DOM（直接调用）
  → 返回 DOM 节点
```

##### 2. **性能对比**

| 方面 | 方案 A (h 函数) | 方案 B (直接生成) | 差异 |
|------|----------------|------------------|------|
| **函数调用开销** | 每次调用 `h()` | 无函数调用 | ~5-10ns/调用 |
| **参数传递开销** | 需要传递 props, children | 直接访问变量 | ~2-5ns/调用 |
| **代码体积** | 较小（共享 `h` 函数） | 较大（每个组件生成代码） | +10-30% |
| **首次渲染** | 稍慢（函数调用） | 稍快（直接调用） | ~5-10% |
| **后续更新** | 稍慢（函数调用 + 缓存检查） | 稍快（内联缓存检查） | ~3-8% |
| **内存占用** | 较小（共享代码） | 较大（每个组件代码） | +5-15% |

**关键发现**：
- **`h` 函数确实使用 `appendChild`**：`h` 函数内部会调用 `appendChild()`，方案 B 也会调用 `appendChild()`
- **函数调用开销很小**：现代 JS 引擎优化很好，函数调用开销通常只有 5-10 纳秒
- **真正的瓶颈在 DOM 操作**：`document.createElement()` 和 `appendChild()` 的开销是微秒级的（1000+ 纳秒），远大于函数调用
- **方案 B 的优势不在 `appendChild`**：两种方案都会调用 `appendChild`，差异在于：
  - **函数调用层数**：方案 A 需要调用 `h()` → `appendChild()`，方案 B 直接调用 `appendChild()`
  - **编译时优化**：方案 B 可以在编译时做更多优化（内联、常量折叠等）
  - **JS 引擎优化**：内联代码可能被 JS 引擎更好地优化
- **实际性能差异很小**：在大多数场景下，方案 B 的性能提升可能只有 3-8%，但代码复杂度大幅增加

##### 3. **代码生成复杂度对比**

**方案 A（h 函数）**：
```typescript
// Babel 插件只需要简单转换
JSX → h('div', props, children)
// 复杂度：O(1) - 简单的语法转换
```

**方案 B（直接生成）**：(rejected)
```typescript
// Babel 插件需要：
// 1. 分析 JSX 结构
// 2. 生成缓存变量
// 3. 生成条件判断
// 4. 生成 DOM 操作代码
// 5. 处理所有边界情况
// 复杂度：O(n) - n 是 JSX 节点数量
```

##### 4. **实际性能测试示例**

假设一个包含 100 个节点的组件：

```typescript
// 方案 A: 使用 h() 函数
render() {
    return h('div', null,
        h('h1', null, this.title),
        h('p', null, this.description)
    );
}
// 执行流程：
// 1. 调用 h('div', ...) → 创建 div 元素
// 2. 调用 h('h1', ...) → 创建 h1 元素
// 3. 在 h() 内部调用 element.appendChild(h1) → 添加子元素
// 4. 调用 h('p', ...) → 创建 p 元素
// 5. 在 h() 内部调用 element.appendChild(p) → 添加子元素
// 
// 开销分析：
// - h() 函数调用：100 × 10ns = 1000ns = 1μs
// - appendChild() 调用：100 × 1000ns = 100μs（在 h() 内部）
// - 总开销：101μs

// 方案 B: 直接生成代码
render() {
    if (!this._domTree) {
        this._domTree = {
            root: document.createElement('div'),
            title: document.createElement('h1'),
            description: document.createElement('p')
        };
        this._domTree.root.appendChild(this._domTree.title);
        this._domTree.root.appendChild(this._domTree.description);
    } else {
        this._domTree.title.textContent = this.title;
        this._domTree.description.textContent = this.description;
    }
    return this._domTree.root;
}
// 执行流程：
// 1. 直接调用 document.createElement('div') → 创建 div 元素
// 2. 直接调用 document.createElement('h1') → 创建 h1 元素
// 3. 直接调用 root.appendChild(h1) → 添加子元素
// 4. 直接调用 document.createElement('p') → 创建 p 元素
// 5. 直接调用 root.appendChild(p) → 添加子元素
//
// 开销分析：
// - h() 函数调用：0ns（跳过）
// - appendChild() 调用：100 × 1000ns = 100μs（直接调用）
// - 总开销：100μs

// 性能提升：1μs / 101μs = 0.99% ≈ 1%
```

**关键澄清**：
- ✅ **两种方案都使用 `appendChild`**：`h` 函数内部会调用 `appendChild()`，方案 B 也会直接调用 `appendChild()`
- ✅ **差异在于调用路径**：
  - 方案 A：`h()` → `appendChild()`（多一层函数调用）
  - 方案 B：直接 `appendChild()`（少一层函数调用）
- ✅ **DOM 操作开销相同**：两种方案都需要创建元素和添加子元素，这部分开销完全相同
- ✅ **性能差异来自函数调用**：方案 B 节省的是 `h()` 函数调用的开销（~10ns/次），而不是 `appendChild()` 的开销

**结论**：在大多数场景下，性能提升非常有限（<5%），但实现复杂度大幅增加。真正的性能瓶颈在 DOM 操作（`createElement`、`appendChild`），而不是函数调用。

##### 5. **优缺点详细对比**

**方案 B 的优点**：
- ✅ **理论性能最优**：完全消除函数调用开销（但实际收益很小，<1%）
- ⚠️ **编译时优化**：理论上可以在编译时做更多优化，但现代 JS 引擎已经做得很好了
- ⚠️ **JS 引擎优化**：理论上内联代码可能被更好地优化，但差异不明显

**方案 B 的缺点（关键问题）**：
- ❌ **代码体积显著增加（NOGO）**：每个组件都会生成大量代码（+10-30%），这是**不可接受的关键问题**
  - **影响首次加载性能**：更大的代码体积意味着更长的下载时间
  - **影响解析时间**：更多的代码需要更多时间解析和执行
  - **影响内存占用**：更大的代码体积占用更多内存
  - **可能抵消性能收益**：代码体积增加带来的性能损失可能超过 <1% 的性能提升
- ❌ **编译复杂度高**：需要处理所有 JSX 特性（条件渲染、循环、组件等）
- ❌ **调试困难**：生成的代码难以阅读和调试
- ❌ **维护成本高**：Babel 插件需要维护大量代码生成逻辑
- ❌ **兼容性风险**：可能破坏某些边缘情况
- ❌ **灵活性降低**：难以在运行时动态调整策略
- ❌ **实际收益非常有限**：性能提升通常 <1%，但代码体积增加 10-30%，复杂度增加 >100%

**关键评估**：
- **性能差异**：<1%（几乎可以忽略）
- **代码体积差异**：+10-30%（**NOGO - 不可接受**）
- **复杂度差异**：+100%+（大幅增加）
- **结论**：**方案 B 不可接受**。代码体积增加 10-30% 是一个关键问题，完全抵消了 <1% 的性能提升。方案 A 是唯一可行的选择。

**方案 A 的优点**：
- ✅ **代码体积小**：共享 `h` 函数，代码复用
- ✅ **实现简单**：只需要优化 `h` 函数内部逻辑
- ✅ **易于调试**：代码清晰，容易追踪问题
- ✅ **维护成本低**：优化逻辑集中在一个地方
- ✅ **向后兼容**：不改变编译流程，完全兼容
- ✅ **灵活性高**：可以在运行时根据情况调整策略
- ✅ **性能足够**：虽然理论性能略低，但实际差异很小

**方案 A 的缺点**：
- ⚠️ **轻微函数调用开销**：每次调用 `h()` 有 5-10ns 开销
- ⚠️ **运行时判断**：需要在运行时检查缓存和更新策略

##### 6. **方案 B 是否值得采用？**

**结论：已拒绝 ❌**

**关键问题：代码体积增加 10-30% 是不可接受的（NOGO）**

**原因**：
1. **性能收益极小**：<1% 的性能提升几乎可以忽略
2. **代码体积增加显著**：+10-30% 的代码体积会带来：
   - 更长的下载时间（特别是移动网络）
   - 更长的解析和执行时间
   - 更多的内存占用
   - 可能完全抵消性能收益
3. **复杂度大幅增加**：需要维护复杂的代码生成逻辑
4. **风险高**：可能破坏兼容性，调试困难

**理论上可能适合的场景**（但需要充分验证，且代码体积问题仍然存在）：

1. **极端性能要求**：对每一纳秒都有要求的场景（如游戏引擎）
   - **但**：即使在这种场景下，性能提升通常也只有 <1%
   - **代价**：代码体积增加 10-30%，可能反而影响性能
   - **建议**：先测量实际性能，确认收益 > 成本

2. **代码体积不是问题**：应用已经很大，10-30% 的增加可以接受
   - **但**：这种情况很少见
   - **建议**：即使代码体积可以接受，<1% 的性能提升是否值得？

3. **实验性功能**：用于评估实际收益
   - **但**：不应作为默认方案
   - **建议**：仅用于研究和评估

**实际建议**：
- **对于所有 Web 应用**：方案 A 是唯一可行的选择
- **代码体积是关键约束**：在现代 Web 开发中，代码体积是一个关键指标，10-30% 的增加是不可接受的
- **性能 vs 体积权衡**：<1% 的性能提升无法 justify 10-30% 的代码体积增加

##### 7. **推荐结论**

**强烈推荐方案 A（保持 `h` 函数）**，理由：

1. **性能差异极小**：实际性能提升通常 <1%，几乎可以忽略
2. **代码体积是关键**：方案 B 会增加 10-30% 的代码体积，这是**不可接受的（NOGO）**
3. **维护成本低**：优化逻辑集中在 `h` 函数，易于维护
4. **向后兼容**：不改变现有架构，风险低
5. **灵活性高**：可以在运行时根据情况调整策略
6. **易于调试**：代码清晰，问题容易定位
7. **复杂度低**：实现简单，不需要复杂的代码生成逻辑

**方案 B 的实际评估**：
- ❌ **性能收益**：<1%（几乎可以忽略）
- ❌ **代码体积**：+10-30%（**NOGO - 不可接受**）
- ❌ **复杂度**：+100%+（大幅增加）
- ❌ **维护成本**：高（需要维护复杂的 Babel 插件）
- ❌ **风险**：高（可能破坏兼容性）

**最终结论**：

**方案 A 是唯一可行的选择**。

- ✅ **性能**：与方案 B 几乎相同（差异 <1%）
- ✅ **代码体积**：更小（共享 `h` 函数）
- ✅ **复杂度**：更低（实现简单）
- ✅ **维护成本**：更低（集中优化）
- ✅ **风险**：更低（向后兼容）

**方案 B 不可接受**，因为：
- ❌ 代码体积增加 10-30% 是一个关键问题（NOGO）
- ❌ 性能收益极小（<1%），无法 justify 代码体积增加
- ❌ 复杂度大幅增加（>100%）
- ❌ 可能反而影响性能（更大的代码体积 → 更长的下载和解析时间）

**因此，RFC 将专注于方案 A 的实现**，方案 B 仅作为理论参考，已明确拒绝。

##### 推荐方案：方案 A（保持 `h` 函数）

**理由**：
1. **向后兼容**：现有代码无需修改
2. **统一处理**：`h` 函数可以集中处理所有优化逻辑
3. **灵活性**：可以在运行时根据情况选择策略
4. **可维护性**：代码更清晰，更容易维护
5. **性能足够**：`h` 函数的开销很小，优化带来的收益远大于开销

**实现方式**：
- `h` 函数内部实现智能缓存和更新逻辑
- 自动识别可复用的 DOM 节点
- 只更新实际变化的部分
- 对开发者完全透明

### API设计

#### 设计原则：零配置、自动处理

**核心原则**：框架应该自动处理所有优化，开发者无需手动配置或标记。

```typescript
// ✅ 好的设计：完全自动，无需配置
class MyComponent extends WebComponent {
    @state private items: Item[] = []; // 自动跟踪变化
    
    render() {
        return (
            <div>
                {this.items.map((item, index) => (
                    <div key={item.id}>{item.name}</div> // 自动识别 key
                ))}
            </div>
        );
    }
    
    protected onRendered() {
        // 框架自动识别并保护这里注入的元素
        Prism.highlightElement(this.querySelector('code'));
    }
}

// ❌ 不好的设计：需要开发者手动配置
class MyComponent extends WebComponent {
    @state({
        trackChanges: true, // 不应该需要手动启用
        updateStrategy: 'fine-grained' // 不应该需要手动选择
    })
    private items: Item[] = [];
    
    render() {
        return (
            <div>
                {this.items.map((item, index) => (
                    <div 
                        key={item.id}
                        data-wsx-track={`items[${index}]`} // 不应该需要手动标记
                    >
                        {item.name}
                    </div>
                ))}
            </div>
        );
    }
}
```

#### 1. 自动响应式跟踪

框架自动跟踪所有 `@state` 属性的变化，无需配置：

```typescript
// 开发者只需使用 @state，框架自动处理
class MyComponent extends WebComponent {
    @state private items: Item[] = []; // 自动跟踪
    @state private title: string = ""; // 自动跟踪
}
```

#### 2. 自动 DOM 映射

框架自动建立数据到 DOM 的映射，无需手动标记：

```typescript
// 框架自动识别 JSX 结构，建立映射关系
class MyComponent extends WebComponent {
    render() {
        return (
            <div>
                {this.items.map((item, index) => (
                    <div key={item.id}>{item.name}</div>
                    // 框架自动识别：
                    // - key={item.id} 用于节点复用
                    // - {item.name} 用于细粒度更新
                ))}
            </div>
        );
    }
}
```

#### 3. 自动后注入元素识别

框架自动识别和保护后注入的元素，无需手动标记：

```typescript
class MyComponent extends WebComponent {
    render() {
        return <div id="container"></div>;
    }
    
    protected onRendered() {
        // 框架自动识别：onRendered 中注入的元素需要保护
        // 不需要开发者手动调用 preserveElement()
        const editor = monaco.editor.create(
            this.querySelector('#container'),
            { value: this.code }
        );
    }
}
```

#### 4. 自动更新策略选择

框架根据变化类型自动选择最优策略，无需配置：

```typescript
// 框架自动选择：
// - 小范围数据变化 → 细粒度更新
// - 大范围结构变化 → DOM swap
// - 极端情况 → 全量替换（回退）
class MyComponent extends WebComponent {
    // 无需配置 updateStrategy
    // 框架会根据实际情况自动选择
}
```

### 实现细节

#### 阶段 1: 运行时 DOM 跟踪（Runtime DOM Tracking）

在运行时建立数据到 DOM 的映射关系：

```typescript
class BaseComponent {
    private domMappings = new Map<string, DOMNodeMapping>();
    
    protected trackDOMNode(dataPath: string, node: HTMLElement, updateFn: Function) {
        this.domMappings.set(dataPath, {
            dataPath,
            domNode: node,
            updateFn
        });
    }
    
    protected _rerender(): void {
        // 1. 检测数据变化
        const changes = this.detectChanges();
        
        // 2. 更新变化的部分
        changes.forEach(change => {
            const mapping = this.domMappings.get(change.path);
            if (mapping) {
                mapping.updateFn(change.newValue);
            }
        });
        
        // 3. 处理结构变化（列表项增减等）
        this.updateStructure();
    }
}
```

#### 阶段 2: 编译时优化（Compile-time Optimization）

通过 Babel 插件在编译时生成优化的更新代码：

```typescript
// babel-plugin-wsx-vapor.ts
export default function babelPluginWSXVapor() {
    return {
        visitor: {
            JSXElement(path) {
                // 分析 JSX，生成细粒度更新代码
                if (isStaticElement(path)) {
                    // 静态元素：只创建一次
                    generateStaticElementCode(path);
                } else if (isReactiveElement(path)) {
                    // 响应式元素：生成更新代码
                    generateReactiveUpdateCode(path);
                }
            }
        }
    };
}
```

#### 阶段 3: 混合更新策略（Hybrid Update Strategy）

根据变化类型自动选择更新策略：

```typescript
class UpdateStrategy {
    shouldFullReplace(changes: Change[]): boolean {
        // 如果结构变化太大，使用全量替换
        return changes.some(c => c.type === 'structure-change') &&
               changes.length > threshold;
    }
    
    shouldFineGrained(changes: Change[]): boolean {
        // 如果只是数据更新，使用细粒度更新
        return changes.every(c => c.type === 'data-update');
    }
}
```

### 示例用法

#### 示例 1: 列表组件优化

```tsx
// 优化前
class TodoList extends WebComponent {
    @state private todos: Todo[] = [];
    
    render() {
        return (
            <ul>
                {this.todos.map(todo => (
                    <li key={todo.id}>{todo.name}</li>
                ))}
            </ul>
        );
    }
}

// 优化后（自动优化，无需修改代码）
// 当 todos 数组只有一项变化时，只更新对应的 <li> 元素
```

#### 示例 2: 表单组件优化

```tsx
// 优化前
class FormComponent extends WebComponent {
    @state private name: string = "";
    @state private email: string = "";
    
    render() {
        return (
            <form>
                <input value={this.name} onInput={(e) => this.name = e.target.value} />
                <input value={this.email} onInput={(e) => this.email = e.target.value} />
            </form>
        );
    }
}

// 优化后
// 当 name 变化时，只更新 name 输入框的 value，email 输入框保持不变
// 焦点、滚动位置等状态得以保留
```

#### 示例 3: 复杂嵌套组件

```tsx
class Dashboard extends WebComponent {
    @state private user: User = { name: "", avatar: "" };
    @state private stats: Stats = { views: 0, likes: 0 };
    
    render() {
        return (
            <div>
                <UserProfile user={this.user} />
                <StatsPanel stats={this.stats} />
            </div>
        );
    }
}

// 优化后
// 当 user 变化时，只更新 UserProfile 组件
// 当 stats 变化时，只更新 StatsPanel 组件
// 两个组件互不影响
```

## 与 WSXJS 设计理念的契合度

### 符合 WSXJS 核心原则

- [x] **JSX语法糖**：保持 JSX 语法不变，优化在编译和运行时层面
- [x] **直接 DOM 操作**：充分利用浏览器原生 DOM API，不引入虚拟 DOM 抽象
- [x] **零侵入**：完全自动，开发者无需修改代码
- [x] **智能优化**：框架自动选择最优策略，对开发者透明

### WSXJS 设计理念

WSXJS 的核心理念是直接操作真实 DOM，充分利用浏览器原生能力：

1. **直接 DOM 操作**：不引入虚拟 DOM 抽象，直接操作真实 DOM
2. **编译时 + 运行时优化**：在编译阶段注入位置 ID，运行时进行智能缓存和更新
3. **细粒度更新**：充分利用浏览器原生能力，只更新必要的部分
4. **零配置**：所有优化自动完成，开发者无需关心实现细节

## 权衡取舍

### 优势

1. **性能提升**：
   - 减少 DOM 创建和销毁开销
   - 降低内存占用
   - 减少浏览器重排/重绘

2. **用户体验改善**：
   - 避免焦点丢失
   - 保持滚动位置
   - 减少闪烁和跳转

3. **向后兼容**：
   - 可以逐步迁移
   - 不影响现有代码
   - 可以选择性启用

4. **灵活性**：
   - 支持多种更新策略
   - 可以根据场景选择最优策略

### 劣势

1. **实现复杂度**：
   - 需要实现 DOM 跟踪机制
   - 需要编译时优化支持
   - 需要处理边界情况

2. **运行时开销**：
   - DOM 映射需要内存
   - 变化检测需要计算
   - 可能增加代码体积

3. **调试难度**：
   - DOM 复用可能使调试更困难
   - 需要更好的开发工具支持

4. **兼容性考虑**：
   - 某些第三方库可能依赖全量替换
   - 需要处理特殊情况

### 替代方案

#### 方案 1: 虚拟 DOM（不采用）

**原因**：
- 与 WSXJS "信任浏览器" 理念不符
- 增加运行时开销
- 需要额外的抽象层

#### 方案 2: 手动优化（不采用）

**原因**：
- 需要开发者手动处理
- 容易出错
- 代码复杂度高

#### 方案 3: 混合策略（推荐）

**原因**：
- 灵活性高
- 可以根据场景选择最优策略
- 向后兼容性好
- 可以结合细粒度更新和 DOM swap

#### 方案 4: 仅 DOM Swap（评估中）

**优点**：
- 可以保护后注入元素
- 不需要编译时优化
- 实现相对简单

**缺点**：
- DOM diff 有性能开销
- 可能不如细粒度更新高效
- 需要处理复杂的 diff 场景

#### 方案 5: 仅细粒度更新（评估中）

**优点**：
- 性能最优
- 编译时优化可以生成高效代码

**缺点**：
- 无法保护后注入元素
- 需要编译时支持
- 实现复杂度高

#### 方案 6: 细粒度更新 + DOM Swap（推荐）

**策略**：
- **默认使用细粒度更新**：对于 `render()` 返回的内容
- **DOM Swap 保护后注入元素**：对于 `onRendered()` 等钩子中注入的元素
- **智能选择**：根据变化类型自动选择策略

**优点**：
- 结合两种策略的优势
- 性能最优
- 保护后注入元素
- 灵活性高

**缺点**：
- 实现复杂度最高
- 需要处理两种策略的协调

## 未解决问题

1. **列表项 key 策略**：
   - 如何确定列表项的唯一标识？
   - 如何处理动态 key？
   - 如何处理 key 冲突？

2. **条件渲染优化**：
   - 如何处理 `{condition && <Component />}` 的情况？
   - 如何优化 `{items.map(...)}` 的更新？

3. **组件嵌套优化**：
   - 如何跨组件边界进行优化？
   - 如何处理组件实例的复用？

4. **性能基准**：
   - 什么情况下细粒度更新比全量替换更优？
   - 如何确定切换阈值？

5. **开发工具支持**：
   - 如何调试细粒度更新？
   - 如何可视化 DOM 映射关系？

6. **后注入元素识别**：
   - ✅ **自动识别**：使用 MutationObserver 和启发式算法自动识别
   - ✅ **无需手动标记**：框架自动处理，开发者无需关心
   - ✅ **智能处理**：支持嵌套的后注入元素

7. **DOM Swap 性能**：
   - DOM diff 算法的性能开销如何？
   - 什么情况下 DOM swap 比全量替换更优？
   - 如何平衡 diff 开销和替换开销？

8. **第三方库兼容性**：
   - 如何确保与各种第三方库兼容？
   - 是否需要提供适配器？
   - 如何处理库的特殊需求？

## 实现计划

### **分阶段实施策略**

**核心原则**：
1. ✅ **先验证 DOM 复用的收益**（阶段 0）
2. ✅ **再实现完整的运行时优化**（阶段 1）
3. ⚠️ **最后考虑编译时优化**（阶段 2，可选）

### 阶段 0: DOM 复用可行性验证（2-3 周）⭐ **最关键**

**目标**：证明 DOM 复用的价值，决定是否继续

**任务**：
1. **实现最小化 DOM 缓存机制**：
   - 修改 `h()` 函数，添加简单的 Map 缓存
   - 使用简单的缓存键（不需要 Babel 插件，手动注入测试 ID）
   - 支持基本的 DOM 复用

2. **测试关键场景**：
   - 静态内容渲染（如文章详情页）
   - 简单列表（无 input）
   - 带 input 的列表（有 key）
   - 第三方库集成（Monaco Editor, Chart.js 等）

3. **性能基准测试**：
   - 对比当前实现（全量替换） vs DOM 复用
   - 测量指标：
     - DOM 创建次数
     - 渲染时间
     - 内存占用
     - 焦点保持情况

4. **决策点**：
   - ✅ **如果性能提升 >20%，且无重大问题** → 继续阶段 1
   - ❌ **如果收益 <20%，或有严重问题** → 暂停，重新评估方案

**示例代码（原型）**：

```typescript
// packages/core/src/jsx-factory.ts (原型修改)

// 阶段 0 原型：使用全局 Map（简化实现）
// 注意：生产环境需要实现组件级别的缓存管理和清理机制
// TODO: 阶段 1 将实现：
// - 组件级别的缓存管理器（DOMCacheManager）
// - disconnectedCallback 时自动清理
// - LRU 清理策略（防止内存泄漏）
// - 嵌套组件的缓存隔离
const domCache = new Map<string, HTMLElement>();

export function h(tag, props, ...children) {
    // 阶段 0 原型：强制要求 __testId 以确保测试准确性
    const cacheKey = props?.__testId;

    if (!cacheKey) {
        throw new Error(
            `[DOM Cache Prototype] Element <${tag}> missing __testId prop. ` +
            `All elements must have __testId for Phase 0 testing.`
        );
    }

    // 查找缓存
    let element = domCache.get(cacheKey);

    // 缓存键冲突检测（阶段 0 原型保护）
    if (element && element.tagName.toLowerCase() !== tag.toLowerCase()) {
        console.warn(
            `[DOM Cache] Cache key conflict: "${cacheKey}" is used by different elements. ` +
            `Expected: <${tag}>, Found: <${element.tagName.toLowerCase()}>. ` +
            `This should not happen in production. Ensure unique __testId values.`
        );
        // 在原型阶段，冲突时使用新元素（生产环境需要更严格的策略）
        element = undefined;
    }

    if (element) {
        console.log('[DOM Reuse]', cacheKey);
        // 简单的更新逻辑（原型）
        updateElement(element, props, children);
    } else {
        console.log('[DOM Create]', cacheKey);
        // 创建新元素（现有逻辑）
        element = document.createElement(tag);
        applyProps(element, props);
        appendChildren(element, children);
        domCache.set(cacheKey, element);

        // 保存缓存键到元素上（用于 getCacheKey 函数）
        (element as any).__wsxCacheKey = cacheKey;
    }

    return element;
}

// 缓存清理函数（阶段 0 原型，手动调用）
// TODO: 阶段 1 将实现自动清理
export function clearDOMCache(cacheKey?: string): void {
    if (cacheKey) {
        // 清理特定缓存
        const element = domCache.get(cacheKey);
        if (element) {
            // 清理元素上的缓存键标记
            delete (element as any).__wsxCacheKey;
        }
        domCache.delete(cacheKey);
    } else {
        // 清理所有缓存（测试用）
        domCache.forEach((element) => {
            delete (element as any).__wsxCacheKey;
        });
        domCache.clear();
    }
}
```

**测试用例**：

```tsx
// 测试 1: 静态内容复用
class ArticleView extends WebComponent {
    @state private content = "Initial content";

    render() {
        return (
            <div __testId="article-container">
                <h1 __testId="article-title">{this.title}</h1>
                <p __testId="article-content">{this.content}</p>
            </div>
        );
    }
}

// 更新 content 时，应该：
// - 复用 <div>, <h1>, <p>
// - 只更新 <p> 的文本内容

// 测试 2: 带 input 的列表
class TodoList extends WebComponent {
    @state private items = [
        { id: 1, text: 'Task 1', editing: true },
        { id: 2, text: 'Task 2', editing: false }
    ];

    render() {
        return (
            <ul __testId="todo-list">
                {this.items.map(item => (
                    <li __testId={`todo-${item.id}`} key={item.id}>
                        {item.editing ? (
                            <input value={item.text} autoFocus />
                        ) : (
                            <span>{item.text}</span>
                        )}
                    </li>
                ))}
            </ul>
        );
    }
}

// 反转列表时，应该：
// - 精确复用每个 <li> (通过 key)
// - 保持 input 的焦点
```

**性能测试方案**：

```typescript
// packages/core/__tests__/performance-benchmark.test.ts

class DOMReusePerformanceBenchmark {
    private domCreationCount = 0;
    private domReuseCount = 0;

    // 测试 1: 静态内容渲染性能
    async testStaticContentPerformance() {
        const component = new ArticleView();
        const iterations = 1000;

        // 重置计数器
        this.resetCounters();

        // 等待渲染完成的辅助函数（WSXJS 实际实现）
        const waitForRender = () => {
            return new Promise<void>((resolve) => {
                // 使用 requestAnimationFrame 等待渲染完成
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        resolve();
                    });
                });
            });
        };

        // 测试当前实现（全量替换）
        const baselineStart = performance.now();
        for (let i = 0; i < iterations; i++) {
            component.content = `Content ${i}`;
            await waitForRender();
        }
        const baselineEnd = performance.now();
        const baselineTime = baselineEnd - baselineStart;
        const baselineCreations = this.domCreationCount;

        // 测试 DOM 复用实现
        this.resetCounters();
        const optimizedStart = performance.now();
        for (let i = 0; i < iterations; i++) {
            component.content = `Content ${i}`;
            await waitForRender();
        }
        const optimizedEnd = performance.now();
        const optimizedTime = optimizedEnd - optimizedStart;
        const optimizedCreations = this.domCreationCount;

        // 计算性能提升
        const timeImprovement = ((baselineTime - optimizedTime) / baselineTime) * 100;
        const creationReduction = ((baselineCreations - optimizedCreations) / baselineCreations) * 100;

        console.log({
            baseline: {
                time: baselineTime,
                domCreations: baselineCreations,
                avgTimePerRender: baselineTime / iterations
            },
            optimized: {
                time: optimizedTime,
                domCreations: optimizedCreations,
                domReuse: this.domReuseCount,
                avgTimePerRender: optimizedTime / iterations
            },
            improvement: {
                timeImprovement: `${timeImprovement.toFixed(2)}%`,
                creationReduction: `${creationReduction.toFixed(2)}%`
            },
            passThreshold: timeImprovement > 20
        });

        return {
            timeImprovement,
            creationReduction,
            passThreshold: timeImprovement > 20
        };
    }

    // 测试 2: 列表重排序性能
    async testListReorderPerformance() {
        const component = new TodoList();
        const itemCount = 1000;
        const iterations = 100;

        // 等待渲染完成的辅助函数
        const waitForRender = () => {
            return new Promise<void>((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        resolve();
                    });
                });
            });
        };

        // 初始化列表
        component.items = Array.from({ length: itemCount }, (_, i) => ({
            id: i,
            text: `Task ${i}`,
            editing: false
        }));

        // 测试反转列表
        const start = performance.now();
        for (let i = 0; i < iterations; i++) {
            component.items = [...component.items].reverse();
            await waitForRender();
        }
        const end = performance.now();

        const avgTime = (end - start) / iterations;
        const domOperations = this.domReuseCount + this.domCreationCount;

        console.log({
            itemCount,
            iterations,
            totalTime: end - start,
            avgTimePerReorder: avgTime,
            domReuse: this.domReuseCount,
            domCreations: this.domCreationCount,
            reuseRatio: `${(this.domReuseCount / domOperations * 100).toFixed(2)}%`
        });

        return avgTime;
    }

    // 测试 3: 焦点保持测试
    async testFocusRetention() {
        const component = new TodoList();
        component.items = [
            { id: 1, text: 'Task 1', editing: true },
            { id: 2, text: 'Task 2', editing: false }
        ];

        // 等待渲染完成
        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    resolve();
                });
            });
        });

        // 聚焦到第一个 input
        const input = component.shadowRoot!.querySelector('input');
        input?.focus();

        const beforeFocus = document.activeElement;

        // 反转列表
        component.items = [...component.items].reverse();
        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    resolve();
                });
            });
        });

        const afterFocus = document.activeElement;

        // 验证焦点是否保持
        const focusRetained = beforeFocus === afterFocus;

        console.log({
            focusRetained,
            beforeElement: beforeFocus?.tagName,
            afterElement: afterFocus?.tagName
        });

        return focusRetained;
    }

    private resetCounters() {
        this.domCreationCount = 0;
        this.domReuseCount = 0;
    }

    // Hook into h() function to count DOM operations
    setupTracking() {
        const originalH = h;
        (window as any).h = (...args: any[]) => {
            const result = originalH(...args);
            if (domCache.has(args[1]?.__testId)) {
                this.domReuseCount++;
            } else {
                this.domCreationCount++;
            }
            return result;
        };
    }
}

// 运行测试
describe('DOM Reuse Performance', () => {
    let benchmark: DOMReusePerformanceBenchmark;

    beforeEach(() => {
        benchmark = new DOMReusePerformanceBenchmark();
        benchmark.setupTracking();
    });

    test('静态内容渲染应该至少提升 20% 性能', async () => {
        const result = await benchmark.testStaticContentPerformance();
        expect(result.passThreshold).toBe(true);
        expect(result.timeImprovement).toBeGreaterThan(20);
    });

    test('列表重排序应该保持焦点', async () => {
        const focusRetained = await benchmark.testFocusRetention();
        expect(focusRetained).toBe(true);
    });
});
```

**内存泄漏检测方案**：

```typescript
// packages/core/__tests__/memory-leak.test.ts

class MemoryLeakDetector {
    async testMemoryLeak() {
        // 仅在支持 performance.memory 的环境运行（Chrome with --enable-precise-memory-info）
        if (!(performance as any).memory) {
            console.warn('performance.memory not available, skipping memory leak test');
            return null;
        }

        const component = new ArticleView();
        const iterations = 10000;

        // 强制垃圾回收（需要 Chrome --expose-gc）
        const gc = (global as any).gc;
        if (gc) gc();

        const initialMemory = (performance as any).memory.usedJSHeapSize;

        // 大量渲染循环
        for (let i = 0; i < iterations; i++) {
            component.content = `Content ${i}`;
            await component.updateComplete;

            // 每 1000 次迭代强制 GC
            if (i % 1000 === 0 && gc) {
                gc();
            }
        }

        // 最后强制 GC
        if (gc) gc();

        const finalMemory = (performance as any).memory.usedJSHeapSize;
        const leak = finalMemory - initialMemory;
        const leakPercentage = (leak / initialMemory) * 100;

        console.log({
            iterations,
            initialMemory: `${(initialMemory / 1024 / 1024).toFixed(2)} MB`,
            finalMemory: `${(finalMemory / 1024 / 1024).toFixed(2)} MB`,
            leak: `${(leak / 1024 / 1024).toFixed(2)} MB`,
            leakPercentage: `${leakPercentage.toFixed(2)}%`,
            acceptable: leakPercentage < 10 // 内存增长 <10% 视为可接受
        });

        return {
            initialMemory,
            finalMemory,
            leak,
            leakPercentage,
            acceptable: leakPercentage < 10
        };
    }

    // 测试缓存清理
    async testCacheCleanup() {
        const component = new ArticleView();
        const cacheSize = domCache.size;

        // 渲染组件
        component.content = 'Test content';
        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    resolve();
                });
            });
        });

        const afterRenderSize = domCache.size;

        // 断开组件
        component.disconnectedCallback();

        // 验证缓存是否被清理
        const afterDisconnectSize = domCache.size;

        console.log({
            initialCacheSize: cacheSize,
            afterRender: afterRenderSize,
            afterDisconnect: afterDisconnectSize,
            cleaned: afterRenderSize > afterDisconnectSize
        });

        return {
            cacheGrowth: afterRenderSize - cacheSize,
            cacheCleanup: afterRenderSize - afterDisconnectSize,
            cleaned: afterRenderSize > afterDisconnectSize
        };
    }
}

describe('Memory Leak Detection', () => {
    let detector: MemoryLeakDetector;

    beforeEach(() => {
        detector = new MemoryLeakDetector();
    });

    test('大量渲染不应导致严重内存泄漏', async () => {
        const result = await detector.testMemoryLeak();
        if (result) {
            expect(result.acceptable).toBe(true);
            expect(result.leakPercentage).toBeLessThan(10);
        }
    }, 60000); // 60秒超时

    test('组件断开时应清理缓存', async () => {
        const result = await detector.testCacheCleanup();
        expect(result.cleaned).toBe(true);
    });
});
```

**第三方库兼容性测试**：

```typescript
// packages/core/__tests__/third-party-integration.test.ts

describe('Third-party Library Integration', () => {
    // 等待渲染完成的辅助函数
    const waitForRender = () => {
        return new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    resolve();
                });
            });
        });
    };

    test('Monaco Editor 不应被重新创建', async () => {
        const component = new CodeEditor();
        document.body.appendChild(component);

        await waitForRender();

        const firstEditor = component.editor;
        expect(firstEditor).not.toBeNull();

        // 修改 code 10 次
        for (let i = 0; i < 10; i++) {
            component.code = `console.log(${i});`;
            await waitForRender();
        }

        // 验证编辑器实例没有被重新创建
        expect(component.editor).toBe(firstEditor);

        // 验证 canvas 元素没有被重新创建
        const canvas = component.shadowRoot!.querySelector('#editor');
        expect(canvas).toBeTruthy();
        expect(canvas).toBe(component.shadowRoot!.querySelector('#editor'));
    });

    test('Chart.js canvas 不应被重新创建', async () => {
        const component = new ChartComponent();
        document.body.appendChild(component);

        await waitForRender();

        const firstChart = component.chart;
        const firstCanvas = component.shadowRoot!.querySelector('#chart');

        // 修改 data 10 次
        for (let i = 0; i < 10; i++) {
            component.data = Array.from({ length: 5 }, () => Math.random());
            await waitForRender();
        }

        // 验证 chart 实例和 canvas 元素都没有被重新创建
        expect(component.chart).toBe(firstChart);
        expect(component.shadowRoot!.querySelector('#chart')).toBe(firstCanvas);
    });
});
```

---

## 分阶段实施计划

### 阶段 0：基础设施准备（1-2 天）

**目标**：建立测试和回滚机制，不改变任何核心逻辑

**任务**：
- [ ] 0.1 创建性能测试基准
  - 文件：`packages/core/__tests__/performance-baseline.test.ts`
  - 内容：测试当前实现的渲染性能
  - 验收：基准数据记录在文档中

- [ ] 0.2 创建回归测试套件
  - 文件：`packages/core/__tests__/regression-suite.test.ts`
  - 内容：覆盖所有已知场景（i18n、列表、表单等）
  - 验收：100% 通过

- [ ] 0.3 创建分支策略
  - 主分支：main（稳定版本）
  - 开发分支：feat/rfc-0037
  - 每个阶段一个子分支：feat/rfc-0037-phase-1

**验收标准**：
- ✅ 所有测试通过
- ✅ 性能基准已记录
- ✅ Git 分支策略清晰

---

### 阶段 1：RenderContext（1-2 天）

**目标**：只添加 RenderContext，不修改 h() 函数

**文件**：
- 新增：`packages/core/src/render-context.ts`
- 修改：`packages/core/src/base-component.ts`（只在 _rerender 中设置上下文）

**实现**：
```typescript
// render-context.ts
export class RenderContext {
    private static current: BaseComponent | null = null;

    static runInContext<T>(component: BaseComponent, fn: () => T): T {
        const prev = RenderContext.current;
        RenderContext.current = component;
        try {
            return fn();
        } finally {
            RenderContext.current = prev;
        }
    }

    static getCurrentComponent(): BaseComponent | null {
        return RenderContext.current;
    }
}
```

**测试**：
```typescript
test('RenderContext tracks current component', () => {
    const component = new TestComponent();

    RenderContext.runInContext(component, () => {
        expect(RenderContext.getCurrentComponent()).toBe(component);
    });

    expect(RenderContext.getCurrentComponent()).toBeNull();
});
```

**验收标准**：
- ✅ 所有现有测试通过
- ✅ 新增测试覆盖 RenderContext
- ✅ 页面功能完全正常
- ✅ 性能无退化

---

### 阶段 2：DOMCacheManager（1-2 天）

**目标**：只添加缓存管理器，h() 函数还不使用它

**文件**：
- 新增：`packages/core/src/dom-cache-manager.ts`
- 修改：`packages/core/src/render-context.ts`（添加 _domCache 属性）

**实现**：
```typescript
// dom-cache-manager.ts
export class DOMCacheManager {
    private cache = new Map<string, Element>();

    get(key: string): Element | undefined {
        return this.cache.get(key);
    }

    set(key: string, element: Element): void {
        this.cache.set(key, element);
    }

    clear(): void {
        this.cache.clear();
    }
}
```

**测试**：
```typescript
test('DOMCacheManager stores and retrieves elements', () => {
    const manager = new DOMCacheManager();
    const element = document.createElement('div');

    manager.set('test-key', element);
    expect(manager.get('test-key')).toBe(element);
});
```

**验收标准**：
- ✅ 所有现有测试通过
- ✅ 缓存管理器功能正常
- ✅ 页面功能完全正常
- ✅ 性能无退化

---

### 阶段 3：h() 函数缓存（3-5 天）⚠️⚠️ 关键阶段 - 精炼设计

**设计原则**：
1. **安全启用**：默认启用缓存机制，但只在组件渲染上下文中工作
   
   **什么是"上下文"？**
   - **有上下文**：`h()` 在组件的 `render()` 方法中被调用时
     ```typescript
     // packages/core/src/web-component.ts
     protected _rerender(): void {
         // RenderContext.runInContext(this, () => this.render()) 设置了上下文
         const content = RenderContext.runInContext(this, () => this.render());
         //                                                      ↑
         //                                            在这个函数内部调用 h() 时
         //                                            RenderContext.getCurrentComponent() 
         //                                            返回 this（当前组件实例）
     }
     
     // 组件内部（有上下文）
     class MyComponent extends WebComponent {
         render() {
             return h('div', {}, 'Hello');  // ✅ 有上下文，可以使用缓存
         }
     }
     ```
   
   - **无上下文**：在组件外部直接调用 `h()` 时
     ```typescript
     // 测试代码中（无上下文）
     test('example', () => {
         const div = h('div', {}, 'test');  // ❌ 无上下文，回退到旧逻辑
     });
     
     // 工具函数中（无上下文）
     function createButton() {
         return h('button', {}, 'Click');  // ❌ 无上下文，回退到旧逻辑
     }
     ```
   
   - **自动回退**：无上下文时 `RenderContext.getCurrentComponent()` 返回 `null`，自动使用旧逻辑，确保向后兼容
2. **渐进式实现**：先缓存+复用但不更新（阶段 3.2），验证安全后实现细粒度更新（阶段 4）
3. **错误处理**：完善的错误处理和降级机制

**目标**：实现缓存机制，阶段 3.2 启用缓存复用（但不更新内容），阶段 4 实现细粒度更新

---

#### 3.1 改进缓存键生成（避免冲突）

**问题**：原设计使用 `'no-id'` 作为回退，会导致多个元素生成相同缓存键。

**解决方案**：使用组件级别的递增计数器。

```typescript
// packages/core/src/utils/cache-key.ts

// 组件级别的元素计数器（使用 WeakMap 避免内存泄漏）
const componentElementCounters = new WeakMap<BaseComponent, number>();

export function generateCacheKey(
    tag: string,
    props: Record<string, unknown> | null | undefined,
    componentId: string,
    component?: BaseComponent
): string {
    const positionId = props?.[POSITION_ID_KEY];
    const userKey = props?.key;
    const index = props?.[INDEX_KEY];

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

    // 优先级 4: 组件级别计数器（运行时回退，确保唯一性）
    if (component) {
        let counter = componentElementCounters.get(component) || 0;
        counter++;
        componentElementCounters.set(component, counter);
        return `${componentId}:${tag}:auto-${counter}`;
    }

    // 最后回退：时间戳（不推荐，但确保唯一性）
    return `${componentId}:${tag}:fallback-${Date.now()}-${Math.random()}`;
}
```

**优势**：
- ✅ 避免缓存键冲突（组件级别隔离）
- ✅ 使用 WeakMap，自动内存管理
- ✅ 即使没有位置 ID 也能正常工作

---

#### 3.2 修改 h() 函数（缓存 + 复用，但不更新 - 阶段 3.2）

**核心策略**：启用缓存复用，但复用时不更新内容。这样可以验证缓存机制和复用逻辑，但 UI 会"冻结"（这是预期的，阶段 4 会解决）。

**关键理解**：
- ❌ **只缓存不复用**：每次还是创建新元素，缓存没有意义
- ✅ **缓存 + 复用但不更新**：复用元素，避免重新创建，但内容不更新（用于验证机制）
- ✅ **缓存 + 复用 + 更新**：完整功能（阶段 4）

```typescript
// packages/core/src/jsx-factory.ts

export function h(
    tag: string | Function,
    props: Record<string, unknown> | null = {},
    ...children: JSXChildren[]
): HTMLElement | SVGElement {
    // 处理组件函数（不受缓存影响）
    if (typeof tag === "function") {
        return tag(props, children);
    }

    // 检查上下文
    const context = RenderContext.getCurrentComponent();
    const cacheManager = context ? RenderContext.getDOMCache() : null;

    let element: HTMLElement | SVGElement;

    if (context && cacheManager) {
        // 有上下文：尝试使用缓存
        try {
            const componentId = getComponentId();
            const cacheKey = generateCacheKey(tag, props, componentId, context);
            const cachedElement = cacheManager.get(cacheKey);

            if (cachedElement && cachedElement.tagName.toLowerCase() === tag.toLowerCase()) {
                // ✅ 缓存命中：复用元素（避免重新创建）
                element = cachedElement as HTMLElement | SVGElement;
                
                // ⚠️ 阶段 3.2：不更新内容（用于验证复用机制）
                // 这会导致 UI "冻结"，但可以验证：
                // 1. 缓存键生成是否正确
                // 2. 元素复用是否工作
                // 3. 是否有缓存键冲突
                // TODO: 阶段 4 实现细粒度更新（updateProps 和 updateChildren）
            } else {
                // ❌ 缓存未命中：创建新元素
                element = createElementAndApplyProps(tag, props, children);
                cacheManager.set(cacheKey, element);
                markElement(element, cacheKey);
            }
        } catch (error) {
            // 缓存失败：降级到创建新元素
            if (process.env.NODE_ENV === 'development') {
                console.warn('[WSX DOM Cache] Cache error, falling back to create new element:', error);
            }
            element = createElementAndApplyProps(tag, props, children);
        }
    } else {
        // 无上下文：使用旧逻辑（向后兼容）
        element = createElementAndApplyProps(tag, props, children);
    }

    return element;
}
```

**已知问题**：
- ⚠️ UI 会"冻结"（元素复用但不更新内容）
- ⚠️ 这是预期行为，用于验证缓存和复用机制
- ✅ 避免了元素重新创建（性能提升）
- ✅ 可以验证缓存键生成是否正确

**优势**：
- ✅ 实际有用：避免元素重新创建
- ✅ 可以验证缓存机制和复用逻辑
- ✅ 有完善的错误处理和降级机制
- ⚠️ UI 不更新是预期的（阶段 4 解决）

// 提取原有的元素创建逻辑（保持代码清晰）
function createElementAndApplyProps(
    tag: string,
    props: Record<string, unknown> | null,
    children: JSXChildren[]
): HTMLElement | SVGElement {
    // ... 原有的元素创建、属性处理、子元素处理逻辑 ...
    // （保持与当前实现完全一致）
}
```

---

#### 3.3 阶段 3 总结

**阶段 3.2 的目标**：
- ✅ 验证缓存键生成是否正确
- ✅ 验证元素复用机制是否工作
- ✅ 避免元素重新创建（性能提升）
- ⚠️ UI 不更新是预期的（阶段 4 解决）

**如何避免重新创建**：
- 通过缓存键匹配，复用已存在的元素
- 如果缓存键相同且标签匹配，直接返回缓存的元素
- 只有缓存未命中时才创建新元素

**下一步（阶段 4）**：
- 实现 `updateProps()` 和 `updateChildren()` 函数
- 在复用元素时，更新变化的属性和子元素
- 这样既能避免重新创建，又能保持 UI 更新

---

#### 3.4 分阶段实现计划

**阶段 3.1：改进缓存键生成**（1 天）
- 实现组件级别计数器
- 更新 `generateCacheKey` 函数
- 添加测试覆盖

**阶段 3.2：只缓存不复用**（2 天）
- 修改 `h()` 函数，默认启用缓存（但不复用）
- 验证缓存机制工作正常
- **零回归风险**（行为完全不变，只是多了缓存步骤）

**阶段 3.3：启用缓存复用**（1 天）
- 在阶段 3.2 基础上添加复用逻辑
- 验证缓存复用工作正常
- **注意**：此时 UI 可能不更新（需要阶段 4 实现细粒度更新）

**验收标准**：
- ✅ 所有现有测试通过
- ✅ 阶段 3.2：行为完全不变，缓存机制工作正常
- ✅ 阶段 3.3：缓存复用成功，但 UI 可能不更新（预期，阶段 4 解决）
- ✅ 完善的错误处理和降级机制

---

### 阶段 4：细粒度更新（3-5 天）⚠️ 关键阶段

**目标**：缓存命中时正确更新 props 和 children

#### 4.1 实现 updateProps
```typescript
function updateProps(
    element: HTMLElement | SVGElement,
    newProps: Record<string, unknown>,
    oldProps: Record<string, unknown>
): void {
    // 移除旧属性
    for (const key in oldProps) {
        if (!(key in newProps)) {
            removeProp(element, key, oldProps[key]);
        }
    }

    // 添加/更新新属性
    for (const key in newProps) {
        if (newProps[key] !== oldProps[key]) {
            applyProp(element, key, newProps[key], oldProps[key]);
        }
    }
}
```

#### 4.2 实现 updateChildren（简单版本）
```typescript
function updateChildren(
    element: HTMLElement | SVGElement,
    newChildren: (string | number | Node)[]
): void {
    // 阶段 4 简化版：只处理相同数量的子节点
    const oldChildren = Array.from(element.childNodes);

    // 更新现有子节点
    for (let i = 0; i < Math.min(oldChildren.length, newChildren.length); i++) {
        const oldNode = oldChildren[i];
        const newChild = newChildren[i];

        if (oldNode !== newChild) {
            element.replaceChild(normalizeChild(newChild), oldNode);
        }
    }

    // 添加新子节点
    for (let i = oldChildren.length; i < newChildren.length; i++) {
        element.appendChild(normalizeChild(newChildren[i]));
    }

    // 移除多余子节点（简单版本：直接删除）
    while (element.childNodes.length > newChildren.length) {
        element.removeChild(element.lastChild!);
    }
}
```

**验收标准**：
- ✅ Props 更新正常
- ✅ Children 更新正常
- ✅ i18n 翻译可以更新
- ✅ 表单输入不丢失焦点
- ✅ 无崩溃

---

### 阶段 5：元素保留逻辑（5-7 天）⚠️⚠️ 最复杂阶段

**目标**：正确处理未标记的元素（第三方库注入）

**关键问题**：这是之前导致崩溃的部分！

#### 5.1 实现元素识别
```typescript
function isCreatedByH(node: Node): boolean {
    if (!(node instanceof HTMLElement || node instanceof SVGElement)) {
        return false;
    }
    return (node as any).__wsxCacheKey !== undefined;
}

function shouldPreserveElement(node: Node): boolean {
    // 规则 1: 非元素节点保留
    if (!(node instanceof HTMLElement || node instanceof SVGElement)) {
        return true;
    }

    // 规则 2: 没有标记的元素保留
    if (!isCreatedByH(node)) {
        return true;
    }

    // 规则 3: 显式标记保留
    if (node.hasAttribute('data-wsx-preserve')) {
        return true;
    }

    return false;
}
```

#### 5.2 修改 updateChildren（完整版本）
```typescript
function updateChildren(
    element: HTMLElement | SVGElement,
    newChildren: (string | number | Node)[]
): void {
    const oldChildren = Array.from(element.childNodes);

    // ... 更新逻辑 ...

    // ⚠️ 关键部分：移除多余节点
    // 问题：需要跳过"应该保留"的元素

    // 方案 A：收集所有应该移除的节点（推荐）
    const nodesToRemove: Node[] = [];
    for (let i = newChildren.length; i < element.childNodes.length; i++) {
        const child = element.childNodes[i];
        if (!shouldPreserveElement(child)) {
            nodesToRemove.push(child);
        }
    }

    // 统一移除
    nodesToRemove.forEach(node => element.removeChild(node));
}
```

**验收标准**：
- ✅ Monaco Editor 等第三方库元素不丢失
- ✅ WSX 创建的元素正确更新
- ✅ 无崩溃
- ✅ 所有回归测试通过

---

### 阶段 6：性能优化（3-5 天）

**目标**：优化缓存查找、减少不必要的更新

#### 6.1 优化缓存键生成
- 使用 Symbol 替代字符串拼接
- 缓存 componentId

#### 6.2 优化 updateProps
- 跳过相同值的属性
- 批量更新 DOM

#### 6.3 性能测试
- 对比阶段 0 的基准数据
- 确认性能提升

**验收标准**：
- ✅ 性能提升 > 30%（大型列表场景）
- ✅ 性能无退化（小型组件场景）

---

## 性能测试报告

详细的性能测试结果和验证数据请参考：[RFC 0037 性能优化报告](./0037-performance-report.md)

## 每个阶段的检查清单

### 开发前
- [ ] 创建功能分支
- [ ] 确认上一阶段所有测试通过

### 开发中
- [ ] 编写测试（TDD）
- [ ] 实现功能
- [ ] 本地测试通过

### 开发后
- [ ] 所有单元测试通过
- [ ] 回归测试通过
- [ ] 性能测试无退化
- [ ] 代码审查
- [ ] 文档更新

### 合并前
- [ ] 所有测试通过
- [ ] 功能分支合并到 feat/rfc-0037
- [ ] 在测试环境验证
- [ ] 准备回滚脚本

---

## 风险控制

### 每个阶段的回滚策略
```bash
# 如果阶段 N 失败
git checkout main
git branch -D feat/rfc-0037-phase-N

# 恢复到阶段 N-1
git checkout feat/rfc-0037-phase-{N-1}
```

### 紧急回滚
```bash
# 如果生产环境出问题
git revert <commit-hash>
git push origin main
```

---

## 时间估算

| 阶段 | 时间 | 累计 |
|------|------|------|
| 阶段 0 | 1-2 天 | 1-2 天 |
| 阶段 1 | 1-2 天 | 2-4 天 |
| 阶段 2 | 1-2 天 | 3-6 天 |
| 阶段 3 | 3-5 天 | 6-11 天 |
| 阶段 4 | 3-5 天 | 9-16 天 |
| 阶段 5 | 5-7 天 | 14-23 天 |
| 阶段 6 | 3-5 天 | 17-28 天 |

**总计**：3-4 周

---

## 成功标准

### 功能标准
- ✅ 所有现有功能正常
- ✅ i18n 翻译更新正常
- ✅ 表单输入不丢失焦点
- ✅ 第三方库（Monaco Editor）正常工作
- ✅ 大型列表性能提升

### 质量标准
- ✅ 测试覆盖率 > 80%
- ✅ 零 lint 错误
- ✅ 零 TypeScript 错误
- ✅ 文档完整

### 性能标准
- ✅ 小型组件：性能无退化
- ✅ 大型列表：性能提升 > 30%

---

## 下一步行动

**立即开始**：
1. 确认此计划
2. 创建 Git 分支
3. 开始阶段 0（测试基础设施）

**每日检查**：
- 当前阶段进度
- 测试通过率
- 遇到的问题

**每周回顾**：
- 完成的阶段
- 性能数据
- 调整计划

## 测试策略

### 单元测试

1. **DOM 跟踪测试**：
   - 映射关系建立
   - 变化检测准确性
   - 更新函数正确性

2. **更新策略测试**：
   - 全量替换策略
   - 细粒度更新策略
   - 混合策略选择

3. **边界情况测试**：
   - 空列表
   - 单元素列表
   - 深层嵌套

### 集成测试

1. **组件渲染测试**：
   - 简单组件
   - 复杂组件
   - 嵌套组件

2. **性能测试**：
   - 大量数据渲染
   - 频繁更新
   - 内存泄漏检测

3. **兼容性测试**：
   - 不同浏览器
   - 不同设备
   - 第三方库集成

### 端到端测试

1. **真实场景测试**：
   - 大型应用
   - 复杂交互
   - 长时间运行

2. **性能基准测试**：
   - 与当前实现对比
   - 内存使用对比
   - 渲染性能对比

## 文档计划

### 需要的文档

- [ ] API 文档更新
- [ ] 使用指南
- [ ] 性能优化指南
- [ ] 迁移指南（如果有破坏性变更）
- [ ] 示例代码
- [ ] 最佳实践
- [ ] 调试指南

### 文档位置

- API 文档：`docs/api/dom-optimization.md`
- 使用指南：`docs/guide/performance-optimization.md`
- 示例代码：`examples/dom-optimization/`

## 向后兼容性

### 破坏性变更

**无破坏性变更**：此优化是向后兼容的，现有代码无需修改即可受益。

### 迁移策略

**无需迁移**：优化是自动的，开发者可以选择启用或禁用。

### 废弃计划

**无废弃**：全量替换策略仍然保留，可以作为回退选项。

## 性能影响

### 构建时性能

- **编译时间**：可能增加 5-10%（由于 Babel 插件处理）
- **产物大小**：可能增加 10-20%（由于运行时支持代码）

### 运行时性能

- **首次渲染**：可能略慢（需要建立映射关系）
- **后续更新**：显著提升（减少 DOM 操作）
- **内存使用**：可能增加 5-10%（DOM 映射开销）

### 内存使用

- **DOM 映射**：需要额外内存存储映射关系
- **长期运行**：需要防止内存泄漏

## 安全考虑

**无安全影响**：此优化只影响 DOM 更新机制，不涉及安全相关功能。

## 开发者体验

### 学习曲线

**极低**：完全自动，零配置，开发者无需学习任何新 API 或概念。

### 调试体验

**需要改进**：
- 需要可视化 DOM 映射关系（开发工具）
- 需要性能分析工具
- 需要更好的错误提示
- 需要显示框架自动选择的更新策略（开发模式）

### 错误处理

- 清晰的错误信息
- 自动回退到全量替换策略（如果优化失败）
- 开发模式下的警告和建议
- 自动降级机制（如果检测到性能问题）

**错误处理和降级策略（详细实现）**：

```typescript
// 错误处理配置
interface DOMOptimizationConfig {
    enableOptimization: boolean;      // 是否启用优化
    fallbackOnError: boolean;          // 错误时是否回退
    maxRetries: number;                // 最大重试次数
    performanceThreshold: number;      // 性能阈值（如果优化后性能更差，自动降级）
}

const defaultConfig: DOMOptimizationConfig = {
    enableOptimization: true,
    fallbackOnError: true,
    maxRetries: 3,
    performanceThreshold: 0.8,  // 如果优化后性能 < 80% 基线，自动降级
};

// 错误处理和降级管理器
class DOMOptimizationManager {
    private config: DOMOptimizationConfig;
    private errorCount = 0;
    private performanceMetrics: number[] = [];
    private isDegraded = false;

    constructor(config: Partial<DOMOptimizationConfig> = {}) {
        this.config = { ...defaultConfig, ...config };
    }

    // 执行优化渲染（带错误处理）
    async executeOptimizedRender(
        component: BaseComponent,
        renderFn: () => HTMLElement
    ): Promise<HTMLElement> {
        if (!this.config.enableOptimization || this.isDegraded) {
            // 已降级或禁用优化，使用全量替换
            return this.fallbackRender(component, renderFn);
        }

        try {
            const startTime = performance.now();
            const result = renderFn();
            const endTime = performance.now();
            const renderTime = endTime - startTime;

            // 记录性能指标
            this.performanceMetrics.push(renderTime);
            if (this.performanceMetrics.length > 100) {
                this.performanceMetrics.shift(); // 保持最近 100 次记录
            }

            // 检查性能是否下降
            this.checkPerformanceDegradation();

            // 重置错误计数（成功执行）
            this.errorCount = 0;

            return result;
        } catch (error) {
            console.error('[DOM Optimization] Error during optimized render:', error);
            this.errorCount++;

            // 如果错误次数超过阈值，自动降级
            if (this.errorCount >= this.config.maxRetries) {
                console.warn(
                    '[DOM Optimization] Too many errors, automatically degrading to fallback mode.'
                );
                this.isDegraded = true;
            }

            // 如果配置了错误回退，使用全量替换
            if (this.config.fallbackOnError) {
                return this.fallbackRender(component, renderFn);
            }

            // 否则重新抛出错误
            throw error;
        }
    }

    // 回退到全量替换策略
    private fallbackRender(
        component: BaseComponent,
        renderFn: () => HTMLElement
    ): HTMLElement {
        // 清理缓存（避免使用缓存的 DOM）
        if (component.shadowRoot) {
            component.shadowRoot.innerHTML = '';
        }

        // 执行全量替换渲染
        const result = renderFn();
        if (component.shadowRoot) {
            component.shadowRoot.appendChild(result);
        }

        return result;
    }

    // 检查性能是否下降
    private checkPerformanceDegradation(): void {
        if (this.performanceMetrics.length < 20) {
            return; // 数据不足，不检查
        }

        // 计算平均性能
        const avgTime = this.performanceMetrics.reduce((a, b) => a + b, 0) / this.performanceMetrics.length;

        // 获取基线性能（首次渲染时间，或从配置获取）
        const baselineTime = this.performanceMetrics[0] || avgTime;
        const performanceRatio = avgTime / baselineTime;

        // 如果性能下降超过阈值，自动降级
        if (performanceRatio > 1 / this.config.performanceThreshold) {
            console.warn(
                `[DOM Optimization] Performance degradation detected (${(performanceRatio * 100).toFixed(2)}% of baseline). ` +
                `Automatically degrading to fallback mode.`
            );
            this.isDegraded = true;
        }
    }

    // 手动重置降级状态（用于测试或调试）
    reset(): void {
        this.isDegraded = false;
        this.errorCount = 0;
        this.performanceMetrics = [];
    }

    // 获取当前状态
    getStatus(): {
        enabled: boolean;
        degraded: boolean;
        errorCount: number;
        avgPerformance: number;
    } {
        const avgPerformance = this.performanceMetrics.length > 0
            ? this.performanceMetrics.reduce((a, b) => a + b, 0) / this.performanceMetrics.length
            : 0;

        return {
            enabled: this.config.enableOptimization && !this.isDegraded,
            degraded: this.isDegraded,
            errorCount: this.errorCount,
            avgPerformance,
        };
    }
}

// 全局优化管理器实例
const optimizationManager = new DOMOptimizationManager();

// 在 BaseComponent._rerender() 中使用
class BaseComponent {
    protected _rerender(): void {
        const result = optimizationManager.executeOptimizedRender(
            this,
            () => this.render()
        );

        // 处理渲染结果...
    }
}
```

**开发模式警告和建议**：

```typescript
// 开发模式下的警告
if (process.env.NODE_ENV === 'development') {
    // 警告 1: 缓存键冲突
    if (cacheKeyConflict) {
        console.warn(
            `[WSXJS DOM Optimization] Cache key conflict detected: "${cacheKey}". ` +
            `This may cause incorrect DOM reuse. Ensure unique keys for list items.`
        );
    }

    // 警告 2: 性能下降
    if (performanceDegraded) {
        console.warn(
            `[WSXJS DOM Optimization] Performance degradation detected. ` +
            `Consider using key prop for list items or reducing DOM complexity.`
        );
    }

    // 警告 3: 内存使用过高
    if (cacheSize > 10000) {
        console.warn(
            `[WSXJS DOM Optimization] Cache size is large (${cacheSize} entries). ` +
            `This may indicate a memory leak. Check component cleanup.`
        );
    }

    // 建议: 使用 key prop
    if (listWithoutKey && listLength > 10) {
        console.info(
            `[WSXJS DOM Optimization] Consider using key prop for list items ` +
            `to improve DOM reuse and maintain focus state.`
        );
    }
}
```

### 零侵入性设计

**核心原则**：框架应该自动处理所有优化，开发者无需：

- ❌ 手动配置更新策略
- ❌ 手动标记后注入元素
- ❌ 手动建立 DOM 映射
- ❌ 手动选择优化方案
- ❌ 修改现有代码

**框架自动处理**：

- ✅ 自动跟踪所有 `@state` 变化
- ✅ 自动识别 JSX 结构并建立映射
- ✅ 自动识别和保护后注入元素
- ✅ 自动选择最优更新策略
- ✅ 自动处理边界情况和错误

## 社区影响

### 生态系统

- **正面影响**：提升 WSXJS 性能，吸引更多开发者
- **兼容性**：需要确保与现有生态系统兼容

### 第三方集成

- 需要测试与常用库的兼容性
- 可能需要提供适配指南

## 技术背景（可选参考）

**说明**：WSXJS 是原创框架，此优化方案基于 WSXJS 的核心理念和实际需求设计。以下内容仅作为技术背景参考，不构成设计依据。

### 相关技术概念

在 Web 开发领域，存在一些与 DOM 优化相关的通用概念：

1. **直接 DOM 操作**：不通过虚拟 DOM 抽象层，直接操作真实 DOM
2. **编译时优化**：在编译阶段进行代码分析和优化
3. **细粒度更新**：只更新实际变化的部分，而不是重建整个树

**WSXJS 的原创设计**：
- 基于 WSXJS 的 Web Components 架构
- 结合编译时位置 ID 注入和运行时智能缓存
- 完全零侵入，对开发者透明

## 附录

### 参考资料

1. [Web Components 性能优化最佳实践](https://web.dev/custom-elements-best-practices/)
2. [DOM API 性能优化指南](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Performance)

### 讨论记录

[待补充]

---

*此 RFC 旨在讨论 WSXJS 框架的原创 DOM 优化方案，通过智能缓存和细粒度更新机制提升性能和用户体验。欢迎社区反馈和建议。*

