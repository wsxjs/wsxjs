# RFC 0052: Marked Code Component Theme Support and TOC Scrolling Enhancement

- **Status**: Completed
- **Created**: 2026-01-03
- **Author**: Claude

## Summary

增强 `wsx-marked-code` 组件以支持亮色/暗色主题切换，修复代码显示为原始 HTML 的问题，并改进 TOC 滚动行为使其随内容滚动而非固定在顶部。

## Problem

### 问题 1: 代码被渲染为 HTML 而不是原始文本

**问题现象：**
- 当代码块包含 HTML 标签（如 `<div>`、`<span>` 等）时，这些标签会被浏览器解析为实际的 HTML 元素
- 代码无法正确显示为纯文本

**根本原因：**
- `wsx-marked-code` 组件直接将代码内容放入 JSX，导致 HTML 标签被浏览器解析

### 问题 2: 缺少语法高亮支持

**问题现象：**
- 代码块以纯文本形式显示，没有语法高亮
- 可读性差，用户体验不佳

**根本原因：**
- `wsx-marked-code` 组件没有集成任何语法高亮库
- 虽然项目中已有 `wsx-code-block` 组件使用 Prism.js，但 `wsx-marked-code` 没有使用

### 问题 3: 缺少 WSX 语言支持

**问题现象：**
- WSX 代码无法获得正确的语法高亮
- 装饰器（`@autoRegister`、`@state`）和 Web Component 标签无法高亮

**根本原因：**
- Prism.js 默认不包含 `wsx` 语言的语法高亮支持

### 问题 4: 主题不支持亮色/暗色切换

**问题现象：**
- 代码块始终显示为暗色主题，即使页面处于亮色模式
- 无法根据页面主题自动切换

**根本原因：**
- 导入了 `prismjs/themes/prism-tomorrow.css`，强制使用暗色主题
- CSS 中缺少对 `.light` 和 `[data-theme="light"]` 的显式支持

### 问题 5: 布局问题

**问题现象：**
- 语言标签显示在代码块左侧而不是顶部
- 代码块宽度不是 100%

**根本原因：**
- `.code-container` 缺少 `flex-direction: column` 布局
- 缺少 `width: 100%` 设置

### 问题 6: TOC 固定在顶部

**问题现象：**
- TOC（目录）使用 `position: sticky` 固定在顶部
- 用户希望 TOC 随内容滚动，而不是固定在顶部

**根本原因：**
- `DocTOC.css` 中使用了 `position: sticky` 和 `top: 70px`

## Solution

### 1. 修复代码渲染为 HTML 的问题

**使用 `textContent` 设置代码：**
- 在 `highlightCode()` 方法中使用 `textContent` 而不是直接放入 JSX
- 确保 HTML 代码显示为原始文本

```typescript
// Set code as raw text (prevents HTML rendering)
this.codeElement.textContent = this.code;
```

### 2. 集成 Prism.js 语法高亮

**添加依赖：**
- `packages/marked-components/package.json` 添加 `prismjs: ^1.30.0`
- 添加 `@types/prismjs: ^1.26.5` 开发依赖

**导入语言组件：**
- 导入所有常用语言的 Prism 组件（markup, css, javascript, typescript, jsx, tsx 等）

### 3. 创建 WSX 语言定义

**新建 `prism-wsx.ts`：**
- 基于 TSX 语言定义 WSX 语法规则
- 支持装饰器语法（`@autoRegister`, `@state`）
- 支持 Web Component 自定义元素标签
- 支持 WSX 特定导入

```typescript
Prism.languages.wsx = Prism.languages.extend("tsx", {
    decorator: {
        pattern: /@[\w]+(?:\([^)]*\))?/,
        // ...
    },
    "web-component": {
        pattern: /<\/?[a-z][\w-]*(?:-[\w-]+)+(?:\s|\/?>)/i,
        // ...
    },
});
```

### 4. 移除强制暗色主题，添加主题支持

**移除 Prism 默认主题：**
- 不再导入 `prismjs/themes/prism-tomorrow.css`
- 使用自定义 CSS 支持亮色/暗色主题

**添加显式主题支持：**
- 添加 `.light` 和 `[data-theme="light"]` 选择器
- 添加 `.dark` 和 `[data-theme="dark"]` 选择器
- 支持 `@media (prefers-color-scheme: dark)` 系统主题

### 5. 修复布局问题

**修复语言标签位置：**
- `.code-container` 使用 `display: flex; flex-direction: column`
- 确保语言标签在顶部

**修复宽度：**
- `wsx-marked-code` 和 `.code-container` 都设置 `width: 100%`

### 6. 修复 TOC 滚动行为

**移除固定定位：**
- 移除 `position: sticky`
- 移除 `top: 70px`
- 移除 `max-height: calc(100vh - 70px)`
- 移除 `height: 100%` 和 `overflow-y: auto`

**结果：**
- TOC 现在随内容滚动，不再固定在顶部

## Changes

### packages/marked-components/package.json

```diff
  "dependencies": {
      "@wsxjs/wsx-core": "workspace:*",
      "@wsxjs/wsx-logger": "workspace:*",
      "marked": "^12.0.0",
+     "prismjs": "^1.30.0"
  },
  "devDependencies": {
+     "@types/prismjs": "^1.26.5",
      "@typescript-eslint/eslint-plugin": "^8.37.0",
```

