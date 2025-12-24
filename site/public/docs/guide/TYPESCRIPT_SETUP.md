# TypeScript 配置指南

本指南详细说明如何在项目中正确配置 TypeScript 以使用 WSXJS。

## 📋 目录

- [基本配置](#基本配置)
- [完整配置示例](#完整配置示例)
- [类型引用机制](#类型引用机制)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

## 基本配置

### 1. JSX 配置

在 `tsconfig.json` 中配置 JSX 支持：

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@wsxjs/wsx-core"
  }
}
```

**配置说明**：
- **`jsx: "react-jsx"`** - 使用新的 JSX 转换方式（React 17+ 引入）
- **`jsxImportSource: "@wsxjs/wsx-core"`** - 指定 JSX 运行时来源为 WSXJS

### 2. 类型引用配置

为了获得完整的类型支持，需要在 `compilerOptions.types` 中添加类型包：

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@wsxjs/wsx-core",
    "types": ["@wsxjs/wsx-core"]
  }
}
```

**配置说明**：
- **`types: ["@wsxjs/wsx-core"]`** - 显式引用 WSXJS 的类型定义
- TypeScript 会自动加载 `@wsxjs/wsx-core/types/index.d.ts`
- 这确保了 JSX 全局类型和组件类型正确加载

### 3. 测试库类型（可选）

如果使用 `@testing-library/jest-dom` 进行测试，也需要添加到 `types` 数组：

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@wsxjs/wsx-core",
    "types": ["@wsxjs/wsx-core", "@testing-library/jest-dom"]
  }
}
```

## 完整配置示例

### 生产项目配置

```json
{
  "compilerOptions": {
    // 输出配置
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "outDir": "./dist",

    // JSX 配置
    "jsx": "react-jsx",
    "jsxImportSource": "@wsxjs/wsx-core",

    // 类型引用
    "types": ["@wsxjs/wsx-core"],

    // 模块解析
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,

    // 严格模式
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    // 其他
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 测试环境配置

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@wsxjs/wsx-core",
    "types": [
      "@wsxjs/wsx-core",
      "@testing-library/jest-dom",
      "vitest/globals"
    ]
  },
  "include": [
    "src/**/*",
    "src/**/*.test.ts"
  ]
}
```

### Monorepo 工作区配置

在 monorepo 中，避免使用相对路径引用类型文件：

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@wsxjs/wsx-core",
    "types": ["@wsxjs/wsx-core"]
  },
  "include": [
    "src/**/*",
    "src/**/*.wsx"
  ]
}
```

**❌ 不要这样做**：
```json
{
  "include": [
    "src/**/*",
    "../core/types/**/*.d.ts"  // ❌ 避免相对路径
  ]
}
```

**✅ 正确做法**：
- 依赖 `compilerOptions.types` 配置
- 让 TypeScript 通过 `node_modules` 自动解析类型
- 这样配置在 monorepo 内部和外部项目中都能正常工作

## 类型引用机制

### TypeScript 如何加载类型

当你在 `compilerOptions.types` 中配置 `@wsxjs/wsx-core` 时：

1. TypeScript 查找 `node_modules/@wsxjs/wsx-core/package.json`
2. 读取 `types` 字段的值：`"./types/index.d.ts"`
3. 加载对应的类型定义文件
4. 这个过程在 monorepo（通过 workspace 链接）和外部项目中都有效

### 类型定义文件层次

```
@wsxjs/wsx-core/
├── package.json
│   └── "types": "./types/index.d.ts"
├── types/
│   ├── index.d.ts          # 主入口，导入所有类型
│   ├── wsx-types.d.ts      # JSX 全局类型定义
│   ├── global.d.ts         # 全局类型扩展
│   └── css-inline.d.ts     # CSS 模块声明
└── src/
    └── ...
```

`types/index.d.ts` 内容示例：
```typescript
// 导入所有类型定义
import "./css-inline.d.ts";
import "./wsx-types";
import "./global.d.ts";

// 重新导出 JSX 工厂函数和类型
export { h, Fragment } from "./wsx-types";
export type { JSXChildren } from "../src/jsx-factory";

// 导出其他核心类型...
```

### 为什么不需要三斜线指令

**❌ 不推荐的做法**（使用三斜线指令）：
```typescript
// global.d.ts
/// <reference types="@wsxjs/wsx-core/types/wsx-types" />
/// <reference types="@testing-library/jest-dom" />
```

