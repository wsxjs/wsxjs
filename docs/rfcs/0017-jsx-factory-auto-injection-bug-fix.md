# RFC-0017: JSX Factory 自动注入 Bug 修复

- **RFC编号**: 0017
- **开始日期**: 2025-07-15
- **状态**: Implemented
- **作者**: WSX Team

## 摘要

修复 WSX Vite 插件中 JSX factory 自动注入功能的 Bug。该 Bug 导致插件无法正确检测 JSX factory 函数（`h` 和 `Fragment`）是否已导入，从而错误地跳过了自动注入，导致运行时错误 `ReferenceError: Can't find variable: h`。

## 动机

### 问题描述

WSX Vite 插件应该自动在 `.wsx` 文件中注入 JSX factory 导入（`h` 和 `Fragment`），但存在一个严重的 Bug：

1. **构建成功但运行时失败**：构建过程成功完成，但在浏览器中运行时出现 `ReferenceError: Can't find variable: h`
2. **检测逻辑错误**：插件错误地认为 JSX factory 已经导入，跳过了自动注入
3. **假阳性匹配**：简单的字符串匹配导致误判

### 问题场景

```typescript
// 用户代码
import { WebComponent, autoRegister } from "@wsxjs-core";

@autoRegister()
export class ColorPicker extends WebComponent {
    render() {
        return <div>Color Picker</div>; // JSX 被转换为 h() 调用
    }
}
```

**期望行为**：
- 插件应该检测到缺少 `h` 和 `Fragment` 导入
- 自动注入：`import { h, Fragment } from "@wsxjs-core";`

**实际行为**：
- 插件错误地认为 `h` 已导入（假阳性）
- 跳过了自动注入
- 运行时失败：`ReferenceError: Can't find variable: h`

### 为什么需要这个修复？

1. **关键功能失效**：自动注入是 WSX 的核心功能之一
2. **用户体验差**：开发者需要手动添加导入，违背了"零配置"的设计理念
3. **难以诊断**：错误发生在运行时，而不是构建时
4. **影响范围广**：所有使用 JSX 的组件都受影响

## 详细设计

### 根本原因分析

#### Bug 位置

问题出现在 `vite-plugin-wsx.ts` 中的 JSX factory 导入检测逻辑：

