# RFC-0016: 组件库构建指南

- **RFC编号**: 0016
- **开始日期**: 2025-12-14
- **状态**: Implemented
- **作者**: WSX Team

## 摘要

本文档提供 WSX Framework 组件库的标准构建指南，解决 CSS 内联问题，确保组件样式能够正确注入到 Shadow DOM 中，实现组件的完全封装和独立性。

## 动机

### 问题背景

在构建 WSX 组件库时，我们遇到了一个关键问题：**CSS 被输出到单独的 `index.css` 文件，而不是内联到 JS 中**。这导致：

1. 组件无法在 Shadow DOM 中正确显示样式
2. 用户需要手动引入 CSS 文件
3. 破坏了组件的封装性和独立性

### 为什么需要这个指南？

组件库开发者需要：
- 了解如何正确配置构建工具
- 确保 CSS 能够内联到 JS 中
- 实现组件的完全封装
- 提供标准的构建流程

### 目标用户

- 构建 WSX 组件库的开发者
- 需要发布可复用组件的团队
- 希望创建组件生态系统的贡献者

## 详细设计

### 核心问题

**问题**: tsup 默认将 CSS 提取到单独文件  
**解决**: 使用 Vite 构建，配置 `cssCodeSplit: false`

### 解决方案

#### 1. 使用 Vite 替代 tsup

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { wsx } from '@wsxjs/wsx-vite-plugin';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'WSXBaseComponents',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['@wsxjs/wsx-core'],
      output: {
        globals: {
          '@wsxjs/wsx-core': 'WSXCore',
        },
      },
    },
    cssCodeSplit: false, // 关键配置：禁用CSS代码分割
  },
  plugins: [
    wsx({
      debug: false,
      jsxFactory: 'jsx',
      jsxFragment: 'Fragment',
    }),
  ],
});
```

#### 2. 关键配置说明

##### CSS 内联配置
```typescript
cssCodeSplit: false  // 禁用CSS代码分割，确保CSS内联到JS中
```

##### 外部依赖配置
```typescript
external: ['@wsxjs/wsx-core']  // 避免重复打包核心库
```

##### 输出格式配置
```typescript
formats: ['es', 'cjs']  // 同时输出ESM和CJS格式
```

#### 3. Package.json 配置

```json
{
  "name": "@your-org/your-component-lib",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": [
    "dist",
    "src"
  ],
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch"
  },
  "dependencies": {
    "@wsxjs/wsx-core": "^0.0.5"
  },
  "devDependencies": {
    "@wsxjs/vite-plugin": "^0.0.5",
    "vite": "^5.4.19",
    "typescript": "^5.0.0"
  }
}
```

### 构建结果

#### 成功构建输出
```
dist/
├── index.js      # ESM 格式，CSS 内联到 JS 中
└── index.cjs     # CJS 格式，CSS 内联到 JS 中
```

#### CSS 内联效果
构建后的 JS 文件中，CSS 被压缩并内联为字符串：

```javascript
const le = ':host{position:relative;display:inline-flex;...}';
```

## 组件开发规范

### 1. CSS 导入方式

```typescript
import styles from './Component.css?inline';
```

**注意**: 使用 `?inline` 后缀确保 CSS 被内联处理。

### 2. 组件导出方式

```typescript
@autoRegister({ tagName: 'component-name' })
export default class ComponentName extends WebComponent {
  constructor() {
    super({
      styles,
      styleName: 'component-name',
    });
  }
}
```

### 3. 文件结构

```
src/
├── Component.wsx      # 组件实现
├── Component.css      # 组件样式
└── index.ts          # 导出文件
```

## 最佳实践

### 1. 组件设计原则

- **独立性**: 每个组件应该是完全独立的，不依赖外部样式
- **封装性**: 利用 Shadow DOM 实现样式隔离
- **可复用性**: 组件应该易于在不同项目中复用

### 2. 样式管理

- **CSS 内联**: 所有样式必须内联到 JS 中
- **CSS 变量**: 使用 CSS 变量实现主题定制
- **响应式设计**: 支持移动端和桌面端

### 3. 类型安全

- **TypeScript**: 提供完整的类型定义
- **接口设计**: 定义清晰的组件接口
- **文档完善**: 提供详细的使用文档

### 4. 测试策略

- **单元测试**: 测试组件的基本功能
- **集成测试**: 测试组件在不同环境中的表现
- **视觉测试**: 确保样式在不同浏览器中一致

## 常见问题解决

### 1. CSS 未内联

**问题**: CSS 仍然输出到单独文件  
**解决**: 检查 `cssCodeSplit: false` 配置

### 2. 组件未注册

**问题**: 组件无法在 HTML 中使用  
**解决**: 确保使用 `@autoRegister` 装饰器

### 3. 样式不生效

**问题**: Shadow DOM 中样式不显示  
**解决**: 确保 CSS 正确内联，检查 `styles` 参数

### 4. 构建失败

**问题**: 构建过程中出现错误  
**解决**: 检查组件导出方式，确保所有依赖正确配置

## 与WSX理念的契合度

### 符合核心原则

- ✅ **JSX语法糖**: 组件使用 JSX 编写，保持一致的开发体验
- ✅ **信任浏览器**: 利用 Shadow DOM 原生能力实现样式隔离
- ✅ **零运行时开销**: CSS 在构建时内联，运行时无额外开销
- ✅ **Web标准**: 基于 Web Components 标准，不引入专有抽象

### 理念契合说明

组件库构建指南完全符合 WSX 的核心理念：
- 使用标准构建工具（Vite），不引入专有工具
- 保持组件独立性，符合 Web Components 标准
- 提供清晰的开发规范，确保组件质量

## 权衡取舍

### 优势

- ✅ **完全封装**: CSS 内联确保组件完全独立
- ✅ **易于使用**: 用户只需引入 JS 文件，无需额外 CSS
- ✅ **标准构建**: 使用 Vite 标准配置，易于理解和维护
- ✅ **类型安全**: 完整的 TypeScript 支持

### 劣势

- ⚠️ **构建工具限制**: 必须使用 Vite，不能使用 tsup
- ⚠️ **CSS 大小**: 所有 CSS 都会打包到 JS 中，可能增加文件大小

### 替代方案

考虑过的其他方案：
1. **CSS 单独文件**: 但破坏了组件封装性
2. **运行时 CSS 注入**: 但增加了运行时开销
3. **PostCSS 插件**: 但增加了构建复杂度

最终选择 Vite + CSS 内联方案，因为它：
- 保持组件完全封装
- 使用标准工具和配置
- 无运行时开销
- 易于理解和维护

## 实现状态

- ✅ Vite 构建配置
- ✅ CSS 内联支持
- ✅ ESM 和 CJS 格式支持
- ✅ TypeScript 类型定义
- ✅ 组件开发规范
- ✅ 文档和示例

## 相关文档

- [RFC-0008: 自动样式注入](./0008-auto-style-injection.md)
- [RFC-0006: Light DOM Components](./0006-light-dom-components.md)
- [WebComponent 使用指南](../guide/WEB_COMPONENT_GUIDE.md)

## 总结

通过使用 Vite 构建工具和正确的配置，我们成功解决了 CSS 内联问题，实现了：

1. ✅ **CSS 完全内联** - 样式自动注入到 Shadow DOM
2. ✅ **组件独立性** - 无需外部 CSS 文件
3. ✅ **标准构建** - 支持 ESM 和 CJS 格式
4. ✅ **类型安全** - 完整的 TypeScript 支持
5. ✅ **社区友好** - 提供完整的构建指南

这个解决方案为 WSX 社区提供了一个标准的组件库构建方式，确保组件的可复用性和封装性。