**✅ 推荐的做法**（使用 tsconfig.json）：
```json
{
  "compilerOptions": {
    "types": ["@wsxjs/wsx-core", "@testing-library/jest-dom"]
  }
}
```

**原因**：
1. **集中管理**：所有类型配置在 `tsconfig.json` 中，易于维护
2. **标准化**：符合 TypeScript 官方推荐的方式
3. **避免冗余**：不需要在多个文件中重复声明
4. **更好的 IDE 支持**：IDE 能更好地理解和解析配置

## 最佳实践

### 1. 使用标准的 TypeScript 类型解析

**✅ 推荐**：
```json
{
  "compilerOptions": {
    "types": ["@wsxjs/wsx-core"]
  }
}
```

**❌ 避免**：
- 三斜线指令：`/// <reference types="..." />`
- 相对路径引用：`"../core/types/**/*.d.ts"`
- 手动导入类型：`import '@wsxjs/wsx-core/types/wsx-types'`

### 2. 分离生产和测试配置

创建 `tsconfig.test.json` 用于测试环境：

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": [
      "@wsxjs/wsx-core",
      "@testing-library/jest-dom",
      "vitest/globals"
    ]
  },
  "include": [
    "src/**/*.test.ts",
    "src/**/__tests__/**/*"
  ]
}
```

### 3. 保持 global.d.ts 简洁

`global.d.ts` 应该只包含：
- 模块声明（如 CSS、图片导入）
- 项目特定的全局类型扩展

```typescript
// global.d.ts - 推荐的内容

// CSS 模块声明
declare module "*.css" {
  const styles: string;
  export default styles;
}

declare module "*.css?inline" {
  const styles: string;
  export default styles;
}

// 图片模块声明
declare module "*.png" {
  const src: string;
  export default src;
}

// 项目特定的全局类型扩展
declare global {
  namespace Vi {
    type Assertion<T = any> = jest.Matchers<void, T>;
  }
}

export {};
```

### 4. 文件包含配置

**推荐的 `include` 配置**：
```json
{
  "include": [
    "src/**/*",
    "src/**/*.wsx",
    "src/**/*.test.ts"
  ]
}
```

**避免**：
- 包含 `node_modules`
- 包含构建输出目录
- 使用 monorepo 特定的相对路径

## 常见问题

### 1. IDE 报错："This JSX tag requires 'React' to be in scope"

**解决方案**：

1. 确保 `jsxImportSource` 配置正确：
   ```json
   {
     "compilerOptions": {
       "jsx": "react-jsx",
       "jsxImportSource": "@wsxjs/wsx-core"
     }
   }
   ```

2. 在 `.wsx` 文件顶部添加 JSX pragma 注释（可选）：
   ```typescript
   /** @jsxImportSource @wsxjs/wsx-core */
   import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
   ```

3. 重启 TypeScript 语言服务器：
   - VS Code: `Cmd+Shift+P` → "TypeScript: Restart TS Server"
   - 或重启 IDE

### 2. 找不到 JSX 类型定义

**问题**：TypeScript 报错找不到 JSX 类型。

**解决方案**：

1. 确认 `@wsxjs/wsx-core` 已安装：
   ```bash
   npm list @wsxjs/wsx-core
   ```

2. 确认 `types` 配置正确：
   ```json
   {
     "compilerOptions": {
       "types": ["@wsxjs/wsx-core"]
     }
   }
   ```

3. 清理并重新安装依赖：
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### 3. 测试文件中找不到 `@testing-library/jest-dom` 类型

**问题**：测试断言方法（如 `toBeInTheDocument`）报类型错误。

**解决方案**：

1. 确认包已安装：
   ```bash
   npm install -D @testing-library/jest-dom
   ```

2. 在 `tsconfig.json` 或 `tsconfig.test.json` 中添加类型：
   ```json
   {
     "compilerOptions": {
       "types": [
         "@wsxjs/wsx-core",
         "@testing-library/jest-dom"
       ]
     }
   }
   ```

3. 不要使用三斜线指令，让 TypeScript 自动加载。

### 4. Monorepo 中类型找不到

**问题**：在 monorepo workspace 中，TypeScript 找不到包的类型。

**解决方案**：

1. 确认 workspace 链接正确：
   ```bash
   pnpm install  # 或 npm install
   ```

2. **避免**使用相对路径引用：
   ```json
   // ❌ 错误
   {
     "include": ["../core/types/**/*.d.ts"]
   }
   ```

3. **使用**标准的包引用：
   ```json
   // ✅ 正确
   {
     "compilerOptions": {
       "types": ["@wsxjs/wsx-core"]
     }
   }
   ```

4. 如果使用 pnpm，确认 `.npmrc` 配置正确：
   ```ini
   shamefully-hoist=false
   strict-peer-dependencies=false
   ```

### 5. `.wsx` 文件找不到类型声明

**问题**：导入 `.wsx` 文件时报错 "Cannot find module"。

**解决方案**：

1. 确认 `global.d.ts` 中有 `.wsx` 模块声明：
   ```typescript
   // 这个声明已经在 @wsxjs/wsx-core 中提供
   // 通常不需要手动添加
   ```

2. 确认 `include` 包含 `.wsx` 文件：
   ```json
   {
     "include": [
       "src/**/*",
       "src/**/*.wsx"
     ]
   }
   ```

3. 检查 Vite 插件配置是否正确：
   ```typescript
   // vite.config.ts
   import { wsx } from '@wsxjs/wsx-vite-plugin';

   export default defineConfig({
     plugins: [wsx()]
   });
   ```

### 6. 外部项目集成 WSXJS

**问题**：在新项目中集成 WSX，不知道如何配置。

**完整步骤**：

1. **安装依赖**：
   ```bash
   npm install @wsxjs/wsx-core
   npm install -D @wsxjs/wsx-vite-plugin typescript
   ```

2. **配置 `tsconfig.json`**：
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "ESNext",
       "lib": ["ES2020", "DOM"],
       "jsx": "react-jsx",
       "jsxImportSource": "@wsxjs/wsx-core",
       "types": ["@wsxjs/wsx-core"],
       "moduleResolution": "bundler",
       "strict": true,
       "skipLibCheck": true
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist"]
   }
   ```

