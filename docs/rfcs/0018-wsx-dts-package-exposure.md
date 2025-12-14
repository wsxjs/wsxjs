# RFC-0018: 统一在 wsx-core 中暴露 wsx.d.ts 类型定义

- **RFC编号**: 0018
- **开始日期**: 2025-01-15
- **状态**: Proposed
- **作者**: WSX Team

## 摘要

本文档说明如何在 `@wsxjs/wsx-core` 中统一暴露 `.wsx` 文件模块类型定义，确保所有使用 WSX Framework 的项目都能正确识别 `.wsx` 文件类型，而无需在每个包中重复配置 `wsx.d.ts` 文件。

## 动机

### 问题描述

当前多个 WSX 包（如 `@wsxjs/wsx-router`、`@wsxjs/wsx-base-components`、`@wsxjs/wsx-examples`）都各自包含 `wsx.d.ts` 文件用于声明 `.wsx` 模块类型，这导致了：

1. **重复配置**：每个包都需要维护相同的 `wsx.d.ts` 文件
2. **维护成本高**：类型定义分散在多个包中，更新困难
3. **不一致风险**：不同包的类型定义可能不一致
4. **用户困惑**：用户需要知道在哪个包中查找类型定义

### 当前状况

#### 现有文件结构

```
packages/
├── core/
│   ├── types/
│   │   ├── index.d.ts            # ✅ 已正确暴露
│   │   └── wsx-types.d.ts       # ✅ 已包含 *.wsx 声明
│   └── package.json              # ✅ types: "./types/index.d.ts"
├── wsx-router/
│   ├── src/types/
│   │   └── wsx.d.ts              # ❌ 重复定义，应删除
│   └── package.json
├── base-components/
│   ├── src/types/
│   │   └── wsx.d.ts              # ❌ 重复定义，应删除
│   └── package.json
└── examples/
    ├── src/types/
    │   └── wsx.d.ts              # ❌ 重复定义，应删除
    └── package.json
```

#### 问题分析

`@wsxjs/wsx-core` 的 `types/wsx-types.d.ts` 已经包含了 `.wsx` 模块声明：

```typescript
declare module "*.wsx" {
    const Component: new (...args: unknown[]) => WebComponent | LightComponent;
    export default Component;
}
```

并且 `types/index.d.ts` 已经导入了这个文件，所以类型已经正确暴露。其他包中的 `wsx.d.ts` 文件是**重复且不必要的**。

### 为什么需要这个 RFC？

1. **消除重复**：统一在 `wsx-core` 中管理 `.wsx` 类型定义
2. **简化维护**：只需在一个地方更新类型定义
3. **一致性保证**：所有包使用相同的类型定义
4. **更好的用户体验**：用户只需配置一次 `@wsxjs/wsx-core` 的类型

### 目标用户

- 使用 WSX Framework 开发组件的开发者
- 构建基于 WSX 的组件库的团队
- 需要类型支持的 TypeScript 用户

## 详细设计

### 核心概念

#### TypeScript 类型解析机制

TypeScript 通过以下方式查找类型定义：

1. **`package.json` 的 `types` 字段**：指向主类型入口文件
2. **`package.json` 的 `exports` 字段**：定义包的导出映射，包括类型
3. **`files` 字段**：指定发布到 npm 的文件
4. **类型声明文件位置**：`*.d.ts` 文件需要被正确包含

#### wsx.d.ts 的作用

`wsx.d.ts` 文件声明 `.wsx` 文件模块类型：

```typescript
// wsx.d.ts
declare module "*.wsx" {
    import { WebComponent, LightComponent } from "@wsxjs/wsx-core";
    const component: new (...args: unknown[]) => WebComponent | LightComponent;
    export default component;
}
```

### 解决方案

#### 核心思路

**在 `@wsxjs/wsx-core` 中统一暴露 `.wsx` 类型定义，其他包删除重复的 `wsx.d.ts` 文件。**

#### 方案说明

`@wsxjs/wsx-core` 已经正确配置了 `.wsx` 类型定义：

1. **类型定义位置**：`packages/core/types/wsx-types.d.ts`
   ```typescript
   declare module "*.wsx" {
       const Component: new (...args: unknown[]) => WebComponent | LightComponent;
       export default Component;
   }
   ```

2. **类型入口**：`packages/core/types/index.d.ts` 已导入
   ```typescript
   import "./wsx-types";  // 包含 *.wsx 声明
   ```

3. **包配置**：`packages/core/package.json` 已正确配置
   ```json
   {
     "types": "./types/index.d.ts",
     "exports": {
       ".": {
         "types": "./types/index.d.ts"
       }
     }
   }
   ```

#### 用户配置

用户只需在 `tsconfig.json` 中引用 `@wsxjs/wsx-core` 的类型：

```json
{
  "compilerOptions": {
    "types": ["@wsxjs/wsx-core"]
  }
}
```

这样，所有使用 WSX Framework 的项目都能自动获得 `.wsx` 文件的类型支持。

### 推荐方案

**统一在 `wsx-core` 中暴露，其他包删除重复文件**

