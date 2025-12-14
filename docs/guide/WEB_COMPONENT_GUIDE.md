# WebComponent 使用指南

## 概述

`WebComponent` 是 WSX Framework 提供的标准自定义元素基类，使用 Shadow DOM 提供完全的样式隔离和封装。它是构建可复用 UI 组件的首选，特别适合需要样式隔离和完全封装的场景。

## 为什么使用 WebComponent？

### 适用场景

1. **可复用 UI 组件**
   - 按钮、输入框、卡片等通用组件
   - 需要完全样式隔离的组件
   - 组件库开发

2. **样式隔离需求**
   - 避免样式冲突
   - 需要完全封装的组件
   - 组件样式不应影响外部

3. **焦点保持功能**
   - 表单输入组件
   - 需要保持用户输入焦点的场景
   - 动态内容更新时保持交互状态

4. **完全封装**
   - 组件内部实现细节需要隐藏
   - 防止外部样式和脚本干扰
   - 提供稳定的组件 API

### 不适用场景

- 需要与第三方库集成（EditorJS、Chart.js 等）→ 使用 `LightComponent`
- 需要全局 DOM 访问 → 使用 `LightComponent`
- 需要事件自然冒泡到文档级别 → 使用 `LightComponent`

## 快速开始

### 基础用法

**方式 1: 自动 CSS 注入（推荐）**

如果组件文件 `MyButton.wsx` 存在对应的 `MyButton.css` 文件，Babel 插件会自动注入 CSS，无需手动导入：

```tsx
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
// CSS 自动注入：如果 MyButton.css 存在，会自动导入并注入为 _autoStyles

@autoRegister('my-button')
export class MyButton extends WebComponent {
  // 无需 constructor，样式会自动应用
  // 或者只需要指定 styleName（如果需要）
  constructor() {
    super({ styleName: 'my-button' });
  }

  render() {
    return (
      <button class="btn">
        <slot />
      </button>
    );
  }
}
```

**方式 2: 手动导入 CSS（可选）**

如果需要手动控制，也可以显式导入：

```tsx
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
import styles from './MyButton.css?inline';

@autoRegister('my-button')
export class MyButton extends WebComponent {
  constructor() {
    super({ styles });
  }

  render() {
    return (
      <button class="btn">
        <slot />
      </button>
    );
  }
}
```

**注意**：如果手动导入了 CSS，Babel 插件会检测到并跳过自动注入，避免重复。

### 使用响应式状态

`WebComponent` 完全支持响应式状态管理，提供了三种方式：

#### 方式 1: 使用 @state 装饰器（推荐）

使用 `@state` 装饰器是最简洁的方式，Babel 插件会在编译时自动处理：

```tsx
import { WebComponent, autoRegister, state } from '@wsxjs/wsx-core';

@autoRegister('wsx-counter')
export class Counter extends WebComponent {
  constructor() {
    super({ styles });
  }

  // ✅ 使用 @state 装饰器（必须有初始值）
  @state private count = 0;
  @state private name = "";
  @state private user = { name: "John", age: 30 };
  @state private items: string[] = [];

  render() {
    return (
      <div>
        <p>Count: {this.count}</p>
        <p>Name: {this.name}</p>
        <p>User: {this.user.name}</p>
        <p>Items: {this.items.length}</p>
        <button onClick={() => this.count++}>
          Increment
        </button>
      </div>
    );
  }
}
```

**重要提示**：
- ⚠️ `@state` 装饰器的属性**必须有初始值**
- ✅ ESLint 规则 `wsx/state-requires-initial-value` 会在开发时检查
- ✅ Babel 插件会在构建时验证，缺少初始值会导致构建失败
- 📖 查看 [RFC-0013](./rfcs/0013-state-initial-value-validation.md) 了解详细说明

**有效示例**：
```tsx
@state private count = 0;           // ✅ 数字
@state private name = "";           // ✅ 字符串
@state private enabled = false;     // ✅ 布尔值
@state private user = {};           // ✅ 对象
@state private items = [];          // ✅ 数组
@state private optional: string | undefined = undefined; // ✅ 可选类型（显式 undefined）
```

**无效示例**（会被 ESLint 和 Babel 检测）：
```tsx
@state private count;               // ❌ 缺少初始值
@state private name;                 // ❌ 缺少初始值
@state private user;                 // ❌ 缺少初始值
```

