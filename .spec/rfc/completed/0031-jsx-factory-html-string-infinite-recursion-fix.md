# RFC-0031: JSX Factory HTML 字符串解析无限递归修复

- **RFC编号**: 0031
- **开始日期**: 2025-01-28
- **状态**: Implemented
- **作者**: WSX Team

## 摘要

修复 JSX Factory 中 HTML 字符串自动解析功能导致的无限递归问题，该问题会导致 Chrome 浏览器崩溃。通过改进 HTML 检测算法、添加递归保护机制和优化解析流程，确保 HTML 字符串解析功能的稳定性和正确性。

## 动机

### 问题描述

JSX Factory 实现了自动检测和解析 HTML 字符串的功能，允许开发者直接将 HTML 字符串传递给 JSX，框架会自动将其转换为 DOM 节点。然而，初始实现存在严重的无限递归问题，导致浏览器崩溃。

### 问题表现

1. **浏览器崩溃**：Chrome 浏览器出现 `RangeError: Maximum call stack size exceeded` 错误
2. **无限递归**：`flattenChildren` 函数陷入无限递归循环
3. **性能问题**：即使不崩溃，也会导致严重的性能问题

### 问题场景

**场景 1：基本无限递归**

```typescript
// 用户代码
render() {
    return <div>{this.htmlContent}</div>; // htmlContent = "<p>Hello</p>"
}

// 执行流程
1. flattenChildren() 检测到 "<p>Hello</p>" 是 HTML 字符串
2. 调用 parseHTMLToNodes("<p>Hello</p>")
3. parseHTMLToNodes 返回: [HTMLElement(<p>), "Hello"]
4. ❌ 问题：递归调用 flattenChildren([HTMLElement, "Hello"], true)
5. 如果 "Hello" 中包含 < 或 >，可能再次被误判为 HTML
6. 无限递归 → Chrome 崩溃
```

**场景 2：文本节点包含特殊字符**

```typescript
// HTML 字符串: "<p>Text with < and > symbols</p>"
1. parseHTMLToNodes 解析后返回: [HTMLElement(<p>), "Text with < and > symbols"]
2. 文本节点 "Text with < and > symbols" 包含 < 和 >
3. ❌ 问题：如果再次检测 HTML，可能被误判
4. 导致无限递归
```

**场景 3：嵌套 HTML 字符串**

```typescript
// 多层嵌套的 HTML 字符串
const html1 = "<div><p>Level 1</p></div>";
const html2 = "<div>" + html1 + "</div>";

// 如果递归处理，可能导致深度过深
```

### 为什么需要这个修复？

1. **关键功能失效**：HTML 字符串自动解析是 WSX 的核心功能之一，用于支持 Markdown 渲染器等场景
2. **用户体验差**：浏览器崩溃严重影响开发体验
3. **难以诊断**：错误发生在运行时，难以定位问题根源
4. **影响范围广**：所有使用 HTML 字符串的场景都受影响

## 根本原因分析

### 问题根源

1. **递归调用链过长**：
   - `flattenChildren` 检测到 HTML 字符串后，调用 `parseHTMLToNodes` 解析
   - 然后递归调用 `flattenChildren` 处理解析后的节点数组
   - 即使设置了 `skipHTMLDetection = true`，仍然可能触发其他路径的检测

2. **HTML 检测过于宽松**：
   - 原来的正则表达式 `/<[a-z][\s\S]*>/i` 过于宽松
   - 可能误判包含 `<` 和 `>` 的纯文本为 HTML
   - 例如：`"a < b"` 可能被误判为 HTML

3. **文本节点可能包含特殊字符**：
   - `parseHTMLToNodes` 返回的文本节点可能包含 `<` 或 `>`
   - 如果这些文本节点再次被检测为 HTML，会导致无限递归

4. **缺少递归保护**：
   - 没有深度限制机制
   - 没有错误恢复机制

## 详细设计

### 修复方案

#### 1. 更严格的 HTML 检测算法

**之前的问题**：
```typescript
// 过于宽松的检测
const htmlTagPattern = /<[a-z][\s\S]*>/i;
```

