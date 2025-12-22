# RFC-0020: JSX Import Source Pragma 自动注入方案

- **RFC编号**: 0020
- **开始日期**: 2025-01-20
- **状态**: Implemented
- **作者**: WSX Team

## 摘要

为 `.wsx` 文件自动注入 `/** @jsxImportSource @wsxjs/wsx-core */` pragma 注释，确保 IDE 的 TypeScript 语言服务器能够正确进行类型检查，同时保持开发者体验的流畅性。

## 动机

### 问题描述

每个 `.wsx` 文件都需要在顶部手动添加 `/** @jsxImportSource @wsxjs/wsx-core */` pragma 注释，这带来了以下问题：

1. **开发者负担**：需要记住在每个新文件中添加 pragma
2. **容易遗漏**：忘记添加 pragma 会导致 IDE 类型检查失败
3. **维护成本**：手动维护 pragma 增加了代码维护成本
4. **不一致性**：不同开发者可能使用不同的格式或位置

### 为什么需要 Pragma？

虽然 `tsconfig.json` 中已经配置了 `jsxImportSource: "@wsxjs/wsx-core"`，但存在以下限制：

1. **TypeScript 编译器限制**：TypeScript 编译器（`tsc`）不支持 `.wsx` 扩展名
2. **IDE 类型检查需求**：IDE 的 TypeScript 语言服务器需要文件级别的 pragma 来正确识别 JSX 导入源
3. **工具链兼容性**：某些工具（如 ESLint、Prettier）可能需要 pragma 来正确处理文件

### 目标

实现**自动化 pragma 管理**：
- 开发者无需手动添加 pragma
- IDE 能够正确进行类型检查
- 工具链能够正常工作
- 保持代码一致性

## 详细设计

### 方案对比

我们考虑了两个主要方案：

#### 方案 1：Vite 插件自动注入（已放弃）

**实现方式**：在 Vite 插件的 `transform` 阶段自动注入 pragma

**问题**：
- ❌ **IDE 无法看到**：IDE 的 TypeScript 语言服务器读取源文件，不是构建后的代码
- ❌ **类型检查失败**：构建时注入对 IDE 类型检查无效
- ❌ **开发体验差**：开发者仍然会在 IDE 中看到类型错误

**结论**：此方案对 IDE 支持无效，已放弃。

#### 方案 2：ESLint 规则自动修复（已采用）✅

**实现方式**：创建 ESLint 规则 `wsx/require-jsx-import-source`，自动检测并修复缺失的 pragma

**优势**：
- ✅ **直接修改源文件**：ESLint 自动修复直接修改源文件
- ✅ **IDE 立即生效**：IDE 可以立即看到 pragma，类型检查正常工作
- ✅ **开发时检测**：在开发时就能发现问题并自动修复
- ✅ **工具链兼容**：与现有工具链完美集成

**实现细节**：

1. **规则检测**：检查 `.wsx` 文件是否包含 `@jsxImportSource` pragma
2. **自动修复**：如果缺失，自动在文件开头添加 pragma
3. **推荐配置**：在 `recommended` 配置中默认启用

### 核心实现

#### ESLint 规则实现

```typescript
// packages/eslint-plugin/src/rules/require-jsx-import-source.ts
export const requireJsxImportSource: WSXRuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "require @jsxImportSource pragma in .wsx files",
            category: "Best Practices",
            recommended: true,
        },
        fixable: "code",
        messages: {
            missingPragma:
                "WSX files must include '@jsxImportSource @wsxjs/wsx-core' pragma comment at the top for IDE TypeScript language server support",
        },
    },
    create(context: Rule.RuleContext) {
        const filename = context.getFilename();
        // 只检查 .wsx 文件
        if (!filename.endsWith(".wsx")) {
            return {};
        }

        const sourceCode = context.getSourceCode();
        const text = sourceCode.getText();

        // 检查是否已包含 pragma
        const hasPragma = text.includes("@jsxImportSource");

        if (!hasPragma) {
            const firstNode = sourceCode.ast.body[0] || sourceCode.ast;
            context.report({
                node: firstNode,
                messageId: "missingPragma",
                fix(fixer) {
                    // 在文件开头插入 pragma 注释
                    return fixer.insertTextBeforeRange(
                        [0, 0],
                        "/** @jsxImportSource @wsxjs/wsx-core */\n"
                    );
                },
            });
        }

        return {};
    },
};
```

### 使用方式

#### 自动修复

开发者可以通过以下方式自动添加 pragma：

1. **手动运行 ESLint 修复**：
   ```bash
   npx eslint --fix "**/*.wsx"
   ```

2. **编辑器自动修复**（推荐）：
   - VS Code：配置保存时自动修复
   - 其他编辑器：配置 ESLint 自动修复

3. **CI/CD 检查**：
   - 在 CI/CD 流程中运行 ESLint 检查
   - 确保所有 `.wsx` 文件都包含 pragma

#### 配置示例

```javascript
// eslint.config.js
import wsxPlugin from "@wsxjs/eslint-plugin-wsx";

export default [
    {
        files: ["**/*.wsx"],
        plugins: {
            wsx: wsxPlugin,
        },
        rules: {
            "wsx/require-jsx-import-source": "error", // 自动修复缺失的 pragma
        },
    },
];
```

## 与WSX理念的契合度

### 符合核心原则

- ✅ **零配置体验**：开发者无需手动添加 pragma，工具自动处理
- ✅ **开发者体验优先**：确保 IDE 类型检查正常工作
- ✅ **工具链集成**：与现有工具链（ESLint、TypeScript）完美集成
- ✅ **自动化优先**：通过工具自动化减少手动操作

### 理念契合说明

这个功能完全符合 WSX 的"零配置"和"开发者体验优先"的理念：

