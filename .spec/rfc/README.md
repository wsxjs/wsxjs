# WSXJS RFCs

RFC（Request for Comments）是WSX框架重要功能和设计变更的设计文档。

## RFC 流程

### 什么时候需要RFC？

以下情况需要RFC：
- 新的核心API设计
- 重大的架构变更
- 破坏性变更
- 新的开发工具或插件
- 影响开发者体验的重要功能

### 什么时候不需要RFC？

以下情况不需要RFC：
- Bug修复
- 文档改进
- 内部重构（不影响公开API）
- 测试改进
- 小的功能增强

## RFC生命周期

```
[构思] -> [草稿] -> [审核] -> [接受] -> [实现] -> [完成]
   |         |        |       |        |        |
   |         |        |       |        |        |-> 功能上线
   |         |        |       |        |-> 开发实现
   |         |        |       |-> 正式采用
   |         |        |-> 社区审核讨论
   |         |-> 提交PR
   |-> 创建RFC文档
```

### 状态说明

- **Draft（草稿）**: RFC正在编写中
- **Proposed（提议）**: RFC已提交，等待审核
- **Active（激活）**: RFC已被接受，正在实现
- **Implemented（已实现）**: RFC功能已实现并发布
- **Withdrawn（撤回）**: RFC被撤回，不再考虑
- **Rejected（拒绝）**: RFC被拒绝
- **Superseded（废弃）**: RFC被更新的RFC取代

## 如何编写RFC

1. **复制模板**：复制 `0000-template.md` 到 `rfcs/` 目录
2. **命名文件**：使用格式 `YYYY-MM-DD-brief-description.md`
3. **填写内容**：按模板填写所有必需章节
4. **提交PR**：提交到 `main` 分支
5. **讨论迭代**：在PR中收集反馈并改进
6. **等待决定**：维护者会决定接受、拒绝或推迟

## RFC目录

### 激活的RFCs

| RFC | 标题 | 状态 | 提议人 |
|-----|------|------|--------|
| [RFC-0062](./0062-dx-and-vscode-support.md) | Developer Experience & VS Code Support | Proposed | WSX Team |
| [RFC-0063](./0063-site-to-base-components.md) | Site to Base Components — Deep Review & Migration | Draft | WSX Team |
| [RFC-0064](./0064-theme-package-and-branding-override-api.md) | Theme 包与 wsx-branding 及覆盖 API | Draft | WSX Team |

### 已完成的RFCs