**修复后**：
```typescript
function isHTMLString(str: string): boolean {
    const trimmed = str.trim();
    if (!trimmed) return false;

    // 更严格的检测：必须包含完整的 HTML 标签
    // 1. 必须以 < 开头
    // 2. 后面跟着字母（标签名）
    // 3. 必须包含 > 来闭合标签
    // 4. 排除单独的 < 或 > 符号（如数学表达式 "a < b"）
    const htmlTagPattern = /<[a-z][a-z0-9]*(\s[^>]*)?(\/>|>)/i;

    // 额外检查：确保不是纯文本中的 < 和 >（如 "a < b" 或 "x > y"）
    const looksLikeMath = /^[^<]*<[^>]*>[^>]*$/.test(trimmed) && !htmlTagPattern.test(trimmed);
    if (looksLikeMath) return false;

    return htmlTagPattern.test(trimmed);
}
```

**改进点**：
- 要求完整的标签结构（开始标签 + `>` 或自闭合标签）
- 排除数学表达式等纯文本场景
- 更准确地识别真正的 HTML 字符串

#### 2. 关键修复：不再递归处理已解析的节点

**之前的问题**：
```typescript
// ❌ 仍然递归调用
const nodes = parseHTMLToNodes(child);
result.push(...flattenChildren(nodes, true, depth + 1));
```

**修复后**：
```typescript
// ✅ 直接添加，不再递归
const nodes = parseHTMLToNodes(child);
if (nodes.length > 0) {
    // 直接添加解析后的节点，不再递归处理（避免无限递归）
    // parseHTMLToNodes 已经完成了所有解析工作
    for (const node of nodes) {
        if (typeof node === "string") {
            // 文本节点直接添加，不再检测 HTML（已解析）
            result.push(node);
        } else {
            // DOM 元素直接添加
            result.push(node);
        }
    }
}
```

**为什么这样有效**：
- `parseHTMLToNodes` 已经完成了所有解析工作
- 返回的节点（元素或文本）无需再次处理
- 直接添加避免了再次进入 `flattenChildren` 的递归逻辑
- 文本节点直接添加，不会再次被检测为 HTML

#### 3. 递归深度限制

```typescript
function flattenChildren(
    children: JSXChildren[],
    skipHTMLDetection: boolean = false,
    depth: number = 0
) {
    // 防止无限递归：如果深度超过 10，停止处理
    if (depth > 10) {
        console.warn(
            "[WSX] flattenChildren: Maximum depth exceeded, treating remaining children as text"
        );
        return children.filter(
            (child): child is string | number =>
                typeof child === "string" || typeof child === "number"
        );
    }
    // ...
}
```

**作用**：
- 作为最后一道防线，防止极端情况下的无限递归
- 超过深度限制时，安全回退到纯文本处理

#### 4. 错误处理机制

```typescript
try {
    const nodes = parseHTMLToNodes(child);
    // ...
} catch (error) {
    // 如果解析失败，回退到纯文本，避免崩溃
    console.warn("[WSX] Failed to parse HTML string, treating as text:", error);
    result.push(child);
}
```

**作用**：
- 防止 HTML 解析失败导致崩溃
- 提供优雅的错误恢复机制

### 修复后的流程

```
1. JSX 中传入 HTML 字符串: "<p>Hello</p>"
   ↓
2. flattenChildren() 检测到是 HTML 字符串
   ↓
3. 调用 parseHTMLToNodes("<p>Hello</p>")
   ↓
4. parseHTMLToNodes 返回: [HTMLElement(<p>), "Hello"]
   ↓
5. ✅ 直接添加节点，不再递归
   - HTMLElement(<p>) → 直接添加到 result
   - "Hello" → 直接添加到 result（不再检测 HTML）
   ↓
6. 完成！没有无限递归
```

## 实现细节

### 代码变更

**文件**: `packages/core/src/jsx-factory.ts`

1. **改进 `isHTMLString` 函数**：
   - 使用更严格的正则表达式
   - 添加数学表达式检测
   - 确保只检测真正的 HTML 标签

