# RFC-0012: Babel Transform 错误处理策略

- **RFC编号**: 0012
- **开始日期**: 2025-12-13
- **状态**: Implemented

## 摘要

修复 Vite 插件中 Babel transform 失败时的静默 fallback 问题。当 Babel 处理 `@state` 装饰器失败时，应该立即停止构建并报告错误，而不是静默 fallback 到 esbuild，导致装饰器在运行时失败。

## 动机

### 问题描述

在 `@wsxjs/wsx-vite-plugin` 中，当 Babel transform 失败时，代码会静默 fallback 到 esbuild：

```typescript
try {
    const babelResult = transformSync(transformedCode, { ... });
    if (babelResult && babelResult.code) {
        transformedCode = babelResult.code;
    }
} catch {
    // Babel transform failed, fallback to esbuild only
}
```

这导致以下问题：

1. **Babel 插件不运行**：`@state` 装饰器没有被处理
2. **装饰器保留在代码中**：`@state` 装饰器保留在输出代码中
3. **运行时失败**：Stage 3 装饰器系统在运行时调用 `@state` 函数，传入 context 对象 `{kind: 'field', name: 'count', ...}`
4. **错误延迟发现**：用户直到运行时才发现问题，而不是在构建时

### 当前状况

- Babel transform 失败时，catch 块静默吞掉错误
- 代码继续执行，使用 esbuild 处理（但装饰器没有被处理）
- 构建成功，但运行时失败
- 错误信息不明确，难以诊断

### 目标用户

所有使用 `@state` 装饰器的 WSX 开发者，特别是在其他项目中集成 WSX 框架时。

## 详细设计

### 核心原则

**编译器错误必须停止构建，不允许 fallback**

这是编译器的基本原则：
- 如果编译步骤失败，整个构建应该失败
- 不应该静默 fallback 到不完整的处理
- 错误应该在构建时发现，而不是运行时

### 实现细节

#### 1. 移除静默 Fallback

```typescript
// ❌ 错误：静默 fallback
} catch {
    // Babel transform failed, fallback to esbuild only
}

// ✅ 正确：抛出错误
} catch (error) {
    throw new Error(
        `[WSX Plugin] Babel transform failed for ${id}. ` +
        `@state decorators will NOT be processed and will cause runtime errors.`
    );
}
```

#### 2. 添加空代码检查

```typescript
if (babelResult && babelResult.code) {
    transformedCode = babelResult.code;
} else {
    // Babel returned no code - critical error
    throw new Error(
        `[WSX Plugin] Babel transform returned no code for ${id}. ` +
        `@state decorators will NOT be processed.`
    );
}
```

#### 3. 改进错误消息

错误消息应该：
- 明确说明问题：Babel transform 失败
- 说明后果：`@state` 装饰器不会被处理
- 提供诊断信息：Babel 错误详情
- 提供解决建议：可能的修复方法

### 错误处理流程

```
Babel Transform
    ↓
成功？
    ├─ 是 → 检查返回代码
    │        ├─ 有代码 → 继续处理
    │        └─ 无代码 → 抛出错误 ❌
    │
    └─ 否 → 抛出错误 ❌
            (不 fallback 到 esbuild)
```

## 与WSX理念的契合度

### 符合核心原则

- ✅ **零运行时开销**：确保装饰器在编译时被处理，避免运行时错误
- ✅ **开发者体验**：在构建时发现错误，而不是运行时
- ✅ **可靠性**：编译器错误应该立即失败，而不是产生错误的输出

### 理念契合说明

WSX 框架强调编译时处理，`@state` 装饰器必须在编译时被 Babel 插件处理。如果编译步骤失败，应该立即停止，而不是产生可能包含未处理装饰器的代码。

## 权衡取舍

### 优势

- **早期错误发现**：在构建时发现 Babel 配置问题
- **明确的错误信息**：用户知道问题所在和如何修复
- **避免运行时错误**：不会产生看似成功但实际失败的构建
- **符合编译器原则**：编译错误应该停止构建

