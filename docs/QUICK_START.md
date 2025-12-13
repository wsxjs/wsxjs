# WSX Framework 快速开始指南

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

> 💡 **提示**：查看 [TypeScript 配置指南](TYPESCRIPT_SETUP.md) 了解完整的配置说明、最佳实践和常见问题解决方案。

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
      'wsx/render-method-required': 'error'
    }
  }
];
```

## 创建组件

```typescript
// MyButton.wsx
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
import styles from './MyButton.css?inline';

@autoRegister('my-button')
export class MyButton extends WebComponent {
  constructor() {
    super({ styles });
  }

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

查看 [JSX 支持文档](JSX_SUPPORT.md) 了解更多高级用法。 