2. **修改 `flattenChildren` 函数**：
   - 添加 `skipHTMLDetection` 参数
   - 添加 `depth` 参数
   - 直接添加 `parseHTMLToNodes` 返回的节点，不再递归

3. **添加保护机制**：
   - 深度限制（最大 10 层）
   - 错误处理（try-catch）
   - 警告日志

### 测试覆盖

创建了详尽的测试套件（92 个测试用例），覆盖：

1. **基本 HTML 字符串解析**（5 个测试）
2. **特殊字符处理**（5 个测试）
3. **边界情况**（9 个测试）
4. **深度嵌套和复杂结构**（3 个测试）
5. **防止无限递归**（3 个测试）
6. **数组和 Fragment 处理**（3 个测试）
7. **错误处理和异常情况**（3 个测试）
8. **性能和深度限制**（2 个测试）
9. **实际使用场景**（3 个测试）
10. **SVG 元素处理**（3 个测试）
11. **自定义元素（Web Components）**（3 个测试）
12. **表单元素**（5 个测试）
13. **表格元素**（2 个测试）
14. **媒体元素**（3 个测试）
15. **特殊属性处理**（5 个测试）
16. **Unicode 和特殊字符**（6 个测试）
17. **脚本和样式标签**（4 个测试）
18. **列表和导航**（3 个测试）
19. **复杂嵌套场景**（2 个测试）
20. **Markdown 渲染器实际场景**（5 个测试）
21. **性能和压力测试**（3 个测试）
22. **边缘情况和错误恢复**（4 个测试）
23. **条件渲染场景**（3 个测试）
24. **parseHTMLToNodes 函数测试**（5 个测试）

## 向后兼容性

- ✅ **API 保持不变**：`h()` 函数的签名和行为保持不变
- ✅ **功能增强**：HTML 字符串解析功能更加稳定和可靠
- ✅ **性能提升**：避免了无限递归，提升了性能
- ✅ **错误处理**：添加了错误恢复机制，提高了健壮性

## 迁移指南

**无需迁移**：此修复是向后兼容的，现有代码无需修改。

**推荐做法**：

1. **使用 HTML 字符串**：
   ```typescript
   // ✅ 推荐：直接使用 HTML 字符串
   render() {
       return <div>{this.htmlContent}</div>;
   }
   ```

2. **显式解析（可选）**：
   ```typescript
   // 如果需要更多控制，可以使用 parseHTMLToNodes
   import { parseHTMLToNodes } from "@wsxjs/wsx-core";
   
   render() {
       const nodes = parseHTMLToNodes(this.htmlContent);
       return <div>{nodes}</div>;
   }
   ```

## 测试计划

### 单元测试

- ✅ 92 个测试用例全部通过
- ✅ 覆盖所有边界情况和错误场景
- ✅ 性能测试验证大量和深度嵌套场景

### 集成测试

- ✅ Markdown 渲染器场景测试通过
- ✅ 实际项目使用场景验证

### 浏览器测试

- ✅ Chrome 浏览器不再崩溃
- ✅ 所有功能正常工作

## 性能影响

### 修复前

- ❌ 无限递归导致浏览器崩溃
- ❌ 性能严重下降

### 修复后

- ✅ 无递归问题
- ✅ 性能正常
- ✅ 大量 HTML 字符串（1000 个元素）处理时间 < 100ms
- ✅ 深度嵌套（20 层）处理正常

## 相关 RFC

- RFC-0017: JSX Factory 自动注入 Bug 修复
- RFC-0030: rerender() 调度机制重构

## 未解决的问题

无

## 总结

此修复解决了 JSX Factory 中 HTML 字符串自动解析功能的无限递归问题，通过以下关键改进：

1. **更严格的 HTML 检测**：避免误判纯文本为 HTML
2. **直接添加已解析节点**：避免不必要的递归调用
3. **递归深度限制**：防止极端情况
4. **错误处理机制**：提供优雅的错误恢复

修复后，HTML 字符串解析功能稳定可靠，支持各种使用场景，包括 Markdown 渲染器、动态内容渲染等。

