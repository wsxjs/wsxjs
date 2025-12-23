# WSX 框架 (@wsxjs)

[![npm version](https://badge.fury.io/js/@wsxjs%2Fwsx-core.svg)](https://badge.fury.io/js/@wsxjs%2Fwsx-core)
[![npm downloads](https://img.shields.io/npm/dm/@wsxjs/wsx-core.svg)](https://www.npmjs.com/package/@wsxjs/wsx-core)
[![CI Status](https://github.com/wsxjs/wsxjs/workflows/CI/badge.svg)](https://github.com/wsxjs/wsxjs/actions)
[![Coverage Status](https://codecov.io/gh/wsxjs/wsxjs/branch/main/graph/badge.svg)](https://codecov.io/gh/wsxjs/wsxjs)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**原生 Web Components 的 JSX 语法糖 - 不是框架，只是更好的开发体验。**

## WSX 存在的意义

WSX 有一个简单的目标：**让 Web Components 开发像写 JSX 一样愉快**，同时保持 100% 原生特性。

### WSX 是什么
- ✅ **JSX 语法编译器** - 为原生 Web Components 提供 JSX 语法
- ✅ **TypeScript 集成** - 完整的 IntelliSense 和类型安全
- ✅ **开发工具** - Vite 插件、ESLint 规则
- ✅ **零运行时开销** - 编译为原生 DOM 操作

### WSX 不是什么
- ❌ 不是 React/Vue 的替代品或竞品
- ❌ 不是状态管理系统
- ❌ 不是虚拟 DOM 实现
- ❌ 不是组件生命周期的重新实现

## 设计哲学

WSX 体现了一种克制和对 Web 标准的尊重：

**核心原则：**
- ✨ **不试图"改进"浏览器已经优化好的东西** - Web Components 经过实战检验
- ⚡ **不增加运行时负担** - 编译时语法糖，而非运行时框架
- 🎯 **不创造新的抽象层** - 使用现有的 Web API 和标准
- 💝 **只解决一个具体问题** - 让 Web Component 开发更愉快

**WSX 方程式：**
```
JSX + Web Components = 现代语法 + 原生性能
```

**框架设计哲学：**
这就是框架设计的最高境界：**做减法而不是加法，增强而不是替代**。WSX 让开发者能用熟悉的 JSX 语法，但底层完全是浏览器原生的 Web Components。

这样的框架才是真正可持续的 - 不会过时，不会被抛弃，因为它建立在随平台自身演进的 Web 标准之上。

**核心理念**：信任浏览器。Web Components 已经被优化过了。JSX 只是让它们写起来更舒服。

```tsx
// 告别痛苦的 DOM 操作...
render() {
    const div = document.createElement('div');
    div.className = 'container';
    const button = document.createElement('button');
    button.textContent = '点击我';
    button.addEventListener('click', this.handleClick);
    div.appendChild(button);
    return div;
}

// 拥抱现代 JSX 语法 ✨
render() {
    return (
        <div class="container">
            <button onClick={this.handleClick}>点击我</button>
        </div>
    );
}
```

**结果**：同样的原生 Web Component，更好的开发体验。

## 特性

WSX 提供必要的工具，让 Web Components 开发现代化且愉快：

- 🎯 **纯粹的 JSX 语法糖** - 现代 JSX 语法编译为原生 DOM 操作
- 📦 **TypeScript 优先** - 完整的类型安全和 IntelliSense 支持  
- ⚡ **零运行时成本** - 无虚拟 DOM，无框架开销，只有原生 Web Components
- 🔧 **无缝构建集成** - 开箱即用的 Vite 插件
- 🎨 **原生 Shadow DOM** - 使用浏览器内置的 CSS 作用域能力
- 📝 **开发者工具** - ESLint 规则、自动注册装饰器
- 🧪 **测试就绪** - 带有 Web Components 模拟的 Jest 设置
- 🎯 **原生 SVG 支持** - SVG 元素的正确命名空间处理
- 🌐 **Web 标准兼容** - 使用浏览器 API，而非专有抽象

## 包

### 已发布的包

#### @wsxjs/wsx-core
[![npm version](https://badge.fury.io/js/@wsxjs%2Fwsx-core.svg)](https://badge.fury.io/js/@wsxjs%2Fwsx-core)
[![npm downloads](https://img.shields.io/npm/dm/@wsxjs/wsx-core.svg)](https://www.npmjs.com/package/@wsxjs/wsx-core)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@wsxjs/wsx-core.svg)](https://bundlephobia.com/result?p=@wsxjs/wsx-core)

核心框架，包含 WebComponent 基类、JSX 工厂、日志器和工具

#### @wsxjs/wsx-vite-plugin
[![npm version](https://badge.fury.io/js/@wsxjs%2Fwsx-vite-plugin.svg)](https://badge.fury.io/js/@wsxjs%2Fwsx-vite-plugin)
[![npm downloads](https://img.shields.io/npm/dm/@wsxjs/wsx-vite-plugin.svg)](https://www.npmjs.com/package/@wsxjs/wsx-vite-plugin)
[![vite compatibility](https://img.shields.io/badge/vite-%3E%3D4.0.0-blueviolet.svg)](https://vitejs.dev/)

用于 .wsx 文件的 Vite 集成（自动注入 JSX 工厂）

#### @wsxjs/eslint-plugin-wsx
[![npm version](https://badge.fury.io/js/@wsxjs%2Feslint-plugin-wsx.svg)](https://badge.fury.io/js/@wsxjs%2Feslint-plugin-wsx)
[![npm downloads](https://img.shields.io/npm/dm/@wsxjs/eslint-plugin-wsx.svg)](https://www.npmjs.com/package/@wsxjs/eslint-plugin-wsx)
[![eslint compatibility](https://img.shields.io/badge/eslint-%3E%3D8.0.0-orange.svg)](https://eslint.org/)

WSX 组件的 ESLint 规则

### 开发包
- **@wsxjs/wsx-site** - 官方网站和交互式展示应用，包含示例组件

## 快速开始

```bash
# 安装依赖
pnpm install

# 构建所有包
pnpm build

# 运行示例
pnpm --filter @wsxjs/wsx-site dev

# 运行测试
pnpm test

# 开始开发（监视模式）
pnpm dev

# Chrome DevTools 调试
pnpm debug:wsx
```

## 创建 WSX 组件

WSX 组件就是**标准的 Web Components**，只是带有 JSX 语法糖：

```tsx
// MyComponent.wsx - 这是一个真正的 Web Component
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
import styles from './MyComponent.css?inline';

@autoRegister() // 注册为 <my-component> 自定义元素
export class MyComponent extends WebComponent {
  constructor() {
    super({ styles }); // 原生 Shadow DOM 与 CSS
  }

  // JSX 编译为原生 DOM 操作 - 没有虚拟 DOM！
  render() {
    return (
      <div class="my-component">
        <h1>Hello WSX!</h1>
        <slot></slot>  {/* 原生 Web Component 插槽 */}
      </div>
    );
  }
}
```

### 底层发生了什么：
1. **JSX 编译** 为 `document.createElement()` 调用
2. **组件注册** 为原生自定义元素
3. **浏览器处理** 渲染、生命周期和优化
4. **你得到** 现代语法与零运行时开销

### WSX 的差别
- **不是框架** - 你的组件就是 Web Components
- **不是运行时** - JSX 只是 DOM 操作的语法糖
- **不是替代品** - 增强 Web Components，而不是替代它们

## JSX 配置

WSX 框架提供框架级的 JSX 支持。配置你的 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@wsxjs/wsx-core/jsx"
  }
}
```

这样就能在没有任何 React 依赖的情况下获得完整的 JSX 支持！

## 在 HTML 中使用

由于 WSX 组件是原生 Web Components，可以像任何 HTML 元素一样使用：

```html
<!-- 标准自定义元素 - 随处可用 -->
<my-component>
  <p>这些内容会进入原生插槽</p>
</my-component>

<!-- 与任何框架或原生 JavaScript 一起工作 -->
<script>
  // 原生 Web Component API 完美工作
  const component = document.querySelector('my-component');
  component.setAttribute('data', 'some value');
  
  // 或者程序化创建
  const newComponent = document.createElement('my-component');
  document.body.appendChild(newComponent);
</script>
```

**无框架锁定** - 你的 WSX 组件可以在 React、Vue、Angular 或原生 HTML 中工作！

## 文档

- [快速开始指南](docs/QUICK_START.md) - 几分钟内开始使用 WSX 框架
- [JSX 支持指南](docs/JSX_SUPPORT.md) - JSX 配置和使用的完整指南
- [设计文档](docs/WSX_DESIGN.md) - 框架架构和设计决策
- [开发计划](docs/WSX_PRACTICE_PLAN.md) - 开发工作流和最佳实践
- [Chrome 调试指南](docs/chrome-debugging-guide.md) - 使用 Chrome DevTools 调试 Web Components

## 开发

这个 monorepo 使用 pnpm workspaces 和完整的开发工具：

### 前置要求

- Node.js 16+（推荐 18+）
- pnpm 8+

### 安装

```bash
# 克隆仓库
git clone https://github.com/wsxjs/wsxjs.git
cd wsxjs

# 安装依赖
pnpm install
```

### 开发脚本

```bash
# 构建所有包
pnpm build

# 开发（监视模式）
pnpm dev

# Chrome 调试
pnpm debug:chrome        # 在调试模式下启动 Chrome
pnpm debug:wsx           # 启动 WSX 应用 + Chrome 调试模式

# 测试
pnpm test                 # 运行所有测试
pnpm test:coverage        # 带覆盖率运行测试
pnpm test:watch          # 监视模式运行测试

# 代码质量
pnpm lint                # 运行 ESLint
pnpm lint:fix            # 自动修复 ESLint 问题
pnpm format              # 用 Prettier 格式化代码
pnpm format:check        # 检查代码格式
pnpm typecheck           # 运行 TypeScript 类型检查

# 维护
pnpm clean               # 清理所有构建产物
```

### 项目结构

```
wsxjs/
├── packages/
│   ├── core/              # 核心框架
│   │   ├── src/
│   │   │   ├── WebComponent.ts     # 组件基类
│   │   │   ├── jsx-factory.ts      # JSX 运行时
│   │   │   ├── auto-register.ts    # 自动注册
│   │   │   ├── logger.ts           # 日志工具
│   │   │   └── styles/             # 样式管理
│   │   └── __tests__/             # 测试文件
│   ├── vite-plugin/       # Vite 集成
│   ├── eslint-plugin/     # ESLint 规则
│   ├── components/        # 预制组件
│   └── examples/          # 示例应用
├── scripts/               # 开发脚本
│   └── debug-chrome.js    # Chrome 调试脚本
├── docs/                  # 文档
│   └── chrome-debugging-guide.md  # Chrome 调试指南
├── test/                  # 全局测试设置
└── .github/              # GitHub Actions CI/CD
```

### 开发工具

#### 代码质量
- **ESLint** - TypeScript 和代码质量规则
- **Prettier** - 代码格式化
- **EditorConfig** - 跨编辑器一致性
- **Husky** - 预提交检查的 Git hooks
- **lint-staged** - 只对暂存文件运行 linters

#### 测试
- **Jest** - 带 jsdom 环境的测试运行器
- **@testing-library/jest-dom** - DOM 测试工具
- **覆盖率** - 代码覆盖率报告
- **Web Components 模拟** - 自定义元素和 Shadow DOM 模拟

#### 构建系统
- **tsup** - 快速的 TypeScript 打包器
- **TypeScript** - 类型检查和编译
- **pnpm workspaces** - Monorepo 包管理

#### 调试
- **Chrome DevTools** - Web Components 调试，支持 Shadow DOM 检查
- **Browser Tools MCP** - Model Context Protocol 集成，用于 AI 辅助调试
- **远程调试** - Chrome 远程调试（端口 9222）

### VS Code 设置

项目包含了 VS Code 配置以获得最佳开发体验：

- 保存时自动格式化
- ESLint 集成
- TypeScript 支持
- `.wsx` 文件的文件关联
- 推荐扩展

### Git Hooks

预提交 hooks 自动运行：
- ESLint 自动修复
- Prettier 格式化
- TypeScript 类型检查

### 持续集成

GitHub Actions 工作流包括：
- Linting 和格式化检查
- TypeScript 编译
- 带覆盖率的测试执行
- 多版本 Node.js 测试（16、18、20）

## 架构

### 核心概念

1. **WebComponent 基类** - 所有 WSX 组件的抽象基类
2. **JSX 工厂** - 零依赖 JSX 实现
3. **自动注册** - 基于装饰器的组件注册
4. **样式管理** - 高效的 CSS 处理与 Shadow DOM
5. **日志** - 内置调试日志系统

### 组件生命周期

```tsx
@autoRegister()
export class MyComponent extends WebComponent {
  // 1. 构造函数 - 组件初始化
  constructor() {
    super({ styles });
  }

  // 2. render() - JSX 渲染（必需）
  render() {
    return <div>内容</div>;
  }

  // 3. connectedCallback - 组件挂载
  protected onConnected() {
    // 组件已在 DOM 中
  }

  // 4. disconnectedCallback - 组件卸载
  protected onDisconnected() {
    // 清理
  }

  // 5. attributeChangedCallback - 属性变化
  protected onAttributeChanged(name: string, oldValue: string, newValue: string) {
    // 处理属性变化
  }
}
```

## SVG 支持

WSX 框架提供原生 SVG 支持，具有正确的命名空间处理：

```tsx
@autoRegister()
export class SvgIcon extends WebComponent {
  render() {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="blue" />
        <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2" />
      </svg>
    );
  }
}
```

### 特性

- **自动命名空间检测** - SVG 元素自动使用 `createElementNS`
- **正确的属性处理** - `className` 在 SVG 元素中转换为 `class`
- **完整的 TypeScript 支持** - SVG 元素和属性的完全类型安全
- **事件处理** - 标准事件监听器在 SVG 元素上工作
- **混合内容** - 在同一组件中无缝混合 HTML 和 SVG

### 示例：交互式 SVG 图表

```tsx
@autoRegister()
export class SvgChart extends WebComponent {
  render() {
    const data = [30, 80, 45, 60];
    
    return (
      <svg width="300" height="200" viewBox="0 0 300 200">
        <defs>
          <linearGradient id="gradient">
            <stop offset="0%" stopColor="#3498db" />
            <stop offset="100%" stopColor="#9b59b6" />
          </linearGradient>
        </defs>
        
        {data.map((value, index) => (
          <rect
            key={index}
            x={index * 60 + 20}
            y={200 - value * 2}
            width="40"
            height={value * 2}
            fill="url(#gradient)"
            onClick={() => console.log(`Bar ${index}: ${value}`)}
          />
        ))}
      </svg>
    );
  }
}
```

## 安装

在你的项目中使用 WSX 框架：

```bash
# 安装核心框架
npm install @wsxjs/wsx-core

# 根据需要安装其他包
npm install @wsxjs/wsx-base-components
npm install @wsxjs/wsx-vite-plugin
npm install @wsxjs/eslint-plugin-wsx
```

## 贡献

1. Fork 仓库
2. 创建功能分支：`git checkout -b feature/my-feature`
3. 进行更改
4. 运行测试：`pnpm test`
5. 运行 linting：`pnpm lint:fix`
6. 提交更改：`git commit -m "feat: add my feature"`
7. 推送到分支：`git push origin feature/my-feature`
8. 提交 pull request

### 提交约定

我们使用约定式提交：
- `feat:` - 新功能
- `fix:` - Bug 修复
- `docs:` - 文档更改
- `style:` - 代码样式更改
- `refactor:` - 代码重构
- `test:` - 测试更改
- `chore:` - 构建/工具更改

## 许可证

MIT

## 包信息

所有包都在 `@wsxjs` npm 组织下发布：

- 核心：`npm install @wsxjs/wsx-core`
- Vite 插件：`npm install @wsxjs/wsx-vite-plugin` 
- ESLint 插件：`npm install @wsxjs/eslint-plugin-wsx`
- 组件：`npm install @wsxjs/wsx-base-components`

## 链接

- **仓库**：https://github.com/wsxjs/wsxjs
- **Issues**：https://github.com/wsxjs/wsxjs/issues
- **NPM 组织**：https://www.npmjs.com/org/wsxjs

## 致谢

由 WSX 框架团队用 ❤️ 构建。

## 项目上下文

有关完整的技术文档和开发上下文，请参阅 [CLAUDE.md](./CLAUDE.md)，其中包含详细的架构信息、开发工作流和故障排除指南。
