# WSX Framework RFCs

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
| [RFC-0007](./0007-reactive-decorator.md) | 响应式装饰器 | Active | Claude |
| [RFC-0008](./0008-auto-style-injection.md) | 自动样式注入 | Active | Claude |

### 已实现的RFCs

| RFC | 标题 | 状态 | 提议人 |
|-----|------|------|--------|
| [RFC-0001](./0001-wsx-router.md) | WSX Router | Implemented | Claude |
| [RFC-0004](./0004-reactive-state-system.md) | 响应式状态系统 | Implemented | Claude |
| [RFC-0006](./0006-light-dom-components.md) | Light DOM 组件 | Implemented | Claude |
| [RFC-0011](./0011-focus-preservation.md) | 焦点保持机制 | Implemented | Claude |
| [RFC-0012](./0012-babel-transform-error-handling.md) | Babel Transform 错误处理策略 | Implemented | Claude |
| [RFC-0013](./0013-state-initial-value-validation.md) | @state 装饰器初始值验证 | Implemented | Claude |
| [RFC-0014](./0014-connected-callback-optimization.md) | connectedCallback 智能渲染优化 | Implemented | WSX Team |
| [RFC-0015](./0015-array-reactive-coverage.md) | 数组响应式覆盖说明 | Implemented | WSX Team |
| [RFC-0016](./0016-component-library-build-guide.md) | 组件库构建指南 | Implemented | WSX Team |
| [RFC-0017](./0017-jsx-factory-auto-injection-bug-fix.md) | JSX Factory 自动注入 Bug 修复 | Implemented | WSX Team |
| [RFC-0018](./0018-wsx-dts-package-exposure.md) | 正确暴露 wsx.d.ts 类型定义文件 | Proposed | WSX Team |

### 草稿RFCs

| RFC | 标题 | 状态 | 提议人 |
|-----|------|------|--------|
| [RFC-0002](./0002-component-composition.md) | 组件组合和Slot增强 | Draft | Claude |
| [RFC-0003](./0003-development-tooling.md) | 开发工具链增强 | Draft | Claude |
| [RFC-0005](./0005-wsx-router-enhancements.md) | WSX Router 增强 | Draft | Claude |
| [RFC-0009](./0009-scss-sass-preprocessing.md) | SCSS/SASS 预处理支持 | Draft (Future) | Claude |
| [RFC-0010](./0010-eslint-rules-enhancement.md) | ESLint 规则增强 | Draft | Claude |

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
