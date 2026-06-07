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

## RFC目录 / 路线图

### 激活的RFCs

| RFC | 标题 | 状态 | 提议人 |
|-----|------|------|--------|
| [RFC-0062](./0062-dx-and-vscode-support.md) | Developer Experience & VS Code Support | Proposed | WSX Team |
| [RFC-0063](./0063-site-to-base-components.md) | Site to Base Components — Deep Review & Migration | Draft | WSX Team |
| [RFC-0064](./0064-theme-package-and-branding-override-api.md) | Theme 包与 wsx-branding 及覆盖 API | Draft | WSX Team |

### 提议中的RFCs

| RFC | 标题 | 状态 | 提议人 |
|-----|------|------|--------|
| [RFC-0019](./0019-zero-config-initialization.md) | 零配置初始化方案 | Proposed | WSX Team |
| [RFC-0021](./0021-framework-website-enhancement.md) | 框架网站增强计划（根 RFC） | In Progress | WSX Team |
| [RFC-0025](./0025-code-playground.md) | 代码 Playground（M3） | Proposed | WSX Team |
| [RFC-0026](./0026-performance-optimization.md) | 性能优化（M4） | Proposed | WSX Team |
| [RFC-0027](./0027-community-features.md) | 社区功能（M5） | Proposed | WSX Team |
| [RFC-0028](./0028-advanced-features.md) | 高级功能（M6） | Proposed | WSX Team |

### 草稿RFCs

| RFC | 标题 | 状态 | 提议人 |
|-----|------|------|--------|
| 无 | - | - | - |

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
- 考虑性能影响 and 边界情况

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
