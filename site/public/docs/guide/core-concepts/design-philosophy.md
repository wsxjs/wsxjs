---
title: WSXJS 设计理念
order: 4
category: guide/core-concepts
description: "WSXJS 是一个原生优先的 Web Components 框架，致力于提供最接近原生 Web 开发的开发体验"
---

## 概述

WSXJS 是一个**原生优先**的 Web Components 框架，致力于提供最接近原生 Web 开发的开发体验，同时保持现代框架的便利性。

## 核心设计原则

### 1. 原生优先 (Native-First)

WSXJS 优先使用原生 Web 标准和 API，而不是创建抽象层。

#### 示例：class vs className

```jsx
// ✅ WSXJS - 使用原生HTML属性名
<div class="container">
  <button class="btn btn-primary">Click me</button>
</div>

// ❌ React - 使用JavaScript化的属性名
<div className="container">
  <button className="btn btn-primary">Click me</button>
</div>
```

**设计理由**：
- `class` 是标准 HTML 属性名
- 避免 JavaScript 保留字冲突
- 更符合原生 Web 开发习惯
- 减少学习成本

**兼容性**：WSX 同时支持 `class` 和 `className`，确保 React 开发者的平滑迁移。

### 2. 零依赖 (Zero Dependencies)

框架核心不依赖任何第三方库，确保：
- 更小的包体积
- 更快的加载速度
- 更好的性能
- 避免依赖冲突

### 3. 渐进增强 (Progressive Enhancement)

```jsx
// 从简单的HTML开始
<div>Hello World</div>

// 逐步添加交互
<div onClick={this.handleClick}>Click me</div>

// 最终成为完整的Web Component
class MyComponent extends WebComponent {
  render() {
    return <div onClick={this.handleClick}>Enhanced Component</div>
  }
}
```

### 4. 标准兼容 (Standards Compliant)

- 完全兼容 Web Components 标准
- 支持 Shadow DOM
- 支持 Custom Elements
- 支持 HTML Templates

## 与React的对比

| 特性 | WSXJS | React |
|------|---------------|-------|
| 属性名 | `class` | `className` |
| 事件处理 | `onClick` | `onClick` |
| 组件定义 | 原生类 | 函数组件/类组件 |
| 状态管理 | 原生属性 | useState/useReducer |
| 生命周期 | 原生生命周期 | useEffect/useLayoutEffect |
| 渲染 | 原生DOM | Virtual DOM |

## 性能优势

### 1. 无Virtual DOM

```jsx
// WSX - 直接操作DOM
render() {
  return <div class="container">Content</div>
}

// React - 通过Virtual DOM
render() {
  return <div className="container">Content</div>
}
```

### 2. 更小的运行时

- 无Virtual DOM diff算法
- 无状态管理库
- 无事件系统抽象

### 3. 原生性能

- 直接使用浏览器优化
- 无额外抽象层开销
- 更少的内存占用

## 开发体验

### 1. 熟悉的语法

```jsx
// 使用标准JSX语法
class MyButton extends WebComponent {
  render() {
    return (
      <button 
        class="btn btn-primary"
        onClick={this.handleClick}
        disabled={this.disabled}
      >
        {this.text}
      </button>
    )
  }
}
```

### 2. TypeScript支持

```typescript
interface ButtonProps {
  text: string
  disabled?: boolean
  onClick?: (event: Event) => void
}

class MyButton extends WebComponent<ButtonProps> {
  // 完整的类型安全
}
```

### 3. 工具链集成

- ESLint 插件支持
- Vite 插件支持
- 自动类型生成

## 迁移指南

### 从React迁移

1. **属性名调整**
   ```jsx
   // React
   <div className="container">
   
   // WSX
   <div class="container">
   ```

2. **组件定义**
   ```jsx
   // React
   function MyComponent(props) {
     return <div>{props.text}</div>
   }
   
   // WSX
   class MyComponent extends WebComponent {
     render() {
       return <div>{this.text}</div>
     }
   }
   ```

3. **状态管理**
   ```jsx
   // React
   const [count, setCount] = useState(0)
   
   // WSX
   class MyComponent extends WebComponent {
     count = 0
     
     increment() {
       this.count++
       this.update()
     }
   }
   ```

## 最佳实践

### 1. 使用原生属性名

```jsx
// ✅ 推荐
<div class="container" tabindex="0">
  <input type="text" autocomplete="off" />
</div>

// ❌ 避免
<div className="container" tabIndex="0">
  <input type="text" autoComplete="off" />
</div>
```

### 2. 利用原生生命周期

```jsx
class MyComponent extends WebComponent {
  connectedCallback() {
    // 组件挂载时
  }
  
  disconnectedCallback() {
    // 组件卸载时
  }
  
  attributeChangedCallback() {
    // 属性变化时
  }
}
```

### 3. 使用Shadow DOM

```jsx
class MyComponent extends WebComponent {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }
  
  render() {
    return <div class="isolated-component">Content</div>
  }
}
```

## 总结

WSXJS 的设计理念是**回归原生，拥抱标准**。通过使用原生 Web 技术，我们获得了：

- **更好的性能** - 无抽象层开销
- **更小的体积** - 零依赖
- **更好的兼容性** - 标准Web API
- **更简单的学习曲线** - 原生概念

同时，我们保持了现代框架的便利性，让开发者能够高效地构建高质量的 Web Components。 
