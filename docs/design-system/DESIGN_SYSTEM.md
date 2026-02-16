# WSXJS 设计系统 (Design System)

本站点与文档系统共用一套设计令牌，保证视觉与交互一致。

## 1. 概述

- **单一数据源**：`site/src/design-system/tokens.css`
- **主题**：深红橘色 (Red-Orange)，支持亮/暗模式
- **兼容层**：现有 CSS 变量名（如 `--primary-red`、`--text-primary`）映射到设计系统语义令牌，无需一次性改完所有引用

## 2. 令牌结构

### 2.1 原始令牌 (Primitives) — 不随主题变化

| 类别 | 变量前缀 | 说明 |
|------|----------|------|
| 品牌色阶 | `--ds-color-brand-{50..900}` | 从浅到深，500/600 为主色 |
| 间距 | `--ds-space-{0,1,2,3,4,5,6,8,10,12,16,20,24,40}` | 4px 为基数的比例 |
| 圆角 | `--ds-radius-{sm,md,lg,xl,2xl}` | 4px ~ 20px |
| 字体 | `--ds-font-sans`, `--ds-font-mono` | 系统栈与等宽 |
| 字号 | `--ds-font-size-{xs..5xl}` | 12px ~ 48px |
| 字重 | `--ds-font-weight-{normal,medium,semibold,bold}` | 400/500/600/700 |
| 行高 | `--ds-line-height-{tight,normal,relaxed,loose}` | 1.25 ~ 1.75 |
| 动效 | `--ds-duration-{fast,base,slow}`, `--ds-ease` | 150/200/300ms |
| 阴影 | `--ds-shadow-{sm,md,lg,xl}` | 中性阴影 |
| 布局 | `--ds-nav-height`, `--ds-container-max`, `--ds-content-max` | 导航高度、容器最大宽 |

### 2.2 语义令牌 (Semantic) — 随亮/暗主题变化

| 用途 | 变量名 | 说明 |
|------|--------|------|
| 主色 | `--ds-color-primary`, `--ds-color-primary-hover` | 按钮、链接、焦点 |
| 强调色 | `--ds-color-accent`, `--ds-color-accent-light` | 渐变、徽章 |
| 背景 | `--ds-color-bg-primary`, `--ds-color-bg-secondary`, `--ds-color-bg-elevated` | 页面、卡片、浮层 |
| 文字 | `--ds-color-text-primary`, `--ds-color-text-secondary`, `--ds-color-text-muted` | 标题、正文、辅助 |
| 边框 | `--ds-color-border`, `--ds-color-border-strong` | 分割线、输入框 |
| 焦点 | `--ds-color-focus-ring`, `--ds-color-focus-ring-offset` | 键盘焦点环 |
| 阴影 | `--ds-shadow-card`, `--ds-shadow-card-hover`, `--ds-shadow-button*` | 卡片、按钮阴影 |

### 2.3 主题切换

- **系统偏好**：`prefers-color-scheme: dark` 下自动使用暗色语义令牌（除非被覆盖）
- **显式主题**：在 `<html>` 或容器上设置 `data-theme="light"` 或 `data-theme="dark"`，或类名 `.light` / `.dark`，可覆盖系统偏好

## 3. 使用约定

### 3.1 在站点 CSS 中

- **新样式**：优先使用 `--ds-*` 语义令牌。
- **旧样式**：可继续使用 `--primary-red`、`--text-primary` 等，它们已映射到设计系统。

示例：

```css
.new-card {
    padding: var(--ds-space-6);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-color-bg-elevated);
    color: var(--ds-color-text-primary);
    box-shadow: var(--ds-shadow-md);
}
```

### 3.2 在组件中

- 使用 `var(--ds-color-primary)` 而非硬编码 `#dc2626`。
- 间距、圆角、字号尽量用 `--ds-space-*`、`--ds-radius-*`、`--ds-font-size-*`。

### 3.3 与 WSX-Press 文档主题对齐

- 文档包 `packages/wsx-press` 的 `theme.css` 中 `--wsx-press-accent` 与主站主色一致（#dc2626）。
- 若站点引用设计系统令牌，文档主题可通过引用同一令牌或保持当前 hex 与主色一致即可。

## 4. 层叠层 (@layer)

设计系统使用 **CSS Cascade Layers** 控制优先级，避免与组件样式发生特异性竞争：

- **`@layer design-system`**：`tokens.css` 内全部内容置于此层（令牌与兼容层）。
- **`main.css`** 中声明顺序：`@layer design-system, components;`，随后 `@import` tokens。页面与组件样式不放入 layer，因此**优先级高于** `design-system` 层，在同等特异性下可覆盖令牌默认值。

效果：组件或页面需要覆盖设计系统变量或基于令牌的样式时，无需提高选择器特异性，直接写规则即可生效。

## 5. 文件与引用

| 文件 | 说明 |
|------|------|
| `site/src/design-system/tokens.css` | 设计令牌定义与兼容层，整体包在 `@layer design-system { }` 中 |
| `site/src/main.css` | `@layer design-system, components;` + `@import "design-system/tokens.css";`，其余为未分层页面/组件样式 |

## 6. 品牌色参考

- **Primary**: `#dc2626` (red-600)
- **Primary Hover**: `#b91c1c` (red-700)
- **Accent**: `#ea580c` (orange-600)
- **Light 背景**: `#fef2e5`, `#fde8d1`
- **Dark 背景**: `#1a1a1a`, `#2d2d2d`

## 7. 可访问性

- 焦点环使用 `--ds-color-focus-ring`，保证键盘焦点可见。
- 正文与背景对比符合 WCAG AA；重要操作使用主色与足够对比。
- 支持 `prefers-reduced-motion`，在 `main.css` 中已有对应处理。
