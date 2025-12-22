# RFC-0019: 零配置初始化方案

- **RFC编号**: 0019
- **开始日期**: 2025-01-15
- **状态**: Proposed
- **作者**: WSX Team

## 摘要

本文档说明如何实现 WSX Framework 的零配置初始化，让用户只需安装依赖即可开始使用，无需手动配置 `tsconfig.json`、`vite.config.ts`、`wsx.d.ts` 和 ESLint 等文件。

## 动机

### 问题描述

当前用户使用 WSXJS 需要手动配置多个文件：

1. **TypeScript 配置** (`tsconfig.json`)：
   - 需要配置 `jsx: "react-jsx"`
   - 需要配置 `jsxImportSource: "@wsxjs/wsx-core"`
   - 需要配置 `types: ["@wsxjs/wsx-core"]`
   - 需要配置 `experimentalDecorators: true`（如果使用 `@state`）
   - 需要配置 `useDefineForClassFields: false`（如果使用 `@state`）

2. **Vite 配置** (`vite.config.ts`)：
   - 需要导入并配置 `@wsxjs/wsx-vite-plugin`

3. **类型声明文件** (`wsx.d.ts`)：
   - 需要创建 `src/types/wsx.d.ts` 文件来声明 `.wsx` 模块类型

4. **ESLint 配置** (`eslint.config.js`)：
   - 需要导入并配置 `@wsxjs/eslint-plugin-wsx`

这些配置步骤增加了用户的学习成本和上手难度。

### 目标

实现**真正的零配置**：
- 用户只需运行 `npm install @wsxjs/wsx-core @wsxjs/wsx-vite-plugin`
- 运行 `wsx init` 或自动检测并配置所有必要文件
- 无需手动创建或修改任何配置文件

## 详细设计

### 核心思路

创建一个 CLI 工具 `@wsxjs/cli`，提供 `wsx init` 命令，自动：

1. **检测项目类型**（Vite、TypeScript、ESLint）
2. **自动配置 `tsconfig.json`**
3. **自动配置 `vite.config.ts`**
4. **自动生成 `wsx.d.ts`**
5. **自动配置 ESLint**

### 方案一：CLI 工具（推荐）

#### 实现方式

创建一个独立的 CLI 包 `@wsxjs/cli`：

```bash
npm install -D @wsxjs/cli
npx wsx init
```

#### CLI 功能

1. **自动检测**：
   - 检测是否已有 `tsconfig.json`
   - 检测是否已有 `vite.config.ts`
   - 检测是否已有 `eslint.config.js`
   - 检测是否已有 `wsx.d.ts`

2. **智能合并**：
   - 如果文件已存在，智能合并配置（不覆盖用户配置）
   - 如果文件不存在，创建新文件

3. **交互式配置**：
   - 询问用户是否使用装饰器（`@state`）
   - 询问用户是否使用 ESLint
   - 询问用户是否使用 `@wsxjs/wsx-tsconfig`

#### 实现细节

**CLI 命令结构**：

```typescript
// packages/cli/src/index.ts
import { Command } from 'commander';

const program = new Command();

program
  .name('wsx')
  .description('WSXJS CLI tool')
  .version('0.0.17');

program
  .command('init')
  .description('Initialize WSXJS in your project')
  .option('--skip-tsconfig', 'Skip TypeScript configuration')
  .option('--skip-vite', 'Skip Vite configuration')
  .option('--skip-eslint', 'Skip ESLint configuration')
  .option('--skip-types', 'Skip wsx.d.ts generation')
  .option('--use-tsconfig-package', 'Use @wsxjs/wsx-tsconfig package')
  .action(async (options) => {
    await initWSX(options);
  });

program.parse();
```

**自动配置逻辑**：

```typescript
// packages/cli/src/init.ts
export async function initWSX(options: InitOptions) {
  const projectRoot = process.cwd();
  
  // 1. 配置 TypeScript
  if (!options.skipTsconfig) {
    await configureTypeScript(projectRoot, options);
  }
  
  // 2. 配置 Vite
  if (!options.skipVite) {
    await configureVite(projectRoot, options);
  }
  
  // 3. 生成 wsx.d.ts
  if (!options.skipTypes) {
    await generateWsxTypes(projectRoot);
  }
  
  // 4. 配置 ESLint
  if (!options.skipEslint) {
    await configureESLint(projectRoot, options);
  }
}
```

### 方案二：Postinstall 脚本（备选）

#### 实现方式

在 `@wsxjs/wsx-core` 的 `package.json` 中添加 `postinstall` 脚本：

```json
{
  "scripts": {
    "postinstall": "wsx-auto-config"
  }
}
```

#### 限制

- 无法交互式询问用户
- 可能干扰用户的项目配置
- 不够灵活

**结论**：不推荐此方案，优先使用 CLI 工具。

### 配置生成逻辑

#### 1. TypeScript 配置

**如果使用 `@wsxjs/wsx-tsconfig`**：