```typescript
// Buggy code
const hasJSXInImport =
  hasWSXCoreImport &&
  (code.includes(`, ${jsxFactory}`) ||
    code.includes(`{ ${jsxFactory}`) ||
    code.includes(`, ${jsxFragment}`) ||
    code.includes(`{ ${jsxFragment}`));
```

#### 为什么失败？

1. **过于宽泛的检测**：`code.includes('{ h')` 匹配了任何包含 `{ h` 的字符串
2. **假阳性匹配**：在导入语句 `import { WebComponent, autoRegister }` 中，`{ WebComponent` 包含了 `{ h`（因为 `WebComponent` 包含字母 `h`）
3. **逻辑缺陷**：插件错误地认为 JSX factory 已经导入，跳过了注入

#### 具体案例

```typescript
// 这个导入语句
import { WebComponent, autoRegister } from "@wsxjs-core";

// 被错误地匹配为包含 'h'
// 因为 'WebComponent' 包含字母 'h'
// code.includes('{ h') 返回 true（假阳性）
```

### 解决方案

#### 修复实现

使用精确的正则表达式替代简单的字符串匹配：

```typescript
// Fixed code
const hasJSXInImport = hasWSXCoreImport && (
  new RegExp(`[{,]\\s*${jsxFactory}\\s*[},]`).test(code) ||
  new RegExp(`[{,]\\s*${jsxFragment}\\s*[},]`).test(code)
);
```

#### 为什么这个修复有效？

1. **精确匹配**：`[{,]\\s*h\\s*[},]` 只匹配作为导入项的 `h`
2. **空白处理**：`\\s*` 处理标识符周围的可选空格
3. **边界检测**：`[{,]` 和 `[},]` 确保匹配完整的导入项

#### 正则表达式说明

```typescript
[{,]\\s*h\\s*[},]
```

- `[{,]` - 匹配 `{` 或 `,`（导入项的开始）
- `\\s*` - 匹配零个或多个空白字符
- `h` - 匹配字面量 `h`
- `\\s*` - 匹配零个或多个空白字符
- `[},]` - 匹配 `}` 或 `,`（导入项的结束）

### 验证

修复后的调试输出：

```
[WSX Plugin] Checking JSX imports for: ColorPicker.wsx
  - hasWSXCoreImport: true
  - hasJSXInImport: false ✓ (correctly detected as missing)
  - has < character: true
  - has Fragment: false
[WSX Plugin] Added JSX factory import to: ColorPicker.wsx ✓
```

## 测试用例

### 应该跳过注入的情况（已存在导入）

```typescript
// ✅ 已导入 h
import { WebComponent, h, Fragment } from "@wsxjs-core";

// ✅ 已导入 Fragment
import { WebComponent, Fragment } from "@wsxjs-core";

// ✅ 已导入两者
import { WebComponent, h, Fragment, autoRegister } from "@wsxjs-core";
```

### 应该注入的情况（缺少导入）

```typescript
// ✅ 缺少 h 和 Fragment
import { WebComponent, autoRegister } from "@wsxjs-core";

// ✅ 有其他导入但缺少 JSX factory
import { WebComponent, StyleManager } from "@wsxjs-core";

// ✅ 原始 Bug 案例（假阳性）
import { WebComponent, autoRegister } from "@wsxjs-core";
// 不应该被误判为已导入 'h'
```

## 影响评估

### 修复前

- ❌ 运行时错误：`ReferenceError: Can't find variable: h`
- ❌ WSX 组件无法正常工作
- ❌ 需要手动添加导入（违背零配置理念）
- ❌ 难以诊断问题

### 修复后

- ✅ 自动 JSX factory 注入正常工作
- ✅ 无运行时错误
- ✅ 无缝的开发者体验
- ✅ 插件行为符合设计预期

## 预防措施

1. **全面的测试套件**：为导入检测逻辑添加单元测试
2. **正则验证**：使用精确的正则表达式进行字符串匹配
3. **调试日志**：增强日志记录以便故障排除
4. **集成测试**：端到端测试插件管道

## 与WSX理念的契合度

### 符合核心原则

- ✅ **零配置**：自动注入确保开发者无需手动配置
- ✅ **信任浏览器**：使用标准 JavaScript 正则表达式
- ✅ **开发者体验**：修复后提供无缝的开发体验

### 理念契合说明

这个修复完全符合 WSX 的"零配置"理念：
- 开发者不应该关心 JSX factory 的导入
- 插件应该自动处理这些细节
- 错误应该在构建时发现，而不是运行时

## 权衡取舍

### 优势

- ✅ **精确匹配**：正则表达式确保准确检测
- ✅ **向后兼容**：不影响已正确导入的情况
- ✅ **性能影响小**：正则表达式匹配性能优秀

### 劣势

- ⚠️ **复杂度增加**：正则表达式比简单字符串匹配复杂
- ⚠️ **维护成本**：需要维护正则表达式模式

### 替代方案

考虑过的其他方案：
1. **AST 解析**：使用 AST 解析器分析导入语句，但增加了依赖和复杂度
2. **更复杂的字符串匹配**：但难以处理所有边界情况
3. **强制要求导入**：要求开发者手动导入，但违背零配置理念

最终选择正则表达式方案，因为它：
- 精确且可靠
- 无额外依赖
- 性能优秀
- 易于理解和维护

## 相关文档

- [RFC-0012: Babel Transform 错误处理策略](./0012-babel-transform-error-handling.md)
- [Vite Plugin 文档](../packages/vite-plugin/README.md)

## 总结

通过使用精确的正则表达式替代简单的字符串匹配，我们成功修复了 JSX factory 自动注入的 Bug。这个修复确保了：

1. ✅ **自动注入正常工作** - JSX factory 函数正确注入
2. ✅ **零配置体验** - 开发者无需关心导入细节
3. ✅ **构建时错误检测** - 问题在构建时发现，而不是运行时
4. ✅ **向后兼容** - 不影响已正确导入的情况

这个修复恢复了 WSX 框架的"零配置"核心特性，提供了无缝的开发者体验。