#### 方式 2: 使用 reactive() 方法

```tsx
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister('wsx-counter')
export class Counter extends WebComponent {
  constructor() {
    super({ styles });
  }

  // 使用 reactive() 创建响应式对象
  private state = this.reactive({ count: 0 });

  render() {
    return (
      <div>
        <p>Count: {this.state.count}</p>
        <button onClick={() => this.state.count++}>
          Increment
        </button>
      </div>
    );
  }
}
```

#### 方式 3: 使用 useState Hook

```tsx
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister('wsx-todo-list')
export class TodoList extends WebComponent {
  constructor() {
    super({ styles });
  }

  // 使用 useState 创建响应式状态
  private [todos, setTodos] = this.useState('todos', []);

  addTodo(text: string) {
    setTodos([...todos(), { id: Date.now(), text }]);
  }

  render() {
    return (
      <div>
        <ul>
          {todos().map(todo => (
            <li key={todo.id}>{todo.text}</li>
          ))}
        </ul>
      </div>
    );
  }
}
```

## 核心特性

### 1. Shadow DOM 样式隔离

`WebComponent` 使用 Shadow DOM 提供完全的样式隔离。

#### 自动 CSS 注入（推荐）

WSX Framework 提供了智能 CSS 自动注入功能。如果组件文件 `MyButton.wsx` 存在对应的 `MyButton.css` 文件，Babel 插件会自动：

1. 自动导入 CSS 文件：`import styles from "./MyButton.css?inline";`
2. 自动注入为类属性：`private _autoStyles = styles;`
3. 自动应用样式：基类会自动检测并使用 `_autoStyles`

**无需手动导入**：

```tsx
// MyButton.wsx
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
// CSS 自动注入：如果 MyButton.css 存在，会自动处理

@autoRegister('my-button')
export class MyButton extends WebComponent {
  // 无需 constructor，或者只需要指定 styleName
  constructor() {
    super({ styleName: 'my-button' });
  }

  render() {
    return <button class="btn">Click me</button>;
  }
}
```

```css
/* MyButton.css - 自动注入 */
.btn {
  padding: 10px 20px;
  background: blue;
  color: white;
}
```

**手动导入 CSS（可选）**：

如果需要手动控制，也可以显式导入。Babel 插件会检测到手动导入并跳过自动注入：

```tsx
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
import styles from './MyButton.css?inline'; // 手动导入

@autoRegister('my-button')
export class MyButton extends WebComponent {
  constructor() {
    super({ styles }); // 手动传入
  }

  render() {
    return <button class="btn">Click me</button>;
  }
}
```

**优势**：
- ✅ 样式完全隔离，不会影响外部
- ✅ 外部样式不会影响组件内部
- ✅ 使用 Constructable StyleSheets 提升性能
- ✅ 自动 CSS 注入减少样板代码
- ✅ 统一的文件命名约定（`Component.wsx` → `Component.css`）

### 2. JSX 支持

`WebComponent` 完全支持 JSX 语法，编译为原生 DOM 操作：

```tsx
render() {
  return (
    <div class="container">
      <h1>Title</h1>
      <p>Content</p>
      <button onClick={this.handleClick}>Click me</button>
    </div>
  );
}
```

### 3. 响应式状态管理

#### @state 装饰器（推荐）

使用 `@state` 装饰器是最简洁的方式，Babel 插件会在编译时自动处理：

```tsx
import { state } from '@wsxjs/wsx-core';

export class MyComponent extends WebComponent {
  // Primitive 类型：使用 useState
  @state private count = 0;
  @state private name = "";
  
  // Object/Array 类型：使用 reactive
  @state private user = { name: "John", age: 30 };
  @state private items: string[] = [];
  
  render() {
    // 直接使用，无需 this.state.xxx
    return <div>{this.count} - {this.name}</div>;
  }
}
```

**关键要求**：
- ⚠️ **必须有初始值**：`@state` 装饰器的属性必须提供初始值
- ✅ **自动类型判断**：Babel 插件根据初始值自动选择 `useState`（primitive）或 `reactive`（object/array）
- ✅ **编译时验证**：缺少初始值会导致构建失败
- ✅ **开发时检查**：ESLint 规则会在编辑器中实时提示

