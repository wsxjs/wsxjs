# WSXJS 设计说明文档

## 一、框架简介
WSXJS 是一套现代 Web Components 框架，主打 JSX 语法与 TypeScript 支持，完全零依赖 React，专注于原生 WebComponent 能力的极致开发体验。

- **核心理念**：WebComponent + JSX + TypeScript，极致类型安全与开发效率。
- **wsx 文件**：即 Web Component with JSX，采用 .wsx 扩展名，等价于 TSX 语法的 WebComponent。
- **自举验证**：examples 目录即为 wsx 体系自举与验证的主场景。

## 二、项目结构
- packages/core：核心能力（WebComponent 抽象基类、JSX 工厂、自动注册、样式管理、日志等）
- packages/vite-plugin：Vite 插件，自动处理 .wsx 文件、JSX 工厂注入、TypeScript 编译、热更新
- packages/eslint-plugin：专用 ESLint 规则（render-method-required、no-react-imports、web-component-naming）
- packages/examples：wsx 组件演示与自举验证，GitHub Pages 部署入口

## 三、核心API与机制
### 1. WebComponent 抽象基类
- 强制实现 render() 方法，支持 JSX 语法
- 生命周期钩子（onConnected、onDisconnected、onAttributeChanged）
- 样式隔离与管理（Shadow DOM + CSS-in-JS）

### 2. JSX 工厂
- 零依赖自研 JSX 工厂，支持所有标准 HTML 属性、事件、Fragment
- Vite 插件自动注入 h/Fragment，无需手动导入

### 3. autoRegister 装饰器
- 自动注册自定义元素，支持自定义 tagName、自动 PascalCase 转 kebab-case
- 防止重复注册，支持前缀

### 4. 样式管理
- 支持 CSS-in-JS、Constructable StyleSheets、Shadow DOM 隔离
- 兼容外部 CSS 文件（?inline 导入）

### 5. 日志系统
- createLogger/WSXLogger，支持分级、命名空间、调试模式

## 四、examples 集成与自举
- examples 目录为 wsx 体系的真实演示与自举验证场景
- 组件（如 Button、ColorPicker、ButtonGroup）均为 wsx 文件，完整演示核心能力
- Vite 配置集成 wsx-vite-plugin，支持 .wsx 热更新与调试
- 通过 pnpm workspace 机制，examples 依赖 core/vite-plugin 为本地包，支持联动开发

## 五、Vite 插件
- 自动识别 .wsx 文件，按 tsx 处理
- 自动注入 JSX 工厂（h/Fragment）
- 支持 TypeScript、装饰器、CSS-in-JS
- 热更新与生产构建兼容

## 六、ESLint 插件
- render-method-required：强制 wsx 组件实现 render()
- no-react-imports：禁止 wsx 文件引入 React
- web-component-naming：强制自定义元素命名规范（带连字符、非保留名）
- 100% 单元测试覆盖，examples 目录为真实集成测试场景

## 七、CI/CD 与开发流程
- GitHub Actions 持续集成：自动 lint、typecheck、test、build、coverage、examples 部署
- 本地开发：pnpm dev/watch，examples 目录热更新联动验证
- 代码质量保障：Husky + lint-staged + Prettier + ESLint + Jest

## 八、最佳实践与未来规划
- 推荐以 wsx 文件为主开发 WebComponent，充分利用类型与 JSX 优势
- examples 目录持续补充新特性与端到端测试
- 未来规划：SSR、组件组合模式、高级状态管理、性能监控、更多内置组件、文档站点生成

---

（本说明文档由 AI 自动生成，内容基于当前代码库与文档自动提取，后续可持续完善） 
