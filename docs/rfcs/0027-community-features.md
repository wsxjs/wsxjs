# RFC-0027: 社区功能（M5）

- **RFC编号**: 0027
- **父 RFC**: [RFC-0021](./0021-framework-website-enhancement.md)
- **里程碑**: M5
- **开始日期**: 2025-01-XX
- **状态**: Proposed
- **作者**: WSX Team

## 摘要

实现社区功能，包括博客系统、社区展示和迁移指南，增强社区参与度和用户支持。

## 动机

### 为什么需要这个功能？

社区功能对于框架网站至关重要：
- 展示社区活跃度
- 提供更新日志和技术文章
- 帮助用户从其他框架迁移
- 增强社区凝聚力

## 详细设计

### 1. 博客系统

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
// src/components/BlogSection.wsx
import { LightComponent, autoRegister, state } from '@wsxjs/wsx-core';

@autoRegister({ tagName: 'blog-section' })
export class BlogSection extends LightComponent {
    @state private posts: BlogPost[] = [];
    
    async connectedCallback() {
        this.posts = await this.loadPosts();
    }
    
    render() {
        return (
            <div class="blog-container">
                {this.posts.map(post => (
                    <article class="blog-post">
                        <h2>{post.title}</h2>
                        <time>{post.date}</time>
                        <p>{post.excerpt}</p>
                        <wsx-link to={`/blog/${post.slug}`}>Read more</wsx-link>
                    </article>
                ))}
            </div>
        );
    }
}
```

### 2. 社区展示

- 贡献者列表（从 GitHub API 获取）
- 使用案例展示
- 社区统计（GitHub stars, npm downloads）
- 社区讨论入口

### 3. 迁移指南

- 从 React 迁移指南
- 从 Vue 迁移指南
- 迁移工具（如果有）

## 实施计划

### 步骤 5.1: 博客系统（3 天）
- [ ] 创建博客布局
- [ ] 实现文章列表
- [ ] 实现文章详情页
- [ ] 添加 RSS feed

### 步骤 5.2: 社区展示（3 天）
- [ ] 集成 GitHub API
- [ ] 展示贡献者
- [ ] 展示使用案例
- [ ] 展示社区统计

### 步骤 5.3: 迁移指南（2 天）
- [ ] 创建迁移指南页面
- [ ] 添加迁移示例

## 验收标准

- [ ] 博客系统正常工作
- [ ] 社区展示数据正确
- [ ] 迁移指南完整
- [ ] 所有链接有效

## 交付物

- ✅ 博客系统
- ✅ 社区展示页面
- ✅ 迁移指南

## 相关文档

- [RFC-0021: 框架网站增强计划](./0021-framework-website-enhancement.md)
- [执行计划](../../packages/examples/EXECUTION_PLAN.md)