**为什么需要初始值？**
1. Babel 插件需要初始值来判断属性类型（primitive vs object/array）
2. 需要从 AST 中提取初始值，生成构造函数中的初始化代码
3. 确保状态有明确的类型，避免运行时错误

#### reactive() 方法

创建响应式对象，属性变化时自动触发重渲染：

```tsx
private state = this.reactive({ 
  count: 0,
  name: 'WSX'
});

// 修改属性会自动触发重渲染
this.state.count++;
this.state.name = 'New Name';
```

#### useState() 方法

创建单个响应式状态值：

```tsx
private [count, setCount] = this.useState('count', 0);

// 使用
count();        // 获取值
setCount(10);   // 设置值
setCount(prev => prev + 1); // 函数式更新
```

### 4. 生命周期钩子

```tsx
export class MyComponent extends WebComponent {
  // 组件连接到 DOM 后调用
  protected onConnected() {
    console.log('Component connected');
    // 初始化逻辑
    this.init();
  }

  // 组件从 DOM 断开后调用
  protected onDisconnected() {
    console.log('Component disconnected');
    // 清理资源
    this.cleanup();
  }

  // 属性变化时调用
  protected onAttributeChanged(name: string, oldValue: string, newValue: string) {
    if (name === 'data') {
      this.handleDataChange(newValue);
    }
  }
}
```

### 5. 焦点保持

`WebComponent` 支持焦点保持功能，在重新渲染时保持用户输入焦点：

```tsx
export class FormInput extends WebComponent {
  @state private value = "";

  render() {
    return (
      <input
        type="text"
        value={this.value}
        onInput={(e) => {
          this.value = (e.target as HTMLInputElement).value;
        }}
        data-wsx-key="input" // 用于焦点保持
      />
    );
  }
}
```

当 `value` 变化触发重渲染时，输入框的焦点和光标位置会自动保持。

### 6. 错误处理

`WebComponent` 内置错误处理机制：

```tsx
render() {
  try {
    return <div>{/* your content */}</div>;
  } catch (error) {
    // 错误会被自动捕获并显示友好的错误信息
    throw error;
  }
}
```

## 实际应用示例

### 示例 1: 按钮组件

```tsx
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
import styles from './Button.css?inline';

@autoRegister('wsx-button')
export class Button extends WebComponent {
  static observedAttributes = ['variant', 'disabled'];

  constructor() {
    super({ styles });
  }

  @state private clicked = false;

  protected onAttributeChanged(name: string, _old: string, newValue: string) {
    if (name === 'disabled') {
      this.rerender();
    }
  }

  private handleClick = () => {
    this.clicked = true;
    this.dispatchEvent(new CustomEvent('click', { 
      bubbles: true, 
      composed: true 
    }));
  };

  render() {
    const variant = this.getAttribute('variant') || 'primary';
    const disabled = this.hasAttribute('disabled');
    
    return (
      <button
        class={`btn btn-${variant}`}
        disabled={disabled}
        onClick={this.handleClick}
      >
        <slot />
        {this.clicked && <span> ✓</span>}
      </button>
    );
  }
}
```

### 示例 2: 表单输入组件

```tsx
import { WebComponent, autoRegister, state } from '@wsxjs/wsx-core';
import styles from './FormInput.css?inline';

@autoRegister('wsx-form-input')
export class FormInput extends WebComponent {
  static observedAttributes = ['label', 'type', 'placeholder'];

  constructor() {
    super({ styles });
  }

  @state private value = "";
  @state private focused = false;

  protected onAttributeChanged(name: string, _old: string, newValue: string) {
    if (name === 'type' || name === 'placeholder') {
      this.rerender();
    }
  }

  private handleInput = (e: Event) => {
    this.value = (e.target as HTMLInputElement).value;
  };

  private handleFocus = () => {
    this.focused = true;
  };

  private handleBlur = () => {
    this.focused = false;
  };

  render() {
    const label = this.getAttribute('label') || '';
    const type = this.getAttribute('type') || 'text';
    const placeholder = this.getAttribute('placeholder') || '';

    return (
      <div class={`form-input ${this.focused ? 'focused' : ''}`}>
        {label && <label>{label}</label>}
        <input
          type={type}
          placeholder={placeholder}
          value={this.value}
          onInput={this.handleInput}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          data-wsx-key="input"
        />
      </div>
    );
  }
}
```

