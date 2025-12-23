# LightComponent 使用指南

## 概述

`LightComponent` 是 WSXJS 提供的轻量级自定义元素基类，专为需要与第三方库集成或使用 Light DOM 的场景设计。它直接继承 `HTMLElement`，不使用 Shadow DOM，同时提供了完整的响应式状态管理和 JSX 支持。

## 为什么使用 LightComponent？

### 适用场景

1. **第三方库集成**
   - 需要与 EditorJS、Chart.js 等库集成
   - 库需要直接访问 DOM 元素
   - 库使用 `document.querySelector` 查找元素

2. **路由和布局组件**
   - 容器组件需要全局 DOM 访问
   - 需要事件冒泡到文档级别
   - 需要与外部样式系统集成

3. **简单组件**
   - 不需要样式隔离的简单组件
   - 需要更轻量级的实现

### 不适用场景

- 需要样式隔离的 UI 组件（使用 `WebComponent`）

## 快速开始

### 基础用法

**方式 1: 自动 CSS 注入（推荐）**

如果组件文件 `MyComponent.wsx` 存在对应的 `MyComponent.css` 文件，Babel 插件会自动注入 CSS，无需手动导入：

```tsx
import { LightComponent, autoRegister } from '@wsxjs/wsx-core';
// CSS 自动注入：如果 MyComponent.css 存在，会自动导入并注入为 _autoStyles

@autoRegister()
export class MyComponent extends LightComponent {
  constructor() {
    super({
      styleName: 'my-component', // 只需要指定 styleName
    });
  }

  render() {
    return (
      <div class="my-component">
        <h1>Hello LightComponent!</h1>
      </div>
    );
  }
}
```

**方式 2: 手动导入 CSS（可选）**

如果需要手动控制，也可以显式导入：

```tsx
import { LightComponent, autoRegister } from '@wsxjs/wsx-core';
import styles from './MyComponent.css?inline';

@autoRegister()
export class MyComponent extends LightComponent {
  constructor() {
    super({
      styles,
      styleName: 'my-component',
    });
  }

  render() {
    return (
      <div class="my-component">
        <h1>Hello LightComponent!</h1>
      </div>
    );
  }
}
```

**注意**：如果手动导入了 CSS，Babel 插件会检测到并跳过自动注入，避免重复。

### 使用响应式状态

`LightComponent` 完全支持响应式状态管理，提供了三种方式：

#### 方式 1: 使用 @state 装饰器（推荐）

使用 `@state` 装饰器是最简洁的方式，Babel 插件会在编译时自动处理：

```tsx
import { LightComponent, autoRegister, state } from '@wsxjs/wsx-core';

@autoRegister()
export class Counter extends LightComponent {
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
- 📖 查看 [RFC-0013](../rfcs/0013-state-initial-value-validation.md) 了解详细说明

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
import { LightComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister()
export class Counter extends LightComponent {
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
import { LightComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister()
export class TodoList extends LightComponent {
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

### 1. JSX 支持

`LightComponent` 完全支持 JSX 语法，编译为原生 DOM 操作：

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

### 2. 响应式状态管理

`LightComponent` 支持三种响应式状态管理方式：

#### @state 装饰器（推荐）

使用 `@state` 装饰器是最简洁的方式，Babel 插件会在编译时自动处理：

```tsx
import { state } from '@wsxjs/wsx-core';

export class MyComponent extends LightComponent {
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

### 3. 生命周期钩子

```tsx
export class MyComponent extends LightComponent {
  // 组件连接到 DOM 后调用
  protected onConnected() {
    console.log('Component connected');
    // 初始化第三方库
    this.initEditor();
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

### 4. 样式管理

#### 自动 CSS 注入（推荐）

WSXJS 提供了智能 CSS 自动注入功能。如果组件文件 `MyComponent.wsx` 存在对应的 `MyComponent.css` 文件，Babel 插件会自动：

1. 自动导入 CSS 文件：`import styles from "./MyComponent.css?inline";`
2. 自动注入为类属性：`private _autoStyles = styles;`
3. 自动应用样式：基类会自动检测并使用 `_autoStyles`

**无需手动导入**：

```tsx
// MyComponent.wsx
import { LightComponent, autoRegister } from '@wsxjs/wsx-core';
// CSS 自动注入：如果 MyComponent.css 存在，会自动处理

@autoRegister()
export class MyComponent extends LightComponent {
  constructor() {
    super({
      styleName: 'my-component', // 只需要指定 styleName
    });
  }