| RFC | 标题 | 状态 | 提议人 |
|-----|------|------|--------|
| [RFC-0001](./completed/0001-wsx-router.md) | WSX Router | Completed | Claude |
| [RFC-0004](./completed/0004-reactive-state-system.md) | 响应式状态系统 | Completed | Claude |
| [RFC-0005](./completed/0005-wsx-router-enhancements.md) | WSX Router 增强 | Completed | Claude |
| [RFC-0006](./completed/0006-light-dom-components.md) | Light DOM 组件 | Completed | Claude |
| [RFC-0007](./completed/0007-reactive-decorator.md) | 响应式装饰器 | Completed | Claude |
| [RFC-0008](./completed/0008-auto-style-injection.md) | 自动样式注入 | Completed | Claude |
| [RFC-0011](./completed/0011-focus-preservation.md) | 焦点保持机制 | Completed | Claude |
| [RFC-0012](./completed/0012-babel-transform-error-handling.md) | Babel Transform 错误处理策略 | Completed | Claude |
| [RFC-0013](./completed/0013-state-initial-value-validation.md) | @state 装饰器初始值验证 | Completed | Claude |
| [RFC-0014](./completed/0014-connected-callback-optimization.md) | connectedCallback 智能渲染优化 | Completed | WSX Team |
| [RFC-0015](./completed/0015-array-reactive-coverage.md) | 数组响应式覆盖说明 | Completed | WSX Team |
| [RFC-0016](./completed/0016-component-library-build-guide.md) | 组件库构建指南 | Completed | WSX Team |
| [RFC-0017](./completed/0017-jsx-factory-auto-injection-bug-fix.md) | JSX Factory 自动注入 Bug 修复 | Completed | WSX Team |
| [RFC-0020](./completed/0020-jsx-import-source-pragma-auto-injection.md) | JSX Import Source Pragma 自动注入方案 | Completed | WSX Team |
| [RFC-0022](./completed/0022-homepage-value-proposition.md) | 首页价值主张优化（M0） | Completed | WSX Team |
| [RFC-0023](./completed/0023-seo-error-handling.md) | SEO 优化和错误处理（M1） | Completed | WSX Team |
| [RFC-0024](./completed/0024-documentation-system.md) | 文档系统集成（M2） | Completed | WSX Team |
| [RFC-0029](./completed/0029-i18next-integration.md) | i18next 国际化支持 | Completed | WSX Team |
| [RFC-0030](./completed/0030-rerender-scheduling-refactor.md) | rerender() 调度机制重构 | Completed | WSX Team |
| [RFC-0031](./completed/0031-jsx-factory-html-string-infinite-recursion-fix.md) | JSX Factory HTML 字符串解析无限递归修复 | Completed | WSX Team |
| [RFC-0032](./completed/0032-wsx-router-refactor.md) | WSX Router 重构（稳定性修复和性能优化） | Completed | WSX Team |
| [RFC-0033](./completed/0033-modern-router-features.md) | Modern Router Features | Completed | WSX Team |
| [RFC-0034](./completed/0034-markdown-text-token-handling.md) | Markdown Text Token Handling | Completed | WSX Team |
| [RFC-0035](./completed/0035-router-navigation-race-condition.md) | Router Navigation Race Condition | Completed | WSX Team |
| [RFC-0036](./completed/0036-smart-property-assignment.md) | Smart Property Assignment | Completed | WSX Team |
| [RFC-0037](./completed/0037-vapor-mode-inspired-dom-optimization.md) | Vapor Mode DOM 优化 | Completed | WSX Team |
| [RFC-0038](./completed/0038-render-context-missing-initial-render.md) | Render Context Missing Initial Render | Completed | WSX Team |
| [RFC-0039](./completed/0039-enforce-super-lifecycle-calls.md) | 强制生命周期方法调用 super | Completed | WSX Team |
| [RFC-0040](./completed/0040-text-node-update-bug-fixes.md) | Text Node Update Bug Fixes | Completed | WSX Team |
| [RFC-0041](./completed/0041-cache-reuse-element-order-and-ref-callback-fixes.md) | Cache Reuse & Element Order Fixes | Completed | WSX Team |
| [RFC-0042](./completed/0042-language-switcher-immediate-ui-update.md) | LanguageSwitcher UI 更新修复 | Completed | WSX Team |
| [RFC-0043](./completed/0043-style-injection-verification-and-fixes.md) | 样式注入验证与修复 | Completed | WSX Team |
| [RFC-0044](./completed/0044-stable-cache-keys-for-all-elements.md) | 稳定缓存键 | Completed | WSX Team |
| [RFC-0045](./completed/0045-babel-plugin-redesign.md) | Babel Plugin Redesign | Completed | WSX Team |
| [RFC-0046](./completed/0046-babel-plugin-focus-only-redesign.md) | Babel Plugin Focus-Only Redesign | Completed | WSX Team |
| [RFC-0047](./completed/0047-text-node-duplicate-render-fix.md) | Text Node Duplicate Render Fix | Completed | WSX Team |
| [RFC-0048](./completed/0048-reconciliation-architecture-realignment.md) | Reconciliation Architecture Realignment | Completed | WSX Team |
| [RFC-0049](./completed/0049-key-based-reconciliation-implementation.md) | Key-based Reconciliation | Completed | WSX Team |
| [RFC-0050](./completed/0050-toc-anchor-scrolling-fix.md) | TOC Anchor Scrolling Fix | Completed | Claude |
| [RFC-0051](./completed/0051-wsx-press-internationalized-docs.md) | WSX-Press 国际化文档支持 | Completed | WSX Team |
| [RFC-0052](./completed/0052-marked-code-theme-and-toc-scrolling.md) | Marked Code Theme & TOC Scrolling | Completed | Claude |
| [RFC-0053](./completed/0053-calendar-text-node-position-based-fix.md) | Calendar Text Node Position Fix | Completed | WSX Team |
| [RFC-0054](./completed/0054-rfc-0053-regression-fix.md) | RFC-0053 Regression Fix | Completed | WSX Team |
| [RFC-0055](./completed/0055-html-parsing-reconciliation-fix.md) | HTML Parsing Reconciliation Fix | Completed | WSX Team |
| [RFC-0056](./completed/0056-shadow-dom-event-handling.md) | Shadow DOM 事件处理标准 | Completed | WSX Team |
| [RFC-0057](./completed/0057-radio-checkbox-rerender-fix.md) | Radio/Checkbox Rerender Fix | Completed | WSX Team |
| [RFC-0058](./completed/0058-true-dom-reconciliation.md) | True DOM Reconciliation | Completed | WSX Team |
| [RFC-0059](./completed/0059-calendar-ghost-node-fix.md) | Calendar Ghost Node Fix | Completed | WSX Team |
| [RFC-0060](./completed/0060-component-identity-and-ssr.md) | Component Identity & SSR | Completed | WSX Team |
| [RFC-0061](./completed/0061-evaluate-focus-management.md) | 评估焦点管理工具 | Completed | WSX Team |