理由：
1. **单一数据源**：所有 `.wsx` 类型定义在一个地方管理
2. **避免重复**：其他包不需要维护相同的类型文件
3. **一致性保证**：所有包使用相同的类型定义
4. **简化维护**：只需在一个地方更新类型定义
5. **用户友好**：用户只需配置一次 `@wsxjs/wsx-core` 的类型

### 实现细节

#### 步骤 1: 验证 wsx-core 配置

确认 `@wsxjs/wsx-core` 已正确暴露 `.wsx` 类型：

1. **检查类型文件**：`packages/core/types/wsx-types.d.ts` 包含 `declare module "*.wsx"`
2. **检查类型入口**：`packages/core/types/index.d.ts` 已导入 `wsx-types`
3. **检查包配置**：`packages/core/package.json` 的 `types` 字段指向 `./types/index.d.ts`

#### 步骤 2: 删除其他包中的重复文件

删除以下包中的 `wsx.d.ts` 文件：
- `packages/wsx-router/src/types/wsx.d.ts`
- `packages/base-components/src/types/wsx.d.ts`
- `packages/examples/src/types/wsx.d.ts`

#### 步骤 3: 更新其他包的 tsconfig.json

确保其他包的 `tsconfig.json` 正确引用 `@wsxjs/wsx-core` 的类型：

```json
{
  "compilerOptions": {
    "types": ["@wsxjs/wsx-core"]
  }
}
```

#### 步骤 4: 更新文档

更新相关文档，说明：
- `.wsx` 类型定义统一在 `@wsxjs/wsx-core` 中
- 用户只需配置 `types: ["@wsxjs/wsx-core"]`
- 其他包不需要单独的 `wsx.d.ts` 文件

#### 步骤 5: 测试验证

1. 在 monorepo 内部测试：验证各包能正确识别 `.wsx` 类型
2. 在外部项目测试：验证外部用户能正确使用类型
3. IDE 测试：验证 IDE 智能提示正常工作

### 示例用法

#### 用户项目配置

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@wsxjs/wsx-core",
    "types": ["@wsxjs/wsx-core"]
  },
  "include": ["src/**/*", "src/**/*.wsx"]
}
```

#### 用户代码

```typescript
// ✅ 自动识别 .wsx 文件类型（来自 @wsxjs/wsx-core）
import MyComponent from "./MyComponent.wsx";
// TypeScript 知道 MyComponent 的类型是 WebComponent | LightComponent

// ✅ IDE 提供完整的智能提示
const component = new MyComponent();
component.render(); // 有类型提示
```

#### 包内部使用

```typescript
// packages/wsx-router/src/components/Router.wsx
import { WebComponent } from "@wsxjs/wsx-core";
import LinkComponent from "./Link.wsx"; // ✅ 类型自动识别（来自 wsx-core）

@autoRegister()
export default class Router extends WebComponent {
    // ...
}
```

**注意**：`wsx-router` 包不需要自己的 `wsx.d.ts` 文件，类型定义统一来自 `@wsxjs/wsx-core`。

## 与WSX理念的契合度

### 符合核心原则

- ✅ **类型安全**：提供完整的 TypeScript 类型支持
- ✅ **开发者体验**：确保 IDE 智能提示和类型检查正常工作
- ✅ **标准化**：遵循 TypeScript 和 npm 包的标准实践
- ✅ **一致性**：所有包使用统一的类型暴露方式

### 理念契合说明

这个 RFC 完全符合 WSX 的核心理念：
- **类型优先**：确保类型系统完整可用
- **开发者友好**：提供无缝的开发体验
- **标准化**：遵循业界最佳实践
- **一致性**：统一所有包的配置方式

## 权衡取舍

### 优势

- ✅ **类型安全**：完整的 TypeScript 类型支持
- ✅ **IDE 支持**：提供智能提示和类型检查
- ✅ **标准化**：符合 TypeScript 和 npm 包标准
- ✅ **一致性**：所有包使用统一配置
- ✅ **向后兼容**：不破坏现有功能

### 劣势

- ⚠️ **文件结构变更**：需要创建 `types` 目录
- ⚠️ **维护成本**：需要维护额外的类型入口文件
- ⚠️ **构建复杂度**：可能需要更新构建脚本

### 替代方案

考虑过的其他方案：

1. **全局类型声明**：在 `@wsxjs/wsx-core` 中统一声明所有 `.wsx` 类型
   - **优点**：用户只需配置一次
   - **缺点**：不够灵活，无法处理包特定的类型

2. **三斜线指令**：使用 `/// <reference types="..." />`
   - **优点**：简单直接
   - **缺点**：不符合现代 TypeScript 实践，不推荐

3. **类型包分离**：创建独立的 `@types/wsx-*` 包
   - **优点**：类型和实现分离
   - **缺点**：增加维护复杂度，不符合 WSX 的简洁理念

最终选择方案 2（types 目录 + index.d.ts），因为它：
- 标准化且易于理解
- 与现有 `@wsxjs/wsx-core` 配置一致
- 灵活且可扩展
- 用户友好