### 示例 3: 卡片组件

```tsx
import { WebComponent, autoRegister, state } from '@wsxjs/wsx-core';
import styles from './Card.css?inline';

@autoRegister('wsx-card')
export class Card extends WebComponent {
  constructor() {
    super({ styles });
  }

  @state private expanded = false;

  private toggleExpand = () => {
    this.expanded = !this.expanded;
  };

  render() {
    return (
      <div class="card">
        <div class="card-header">
          <slot name="header" />
          <button onClick={this.toggleExpand}>
            {this.expanded ? '−' : '+'}
          </button>
        </div>
        {this.expanded && (
          <div class="card-body">
            <slot name="body" />
          </div>
        )}
      </div>
    );
  }
}
```

## 最佳实践

### 1. 样式隔离

利用 Shadow DOM 的样式隔离，无需担心样式冲突：

```tsx
super({
  styles: `
    /* 样式完全隔离，不会影响外部 */
    .btn {
      padding: 10px;
      background: blue;
    }
  `
});
```

### 2. 事件转发

如果需要事件冒泡到外部，使用 `composed: true`：

```tsx
private handleClick = () => {
  this.dispatchEvent(new CustomEvent('click', { 
    bubbles: true,    // 允许冒泡
    composed: true    // 允许跨越 Shadow DOM 边界
  }));
};
```

### 3. 响应式状态管理

合理使用响应式状态，避免过度使用：

```tsx
// ✅ 好：只对需要触发重渲染的数据使用响应式
@state private uiState = { count: 0, visible: true };
private staticConfig = { maxCount: 100 }; // 不需要响应式

// ❌ 避免：对静态数据使用响应式
@state private staticData = { apiUrl: 'https://api.example.com' };
```

### 4. 属性观察

使用 `observedAttributes` 观察属性变化：

```tsx
static observedAttributes = ['data', 'disabled', 'theme'];

protected onAttributeChanged(name: string, _old: string, newValue: string) {
  switch (name) {
    case 'data':
      this.handleDataChange(newValue);
      break;
    case 'disabled':
      this.updateDisabledState(newValue !== null);
      break;
  }
}
```

### 5. 焦点保持

对于表单输入组件，使用 `data-wsx-key` 属性启用焦点保持：

```tsx
<input
  data-wsx-key="input"
  value={this.value}
  onInput={(e) => {
    this.value = (e.target as HTMLInputElement).value;
  }}
/>
```

## 组件对比：WebComponent vs LightComponent

### 核心区别

| 特性 | WebComponent | LightComponent |
|------|---------------|---------------|
| **继承关系** | `HTMLElement` | `HTMLElement` |
| **DOM 类型** | Shadow DOM | Light DOM |
| **样式隔离** | 完全隔离（Shadow DOM） | 作用域样式（data 属性） |
| **响应式支持** | ✅ 完整支持 | ✅ 完整支持 |
| **第三方库集成** | ⚠️ 有限支持 | ✅ 完美支持 |
| **全局 DOM 访问** | ❌ 受限（Shadow DOM 边界） | ✅ 支持 |
| **事件冒泡** | ⚠️ 需要手动转发 | ✅ 自然冒泡 |
| **焦点保持** | ✅ 支持 | ❌ 不支持 |
| **样式作用域** | 自动隔离 | 手动管理（BEM/命名规范） |
| **性能** | 稍重（Shadow DOM 开销） | 更轻量 |

### 详细对比

#### 1. DOM 渲染方式

**WebComponent:**
```tsx
// 渲染到 Shadow DOM
render() {
  return <div>Content</div>; // 添加到 this.shadowRoot
}
// DOM 结构: <my-component>#shadow-root<div>Content</div></my-component>
```

**LightComponent:**
```tsx
// 渲染到 Light DOM（直接到组件内部）
render() {
  return <div>Content</div>; // 直接添加到 this
}
// DOM 结构: <my-component><div>Content</div></my-component>
```

#### 2. 样式处理

**WebComponent:**
```tsx
// 使用 Shadow DOM 自动隔离
super({
  styles: 'div { color: red; }', // 自动隔离，不会影响外部
});
// 样式完全隔离，不会影响外部样式
```