  render() {
    return <div class="my-component">Content</div>;
  }
}
```

```css
/* MyComponent.css - 自动注入 */
.my-component {
  padding: 20px;
  background: #f5f5f5;
}
.my-component h1 {
  color: #333;
}
```

**手动导入 CSS（可选）**：

如果需要手动控制，也可以显式导入。Babel 插件会检测到手动导入并跳过自动注入：

```tsx
import { LightComponent, autoRegister } from '@wsxjs/wsx-core';
import styles from './MyComponent.css?inline'; // 手动导入

@autoRegister()
export class MyComponent extends LightComponent {
  constructor() {
    super({
      styles, // 手动传入
      styleName: 'my-component',
    });
  }

  render() {
    return <div class="my-component">Content</div>;
  }
}
```

#### 作用域样式

`LightComponent` 使用作用域样式，通过 data 属性实现样式隔离。样式会被自动注入到组件内部，并使用 `data-wsx-light-component` 属性进行作用域化。

### 5. 错误处理

`LightComponent` 内置错误处理机制：

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

### 示例 1: EditorJS 集成

```tsx
import { LightComponent, autoRegister } from '@wsxjs/wsx-core';
import EditorJS from '@editorjs/editorjs';

@autoRegister({ tagName: 'editor-demo' })
export class EditorDemo extends LightComponent {
  private editor?: EditorJS;

  protected onConnected() {
    // 在 Light DOM 中，EditorJS 可以正常访问 DOM
    this.editor = new EditorJS({
      holder: this.querySelector('#editor'),
      // EditorJS 配置
    });
  }

  protected onDisconnected() {
    // 清理 EditorJS 实例
    this.editor?.destroy();
  }

