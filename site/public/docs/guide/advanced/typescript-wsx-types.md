---
title: WSX 类型系统指南
order: 2
category: guide/advanced
description: "本指南详细说明了 WSXJS 中 `.wsx` 文件类型系统的工作原理、维护方式和最佳实践。"
---

本指南详细说明了 WSXJS 中 `.wsx` 文件类型系统的工作原理、维护方式和最佳实践。

## 目录

- [为什么每个包都需要 wsx.d.ts？](#为什么每个包都需要-wsxdts)
- [如何维护类型一致性？](#如何维护类型一致性)
- [开发者指南](#开发者指南)
- [故障排查](#故障排查)

---

## 为什么每个包都需要 wsx.d.ts？

### 问题背景

在 WSXJS 的 monorepo 结构中，多个包（`wsx-router`、`base-components`、`examples` 等）都包含了相同的 `wsx.d.ts` 文件，这看起来是重复的。但这是**必需的**，而不是设计失误。

### TypeScript 模块类型声明的限制

**关键概念**：`declare module "*.wsx"` 属于 **模块模式声明（Pattern Ambient Module）**。

TypeScript 的类型解析机制要求：
- **模块模式声明必须存在于编译上下文中**
- **无法从 `node_modules` 自动传播**
- `compilerOptions.types` 字段只影响**全局类型**（如 `@types/node`），不影响模块模式声明

**这意味着**：即使 `@wsxjs/wsx-core` 正确配置了类型定义，其他包也无法自动"继承"这个模块声明。

###  实际验证结果

我们尝试了多种技术方案，包括：

1. **`typesVersions` 字段**：TypeScript 官方的类型版本映射机制
   - **结果**：在 monorepo 中部分失败
   - `examples` 包可以工作，但 `wsx-router` 和 `base-components` 失败
   - 行为不一致，不可靠

2. **三斜线指令**：`/// <reference types="..." />`
   - **结果**：技术上可行，但违反现代 TypeScript 最佳实践
   - 需要在每个文件中手动添加
   - 容易遗漏，维护困难

3. **当前方案**：每个包保留自己的 `wsx.d.ts`
   - **结果**：完全稳定可靠
   - 符合 TypeScript 的设计限制
   - 与 Vue、Svelte 等成熟框架一致

### 业界最佳实践

成熟的框架都采用相同的方案：

- **Vue.js**：每个包都有 `shims-vue.d.ts` 文件
- **Svelte**：每个包都有 `ambient.d.ts` 文件
- **Solid.js**：每个包都有模块声明文件

这证明了这是业界公认的最佳实践，而不是 WSX 的特殊问题。

### 参考资料

- [TypeScript Documentation - Modules Reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html)
- [TypeScript Issue #57652 - Monorepo dependency resolution](https://github.com/microsoft/TypeScript/issues/57652)
- [Live types in a TypeScript monorepo](https://colinhacks.com/essays/live-types-typescript-monorepo)

---

## 如何维护类型一致性？

虽然我们必须保留重复的 `wsx.d.ts` 文件，但通过自动化工具确保了一致性和零维护成本。

### 自动同步机制

**核心脚本**：`scripts/sync-wsx-types.mjs`

该脚本会：
1. 从 `@wsxjs/wsx-core/types/wsx-types.d.ts` 读取标准类型定义
2. 自动同步到所有包的 `wsx.d.ts` 文件
3. 添加"自动生成"注释，提醒开发者不要手动编辑

**使用方法**：

```bash
# 手动同步
pnpm sync:types

# 查看同步结果
git status
```

### Pre-commit Hook

**配置文件**：`.husky/pre-commit`

每次提交代码前，pre-commit hook 会：
1. 自动运行 `pnpm sync:types`
2. 将同步后的文件添加到 git
3. 确保提交的代码中所有类型文件都是一致的

**开发者无需任何操作**，hook 会自动处理。

### CI/CD 验证

**GitHub Actions 配置**：`.github/workflows/ci.yml`

CI 流程中包含类型一致性验证：

```yaml
- name: Verify wsx.d.ts files consistency
  run: |
    pnpm sync:types
    git diff --exit-code packages/*/src/types/wsx.d.ts
```

如果检测到不一致：
- CI 会失败
- 提示开发者运行 `pnpm sync:types`
- 确保不会合并不一致的代码

---

## 开发者指南

### 修改类型定义

**重要**：只修改 `@wsxjs/wsx-core/types/wsx-types.d.ts`，不要修改其他包的 `wsx.d.ts`！

**步骤**：

1. 编辑 `packages/core/types/wsx-types.d.ts`：

```typescript
// 修改模块声明
declare module "*.wsx" {
    import { WebComponent, LightComponent } from "../src/index";
    const Component: new (...args: unknown[]) => WebComponent | LightComponent;
    export default Component;
}
```

2. 运行同步脚本：

```bash
pnpm sync:types
```

3. 提交更改：

```bash
git add packages/core/types/wsx-types.d.ts packages/*/src/types/wsx.d.ts
git commit -m "feat: update wsx type definitions"
```

**注意**：如果你忘记运行 `pnpm sync:types`，pre-commit hook 会自动帮你运行。

### 添加新包

如果你创建了新的包，需要：

1. **创建类型文件夹**：

```bash
mkdir -p packages/your-new-package/src/types
```

2. **更新同步脚本**，编辑 `scripts/sync-wsx-types.mjs`：

```javascript
const TARGET_FILES = [
  'packages/wsx-router/src/types/wsx.d.ts',
  'packages/base-components/src/types/wsx.d.ts',
  'packages/examples/src/types/wsx.d.ts',
  'packages/your-new-package/src/types/wsx.d.ts',  // 添加这行
];
```

3. **运行同步**：

```bash
pnpm sync:types
```

4. **配置 `tsconfig.json`**（如果需要）：

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@wsxjs/wsx-core"
  },
  "include": ["src/**/*", "src/types/**/*"]
}
```

### 检查类型一致性

手动检查所有 `wsx.d.ts` 文件是否一致：

```bash
# 运行同步
pnpm sync:types

# 检查是否有差异
git diff packages/*/src/types/wsx.d.ts
```

如果没有输出，说明所有文件都是一致的。

---

## 故障排查

### 问题 1：TypeScript 报错 `Cannot find module '*.wsx'`

**症状**：

```
error TS2307: Cannot find module './Component.wsx' or its corresponding type declarations.
```

**原因**：`wsx.d.ts` 文件缺失或未被 TypeScript 识别。

**解决方案**：

1. 检查 `src/types/wsx.d.ts` 是否存在：

```bash
ls -la packages/your-package/src/types/wsx.d.ts
```

2. 如果不存在，运行同步脚本：

```bash
pnpm sync:types
```

3. 检查 `tsconfig.json` 的 `include` 配置：

```json
{
  "include": [
    "src/**/*",
    "src/types/**/*"  // 确保包含 types 目录
  ]
}
```

4. 重启 TypeScript server（VS Code）：

- `Cmd+Shift+P` → "TypeScript: Restart TS Server"

### 问题 2：IDE 显示 "React is not in scope" 错误

**症状**：

虽然代码能编译，但 IDE 显示红色波浪线：`This JSX tag requires 'React' to be in scope`。

**原因**：IDE 的 TypeScript 服务未正确加载 JSX 配置。

**解决方案**：

1. 在 `.wsx` 文件顶部添加 JSX pragma：

```typescript
/** @jsxImportSource @wsxjs/wsx-core */
```

2. 确保 `tsconfig.json` 配置正确：

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@wsxjs/wsx-core"
  }
}
```

3. 重启 TypeScript server

### 问题 3：CI 验证失败 "wsx.d.ts files are inconsistent"

**症状**：

CI 中报错：
```
Error: wsx.d.ts files are inconsistent
```

**原因**：某个包的 `wsx.d.ts` 文件与其他包不一致。

**解决方案**：

1. 本地运行同步脚本：

```bash
pnpm sync:types
```

2. 提交更改：

```bash
git add packages/*/src/types/wsx.d.ts
git commit -m "chore: sync wsx.d.ts files"
git push
```

### 问题 4：Pre-commit hook 没有自动运行

**症状**：

提交代码时，`wsx.d.ts` 文件没有自动同步。

**原因**：Husky hooks 未正确安装。

**解决方案**：

1. 重新安装 hooks：

```bash
pnpm install
```

2. 手动启用 hooks：

```bash
chmod +x .husky/pre-commit
```

3. 测试 hook：

```bash
git commit -m "test" --allow-empty
```

应该看到 `pnpm sync:types` 自动运行。

### 问题 5：新创建的包无法识别 .wsx 文件

**症状**：

新包中的 `.wsx` 文件无法被 TypeScript 识别。

**原因**：新包未添加到同步脚本中。

**解决方案**：

参考 [添加新包](#添加新包) 章节。

---

## 总结

- **为什么重复？** TypeScript 的模块模式声明限制，这是技术必然
- **如何维护？** 自动同步脚本 + Pre-commit hook + CI/CD 验证
- **开发者体验？** 完全自动化，零手动维护成本
- **是否可以改进？** 未来 TypeScript 改进类型系统后可以迁移到统一配置

WSXJS 选择了工程实用主义：承认技术限制，通过自动化工具提供最佳开发体验。
