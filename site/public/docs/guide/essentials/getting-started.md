---
title: 快速开始
order: 1
category: guide/essentials
description: "5分钟上手 WSXJS，从安装到创建第一个组件"
---

## 安装

```bash
npm install @wsxjs/wsx-core @wsxjs/wsx-vite-plugin @wsxjs/eslint-plugin-wsx
npm install --save-dev @wsxjs/wsx-tsconfig
```

## 配置

### 1. TypeScript 配置

**推荐方式**：使用 `@wsxjs/wsx-tsconfig` 包（包含所有必需的配置）：

```json
{
  "extends": "@wsxjs/wsx-tsconfig/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

**手动配置**（如果不使用 `@wsxjs/wsx-tsconfig`）：

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@wsxjs/wsx-core",
    "types": ["@wsxjs/wsx-core"],
    "experimentalDecorators": true,
    "useDefineForClassFields": false
  }
}
```

> ⚠️ **重要**：如果使用 `@state` 装饰器，必须配置：
> - `experimentalDecorators: true` - 启用装饰器语法
> - `useDefineForClassFields: false` - 确保装饰器与类属性兼容
>
> 同时，必须在 `vite.config.ts` 中配置 `@wsxjs/wsx-vite-plugin`，该插件包含处理 `@state` 装饰器的 Babel 插件。

> 💡 **提示**：查看 [TypeScript 配置指南](./typescript-setup.md) 了解完整的配置说明、最佳实践和常见问题解决方案。

### 2. Vite 配置

在 `vite.config.ts` 中添加：

```typescript
import { defineConfig } from 'vite';
import { wsx } from '@wsxjs/wsx-vite-plugin';

export default defineConfig({
  plugins: [wsx()]
});
```

> ⚠️ **重要**：`@wsxjs/wsx-vite-plugin` 是使用 `@state` 装饰器的**必需**配置。该插件包含 Babel 插件，会在编译时处理 `@state` 装饰器。如果没有配置此插件，`@state` 装饰器将无法工作并会抛出错误。

### 3. ESLint 配置

在 `eslint.config.js` 中添加：

```javascript
import wsxPlugin from '@wsxjs/eslint-plugin-wsx';

export default [
  {
    files: ['**/*.{ts,tsx,js,jsx,wsx}'],
    plugins: { wsx: wsxPlugin },
    rules: {
      'wsx/no-react-imports': 'error',
      'wsx/render-method-required': 'error',
      'wsx/state-requires-initial-value': 'error' // ✅ 验证 @state 必须有初始值
    }
  }
];
```

> ⚠️ **重要**：`wsx/state-requires-initial-value` 规则会在开发时检查 `@state` 装饰器的属性是否有初始值。这是强制性的，因为 Babel 插件需要初始值来判断属性类型并生成正确的响应式代码。

## 创建组件

### 基础组件

**自动 CSS 注入（推荐）**：
如果存在 `MyButton.css` 文件，Babel 插件会自动注入样式，无需手动导入：

```typescript
// MyButton.wsx
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
// CSS 自动注入：如果 MyButton.css 存在，会自动导入并注入为 _autoStyles

@autoRegister('my-button')
export class MyButton extends WebComponent {
  // 无需 constructor，样式会自动应用
  render() {
    return (
      <button className="btn" onClick={(e) => this.handleClick(e)}>
        <slot />
      </button>
    );
  }

  private handleClick = (event: MouseEvent) => {
    console.log('Button clicked!');
  };
}
```

**手动导入样式（可选）**：
如果你已经手动导入了样式，Babel 插件会跳过自动注入以避免重复：

```typescript
// MyButton.wsx
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
import styles from './MyButton.css?inline'; // 手动导入

@autoRegister('my-button')
export class MyButton extends WebComponent {
  constructor() {
    super({ styles }); // 手动传递
  }
  // ...
}
```

### 使用 @state 装饰器（响应式状态）

```typescript
// Counter.wsx
import { WebComponent, autoRegister, state } from '@wsxjs/wsx-core';
// CSS 自动注入：如果 Counter.css 存在，会自动导入并注入

@autoRegister('wsx-counter')
export class Counter extends WebComponent {
  // 无需 constructor，样式会自动应用
  }

  // ✅ @state 装饰器必须有初始值
  @state private count = 0;
  @state private name = "";
  @state private user = { name: "John", age: 30 };
  @state private items: string[] = [];

  render() {
    return (
      <div>
        <p>Count: {this.count}</p>
        <p>Name: {this.name}</p>
        <button onClick={() => this.count++}>Increment</button>
        <button onClick={() => this.name = "Updated"}>Update Name</button>
      </div>
    );
  }
}
```

**重要提示**：
- ⚠️ `@state` 装饰器的属性**必须有初始值**
- ✅ ESLint 规则会在开发时检查（`wsx/state-requires-initial-value`）
- ✅ Babel 插件会在构建时验证，缺少初始值会导致构建失败
- 📖 查看 [RFC-0013](./rfcs/completed/0013-state-initial-value-validation.md) 了解详细说明

**有效示例**：
```typescript
@state private count = 0;           // ✅ 数字
@state private name = "";           // ✅ 字符串
@state private enabled = false;     // ✅ 布尔值
@state private user = {};           // ✅ 对象
@state private items = [];          // ✅ 数组
```

**无效示例**（会被 ESLint 和 Babel 检测）：
```typescript
@state private count;               // ❌ 缺少初始值
@state private name;                 // ❌ 缺少初始值
```

## 使用组件

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="./main.ts"></script>
</head>
<body>
  <my-button>Click me!</my-button>
</body>
</html>
```

## 主要特性

- ✅ **零 React 依赖**：完全独立的 JSX 实现
- ✅ **框架级支持**：无需额外配置
- ✅ **TypeScript 支持**：完整的类型安全
- ✅ **Web Components**：原生自定义元素
- ✅ **CSS 封装**：Shadow DOM 样式隔离

## 下一步

- 查看 **[WebComponent 使用指南](../core-concepts/web-components.md)** 了解 Shadow DOM 组件开发
- 查看 **[LightComponent 使用指南](../core-concepts/light-components.md)** 了解 Light DOM 组件开发
- 查看 **[JSX 支持文档](../core-concepts/jsx-support.md)** 了解更多高级用法