  render() {
    return (
      <div>
        <div id="editor"></div>
      </div>
    );
  }
}
```

### 示例 2: 路由容器

```tsx
import { LightComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister({ tagName: 'wsx-route' })
export class WsxRoute extends LightComponent {
  static observedAttributes = ['path', 'component'];

  private currentComponent?: HTMLElement;

  protected onAttributeChanged(name: string, _old: string, newValue: string) {
    if (name === 'path' || name === 'component') {
      this.loadComponent();
    }
  }

  private loadComponent() {
    const componentName = this.getAttribute('component');
    if (componentName) {
      // 动态加载组件
      this.currentComponent = document.createElement(componentName);
      this.rerender();
    }
  }

  render() {
    return (
      <div class="route-container">
        {this.currentComponent}
      </div>
    );
  }
}
```

### 示例 3: 响应式表单

```tsx
import { LightComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister()
export class FormComponent extends LightComponent {
  private formData = this.reactive({
    name: '',
    email: '',
    submitted: false,
  });

  handleSubmit = (e: Event) => {
    e.preventDefault();
    this.formData.submitted = true;
    console.log('Form data:', this.formData);
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={this.formData.name}
          onInput={(e) => {
            this.formData.name = (e.target as HTMLInputElement).value;
          }}
        />
        <input
          type="email"
          placeholder="Email"
          value={this.formData.email}
          onInput={(e) => {
            this.formData.email = (e.target as HTMLInputElement).value;
          }}
        />
        <button type="submit">Submit</button>
        {this.formData.submitted && (
          <p>Form submitted!</p>
        )}
      </form>
    );
  }
}
```

## 最佳实践

### 1. 样式作用域

使用唯一的 `styleName` 避免样式冲突：

```tsx
super({
  styleName: 'my-unique-component-name',
  styles: '/* your styles */',
});
```

### 2. 第三方库清理

在 `onDisconnected` 中清理第三方库资源：

```tsx
protected onDisconnected() {
  // 清理事件监听器
  this.removeEventListener('click', this.handleClick);
  
  // 清理第三方库实例
  if (this.thirdPartyInstance) {
    this.thirdPartyInstance.destroy();
  }
}
```

### 3. 响应式状态管理

合理使用响应式状态，避免过度使用：

```tsx
// ✅ 好：只对需要触发重渲染的数据使用响应式
private uiState = this.reactive({ count: 0, visible: true });
private staticConfig = { maxCount: 100 }; // 不需要响应式

// ❌ 避免：对静态数据使用响应式
private staticData = this.reactive({ apiUrl: 'https://api.example.com' });
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

## 组件对比：LightComponent vs WebComponent

### 核心区别

| 特性 | LightComponent | WebComponent |
|------|---------------|---------------|
| **继承关系** | `HTMLElement` | `HTMLElement` |
| **DOM 类型** | Light DOM | Shadow DOM |
| **样式隔离** | 作用域样式（data 属性） | 完全隔离（Shadow DOM） |
| **响应式支持** | ✅ 完整支持 | ✅ 完整支持 |
| **第三方库集成** | ✅ 完美支持 | ⚠️ 有限支持 |
| **全局 DOM 访问** | ✅ 支持 | ❌ 受限（Shadow DOM 边界） |
| **事件冒泡** | ✅ 自然冒泡 | ⚠️ 需要手动转发 |
| **焦点保持** | ❌ 不支持 | ✅ 支持 |
| **样式作用域** | 手动管理（BEM/命名规范） | 自动隔离 |
| **性能** | 更轻量 | 稍重（Shadow DOM 开销） |

### 详细对比

#### 1. DOM 渲染方式

**LightComponent:**
```tsx
// 渲染到 Light DOM（直接到组件内部）
render() {
  return <div>Content</div>; // 直接添加到 this
}
// DOM 结构: <my-component><div>Content</div></my-component>
```

**WebComponent:**
```tsx
// 渲染到 Shadow DOM
render() {
  return <div>Content</div>; // 添加到 this.shadowRoot
}
// DOM 结构: <my-component>#shadow-root<div>Content</div></my-component>
```

#### 2. 样式处理

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

**WebComponent:**
```tsx
// 使用 Shadow DOM 自动隔离
super({
  styles: 'div { color: red; }', // 自动隔离，不会影响外部
});
// 样式完全隔离，不会影响外部样式
```

#### 3. 第三方库集成

**LightComponent:**
```tsx
// ✅ EditorJS 可以正常工作
protected onConnected() {
  this.editor = new EditorJS({
    holder: this.querySelector('#editor'), // ✅ 可以找到元素
  });
}
```

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

#### 4. 响应式 API

两者使用**完全相同的响应式 API**：

```tsx
// 两者都支持
private state = this.reactive({ count: 0 });
private [count, setCount] = this.useState('count', 0);
```

#### 5. 元素查询

**LightComponent:**
```tsx
// 直接查询，与标准 DOM 一致
this.querySelector('.item'); // 查询组件内部
document.querySelector('.item'); // 可以查询全局
```

**WebComponent:**
```tsx
// 查询 Shadow DOM
this.shadowRoot.querySelector('.item'); // 查询 Shadow DOM
// document.querySelector 无法访问 Shadow DOM 内容
```

#### 6. 事件处理

**LightComponent:**
```tsx
// 事件自然冒泡
<button onClick={this.handleClick}>Click</button>
// 事件会自然冒泡到 document
```

**WebComponent:**
```tsx
// 事件默认不冒泡到外部（Shadow DOM 边界）
<button onClick={this.handleClick}>Click</button>
// 需要手动转发事件到外部
this.dispatchEvent(new CustomEvent('click', { bubbles: true, composed: true }));
```

### 选择指南

#### 使用 LightComponent 当：

- ✅ 需要与第三方库集成（EditorJS、Chart.js 等）
- ✅ 构建路由或布局容器组件
- ✅ 需要全局 DOM 访问
- ✅ 需要事件自然冒泡
- ✅ 不需要严格的样式隔离
- ✅ 追求更轻量的实现

#### 使用 WebComponent 当：

- ✅ 构建可复用的 UI 组件（按钮、输入框等）
- ✅ 需要完全的样式隔离
- ✅ 需要焦点保持功能
- ✅ 组件需要完全封装
- ✅ 避免样式冲突是首要考虑

### 代码示例对比

#### 相同点：响应式状态

```tsx
// 两者使用相同的响应式 API
export class Counter extends LightComponent { // 或 WebComponent
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
// LightComponent - 可以访问全局 DOM
export class EditorWrapper extends LightComponent {
  protected onConnected() {
    // ✅ 可以访问全局 DOM
    const globalElement = document.querySelector('.global-class');
    this.editor = new EditorJS({ holder: this.querySelector('#editor') });
  }
}

// WebComponent - Shadow DOM 隔离
export class EditorWrapper extends WebComponent {
  protected onConnected() {
    // ⚠️ 只能访问 Shadow DOM 内部
    const shadowElement = this.shadowRoot.querySelector('.shadow-class');
    // document.querySelector 无法访问 Shadow DOM 内容
  }
}
```

### 总结

- **LightComponent**: 简单、轻量、适合集成，使用 Light DOM
- **WebComponent**: 封装、隔离、适合 UI 组件，使用 Shadow DOM
- **共同点**: 都支持完整的响应式状态管理（`reactive()` 和 `useState()` 方法）
- **选择原则**: 根据是否需要样式隔离和第三方库集成来决定

## 常见问题

### Q: LightComponent 支持 Shadow DOM 吗？

A: 不支持。`LightComponent` 专门设计为不使用 Shadow DOM，以便与第三方库集成。如果需要 Shadow DOM，请使用 `WebComponent`。

### Q: 样式会被全局污染吗？

A: `LightComponent` 使用作用域样式（通过 data 属性），但不如 Shadow DOM 的隔离性强。建议使用唯一的 `styleName` 和 BEM 命名规范来避免冲突。

### Q: 响应式状态会自动清理吗？

A: 是的。在 `disconnectedCallback` 中，所有响应式状态会自动清理。

### Q: 可以在 LightComponent 中使用 slot 吗？

A: 可以，但需要使用原生 slot 语法，因为 Light DOM 不支持 Shadow DOM 的 slot 机制。

```tsx
render() {
  return (
    <div>
      <slot></slot>
    </div>
  );
}
```

### Q: 如何自动注入 CSS 样式？

A: WSXJS 提供了智能 CSS 自动注入功能。如果组件文件 `MyComponent.wsx` 存在对应的 `MyComponent.css` 文件，Babel 插件会自动：

1. **自动导入 CSS**：`import styles from "./MyComponent.css?inline";`
2. **自动注入类属性**：`private _autoStyles = styles;`
3. **自动应用样式**：基类会自动检测并使用 `_autoStyles`

**使用方式**：

```tsx
// MyComponent.wsx - 无需手动导入 CSS
import { LightComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister()
export class MyComponent extends LightComponent {
  constructor() {
    super({
      styleName: 'my-component', // 只需要指定 styleName
    });
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

查看 [RFC-0013](../rfcs/0013-state-initial-value-validation.md) 了解详细说明。

## 总结

`LightComponent` 提供了一个简单而强大的方式来创建自定义元素，特别适合：

- 需要与第三方库集成的场景
- 路由和布局组件
- 不需要样式隔离的简单组件

它提供了完整的响应式状态管理、JSX 支持和生命周期钩子，让编写自定义元素变得简单而高效。

