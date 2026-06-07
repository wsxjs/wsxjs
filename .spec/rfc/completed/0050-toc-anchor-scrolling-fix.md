# RFC 0050: TOC Anchor Scrolling Fix

- **Status**: Completed
- **Created**: 2026-01-17
- **Author**: Claude

## Summary

修复 wsx-press 文档系统中 TOC（目录）锚点滚动功能失效的问题。点击 TOC 链接时，浏览器无法正确滚动到对应的标题位置。

## Problem

### 问题现象

1. TOC 侧边栏链接的 `href` 属性值错误（如 `href="#"` 或 `href="#3-eslint-"`）
2. Heading 元素的 `id` 属性与 TOC 链接不匹配
3. 中文标题的 ID 生成不正确，中文字符被移除

### 根本原因

**三个文件的 `generateId` 函数使用了不一致的算法：**

| 文件 | 正则表达式 | 问题 |
|------|-----------|------|
| `toc.ts` (服务端) | `[^\p{L}\p{N}_-]` | 下划线保留，但中文处理可能有问题 |
| `marked-utils.ts` (客户端) | `[^\p{L}\p{N}_-]` | 同上 |
| `DocTOC.wsx` (客户端) | `[^\w\s-]` | `\w` 只匹配 ASCII，中文被完全移除 |

**数据流问题：**

1. 服务端 `toc.ts` 生成 TOC JSON，ID 中中文被移除（如 `"id": "3-eslint-"`）
2. 客户端 `marked-utils.ts` 生成 Heading ID，算法不一致
3. DocTOC 渲染时使用服务端数据的错误 ID
4. 导致 `href="#3-eslint-"` 与 `id="3-eslint-配置"` 不匹配

## Solution

### 1. 统一 `generateId` 算法

修改三个文件使用相同的正则表达式：

```typescript
function generateId(text: string): string {
    return text
        .toLowerCase()
        .replace(/\s+/g, "-")           // 空格转连字符
        .replace(/[^\p{L}\p{N}\-]/gu, "") // 保留字母、数字、连字符（Unicode-aware）
        .replace(/-+/g, "-")            // 合并多个连字符
        .replace(/^-+|-+$/g, "");       // 移除首尾连字符
}
```

**关键修改：** `[^\p{L}\p{N}\-]` 正确保留所有 Unicode 字母（包括中文）和数字。

### 2. 修改的文件

- `packages/wsx-press/src/node/toc.ts` - 服务端 TOC 生成
- `packages/marked-components/src/marked-utils.ts` - 客户端 Heading ID 生成
- `packages/wsx-press/src/client/components/DocTOC.wsx` - TOC 组件 fallback

### 3. DocTOC 改进

**`setupHeadingIds` 方法：**
- 不再重新生成 ID，而是使用 Heading 组件已设置的 ID
- 从 `wsx-marked-heading` 内部的 `h1-h6` 元素获取 ID

**`handleTOCClick` 方法：**
- 添加 `document.getElementById` fallback
- 添加日志警告便于调试

### 4. DocPage 滚动改进

**`scrollToHash` 方法：**
- 添加重试机制（最多 5 次，间隔 100ms）
- 处理异步渲染内容的情况

## Changes

### packages/wsx-press/src/node/toc.ts

```diff
 function generateId(text: string): string {
     return text
         .toLowerCase()
-        .replace(/\s+/g, "-")
-        .replace(/[^\p{L}\p{N}_-]/gu, "")
+        .replace(/\s+/g, "-")           // 空格转连字符
+        .replace(/[^\p{L}\p{N}\-]/gu, "") // 保留字母、数字、连字符（Unicode-aware）
         .replace(/-+/g, "-")
         .replace(/^-+|-+$/g, "");
 }
```

### packages/marked-components/src/marked-utils.ts

```diff
 export function generateId(text: string): string {
     return text
         .toLowerCase()
-        .replace(/\s+/g, "-")
-        .replace(/[^\p{L}\p{N}_-]/gu, "")
+        .replace(/\s+/g, "-")           // 空格转连字符
+        .replace(/[^\p{L}\p{N}\-]/gu, "") // 保留字母、数字、连字符（Unicode-aware）
         .replace(/-+/g, "-")
         .replace(/^-+|-+$/g, "");
 }
```

### packages/wsx-press/src/client/components/DocTOC.wsx

```diff
 private generateId(text: string): string {
     return text
         .toLowerCase()
-        .replace(/[^\w\s-]/g, "")
-        .replace(/\s+/g, "-")
+        .replace(/\s+/g, "-")           // 空格转连字符
+        .replace(/[^\p{L}\p{N}\-]/gu, "") // 保留字母、数字、连字符（Unicode-aware）
         .replace(/-+/g, "-")
-        .trim();
+        .replace(/^-+|-+$/g, "");
 }
```

## Testing

### 验证步骤

1. 重新构建项目生成新的 TOC JSON
2. 检查 `docs-toc.json` 中的 ID 包含中文（如 `"id": "3-eslint-配置"`）
3. 检查渲染的 Heading 元素 ID（如 `id="3-eslint-配置"`）
4. 检查 TOC 链接 href（如 `href="#3-eslint-配置"`）
5. 点击 TOC 链接，验证页面滚动到正确位置

### 预期结果

- TOC 链接：`<a href="#3-eslint-配置">3. ESLint 配置</a>`
- Heading 元素：`<h6 id="3-eslint-配置">3. ESLint 配置</h6>`
- 点击链接后页面平滑滚动到对应标题

## Migration

用户需要在更新代码后重新构建项目以生成新的 TOC JSON 数据：

```bash
pnpm build
```

## References

- Unicode Property Escapes: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Unicode_Property_Escapes
- `\p{L}` - 匹配任何语言的字母
- `\p{N}` - 匹配任何数字
