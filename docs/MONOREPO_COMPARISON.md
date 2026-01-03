# Monorepo 工具对比：pnpm workspace vs Turbo vs Nx

## 当前配置分析

### 你的项目使用：
- **pnpm workspace** - 包管理和链接
- **Turbo** - 任务编排和缓存
- **组合使用** - 这是最佳实践！

## 工具对比

### 1. pnpm workspace

**职责：包管理和链接**

✅ **优点：**
- 高效的磁盘空间使用（硬链接）
- 自动处理 workspace 包链接
- 支持 `workspace:*` 协议
- 快速安装和更新
- 内置依赖提升（hoisting）

❌ **缺点：**
- 不提供任务编排
- 不提供构建缓存
- 不提供依赖图分析

**你的配置：**
```yaml
# pnpm-workspace.yaml
packages:
    - "packages/*"
    - "site/"
```

**包链接状态：** ✅ 正常工作
```bash
# 所有包都正确链接
@wsxjs/wsx-core link:../packages/core
@wsxjs/wsx-base-components link:../packages/base-components
```

---

### 2. Turbo

**职责：任务编排、缓存、并行执行**

✅ **优点：**
- 智能缓存（基于文件哈希）
- 并行任务执行
- 依赖图感知
- 增量构建
- 远程缓存支持（可选）
- 轻量级，配置简单

❌ **缺点：**
- 需要手动配置任务
- 不提供包管理
- 缓存可能占用空间

**你的配置：**
```json
// turbo.json
{
    "tasks": {
        "build": {
            "dependsOn": ["^build"],  // 依赖上游包先构建
            "outputs": ["dist/**"]
        }
    }
}
```

**优势：**
- 自动处理构建顺序（core → base-components → site）
- 缓存未变更的包
- 并行构建独立包

---

### 3. Nx

**职责：完整的 monorepo 解决方案**

✅ **优点：**
- 完整的工具链（构建、测试、lint、发布）
- 强大的依赖图分析
- 代码生成器（generators）
- 插件生态系统
- 远程缓存（Nx Cloud）
- 受影响项目检测

❌ **缺点：**
- 学习曲线陡峭
- 配置复杂
- 可能过度工程化（对于小项目）
- 需要迁移成本

**适用场景：**
- 大型企业 monorepo（100+ 包）
- 需要复杂的工作流
- 需要代码生成和插件

---

## 为什么包无法正确链接？

### 问题诊断

从你的配置来看，**包链接实际上是正常的**：

```bash
# 检查链接状态
$ pnpm list --filter @wsxjs/wsx-site

dependencies:
@wsxjs/wsx-core link:../packages/core          ✅
@wsxjs/wsx-base-components link:../packages/base-components  ✅
@wsxjs/wsx-i18next link:../packages/i18next   ✅
```

### 可能的问题原因

#### 1. **Vite 路径别名覆盖了正常解析**

```typescript
// site/vite.config.ts
resolve: {
    alias: process.env.NODE_ENV === "development"
        ? {
              "@wsxjs/wsx-core": path.resolve(__dirname, "../core/src/index.ts"),
              // ⚠️ 这覆盖了正常的 node_modules 解析
          }
        : undefined,
}
```

**问题：** 开发模式下，Vite 别名直接指向源文件，绕过了 pnpm 的链接机制。

**解决方案：**
- 移除别名，让 Vite 使用正常的模块解析
- 或者确保别名路径正确

#### 2. **TypeScript 路径映射不匹配**

检查 `tsconfig.json` 中的 `paths` 配置是否与 Vite 别名一致。

#### 3. **构建产物路径问题**

生产模式下，Vite 使用 `package.json` 的 `exports`，确保路径正确。

---

## 推荐配置（当前最佳实践）

### ✅ 你当前的组合是正确的：

```
pnpm workspace (包管理)
    +
Turbo (任务编排)
    =
完美的 monorepo 解决方案
```

### 为什么这个组合好？

1. **职责分离**
   - pnpm 负责包管理和链接
   - Turbo 负责任务编排和缓存

2. **性能优秀**
   - pnpm 的硬链接节省空间
   - Turbo 的缓存加速构建

3. **简单易用**
   - 配置简单
   - 学习曲线平缓

4. **社区支持**
   - 广泛使用
   - 文档完善

---

## 修复包链接问题的步骤

### 1. 验证链接状态

```bash
# 检查所有 workspace 包的链接
pnpm list --filter @wsxjs/wsx-site

# 检查符号链接
ls -la site/node_modules/@wsxjs/
```

### 2. 检查 Vite 配置

```typescript
// site/vite.config.ts
resolve: {
    alias: process.env.NODE_ENV === "development"
        ? {
              // 确保路径正确
              "@wsxjs/wsx-core": path.resolve(__dirname, "../packages/core/src/index.ts"),
          }
        : undefined,
}
```

**建议：** 如果包链接正常，可以移除别名，让 Vite 使用正常的模块解析。

### 3. 重新安装依赖

```bash
# 清理并重新安装
rm -rf node_modules site/node_modules
pnpm install
```

### 4. 验证构建

```bash
# 开发模式
pnpm --filter @wsxjs/wsx-site dev

# 生产构建
pnpm --filter @wsxjs/wsx-site build
```

---

## 何时考虑 Nx？

### 考虑迁移到 Nx 的情况：

1. **包数量 > 50**
2. **需要复杂的代码生成**
3. **需要插件生态系统**
4. **需要高级的依赖图分析**
5. **团队规模大，需要标准化工作流**

### 对于你的项目（~10 个包）：

✅ **当前组合（pnpm + Turbo）是最佳选择**

- 简单高效
- 性能优秀
- 维护成本低
- 社区支持好

---

## 总结

| 工具 | 职责 | 你的使用 | 状态 |
|------|------|---------|------|
| **pnpm workspace** | 包管理、链接 | ✅ 使用中 | 正常 |
| **Turbo** | 任务编排、缓存 | ✅ 使用中 | 正常 |
| **Nx** | 完整解决方案 | ❌ 未使用 | 不需要 |

**结论：** 你的配置是正确的，包链接也是正常的。如果遇到问题，可能是 Vite 别名配置导致的，而不是包链接本身的问题。