## 实现计划

### 阶段规划

1. **阶段 1：验证 wsx-core 配置**
   - 确认 `types/wsx-types.d.ts` 包含 `*.wsx` 声明
   - 确认 `types/index.d.ts` 已导入
   - 确认 `package.json` 配置正确
   - 测试类型解析

2. **阶段 2：清理其他包的重复文件**
   - 删除 `wsx-router/src/types/wsx.d.ts`
   - 删除 `base-components/src/types/wsx.d.ts`
   - 删除 `examples/src/types/wsx.d.ts`
   - 更新各包的 `tsconfig.json` 确保引用 `@wsxjs/wsx-core` 类型

3. **阶段 3：测试验证**
   - 在 monorepo 内部测试类型解析
   - 在外部项目测试类型解析
   - 验证 IDE 智能提示

4. **阶段 4：文档更新**
   - 更新 TypeScript 配置指南
   - 说明类型定义统一在 `wsx-core` 中
   - 更新示例代码

### 时间线

- **Day 1**: 验证 wsx-core 配置，删除重复文件
- **Day 2**: 测试验证和文档更新

### 依赖项

- TypeScript >= 4.7.0
- 现有的包结构
- 构建工具支持（Vite/tsup）

## 测试策略

### 单元测试

- 验证类型定义文件可以被正确解析
- 测试 `.wsx` 文件导入的类型正确性

### 集成测试

- 在真实项目中测试类型解析
- 验证 IDE 智能提示正常工作
- 测试 monorepo 和外部项目场景

### 类型测试

```typescript
// types/test.ts
import Component from "./Component.wsx";

// 应该能够正确推断类型
const instance = new Component();
// instance 应该是 WebComponent | LightComponent 类型
```

## 文档计划

### 需要的文档

- [ ] 包开发指南：如何正确配置类型定义
- [ ] TypeScript 配置指南更新
- [ ] 迁移指南（如果有破坏性变更）
- [ ] 示例代码更新

### 文档位置

- `docs/guide/TYPESCRIPT_SETUP.md` - 更新类型配置说明
- `docs/guide/PACKAGE_DEVELOPMENT.md` - 新建包开发指南
- `packages/*/README.md` - 更新各包的 README

## 向后兼容性

### 破坏性变更

无。这是一个增强性变更，不会破坏现有功能。

### 迁移策略

对于现有包：
1. 创建 `types` 目录
2. 创建 `types/index.d.ts`
3. 更新 `package.json`
4. 测试类型解析

对于用户：
- 无需任何更改
- 类型支持会自动生效

### 废弃计划

无废弃内容。

## 性能影响

### 构建时性能

- **影响**：最小
- **原因**：只是添加类型文件，不增加构建复杂度

### 运行时性能

- **影响**：无
- **原因**：类型定义仅在编译时使用

### 内存使用

- **影响**：无
- **原因**：类型定义不参与运行时

## 安全考虑

无安全影响。类型定义文件不包含可执行代码。

## 开发者体验

### 学习曲线

- **难度**：低
- **原因**：遵循标准 TypeScript 实践，易于理解

### 调试体验

- **改进**：更好的类型错误提示
- **IDE 支持**：完整的智能提示和类型检查

### 错误处理

TypeScript 会提供清晰的错误信息：
- 如果类型文件缺失：`Cannot find module`
- 如果类型不匹配：类型错误提示

## 社区影响

### 生态系统

- **正面影响**：提升 WSX 生态系统的类型支持质量
- **标准化**：为社区包提供标准配置模板

### 第三方集成

- **改进**：更好的 TypeScript 工具链集成
- **兼容性**：与主流 IDE 和工具兼容

## 先例

### 业界实践

参考了以下项目的类型暴露方式：
- **React**：使用 `types` 字段和 `exports` 字段
- **Vue**：使用 `types` 目录结构
- **TypeScript 官方指南**：推荐使用 `types` 字段

### 学习借鉴

- TypeScript 官方文档：Package.json types field
- npm 包最佳实践：Exports field
- 现代 TypeScript 项目结构

## 相关文档

- [RFC-0000: TypeScript 类型系统](./0000-typescript-type-system.md)（如果存在）
- [TypeScript 配置指南](../guide/TYPESCRIPT_SETUP.md)
- [WSX Core 类型系统](../../packages/core/TYPES.md)

## 总结

通过在 `@wsxjs/wsx-core` 中统一暴露 `.wsx` 类型定义，我们可以：

1. ✅ **消除重复配置** - 其他包不需要维护相同的 `wsx.d.ts` 文件
2. ✅ **简化维护** - 只需在一个地方（`wsx-core`）更新类型定义
3. ✅ **保证一致性** - 所有包使用相同的类型定义
4. ✅ **改善用户体验** - 用户只需配置一次 `@wsxjs/wsx-core` 的类型
5. ✅ **遵循最佳实践** - 单一数据源原则，避免重复

这个 RFC 简化了 WSX Framework 的类型管理，通过集中管理 `.wsx` 类型定义，减少了维护成本，提升了开发体验。