**LightComponent:**
```tsx
// 使用作用域样式（通过 data 属性）
super({
  styles: '.my-component { color: red; }',
  styleName: 'my-component',
});
// 样式注入为: <style data-wsx-light-component="my-component">...</style>
// 需要手动避免全局冲突
```

#### 3. 第三方库集成

**WebComponent:**
```tsx
// ⚠️ EditorJS 可能无法正常工作
protected onConnected() {
  this.editor = new EditorJS({
    holder: this.shadowRoot.querySelector('#editor'), // ⚠️ 在 Shadow DOM 中
    // 但 EditorJS 的全局查询可能失败
  });
}
```

**LightComponent:**
```tsx
// ✅ EditorJS 可以正常工作
protected onConnected() {
  this.editor = new EditorJS({
    holder: this.querySelector('#editor'), // ✅ 可以找到元素
  });
}
```

#### 4. 响应式 API

两者使用**完全相同的响应式 API**：

```tsx
// 两者都支持
@state private count = 0;
private state = this.reactive({ count: 0 });
private [count, setCount] = this.useState('count', 0);
```

#### 5. 元素查询

**WebComponent:**
```tsx
// 查询 Shadow DOM
this.shadowRoot.querySelector('.item'); // 查询 Shadow DOM
// document.querySelector 无法访问 Shadow DOM 内容
```

**LightComponent:**
```tsx
// 直接查询，与标准 DOM 一致
this.querySelector('.item'); // 查询组件内部
document.querySelector('.item'); // 可以查询全局
```

#### 6. 事件处理

**WebComponent:**
```tsx
// 事件默认不冒泡到外部（Shadow DOM 边界）
<button onClick={this.handleClick}>Click</button>
// 需要手动转发事件到外部
this.dispatchEvent(new CustomEvent('click', { bubbles: true, composed: true }));
```

**LightComponent:**
```tsx
// 事件自然冒泡
<button onClick={this.handleClick}>Click</button>
// 事件会自然冒泡到 document
```

### 选择指南

#### 使用 WebComponent 当：

- ✅ 构建可复用的 UI 组件（按钮、输入框等）
- ✅ 需要完全的样式隔离
- ✅ 需要焦点保持功能
- ✅ 组件需要完全封装
- ✅ 避免样式冲突是首要考虑

#### 使用 LightComponent 当：

- ✅ 需要与第三方库集成（EditorJS、Chart.js 等）
- ✅ 构建路由或布局容器组件
- ✅ 需要全局 DOM 访问
- ✅ 需要事件自然冒泡
- ✅ 不需要严格的样式隔离
- ✅ 追求更轻量的实现

### 代码示例对比

#### 相同点：响应式状态

```tsx
// 两者使用相同的响应式 API
export class Counter extends WebComponent { // 或 LightComponent
  // ✅ @state 装饰器必须有初始值
  @state private count = 0;
  
  render() {
    // 直接使用，无需 this.state.xxx
    return (
      <div>
        <p>Count: {this.count}</p>
        <button onClick={() => this.count++}>+</button>
      </div>
    );
  }
}
```

**注意**：`@state` 装饰器的属性必须有初始值。ESLint 规则和 Babel 插件会验证这一点。

#### 不同点：DOM 访问

```tsx
// WebComponent - Shadow DOM 隔离
export class EditorWrapper extends WebComponent {
  protected onConnected() {
    // ⚠️ 只能访问 Shadow DOM 内部
    const shadowElement = this.shadowRoot.querySelector('.shadow-class');
    // document.querySelector 无法访问 Shadow DOM 内容
  }
}

// LightComponent - 可以访问全局 DOM
export class EditorWrapper extends LightComponent {
  protected onConnected() {
    // ✅ 可以访问全局 DOM
    const globalElement = document.querySelector('.global-class');
    this.editor = new EditorJS({ holder: this.querySelector('#editor') });
  }
}
```

### 总结

- **WebComponent**: 封装、隔离、适合 UI 组件，使用 Shadow DOM
- **LightComponent**: 简单、轻量、适合集成，使用 Light DOM
- **共同点**: 都支持完整的响应式状态管理（`@state` 装饰器、`reactive()` 和 `useState()` 方法）
- **选择原则**: 根据是否需要样式隔离和第三方库集成来决定

