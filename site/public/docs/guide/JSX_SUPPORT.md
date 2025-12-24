# WSXJS JSX 支持文档

## 概述

WSXJS 提供了完整的 JSX 支持，无需依赖 React 或其他框架。通过框架级的配置，任何使用 WSX 的项目都能获得开箱即用的 JSX 体验。

## 核心特性

- ✅ **零 React 依赖**：完全独立的 JSX 实现
- ✅ **框架级支持**：无需消费者项目额外配置
- ✅ **TypeScript 原生支持**：符合 TypeScript 标准机制
- ✅ **IDE 友好**：完整的类型提示和错误检查
- ✅ **Web Components 集成**：完美配合自定义元素

## 技术架构

### JSX 工厂函数

WSXJS 使用纯原生的 JSX 工厂函数：

```typescript
// JSX 工厂函数
export function h(
    tag: string | ((...args: unknown[]) => HTMLElement),
    props?: Record<string, unknown> | null,
    ...children: JSXChildren[]
): HTMLElement

// JSX Fragment
export function Fragment(_props: unknown, children: JSXChildren[]): DocumentFragment
```

### 类型系统

框架提供了完整的 TypeScript 类型支持：

```typescript
// 全局 JSX 命名空间
declare global {
    namespace JSX {
        interface IntrinsicElements {
            div: any;
            button: any;
            a: any;
            span: any;
            input: any;
            p: any;
            h1: any;
            h2: any;
            h3: any;
            ul: any;
            li: any;
            section: any;
            slot: any;
            // 支持任意 HTML 元素
            [elemName: string]: any;
        }
    }
}
```

## 配置指南

### 1. TypeScript 配置

在项目的 `tsconfig.json` 中添加以下配置：

```json
{
    "compilerOptions": {
        "jsx": "react-jsx",
        "jsxImportSource": "@wsxjs/wsx-core/jsx"
    }
}
```

### 2. Vite 配置

WSXJS 提供了专门的 Vite 插件：

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { wsx } from '@wsxjs/wsx-vite-plugin';

export default defineConfig({
    plugins: [
        wsx({
            jsxFactory: 'h',
            jsxFragment: 'Fragment',
            debug: false
        })
    ]
});
```

### 3. ESLint 配置

使用 WSX 专用的 ESLint 插件：

```javascript
// eslint.config.js
import wsxPlugin from '@wsxjs/eslint-plugin-wsx';

export default [
    {
        files: ['**/*.{ts,tsx,js,jsx,wsx}'],
        languageOptions: {
            parserOptions: {
                jsxPragma: 'h',
                jsxFragmentName: 'Fragment'
            }
        },
        plugins: {
            wsx: wsxPlugin
        },
        rules: {
            'wsx/no-react-imports': 'error',
            'wsx/render-method-required': 'error',
            'wsx/web-component-naming': 'warn'
        }
    }
];
```

## 使用方法

### 基本 JSX 语法

```typescript
// Button.wsx
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister({ tagName: 'wsx-button' })
export default class Button extends WebComponent {
    render(): HTMLElement {
        return (
            <div className="button-container">
                <button 
                    className="btn"
                    onClick={(e) => this.handleClick(e)}
                    ref={(el) => this.buttonRef = el}
                >
                    <slot />
                </button>
            </div>
        );
    }
}
```

### 事件处理

```typescript
render(): HTMLElement {
    return (
        <button
            onClick={(event: Event) => this.handleClick(event)}
            onMouseDown={(event: MouseEvent) => this.handleMouseDown(event)}
            onKeyDown={(event: KeyboardEvent) => this.handleKeyDown(event)}
        >
            Click me
        </button>
    );
}
```

### 引用回调

```typescript
render(): HTMLElement {
    return (
        <div>
            <input 
                ref={(el: HTMLInputElement) => this.inputRef = el}
                type="text"
            />
            <button 
                ref={(el: HTMLButtonElement) => this.buttonRef = el}
            >
                Submit
            </button>
        </div>
    );
}
```

### 条件渲染

```typescript
render(): HTMLElement {
    const { loading, disabled } = this;
    
    return (
        <div className="container">
            {loading && <div className="loading">Loading...</div>}
            {!loading && (
                <button disabled={disabled}>
                    <slot />
                </button>
            )}
        </div>
    );
}
```

### 列表渲染

```typescript
render(): HTMLElement {
    const items = ['Item 1', 'Item 2', 'Item 3'];
    
    return (
        <ul className="list">
            {items.map((item, index) => (
                <li key={index} className="list-item">
                    {item}
                </li>
            ))}
        </ul>
    );
}
```

## 框架内部实现

### JSX 入口点

WSXJS 创建了专门的 JSX 入口点：

```typescript
// packages/core/src/jsx.ts
declare global {
    namespace JSX {
        interface IntrinsicElements {
            // HTML 元素类型定义
        }
    }
}

export { h, Fragment } from './jsx-factory';
```

### 包导出配置

```json
// packages/core/package.json
{
    "exports": {
        ".": {
            "types": "types/index.d.ts",
            "import": "./dist/index.mjs",
            "require": "./dist/index.js"
        },
        "./jsx": {
            "types": "types/jsx.d.ts",
            "import": "./dist/jsx.mjs",
            "require": "./dist/jsx.js"
        }
    }
}
```

## 最佳实践

### 1. 类型安全

```typescript
// 使用具体的类型而不是 any
render(): HTMLElement {
    return (
        <button
            ref={(el: HTMLButtonElement) => this.buttonRef = el}
            onClick={(e: MouseEvent) => this.handleClick(e)}
        >
            Click me
        </button>
    );
}
```

### 2. 事件处理

```typescript
// 使用箭头函数绑定 this
private handleClick = (event: MouseEvent): void => {
    console.log('Button clicked', event);
};
```

### 3. 组件组合

```typescript
// 使用 slot 进行组件组合
render(): HTMLElement {
    return (
        <div className="card">
            <header className="card-header">
                <slot name="header" />
            </header>
            <main className="card-body">
                <slot />
            </main>
            <footer className="card-footer">
                <slot name="footer" />
            </footer>
        </div>
    );
}
```

## 故障排除

### 常见问题

1. **"React in scope" 错误**
   - 确保 `jsxImportSource` 配置正确
   - 重启 TypeScript 语言服务器
   - 检查包是否正确安装

2. **类型错误**
   - 确保使用正确的类型注解
   - 检查 JSX 命名空间是否正确加载

3. **构建错误**
   - 确保 Vite 插件配置正确
   - 检查文件扩展名是否为 `.wsx`

### 调试技巧

```typescript
// 启用 Vite 插件调试
wsx({
    debug: true,
    jsxFactory: 'h',
    jsxFragment: 'Fragment'
})
```

## 迁移指南

### 从 React 迁移

1. 移除 React 导入
2. 将 `jsxImportSource` 改为 `"@wsxjs/wsx-core/jsx"`
3. 使用 WSX 的 `h` 和 `Fragment` 函数
4. 更新事件处理器类型

### 从其他框架迁移

1. 配置 TypeScript JSX 设置
2. 安装 WSX 相关包
3. 配置构建工具
4. 更新组件语法

## 总结

WSXJS 的 JSX 支持提供了：

- **零配置体验**：开箱即用的 JSX 支持
- **类型安全**：完整的 TypeScript 类型系统
- **性能优化**：原生 DOM 操作，无虚拟 DOM 开销
- **Web Components 集成**：完美配合自定义元素
- **开发体验**：IDE 友好的类型提示和错误检查

通过框架级的实现，开发者可以专注于业务逻辑，而不用担心 JSX 配置的复杂性。 
