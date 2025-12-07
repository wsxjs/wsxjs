# LightComponent 使用指南

## 概述

`LightComponent` 是 WSX Framework 提供的轻量级自定义元素基类，专为需要与第三方库集成或使用 Light DOM 的场景设计。它直接继承 `HTMLElement`，不使用 Shadow DOM，同时提供了完整的响应式状态管理和 JSX 支持。

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
- 需要完全封装的组件（使用 `ReactiveWebComponent`）

## 快速开始

### 基础用法

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

### 使用响应式状态

`LightComponent` 完全支持响应式状态管理：

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

### 使用 useState Hook

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

`LightComponent` 使用作用域样式，通过 data 属性实现样式隔离：

```tsx
export class MyComponent extends LightComponent {
  constructor() {
    super({
      styles: `
        .my-component {
          padding: 20px;
          background: #f5f5f5;
        }
        .my-component h1 {
          color: #333;
        }
      `,
      styleName: 'my-component', // 用于样式作用域
    });
  }
}
```

样式会被自动注入到组件内部，并使用 `data-wsx-light-component` 属性进行作用域化。

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

## 组件对比：LightComponent vs ReactiveWebComponent

### 核心区别

| 特性 | LightComponent | ReactiveWebComponent |
|------|---------------|---------------------|
| **继承关系** | `HTMLElement` | `WebComponent` → `HTMLElement` |
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

**ReactiveWebComponent:**
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

**ReactiveWebComponent:**
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

**ReactiveWebComponent:**
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

**ReactiveWebComponent:**
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

**ReactiveWebComponent:**
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

#### 使用 ReactiveWebComponent 当：

- ✅ 构建可复用的 UI 组件（按钮、输入框等）
- ✅ 需要完全的样式隔离
- ✅ 需要焦点保持功能
- ✅ 组件需要完全封装
- ✅ 避免样式冲突是首要考虑

### 代码示例对比

#### 相同点：响应式状态

```tsx
// 两者使用相同的响应式 API
export class Counter extends LightComponent { // 或 ReactiveWebComponent
  private state = this.reactive({ count: 0 });
  
  render() {
    return (
      <div>
        <p>Count: {this.state.count}</p>
        <button onClick={() => this.state.count++}>+</button>
      </div>
    );
  }
}
```

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

// ReactiveWebComponent - Shadow DOM 隔离
export class EditorWrapper extends ReactiveWebComponent {
  protected onConnected() {
    // ⚠️ 只能访问 Shadow DOM 内部
    const shadowElement = this.shadowRoot.querySelector('.shadow-class');
    // document.querySelector 无法访问 Shadow DOM 内容
  }
}
```

### 总结

- **LightComponent**: 简单、轻量、适合集成，使用 Light DOM
- **ReactiveWebComponent**: 封装、隔离、适合 UI 组件，使用 Shadow DOM
- **共同点**: 都支持完整的响应式状态管理
- **选择原则**: 根据是否需要样式隔离和第三方库集成来决定

## 常见问题

### Q: LightComponent 支持 Shadow DOM 吗？

A: 不支持。`LightComponent` 专门设计为不使用 Shadow DOM，以便与第三方库集成。如果需要 Shadow DOM，请使用 `WebComponent` 或 `ReactiveWebComponent`。

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

## 总结

`LightComponent` 提供了一个简单而强大的方式来创建自定义元素，特别适合：

- 需要与第三方库集成的场景
- 路由和布局组件
- 不需要样式隔离的简单组件

它提供了完整的响应式状态管理、JSX 支持和生命周期钩子，让编写自定义元素变得简单而高效。