### 劣势

- **构建失败**：如果 Babel 配置有问题，构建会立即失败
- **需要修复配置**：用户必须修复 Babel 配置才能继续

### 替代方案

**方案1：静默 Fallback（已拒绝）**
- ❌ 问题：运行时错误，难以诊断
- ❌ 问题：违反编译器原则

**方案2：警告 + Fallback（已拒绝）**
- ❌ 问题：仍然会产生错误的输出
- ❌ 问题：警告可能被忽略

**方案3：抛出错误（已采用）**
- ✅ 优势：立即发现问题
- ✅ 优势：明确的错误信息
- ✅ 优势：符合编译器原则

## 实现计划

### 阶段规划

1. **阶段1**: 移除静默 fallback，添加错误抛出
2. **阶段2**: 添加空代码检查
3. **阶段3**: 改进错误消息，提供诊断信息

### 实现文件

- `packages/vite-plugin/src/vite-plugin-wsx-babel.ts`

### 关键变更

```typescript
// 移除静默 fallback
- } catch {
-     // Babel transform failed, fallback to esbuild only
- }

// 添加错误抛出
+ } catch (error) {
+     throw new Error(
+         `[WSX Plugin] Babel transform failed for ${id}. ` +
+         `@state decorators will NOT be processed and will cause runtime errors.`
+     );
+ }

// 添加空代码检查
+ if (babelResult && babelResult.code) {
+     transformedCode = babelResult.code;
+ } else {
+     throw new Error(
+         `[WSX Plugin] Babel transform returned no code for ${id}.`
+     );
+ }
```

## 测试策略

### 单元测试

测试 Babel transform 失败时的错误处理：
- Babel 抛出错误时，插件应该抛出错误
- Babel 返回空代码时，插件应该抛出错误
- 错误消息应该包含有用的诊断信息

### 集成测试

测试实际构建场景：
- 配置错误的 Babel 插件
- 语法错误的源文件
- 缺失的 Babel 依赖

## 向后兼容性

### 破坏性变更

- **构建行为变更**：之前构建可能成功（但运行时失败），现在会在构建时失败
- **影响**：如果用户有 Babel 配置问题，构建会立即失败

### 迁移策略

1. **检查 Babel 配置**：确保所有 Babel 插件正确安装
2. **检查文件扩展名**：确保使用 `.wsx` 扩展名或配置 `extensions` 选项
3. **修复语法错误**：确保源文件没有语法错误

## 性能影响

### 构建时性能

- **无影响**：错误检查是 O(1) 操作
- **可能更快**：早期失败避免不必要的处理

### 运行时性能

- **无影响**：这是编译时处理

## 安全考虑

- **无安全影响**：这是编译时错误处理

## 开发者体验

### 错误处理

错误消息应该：
1. 明确说明问题：Babel transform 失败
2. 说明后果：`@state` 装饰器不会被处理
3. 提供诊断：Babel 错误详情
4. 提供建议：可能的修复方法

### 示例错误消息

```
[WSX Plugin] Babel transform failed for /path/to/Component.wsx.
@state decorators will NOT be processed and will cause runtime errors.

Babel Error: Plugin "babel-plugin-wsx-state" not found

This usually means:
1. Babel plugins are not installed correctly
2. Babel configuration is invalid
3. File contains syntax errors that Babel cannot parse

Please fix the Babel error above before continuing.
```

## 实现总结

### 已完成的修复

1. ✅ 移除了静默 fallback
2. ✅ 添加了空代码检查
3. ✅ 改进了错误消息
4. ✅ 确保编译器错误时停止构建

### 关键原则

**编译器错误必须停止构建，不允许 fallback**

这是所有编译器的基本原则，WSX 框架也应该遵循这个原则。

---

*RFC-0012 确保 WSX 框架在编译时错误时能够正确停止，避免产生错误的输出。*
