# 设计系统 (Design System)

本目录为 WSXJS 站点与文档的**设计系统**文档。

- **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** — 设计令牌说明、语义变量、使用约定、品牌色与可访问性

实现层：

- **站点令牌**：`site/src/design-system/tokens.css`（单一数据源）
- **站点样式**：`site/src/main.css`（引用 tokens，其余为页面/组件样式）
- **文档主题**：`packages/wsx-press/src/client/styles/theme.css`（与设计系统主色对齐）
