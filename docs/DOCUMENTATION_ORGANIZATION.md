# WSXJS 文档组织最佳实践

本文档说明如何组织和维护 WSXJS 文档，遵循开源框架（Vue.js、Svelte）的最佳实践。

## 目录结构

文档按学习路径组织，分为三个主要分类：

```
docs/
├── guide/
│   ├── essentials/          # 基础入门（必读）
│   ├── core-concepts/       # 核心概念
│   └── advanced/            # 高级主题
```

### Essentials（基础入门）

新用户必读文档，包括：
- 快速开始指南
- 安装和配置
- TypeScript 设置

**文件命名示例**：
- `getting-started.md` (order: 1)
- `installation.md` (order: 2)
- `typescript-setup.md` (order: 3)

### Core Concepts（核心概念）

框架的核心概念和设计理念：
- Web Components 基础
- Light Components
- JSX 支持
- 设计哲学

**文件命名示例**：
- `web-components.md` (order: 1)
- `light-components.md` (order: 2)
- `jsx-support.md` (order: 3)
- `design-philosophy.md` (order: 4)

### Advanced（高级主题）

高级用法和优化技巧：
- DOM 缓存
- TypeScript 类型系统
- 第三方库集成
- 发布指南

**文件命名示例**：
- `dom-cache.md` (order: 1)
- `typescript-wsx-types.md` (order: 2)
- `i18next-integration.md` (order: 3)
- `publishing.md` (order: 4)

## Frontmatter 规范

每个文档必须包含 frontmatter，用于元数据管理：

```yaml
---
title: 快速开始
order: 1
category: guide/essentials
description: 5分钟上手 WSXJS，从安装到创建第一个组件
---
```

### 必需字段

- **`title`**: 文档标题（用于侧边栏和页面标题）
- **`order`**: 显示顺序（数字越小越靠前）
- **`category`**: 文档分类（用于侧边栏分组）

### 可选字段

- **`description`**: 文档描述（用于 SEO 和搜索）
- **`tags`**: 标签数组（用于搜索和分类）

## 文件命名规范

- ✅ **使用 kebab-case**：`getting-started.md`, `web-components.md`
- ❌ **避免大写和下划线**：`QUICK_START.md`, `WebComponent.md`

## 文档顺序管理

使用 `order` 字段控制文档在侧边栏和导航中的显示顺序：

```markdown
---
title: Quick Start
order: 1
category: guide/essentials
---

# Quick Start

这是快速开始文档，会显示在其他文档之前。
```

**排序规则**：
- `order` 值越小，排序越靠前
- 有 `order` 的文档排在无 `order` 的文档之前
- 都没有 `order` 时按标题字母顺序排序

## 内容组织原则

### 1. 清晰的标题层级

```markdown
# 主标题（H1，每个文档只有一个）

## 章节标题（H2）

### 小节标题（H3）
```

### 2. 代码示例

- 提供完整、可运行的代码示例
- 包含必要的导入和配置
- 添加注释说明关键点

### 3. 链接管理

- 使用相对路径链接到其他文档
- 确保链接在新结构下仍然有效
- 使用描述性链接文本

### 4. 更新维护

- 文档应与代码保持同步
- 重大变更时更新相关文档
- 定期审查和更新过时内容

## 迁移指南

从旧结构迁移到新结构：

1. **创建分类目录**：
   ```bash
   mkdir -p docs/guide/{essentials,core-concepts,advanced}
   ```

2. **添加 frontmatter**：
   为每个文档添加 frontmatter，包括 `title`、`order`、`category`

3. **重命名文件**：
   将 `QUICK_START.md` 重命名为 `getting-started.md`（kebab-case）

4. **更新链接**：
   更新文档内的相对链接，确保指向新路径

5. **验证**：
   运行构建，检查文档是否正确显示在侧边栏

## 参考资源

- [Vue.js 文档结构](https://vuejs.org/guide/)
- [Svelte 文档结构](https://svelte.dev/docs)
- [RFC 0024: WSX-Press 文档系统](../../docs/rfcs/0024-documentation-system.md)