1. **自动化处理**：开发者无需关心 pragma 的存在，工具自动管理
2. **IDE 支持**：确保 IDE 能够正确进行类型检查，提升开发体验
3. **工具链集成**：与现有工具链无缝集成，不增加额外负担

## 权衡取舍

### 优势

- ✅ **自动化**：开发者无需手动添加 pragma
- ✅ **IDE 支持**：确保 IDE 类型检查正常工作
- ✅ **一致性**：所有文件自动保持一致的 pragma 格式
- ✅ **可维护性**：减少手动维护成本
- ✅ **工具链兼容**：与 ESLint、TypeScript 等工具完美集成

### 劣势

- ⚠️ **需要运行 ESLint**：开发者需要运行 ESLint 修复（但可以自动化）
- ⚠️ **源文件修改**：ESLint 自动修复会修改源文件（这是期望的行为）

### 替代方案

考虑过的其他方案：

1. **TypeScript Transformer**：
   - 复杂度高，需要额外的构建配置
   - 对 IDE 支持有限

2. **Pre-commit Hook**：
   - 只能在提交时检查，不能实时修复
   - 增加提交时间

3. **IDE 插件**：
   - 需要为每个 IDE 开发插件
   - 维护成本高

最终选择 ESLint 规则方案，因为：
- 简单易用
- 与现有工具链集成
- 对 IDE 支持最好

## 未解决问题

无

## 实现计划

### 阶段规划

1. **阶段1**：创建 ESLint 规则 ✅
   - 实现 `require-jsx-import-source` 规则
   - 添加自动修复功能

2. **阶段2**：集成到推荐配置 ✅
   - 在 `recommended` 配置中启用规则
   - 更新文档

3. **阶段3**：测试和验证 ✅
   - 测试规则在不同场景下的行为
   - 验证 IDE 类型检查正常工作

### 时间线

- **2025-01-20**: 设计确认和讨论
- **2025-01-20**: 核心实现
- **2025-01-20**: 测试和文档

### 依赖项

- `@wsxjs/eslint-plugin-wsx`: ESLint 插件包
- ESLint 9+ flat config 支持

## 测试策略

### 单元测试

- 测试规则检测缺失的 pragma
- 测试自动修复功能
- 测试已存在 pragma 的情况
- 测试非 `.wsx` 文件的情况

### 集成测试

- 测试与 ESLint 配置的集成
- 测试与 TypeScript 的集成
- 测试 IDE 类型检查是否正常工作

### 端到端测试

- 创建新 `.wsx` 文件，验证自动修复
- 验证 IDE 类型检查正常工作
- 验证构建过程正常

## 文档计划

### 需要的文档

- [x] ESLint 规则文档
- [x] 使用指南
- [x] 最佳实践
- [x] RFC 文档（本文档）

### 文档位置

- ESLint 规则文档：`packages/eslint-plugin/README.md`
- 使用指南：`docs/guide/JSX_SUPPORT.md`
- RFC 文档：`docs/rfcs/0020-jsx-import-source-pragma-auto-injection.md`

## 向后兼容性

### 破坏性变更

无破坏性变更。现有代码继续工作，新规则只是添加了自动修复功能。

### 迁移策略

对于现有项目：

1. 运行 ESLint 自动修复：
   ```bash
   npx eslint --fix "**/*.wsx"
   ```

2. 或者手动添加 pragma 到现有文件

### 废弃计划

无废弃计划。

## 性能影响

### 构建时性能

- **ESLint 检查**：对构建时间影响可忽略（通常 < 100ms）
- **自动修复**：仅在开发时运行，不影响构建时间

### 运行时性能

无运行时性能影响。

### 内存使用

无内存使用影响。

## 安全考虑

无安全影响。ESLint 规则只是添加注释，不执行任何代码。

## 开发者体验

### 学习曲线

- **零学习成本**：开发者无需学习新概念
- **自动化处理**：工具自动处理，开发者无需关心

### 调试体验

- **清晰的错误信息**：ESLint 会明确提示缺失 pragma
- **自动修复**：一键修复，无需手动操作

### 错误处理

- **友好的错误信息**：明确说明为什么需要 pragma
- **自动修复提示**：ESLint 提供自动修复选项

## 社区影响

### 生态系统

- **提升开发者体验**：减少手动操作，提升开发效率
- **工具链集成**：与现有工具链完美集成

### 第三方集成

- **ESLint 兼容**：与所有 ESLint 兼容的工具集成
- **编辑器支持**：支持所有支持 ESLint 的编辑器

## 先例

### 业界实践

- **Prettier**：类似的自动格式化工具
- **ESLint auto-fix**：标准的 ESLint 自动修复机制
- **TypeScript pragma**：标准的 TypeScript pragma 注释机制

### 学习借鉴

- 借鉴了 ESLint 自动修复的最佳实践
- 参考了 TypeScript pragma 的标准用法

## 附录

### 参考资料

- [TypeScript JSX Pragma](https://www.typescriptlang.org/docs/handbook/jsx.html)
- [ESLint Auto-fix](https://eslint.org/docs/latest/use/core-concepts/rule-fixes)
- [RFC-0017: JSX Factory 自动注入 Bug 修复](./0017-jsx-factory-auto-injection-bug-fix.md)

### 讨论记录

**2025-01-20**: 初始讨论
- 考虑 Vite 插件自动注入方案，但发现对 IDE 无效
- 决定采用 ESLint 规则方案，直接修改源文件
- 实现并测试完成

**关键决策**：
- ❌ 放弃 Vite 插件自动注入（对 IDE 无效）
- ✅ 采用 ESLint 规则自动修复（直接修改源文件，IDE 可见）

---

*这个 RFC 记录了 JSX Import Source Pragma 自动注入的完整设计和实现过程。*

