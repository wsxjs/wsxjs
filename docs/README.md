# WSXJS 文档

欢迎来到 WSXJS 文档中心！这里包含了框架的完整文档，从快速开始到高级特性。

## 📚 文档导航

### 🚀 快速开始
- **[快速开始指南](guide/QUICK_START.md)** - 5分钟上手WSXJS
- **[JSX支持详解](guide/JSX_SUPPORT.md)** - 完整的JSX语法和特性说明

### 🎯 核心概念
- **[设计理念](wiki/DESIGN_PHILOSOPHY.md)** - WSXJS的设计哲学和原生优先理念
- **[Web Components基础](wiki/WSX_DESIGN.md)** - Web Components标准介绍
- **[组件架构](wiki/COMPONENT_ARCHITECTURE.md)** - Container vs Leaf 组件策略（已合并到 [RFC-0006](../rfcs/0006-light-dom-components.md)）

### 🛠️ WSXJS 使用指南（给使用 WSXJS 的开发者）

这些指南帮助您使用 WSXJS 开发应用：

- **[WebComponent 使用指南](guide/WEB_COMPONENT_GUIDE.md)** - Shadow DOM 组件开发指南
- **[LightComponent 使用指南](guide/LIGHT_COMPONENT_GUIDE.md)** - Light DOM 组件开发指南
- **[TypeScript 配置指南](guide/TYPESCRIPT_SETUP.md)** - 完整的 TypeScript 配置说明和最佳实践
- **[发布指南](guide/PUBLISH_GUIDE.md)** - 如何发布 WSX 组件库
- **[代码覆盖率指南](guide/CODE_COVERAGE.md)** - 如何运行和查看代码覆盖率
- **[Chrome调试指南](guide/2025-07-19-chrome-debugging-guide.md)** - 使用Chrome DevTools调试WSX组件
- **[实践计划](guide/2025-07-14-wsx-practice-plan.md)** - 系统性的学习计划
- **[独立开发模板](guide/2025-07-16-wsx-solo-dev-template.md)** - 快速搭建开发环境

### 📋 RFC（设计决策文档）

所有重要的设计决策和技术方案都记录在 RFC 中：

- **[RFC 索引](rfcs/README.md)** - 查看所有 RFC 文档
- **[RFC-0004: 响应式状态系统](rfcs/0004-reactive-state-system.md)** - 响应式状态管理设计
- **[RFC-0006: Light DOM Components](rfcs/0006-light-dom-components.md)** - Light DOM 组件设计（包含 Container vs Leaf 策略）
- **[RFC-0007: 响应式装饰器](rfcs/0007-reactive-decorator.md)** - @state 装饰器设计
- **[RFC-0008: 自动样式注入](rfcs/0008-auto-style-injection.md)** - CSS 自动注入机制
- **[RFC-0016: 组件库构建指南](rfcs/0016-component-library-build-guide.md)** - 组件库构建标准

### 🔧 工具链
- **[ESLint插件](../packages/eslint-plugin/README.md)** - 代码质量检查
- **[Vite插件](../packages/vite-plugin/)** - 构建工具集成

### 📦 包结构
```
wsxjs/
├── packages/
│   ├── core/           # 核心框架
│   ├── eslint-plugin/  # ESLint插件
│   ├── vite-plugin/    # Vite插件
│   └── examples/       # 示例项目
```

## 📁 文档组织结构

文档按照用途和受众分为以下目录：

```
docs/
├── README.md           # 本文档（文档导航）
├── ROADMAP.md          # 项目路线图
│
├── guide/              # 📖 使用指南（给使用 WSXJS 的开发者）
│   ├── QUICK_START.md
│   ├── JSX_SUPPORT.md
│   ├── WEB_COMPONENT_GUIDE.md
│   ├── LIGHT_COMPONENT_GUIDE.md
│   ├── TYPESCRIPT_SETUP.md
│   ├── PUBLISH_GUIDE.md
│   └── ...
│
├── rfcs/               # 📋 设计决策文档（RFC）
│   ├── README.md
│   ├── 0004-reactive-state-system.md
│   ├── 0006-light-dom-components.md
│   └── ...
│
├── wiki/               # 📚 知识库（常识、历史记录、技术知识）
│   ├── DESIGN_PHILOSOPHY.md
│   ├── WSX_DESIGN.md
│   ├── COMPONENT_ARCHITECTURE.md
│   └── ...
│
└── rearch/             # 🔬 研究文档（库对比、技术调研）
    └── CLI_LIBRARIES_COMPARISON.md
```

