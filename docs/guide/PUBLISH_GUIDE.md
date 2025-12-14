# WSX Framework 发布指南

本指南说明如何使用 Turbo 和 Changesets 发布 WSX Framework 的所有包。

> **最佳实践**: 本发布流程遵循开源 npm 包发布的最佳实践，包括安全性检查、dry-run 测试、版本验证等。

## 前置要求

1. **安装 Turbo**（已包含在 devDependencies 中）
   ```bash
   pnpm install
   ```

2. **确保已登录 NPM**
   ```bash
   npm login
   ```

3. **确保在 main 分支且所有更改已提交**
   ```bash
   git checkout main
   git pull origin main
   ```

## 发布流程

### 方法 1: 使用自动化发布脚本（推荐）

```bash
pnpm release
```

这个脚本会自动执行以下步骤：

## 阶段 1: 版本管理（可选）

1. ✅ **检查 NPM 认证** - 验证登录状态和 registry 配置
2. ✅ **检查 Git 状态** - 验证分支、未提交更改、未推送提交
3. ✅ **检查远程更新** - 自动拉取远程最新代码（推荐）
4. ✅ **询问版本更新** - 是否要更新版本号
5. ✅ **创建 Changeset** - 如果没有 changeset，自动创建
6. ✅ **应用版本更新** - 使用 changeset version 更新所有包版本
7. ✅ **重新构建** - 版本更新后重新构建
8. ✅ **Git 提交** - 提交版本更新和 CHANGELOG
9. ✅ **创建标签** - 创建 Git 标签（vX.X.X）
10. ✅ **推送到远程** - 自动推送分支和标签

## 阶段 2: 发布到 NPM

11. ✅ **清理构建产物** - 清理旧的构建文件
12. ✅ **安装依赖** - 使用 frozen-lockfile 确保一致性
13. ✅ **代码质量检查** - ESLint、Prettier、TypeScript 类型检查
14. ✅ **运行测试** - 确保所有测试通过
15. ✅ **构建所有包** - 使用 Turbo 并行构建（带缓存）
16. ✅ **验证构建产物** - 检查所有包的构建输出
17. ✅ **显示发布列表** - 显示将要发布的包和版本
18. ✅ **检查已存在版本** - 避免重复发布
19. ✅ **Dry-run 测试** - 可选，模拟发布过程（推荐）
20. ✅ **发布到 NPM** - 支持交互式 OTP 输入（2FA）
21. ✅ **完成确认** - 显示发布结果摘要

## 最佳实践特性

- 🔒 **安全性**: 检查 NPM 认证、registry 配置
- 🔍 **验证**: 检查包是否已存在，避免重复发布
- 🧪 **Dry-run**: 发布前模拟测试，降低风险
- 🔄 **同步**: 自动检查并拉取远程更新
- 📦 **透明**: 显示将要发布的所有包和版本
- 🛡️ **错误处理**: 完善的错误提示和恢复建议

**为什么使用 JavaScript 而不是 Shell 脚本？**

发布脚本使用 Node.js (`.mjs`) 实现，并使用专业的 CLI 库：

- ✅ **跨平台兼容**：Windows、macOS、Linux 都能运行，无需 Git Bash 或 WSL
- ✅ **更好的维护性**：与项目技术栈一致（TypeScript/JavaScript）
- ✅ **更容易调试**：可以使用 Node.js 调试工具
- ✅ **更好的错误处理**：JavaScript 的异常处理更完善
- ✅ **专业的 CLI 体验**：使用以下库提供更好的用户体验：
  - **chalk** - 彩色输出，更清晰的视觉反馈
  - **inquirer** - 交互式提示，友好的用户交互
  - **ora** - 加载动画，显示任务进度
  - **listr2** - 任务列表，清晰展示执行步骤

### 方法 2: 手动发布流程

#### 步骤 1: 创建 Changeset

在开发过程中，为每个变更创建 changeset：

```bash
pnpm changeset
```

这会引导你：
- 选择要发布的包
- 选择版本类型（patch/minor/major）
- 添加变更说明

#### 步骤 2: 构建和测试

```bash
# 使用 Turbo 并行构建所有包（自动处理依赖顺序）
pnpm build

# 运行测试
pnpm test

# 类型检查
pnpm typecheck
```

#### 步骤 3: 应用版本更新

```bash
pnpm changeset:version
```

这会：
- 根据 changesets 更新所有包的版本号
- 更新 CHANGELOG.md
- 删除已应用的 changeset 文件

#### 步骤 4: 重新构建

版本更新后需要重新构建：

```bash
pnpm build
```

#### 步骤 5: 发布到 NPM

```bash
pnpm changeset:publish
```

这会发布所有版本已更新的包到 NPM。

#### 步骤 6: 提交和推送

```bash
git add .
git commit -m "chore: release vX.X.X"
git push --follow-tags
```

## Turbo 的优势

使用 Turbo 后，构建过程有以下优势：

### 1. 并行构建
- 多个包可以同时构建
- 自动处理依赖顺序（例如：core 先于 base-components）

### 2. 智能缓存
- 未变更的包不会重新构建
- 大幅提升构建速度

### 3. 依赖感知
- 自动识别包之间的依赖关系
- 确保构建顺序正确

### 4. 增量构建
- 只构建变更的包及其依赖
- 使用 `turbo build --filter=@wsxjs/wsx-core` 构建单个包

## 常用命令

### 构建相关

```bash
# 构建所有包
pnpm build

# 构建特定包
pnpm build:filter @wsxjs/wsx-core

# 构建开发版本（带 sourcemap）
pnpm build:dev

# 清理所有构建产物
pnpm clean
```

### 代码质量

```bash
# 运行所有包的 lint
pnpm lint

# 类型检查所有包
pnpm typecheck

# 格式化代码
pnpm format

# 检查代码格式
pnpm format:check
```

### Changeset 相关

```bash
# 创建新的 changeset
pnpm changeset

# 查看 changeset 状态
pnpm changeset:status

# 应用版本更新
pnpm changeset:version

# 发布（dry-run）
pnpm release:dry-run
```

## 发布检查清单

在发布前，请确认：

- [ ] 所有测试通过 (`pnpm test`)
- [ ] 类型检查通过 (`pnpm typecheck`)
- [ ] 代码格式正确 (`pnpm format:check`)
- [ ] Lint 检查通过 (`pnpm lint`)
- [ ] 所有包构建成功 (`pnpm build`)
- [ ] 构建产物存在且完整
- [ ] Changeset 已创建并描述清楚
- [ ] 在 main 分支
- [ ] 所有更改已提交
- [ ] 已登录 NPM

## 故障排除

### 构建失败

如果某个包构建失败：

1. 检查该包的依赖是否已构建
2. 清理并重新构建：
   ```bash
   pnpm clean
   pnpm build
   ```

### 版本冲突

如果遇到版本冲突：

1. 检查是否有未应用的 changeset
2. 手动解决版本冲突
3. 重新运行 `pnpm changeset:version`

### 发布失败

如果发布失败：

1. 检查 NPM 登录状态：`npm whoami`
2. 检查包名和版本是否已存在
3. 检查是否有发布权限

## CI/CD 集成

发布流程已集成到 GitHub Actions（`.github/workflows/release.yml`）：

- 自动运行 CI 检查
- 自动构建和测试
- 使用 semantic-release 自动发布

## 相关文档

- [Changesets 文档](https://github.com/changesets/changesets)
- [Turbo 文档](https://turbo.build/repo/docs)
- [Semantic Release 配置](.releaserc.js)