### packages/marked-components/src/Code.wsx

**主要更改：**
- 导入 Prism.js 及所有常用语言组件
- 导入自定义 WSX 语言定义
- 使用 `ref` 获取 `<code>` 元素引用
- 在 `onRendered()` 中使用 `textContent` 设置代码并调用 `Prism.highlightElement()`
- 添加语言别名映射和回退机制
- 添加 `data-prism-highlighted` 标记防止重复高亮

### packages/marked-components/src/prism-wsx.ts (新建)

创建 WSX 语言定义文件，基于 TSX 扩展支持：
- 装饰器语法
- Web Component 标签
- WSX 特定导入

### packages/marked-components/src/Code.css

**主要更改：**
- 移除对 Prism 默认主题的依赖
- 添加完整的亮色/暗色主题支持
- 使用 wsxjs site 设计系统的颜色变量
- 修复布局（`flex-direction: column`，`width: 100%`）
- 添加显式的 `.light` 和 `[data-theme="light"]` 支持
- 添加显式的 `.dark` 和 `[data-theme="dark"]` 支持
- 支持 `@media (prefers-color-scheme: dark)` 系统主题

### packages/wsx-press/src/client/components/DocTOC.css

```diff
  wsx-doc-toc {
      display: flex;
      flex-direction: column;
      width: 240px;
      min-width: 240px;
-     height: 100%;
-     overflow-y: auto;
-     position: sticky;
-     top: 70px; /* Navigation height */
-     max-height: calc(100vh - 70px);
+     /* TOC scrolls with content instead of staying fixed at top */
  }
```

## Features

### 语法高亮支持的语言

- **标记语言**: markup (html/xml/svg), markdown
- **样式语言**: css, scss, sass, less, stylus
- **脚本语言**: javascript, typescript, python, java, c, cpp, rust, go
- **JSX 变体**: jsx, tsx, **wsx** (新增)
- **数据格式**: json, yaml
- **其他**: bash/shell, sql

### 主题支持

- ✅ 亮色主题（使用 wsxjs site 设计系统颜色）
- ✅ 暗色主题（Monokai 风格）
- ✅ 系统主题检测（`prefers-color-scheme`）
- ✅ 显式主题类（`.light`, `.dark`）
- ✅ 主题属性（`[data-theme="light"]`, `[data-theme="dark"]`）

### WSX 特定高亮

- 装饰器（`@autoRegister`, `@state`）使用橙色高亮
- Web Component 标签使用紫色/绿色高亮（根据主题）

## Testing

### 验证步骤

1. **代码原始 HTML 显示：**
   - 在 markdown 中添加包含 HTML 标签的代码块
   - 验证 HTML 标签显示为文本而不是被解析

2. **语法高亮：**
   - 测试各种语言的代码块
   - 验证 WSX 代码有正确的语法高亮
   - 验证装饰器和 Web Component 标签高亮

3. **主题切换：**
   - 切换页面主题（亮色/暗色）
   - 验证代码块自动切换主题
   - 验证语法高亮颜色正确

4. **布局：**
   - 验证语言标签在代码块顶部
   - 验证代码块宽度为 100%

5. **TOC 滚动：**
   - 滚动页面内容
   - 验证 TOC 随内容滚动，不固定在顶部

### 预期结果

- ✅ 代码块正确显示原始 HTML 文本
- ✅ 所有支持的语言都有语法高亮
- ✅ WSX 代码有正确的语法高亮
- ✅ 代码块根据页面主题自动切换
- ✅ 语言标签在代码块顶部
- ✅ 代码块宽度为 100%
- ✅ TOC 随内容滚动

## Migration

### 对于用户

**无需迁移** - 这些更改是向后兼容的增强功能。

**可选优化：**
- 如果之前依赖 `wsx-marked-code` 的特定样式，可能需要检查样式是否与新的主题系统兼容
- 如果使用自定义 CSS 覆盖代码块样式，可能需要更新以支持新的主题变量

### 对于开发者

**构建要求：**
- 需要运行 `pnpm install` 安装新的 `prismjs` 依赖
- 需要重新构建 `marked-components` 包

## Performance Impact

### 构建时

- **包大小增加**: ~177KB (gzipped: ~43KB) - 包含 Prism.js 核心和所有语言组件
- **构建时间**: 无明显影响

### 运行时

- **初始加载**: Prism.js 在组件首次渲染时加载
- **语法高亮**: 使用 `requestAnimationFrame` 异步执行，不影响主线程
- **内存**: 每个代码块元素缓存高亮状态，避免重复高亮

## References

- [Prism.js Documentation](https://prismjs.com/)
- [Prism.js Language Definitions](https://prismjs.com/#supported-languages)
- [WCAG AA Contrast Ratios](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [CSS prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)

## Related RFCs

- [RFC 0024: Documentation System](./0024-documentation-system.md) - wsx-press 文档系统设计
- [RFC 0050: TOC Anchor Scrolling Fix](./completed/0050-toc-anchor-scrolling-fix.md) - TOC 锚点滚动修复