### 文档分类规则

#### 📖 guide/ - 使用指南
**受众**: 使用 WSXJS 开发应用的开发者

**内容**:
- 如何使用的教程和指南
- 配置说明
- 开发工具使用
- 最佳实践
- 故障排除

**示例**:
- 快速开始指南
- 组件使用指南
- TypeScript 配置
- 调试指南
- 发布指南

#### 📋 rfcs/ - 设计决策文档
**受众**: 框架维护者和贡献者

**内容**:
- 重要的设计决策
- 技术方案设计
- API 设计
- 架构变更

**规则**:
- 所有重要的设计决策必须记录在 RFC 中
- 使用 RFC 模板格式
- 状态：Draft → Proposed → Active → Implemented

#### 📚 wiki/ - 知识库
**受众**: 所有开发者

**内容**:
- 设计理念和哲学
- 技术知识
- 历史记录（已实现的方案、Bug 修复记录等）
- 项目总结

**示例**:
- 设计理念文档
- CI/CD 策略（历史记录）
- 实现总结（历史记录）
- Bug 修复记录（历史记录）

#### 🔬 rearch/ - 研究文档
**受众**: 框架维护者和贡献者

**内容**:
- 技术调研
- 库对比分析
- 方案评估
- 可行性研究

**示例**:
- CLI 库对比（Ora vs Ink）
- 技术方案可行性研究

### 文档命名规则

- **指南文档**: 使用描述性名称，如 `QUICK_START.md`, `WEB_COMPONENT_GUIDE.md`
- **RFC 文档**: 使用编号格式，如 `0004-reactive-state-system.md`
- **Wiki 文档**: 使用描述性名称或日期格式，如 `DESIGN_PHILOSOPHY.md`, `2025-07-15-ci-fixes.md`
- **研究文档**: 使用描述性名称，如 `CLI_LIBRARIES_COMPARISON.md`

## 🎯 设计理念亮点

### 原生优先 (Native-First)
WSXJS 采用原生优先的设计理念：

```jsx
// ✅ WSX - 使用原生HTML属性名
<div class="container">
  <button class="btn btn-primary">Click me</button>
</div>

// ❌ React - 使用JavaScript化的属性名  
<div className="container">
  <button className="btn btn-primary">Click me</button>
</div>
```

**核心优势**：
- 🚀 **更好的性能** - 无Virtual DOM开销
- 📦 **更小的体积** - 零依赖
- 🌐 **更好的兼容性** - 标准Web API
- 📚 **更简单的学习曲线** - 原生概念

## 🚀 快速体验

1. **安装**
   ```bash
   npm install @wsxjs/wsx-core
   ```

2. **创建组件**
   ```jsx
   import { WebComponent, h } from '@wsxjs/wsx-core';
   
   class MyButton extends WebComponent {
     render() {
       return <button class="btn" onClick={this.handleClick}>
         {this.text}
       </button>
     }
   }
   ```

3. **使用组件**
   ```html
   <my-button text="Click me"></my-button>
   ```

## 📖 深入学习

- 阅读 **[设计理念](wiki/DESIGN_PHILOSOPHY.md)** 了解框架哲学
- 查看 **[JSX支持](guide/JSX_SUPPORT.md)** 掌握完整语法
- 实践 **[Chrome调试](guide/2025-07-19-chrome-debugging-guide.md)** 提升开发效率
- 查看 **[RFC 索引](rfcs/README.md)** 了解设计决策

## 🤝 贡献指南

欢迎贡献代码和文档！请查看：
- [贡献指南](../CONTRIBUTING.md)
- [RFC 流程](rfcs/README.md)

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](../LICENSE) 文件了解详情。

---

**WSXJS** - 回归原生，拥抱标准 🌟 