3. **配置 `vite.config.ts`**：
   ```typescript
   import { defineConfig } from 'vite';
   import { wsx } from '@wsxjs/wsx-vite-plugin';

   export default defineConfig({
     plugins: [wsx()]
   });
   ```

4. **创建组件**：
   ```typescript
   // src/components/MyButton.wsx
   /** @jsxImportSource @wsxjs/wsx-core */
   import { WebComponent, autoRegister } from '@wsxjs/wsx-core';

   @autoRegister()
   export class MyButton extends WebComponent {
     render() {
       return <button>Click me</button>;
     }
   }
   ```

5. **使用组件**：
   ```html
   <!-- index.html -->
   <my-button></my-button>
   <script type="module" src="/src/main.ts"></script>
   ```

## 调试技巧

### 查看 TypeScript 解析的类型路径

```bash
# 使用 tsc 的 --showConfig 选项
npx tsc --showConfig

# 查看类型解析详情
npx tsc --traceResolution > trace.log
```

### 验证类型定义加载

在 TypeScript 文件中：

```typescript
// 测试 JSX 类型是否正确加载
const testJSX: JSX.Element = <div>Test</div>;

// 测试 WebComponent 类型是否正确加载
import { WebComponent } from '@wsxjs/wsx-core';
const testComponent: typeof WebComponent = WebComponent;
```

如果没有类型错误，说明配置正确。

## 总结

### ✅ 推荐的配置方式

1. 在 `tsconfig.json` 中配置 `jsx` 和 `jsxImportSource`
2. 在 `compilerOptions.types` 中显式引用 `@wsxjs/wsx-core`
3. 让 TypeScript 通过 `node_modules` 自动解析类型定义
4. 保持 `global.d.ts` 简洁，只放模块声明和项目特定类型
5. 避免使用三斜线指令和相对路径

### ❌ 避免的做法

1. 使用三斜线指令引用类型
2. 在 `include` 中使用 monorepo 相对路径
3. 手动导入类型定义文件
4. 在多个地方重复声明类型引用

### 📚 相关文档

- [快速开始指南](QUICK_START.md) - 5分钟上手 WSXJS
- [JSX 支持详解](JSX_SUPPORT.md) - 完整的 JSX 语法和特性
- [Vite 插件文档](../packages/vite-plugin/README.md) - Vite 集成配置
- [ESLint 插件文档](../packages/eslint-plugin/README.md) - 代码质量检查

---

**需要帮助？** 如果遇到配置问题，请查看 [常见问题](#常见问题) 章节或在 [GitHub Issues](https://github.com/wsxjs/wsxjs/issues) 提问。