## 常见问题

### Q: WebComponent 支持 Light DOM 吗？

A: 不支持。`WebComponent` 专门设计为使用 Shadow DOM，提供完全的样式隔离。如果需要 Light DOM，请使用 `LightComponent`。

### Q: Shadow DOM 会影响性能吗？

A: Shadow DOM 有轻微的性能开销，但通常可以忽略。对于大多数 UI 组件，Shadow DOM 带来的样式隔离和封装优势远大于性能开销。

### Q: 如何让外部样式影响 Shadow DOM？

A: 默认情况下，外部样式无法影响 Shadow DOM 内部。如果需要外部样式，可以使用 CSS 变量（CSS Custom Properties）：

```tsx
// 组件内部
super({
  styles: `
    .btn {
      background: var(--button-bg, blue);
      color: var(--button-color, white);
    }
  `
});

// 外部使用
<style>
  my-button {
    --button-bg: red;
    --button-color: yellow;
  }
</style>
```

### Q: 响应式状态会自动清理吗？

A: 是的。在 `disconnectedCallback` 中，所有响应式状态会自动清理。

### Q: 可以在 WebComponent 中使用 slot 吗？

A: 可以，Shadow DOM 完全支持 slot 机制：

```tsx
render() {
  return (
    <div>
      <slot name="header"></slot>
      <slot></slot>
      <slot name="footer"></slot>
    </div>
  );
}
```

### Q: 如何自动注入 CSS 样式？

A: WSX Framework 提供了智能 CSS 自动注入功能。如果组件文件 `MyComponent.wsx` 存在对应的 `MyComponent.css` 文件，Babel 插件会自动：

1. **自动导入 CSS**：`import styles from "./MyComponent.css?inline";`
2. **自动注入类属性**：`private _autoStyles = styles;`
3. **自动应用样式**：基类会自动检测并使用 `_autoStyles`

**使用方式**：

```tsx
// MyComponent.wsx - 无需手动导入 CSS
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister('my-component')
export class MyComponent extends WebComponent {
  // 无需 constructor，或者只需要指定 styleName
  constructor() {
    super({ styleName: 'my-component' });
  }

  render() {
    return <div class="my-component">Content</div>;
  }
}
```

```css
/* MyComponent.css - 自动注入 */
.my-component {
  padding: 1rem;
  background: white;
}
```

**注意事项**：
- ✅ 文件命名约定：`Component.wsx` → `Component.css`（必须在同一目录）
- ✅ 如果手动导入了 CSS，Babel 插件会检测到并跳过自动注入，避免重复
- ✅ 支持 WebComponent 和 LightComponent
- 📖 查看 [RFC-0008](../rfcs/0008-auto-style-injection.md) 了解详细说明

### Q: @state 装饰器为什么必须有初始值？

A: `@state` 装饰器必须有初始值，因为：

1. **类型判断**：Babel 插件需要初始值来判断属性类型（primitive vs object/array）
   - Primitive（数字、字符串、布尔值）→ 使用 `useState`
   - Object/Array → 使用 `reactive`

2. **代码生成**：Babel 插件需要从 AST 中提取初始值，生成构造函数中的初始化代码

3. **类型安全**：确保状态有明确的类型和初始值，避免运行时错误

**验证机制**：
- ✅ **ESLint 规则**：`wsx/state-requires-initial-value` 在开发时检查
- ✅ **Babel 插件**：在构建时验证，缺少初始值会导致构建失败

**有效示例**：
```tsx
@state private count = 0;           // ✅
@state private name = "";           // ✅
@state private user = {};           // ✅
@state private items = [];          // ✅
```

**无效示例**：
```tsx
@state private count;               // ❌ 缺少初始值
@state private name;                 // ❌ 缺少初始值
```

查看 [RFC-0013](./rfcs/0013-state-initial-value-validation.md) 了解详细说明。

## 总结

`WebComponent` 提供了一个强大而封装的方式来创建自定义元素，特别适合：

- 构建可复用的 UI 组件
- 需要完全样式隔离的场景
- 需要焦点保持功能的表单组件
- 组件库开发

它提供了完整的响应式状态管理、JSX 支持、生命周期钩子和焦点保持功能，让编写自定义元素变得简单而高效。