```json
{
  "extends": "@wsxjs/wsx-tsconfig/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

**如果不使用 `@wsxjs/wsx-tsconfig`**：

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

#### 2. Vite 配置

**如果已有 `vite.config.ts`**：

```typescript
// 检测是否已导入 wsx 插件
// 如果没有，添加：
import { wsx } from '@wsxjs/wsx-vite-plugin';

export default defineConfig({
  plugins: [
    // ... 现有插件
    wsx(), // 添加 wsx 插件
  ],
});
```

**如果没有 `vite.config.ts`**：

```typescript
import { defineConfig } from 'vite';
import { wsx } from '@wsxjs/wsx-vite-plugin';

export default defineConfig({
  plugins: [wsx()],
});
```

#### 3. wsx.d.ts 生成

自动在 `src/types/wsx.d.ts` 创建：

```typescript
declare module "*.wsx" {
  import { WebComponent, LightComponent } from "@wsxjs/wsx-core";
  const Component: new (...args: unknown[]) => WebComponent | LightComponent;
  export default Component;
}
```

#### 4. ESLint 配置

**如果使用 Flat Config**：

```javascript
import wsxPlugin from '@wsxjs/eslint-plugin-wsx';

export default [
  {
    files: ['**/*.{ts,tsx,js,jsx,wsx}'],
    plugins: { wsx: wsxPlugin },
    rules: {
      'wsx/no-react-imports': 'error',
      'wsx/render-method-required': 'error',
      'wsx/state-requires-initial-value': 'error',
    },
  },
];
```

**如果使用 Legacy Config**：

```javascript
module.exports = {
  plugins: ['@wsxjs/wsx'],
  rules: {
    '@wsxjs/wsx/no-react-imports': 'error',
    '@wsxjs/wsx/render-method-required': 'error',
    '@wsxjs/wsx/state-requires-initial-value': 'error',
  },
};
```

## 实施计划

### 阶段 1：创建 CLI 包

1. 创建 `packages/cli` 目录
2. 实现基础 CLI 框架（使用 `commander`）
3. 实现 `init` 命令的基础结构

### 阶段 2：实现配置生成

1. 实现 TypeScript 配置生成和合并
2. 实现 Vite 配置生成和合并
3. 实现 `wsx.d.ts` 自动生成
4. 实现 ESLint 配置生成和合并

### 阶段 3：智能检测和合并

1. 实现项目类型检测（Vite、TypeScript、ESLint）
2. 实现配置文件的智能合并（不覆盖用户配置）
3. 实现交互式询问（使用 `inquirer`）

### 阶段 4：测试和文档

1. 编写单元测试
2. 编写集成测试
3. 更新快速开始文档
4. 创建 CLI 使用指南

## 使用示例

### 基本使用

```bash
# 安装依赖
npm install @wsxjs/wsx-core @wsxjs/wsx-vite-plugin
npm install -D @wsxjs/cli

# 初始化配置
npx wsx init
```

### 交互式配置

```bash
$ npx wsx init

? 是否使用 @state 装饰器？ (Y/n) y
? 是否使用 @wsxjs/wsx-tsconfig？ (Y/n) y
? 是否配置 ESLint？ (Y/n) y
? 是否使用 Flat Config？ (Y/n) y

✅ TypeScript 配置已更新
✅ Vite 配置已更新
✅ wsx.d.ts 已生成
✅ ESLint 配置已更新

🎉 WSX Framework 初始化完成！
```

### 跳过某些配置

```bash
# 只配置 TypeScript 和 Vite，跳过 ESLint
npx wsx init --skip-eslint
```

## 与WSX理念的契合度

### 符合核心原则

- ✅ **开发者体验优先**：零配置，开箱即用
- ✅ **类型安全**：自动生成类型声明文件
- ✅ **最佳实践**：自动应用推荐的配置
- ✅ **灵活性**：支持跳过某些配置，支持自定义

### 优势

1. **降低学习成本**：用户无需了解所有配置细节
2. **减少错误**：自动生成正确的配置
3. **保持更新**：CLI 工具可以随框架更新而更新配置模板
4. **向后兼容**：支持智能合并，不破坏现有配置

## 风险评估

### 潜在问题

1. **配置冲突**：自动生成的配置可能与用户现有配置冲突
   - **缓解**：实现智能合并，检测冲突并提示用户

2. **版本兼容性**：CLI 工具需要支持不同版本的配置格式
   - **缓解**：使用版本检测和适配逻辑

3. **用户信任**：用户可能担心自动修改配置文件
   - **缓解**：提供 `--dry-run` 选项预览更改，提供回滚机制

### 备选方案

如果 CLI 工具实现复杂，可以先实现：
1. 提供详细的配置模板和文档
2. 提供配置生成器网页工具
3. 在文档中提供一键复制配置

## 后续优化

1. **配置验证**：`wsx validate` 命令验证配置是否正确
2. **配置更新**：`wsx update` 命令更新配置到最新版本
3. **项目模板**：`wsx create` 命令创建完整的项目模板
4. **迁移工具**：`wsx migrate` 命令帮助从其他框架迁移

## 参考

- [Vite 插件自动配置](https://vitejs.dev/guide/api-plugin.html)
- [TypeScript 配置继承](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)
- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files-new)