### 提议中的RFCs

| RFC | 标题 | 状态 | 提议人 |
|-----|------|------|--------|
| [RFC-0019](./0019-zero-config-initialization.md) | 零配置初始化方案 | Proposed | WSX Team |
| [RFC-0021](./0021-framework-website-enhancement.md) | 框架网站增强计划（根 RFC） | In Progress | WSX Team |
| [RFC-0025](./0025-code-playground.md) | 代码 Playground（M3） | Proposed | WSX Team |
| [RFC-0026](./0026-performance-optimization.md) | 性能优化（M4） | Proposed | WSX Team |
| [RFC-0027](./0027-community-features.md) | 社区功能（M5） | Proposed | WSX Team |
| [RFC-0028](./0028-advanced-features.md) | 高级功能（M6） | Proposed | WSX Team |

### 被拒绝/废弃的RFCs

| RFC | 标题 | 状态 | 提议人 | 原因 |
|-----|------|------|--------|------|
| [RFC-0018](./completed/0018-wsx-dts-package-exposure.md) | 统一暴露 wsx.d.ts 类型定义 | Rejected | WSX Team | TypeScript 模块类型解析机制限制 |
| [RFC-0002](./rejected/0002-component-composition.md) | 组件组合和Slot增强 | Rejected | Claude | 与当前 WSX 类组件模型及已有能力重复；Hooks 风格与类组件不符 |
| [RFC-0009](./rejected/0009-scss-sass-preprocessing.md) | SCSS/SASS 预处理支持 | Rejected | Claude | 原生 CSS 更加简洁且更好用 |

### 草稿RFCs

| RFC | 标题 | 状态 | 提议人 |
|-----|------|------|--------|
| [RFC-0010](./0010-eslint-rules-enhancement.md) | ESLint 规则增强 | Draft | Claude |

### 已废弃的RFCs

| RFC | 标题 | 状态 | 提议人 | 原因 |
|-----|------|------|--------|------|
| [RFC-0003](./completed/0003-development-tooling.md) | 开发工具链增强 | Completed | Claude | 被 [RFC-0062](./0062-dx-and-vscode-support.md) 取代 |

## RFC原则

### 1. 保持WSX核心理念
- **JSX语法糖优先**：任何功能都不应偏离"JSX让WebComponent更好写"的核心目标
- **信任浏览器**：优先使用浏览器原生能力，而不是重新发明轮子
- **零运行时开销**：新功能不应增加运行时负担

### 2. 向后兼容
- 尽量避免破坏性变更
- 如果必须破坏兼容性，提供清晰的迁移路径
- 考虑渐进式采用策略

### 3. 开发者体验
- 功能应该简化开发工作流
- 提供良好的错误信息和调试体验
- 保持API的一致性和可预测性

### 4. 质量标准
- 必须包含完整的测试覆盖
- 必须包含文档和示例
- 考虑性能影响和边界情况

## 维护者指南

### 审核标准

审核RFC时考虑：
- **是否符合WSX理念**：与框架核心价值一致
- **技术可行性**：实现复杂度和维护成本
- **社区需求**：是否解决真实的开发痛点
- **质量标准**：设计是否完整和合理

### 决策过程

1. **初步审核**：检查RFC格式和基本要求
2. **技术讨论**：评估技术可行性和设计质量
3. **社区反馈**：收集社区意见（至少2周）
4. **最终决定**：维护者团队投票决定

## 联系方式

- **GitHub Issues**: 技术讨论和问题报告
- **GitHub Discussions**: 功能想法和社区讨论
- **RFC Pull Requests**: 正式RFC提案

---

*WSX框架RFC流程参考了Rust、Vue.js等开源项目的最佳实践。*
