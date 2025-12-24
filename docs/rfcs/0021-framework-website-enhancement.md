# RFC-0021: 框架网站增强计划

- **RFC编号**: 0021
- **开始日期**: 2025-01-XX
- **状态**: Approved
- **作者**: WSX Team

## 摘要

本文档规划 WSXJS 框架网站的全面增强，参考主流框架（React、Vue、Svelte、Angular）的最佳实践，识别缺失功能并制定实施计划，将 `packages/examples` 从简单的示例展示升级为完整的框架官方网站。

**重要约束**：
- 网站必须完全使用 WSXJS 构建（`.wsx` 文件）
- 不能引入 React、Vue、Angular 或其他框架
- Markdown 文档必须转换为 WSX 组件，而不是 JSX
- 所有功能必须基于原生 Web Components 和 WSXJS

## 动机

### 当前状态

`packages/examples` 目前作为 WSXJS 的官方网站（`wsxjs.dev`），实现了基本功能：
- ✅ 路由系统（9 个页面）
- ✅ 响应式设计
- ✅ 主题切换
- ✅ 基础示例展示
- ✅ GitHub Pages 部署

### 问题分析

对比主流框架网站（Vue.js、React），WSXJS 网站作为"前门"缺少以下关键功能：

#### 1. **首页价值主张不清晰**（关键缺失）
   - ❌ 缺少清晰的核心卖点展示
   - ❌ 缺少与 React/Vue 的对比说明
   - ❌ 缺少"为什么选择 WSXJS"的明确说明
   - ❌ 缺少性能指标展示
   - ❌ 缺少快速开始按钮和 CTA

#### 2. **文档系统不完整**（关键缺失）
   - ❌ 缺少完整的 API 参考
   - ❌ 缺少教程和学习路径（从入门到高级）
   - ❌ 文档未集成到网站中
   - ❌ 缺少代码示例和交互式演示
   - ❌ 缺少最佳实践指南

#### 3. **SEO 和可发现性**（高优先级）
   - ❌ 缺少动态 meta 标签
   - ❌ 缺少 Open Graph 标签
   - ❌ 缺少结构化数据（Schema.org）
   - ❌ 缺少 sitemap.xml

#### 4. **用户体验**（高优先级）
   - ❌ 无全局搜索功能
   - ❌ 无代码 Playground（在线编辑器）
   - ❌ 无版本信息显示
   - ❌ 无更新日志/博客
   - ❌ 无面包屑导航
   - ❌ 无文档目录（TOC）

#### 5. **社区功能**（中优先级）
   - ❌ 社交媒体链接未配置
   - ❌ 无社区展示（贡献者、使用案例）
   - ❌ 无 GitHub 统计展示
   - ❌ 无社区讨论入口

#### 6. **内容完整性**（中优先级）
   - ❌ 页脚链接占位符
   - ❌ 缺少常见问题（FAQ）
   - ❌ 缺少迁移指南（从 React/Vue 迁移）
   - ❌ 缺少性能对比数据
   - ❌ 缺少使用案例展示

#### 7. **学习资源**（中优先级）
   - ❌ 缺少学习路径（Learning Path）
   - ❌ 缺少视频教程链接
   - ❌ 缺少示例项目展示
   - ❌ 缺少模板和脚手架

#### 8. **国际化**（低优先级）
   - ❌ 无多语言支持
   - ❌ 无语言切换功能

### 目标

将 WSXJS 网站升级为**世界级的框架官方网站**（参考 Vue.js、React 的标准）：

#### 核心目标
- 🎯 **清晰的价值主张** - 首页突出 WSXJS 的核心优势和差异化
- 📚 **完整的文档中心** - 集成所有文档、API 参考、教程和学习路径
- 🔍 **强大的搜索功能** - 全局搜索，快速找到所需信息
- 🎮 **交互式 Playground** - 在线编辑和运行代码，即时体验
- 📖 **学习路径** - 从入门到高级的完整学习路径
- 🚀 **性能展示** - 展示框架性能优势和对比数据
- 📱 **移动优先** - 完美的移动端体验
- ♿ **可访问性** - 符合 WCAG 2.1 AA 标准
- 🌍 **国际化准备** - 支持多语言扩展
- 👥 **社区展示** - 贡献者、使用案例、社区统计

## 详细设计

### 0. 首页价值主张优化（最高优先级）- 作为"前门"的关键

**参考标准**：Vue.js 和 React 的首页设计

Vue.js 首页特点：
- 清晰的标语："The Progressive JavaScript Framework"
- 三个核心特性：Approachable, Versatile, Performant
- 立即开始的 CTA
- 代码示例展示

React 首页特点：
- 清晰的标语："The library for web and native user interfaces"
- 核心特性展示
- 快速开始指南
- 社区统计

WSXJS 首页应该：
- 清晰传达"JSX for Native Web Components"的核心价值
- 突出与 React/Vue 的差异化
- 展示性能优势
- 提供立即开始的路径

作为 WSXJS 的"前门"，首页必须立即传达核心价值。

#### 0.1 核心价值主张展示

**参考 Vue.js 的首页结构**：

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
// src/components/HomeSection.wsx (增强版)
@autoRegister({ tagName: 'home-section' })
export class HomeSection extends WebComponent {
    render() {
        return (
            <div>
                {/* Hero Section - 核心价值主张 */}
                <section class="hero-section">
                    <h1 class="hero-title">
                        <span class="title-main">WSXJS</span>
                        <span class="title-subtitle">
                            JSX for Native Web Components
                        </span>
                    </h1>
                    <p class="hero-description">
                        Not a framework, just better developer experience.
                        Write JSX syntax, get native Web Components.
                        Zero dependencies, TypeScript-first, production-ready.
                    </p>
                    
                    {/* CTA Buttons */}
                    <div class="hero-actions">
                        <wsx-link to="/docs/getting-started" class="btn-primary">
                            Get Started
                        </wsx-link>
                        <button class="btn-secondary" onClick={this.openPlayground}>
                            Try Online
                        </button>
                    </div>
                </section>

                {/* Why WSXJS Section - 差异化优势 */}
                <section class="why-section">
                    <h2>Why WSXJS?</h2>
                    <div class="comparison-grid">
                        <div class="comparison-item">
                            <h3>vs React</h3>
                            <ul>
                                <li>✅ Native Web Components (no Virtual DOM)</li>
                                <li>✅ Zero runtime overhead</li>
                                <li>✅ Works with any framework</li>
                                <li>✅ Smaller bundle size</li>
                            </ul>
                        </div>
                        <div class="comparison-item">
                            <h3>vs Vue</h3>
                            <ul>
                                <li>✅ Pure Web Standards</li>
                                <li>✅ No framework lock-in</li>
                                <li>✅ Better performance</li>
                                <li>✅ Future-proof</li>
                            </ul>
                        </div>
                        <div class="comparison-item">
                            <h3>vs Plain Web Components</h3>
                            <ul>
                                <li>✅ JSX syntax (familiar)</li>
                                <li>✅ TypeScript support</li>
                                <li>✅ Better DX</li>
                                <li>✅ Modern tooling</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Performance Metrics */}
                <section class="performance-section">
                    <h2>Performance</h2>
                    <div class="metrics-grid">
                        <div class="metric-item">
                            <span class="metric-value">0 KB</span>
                            <span class="metric-label">Runtime Size</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">100%</span>
                            <span class="metric-label">Native Performance</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">⚡</span>
                            <span class="metric-label">No Virtual DOM</span>
                        </div>
                    </div>
                </section>

                {/* Quick Start Code Example */}
                <section class="code-example-section">
                    <h2>Get Started in 60 Seconds</h2>
                    <div class="code-block">
                        <pre><code>{this.getQuickStartCode()}</code></pre>
                        <button onClick={this.copyCode}>Copy</button>
                        <button onClick={this.openPlayground}>Try Online</button>
                    </div>
                </section>
            </div>
        );
    }
}
```

#### 0.2 关键信息展示

**必须包含**：
- ✅ 核心价值主张（一句话说明）
- ✅ 与 React/Vue 的对比
- ✅ 性能指标
- ✅ 快速开始代码示例
- ✅ CTA 按钮（Get Started, Try Online）
- ✅ 统计数据（npm downloads, GitHub stars）

### 1. 文档系统集成（高优先级）

**参考标准**：Vue.js 和 React 的文档结构

Vue.js 文档特点：
- 清晰的分类：Guide, API Reference, Examples
- 侧边栏导航
- 文档目录（TOC）
- 面包屑导航
- 代码示例和交互式演示

React 文档特点：
- 学习路径：Learn React, API Reference, Community
- 搜索功能（Cmd+K）
- 代码示例
- 版本切换

#### 1.1 文档结构重组

**当前问题**：
- 文档分散在 `docs/` 目录
- 网站中无文档入口
- 文档格式不统一

**解决方案**：

```
packages/examples/src/
├── docs/                    # 文档组件（全部使用 WSX）
│   ├── DocLayout.wsx       # 文档布局组件（参考 Vue.js）
│   ├── DocSidebar.wsx      # 文档侧边栏导航
│   ├── DocContent.wsx      # 文档内容渲染（渲染 Markdown 转换后的 WSX）
│   ├── DocTOC.wsx          # 文档目录（Table of Contents）
│   ├── DocBreadcrumb.wsx   # 面包屑导航
│   ├── DocSearch.wsx       # 文档搜索（全局搜索，Cmd+K）
│   ├── DocVersionSwitcher.wsx # 版本切换器（如果适用）
│   └── pages/              # 文档页面（Markdown 转换生成的 WSX 文件）
│       ├── guide/          # 指南（概念性文档）
│       │   ├── essentials/ # 基础
│       │   ├── core-concepts/ # 核心概念
│       │   └── advanced/   # 高级主题
│       ├── api/            # API 参考（技术性文档）
│       ├── tutorials/      # 教程（实践性文档）
│       └── migration/      # 迁移指南
```

**路由扩展**（参考 Vue.js 文档结构）：
```tsx
<wsx-view route="/docs" component="docs-layout">
    {/* 入门指南 */}
    <wsx-view route="/docs/guide/essentials/getting-started" component="getting-started-doc" />
    <wsx-view route="/docs/guide/essentials/installation" component="installation-doc" />
    
    {/* 核心概念 */}
    <wsx-view route="/docs/guide/core-concepts/web-components" component="web-components-doc" />
    <wsx-view route="/docs/guide/core-concepts/light-components" component="light-components-doc" />
    <wsx-view route="/docs/guide/core-concepts/state" component="state-doc" />
    
    {/* 高级主题 */}
    <wsx-view route="/docs/guide/advanced/composition" component="composition-doc" />
    <wsx-view route="/docs/guide/advanced/routing" component="routing-doc" />
    
    {/* API 参考 */}
    <wsx-view route="/docs/api/web-component" component="api-web-component" />
    <wsx-view route="/docs/api/light-component" component="api-light-component" />
    <wsx-view route="/docs/api/router" component="api-router" />
    
    {/* 教程 */}
    <wsx-view route="/docs/tutorials/building-your-first-app" component="tutorial-first-app" />
    <wsx-view route="/docs/tutorials/building-a-component-library" component="tutorial-component-library" />
    
    {/* 迁移指南 */}
    <wsx-view route="/docs/migration/from-react" component="migration-react" />
    <wsx-view route="/docs/migration/from-vue" component="migration-vue" />
</wsx-view>
```

**文档结构**（参考 Vue.js）：
- **Guide（指南）** - 概念性文档，解释"为什么"和"如何"
- **API Reference（API 参考）** - 技术性文档，详细的 API 说明
- **Tutorials（教程）** - 实践性文档，手把手教学
- **Migration（迁移）** - 从其他框架迁移的指南

**重要约束**：
- 所有组件必须使用 WSXJS（`.wsx` 文件）
- 不能引入 React、Vue 或其他框架
- Markdown 必须转换为 WSX 组件，而不是 JSX

#### 1.2 文档内容管理

**方案 A: Markdown 转 WSX（推荐）**

使用 Vite 插件将 Markdown 转换为 WSX 组件：

```typescript
// vite.config.ts
import { markdownToWsxPlugin } from './plugins/markdown-to-wsx-plugin';

export default defineConfig({
    plugins: [
        markdownToWsxPlugin({
            basePath: '../docs',
            outputPath: './src/docs/pages',
            // 转换选项
            options: {
                // 代码高亮
                highlight: true,
                // 转换为 WSX 组件格式
                componentFormat: 'wsx',
                // 自动添加 @jsxImportSource pragma
                autoInjectPragma: true
            }
        }),
        // ...
    ]
});
```

**转换示例**：

输入 Markdown (`docs/guide/QUICK_START.md`):
```markdown
# Quick Start

Learn how to get started with WSXJS.

## Installation

\`\`\`bash
npm install @wsxjs/wsx-core
\`\`\`
```

输出 WSX (`src/docs/pages/quick-start.wsx`):
```tsx
/** @jsxImportSource @wsxjs/wsx-core */
import { LightComponent, autoRegister } from '@wsxjs/wsx-core';
import { highlightCode } from '../utils/code-highlight';

@autoRegister({ tagName: 'quick-start-doc' })
export default class QuickStartDoc extends LightComponent {
    render() {
        return (
            <div class="doc-content">
                <h1>Quick Start</h1>
                <p>Learn how to get started with WSXJS.</p>
                <h2>Installation</h2>
                <pre class="code-block">
                    <code>{highlightCode('bash', 'npm install @wsxjs/wsx-core')}</code>
                </pre>
            </div>
        );
    }
}
```

**优点**：
- 保持 Markdown 可读性
- 构建时转换为原生 WSX 组件
- 支持代码高亮
- 完全使用 WSXJS，无外部框架依赖
- 自动添加必要的 pragma 和导入

**方案 B: 运行时 Markdown 解析**

使用 `marked` 或 `markdown-it` 在运行时解析：

```typescript
// src/components/DocContent.wsx
import { marked } from 'marked';

@autoRegister({ tagName: 'doc-content' })
export class DocContent extends LightComponent {
    private content: string = '';
    
    async connectedCallback() {
        const markdown = await this.loadMarkdown();
        this.content = marked.parse(markdown);
        this.rerender();
    }
    
    render() {
        return (
            <div class="doc-content" innerHTML={this.content}></div>
        );
    }
}
```

**优点**：
- 实现简单
- 无需额外构建步骤

**缺点**：
- 需要运行时解析，性能较差
- 需要处理 XSS 安全
- 代码高亮需要额外处理

**推荐方案 A（Markdown 转 WSX）**，因为：
- 构建时转换，性能更好
- 完全使用 WSXJS，符合项目约束
- 可以添加语法高亮、代码示例等增强
- 类型安全（TypeScript 支持）
- 可以利用 WSX 的所有特性（响应式、生命周期等）

### 2. SEO 优化（高优先级）

#### 2.1 动态 Meta 标签

**实现方案**：

创建 `MetaManager` 工具类：

```typescript
// src/utils/meta-manager.ts
export class MetaManager {
    static update(meta: RouteMeta) {
        // 更新 title
        document.title = meta.title;
        
        // 更新或创建 meta 标签
        this.setMeta('description', meta.description);
        this.setMeta('og:title', meta.title);
        this.setMeta('og:description', meta.description);
        this.setMeta('og:url', meta.url);
        this.setMeta('og:image', meta.image);
        this.setMeta('twitter:card', 'summary_large_image');
        // ...
    }
    
    private static setMeta(name: string, content: string) {
        let element = document.querySelector(`meta[name="${name}"]`) ||
                     document.querySelector(`meta[property="${name}"]`);
        
        if (!element) {
            element = document.createElement('meta');
            if (name.startsWith('og:') || name.startsWith('twitter:')) {
                element.setAttribute('property', name);
            } else {
                element.setAttribute('name', name);
            }
            document.head.appendChild(element);
        }
        
        element.setAttribute('content', content);
    }
}
```

**路由 Meta 配置**：

```typescript
// src/config/route-meta.ts
export const routeMeta: Record<string, RouteMeta> = {
    '/': {
        title: 'WSXJS - JSX for Web Components',
        description: 'Modern JSX syntax for native Web Components. Zero dependencies, TypeScript-first, production-ready.',
        image: '/og-image.png',
        url: 'https://wsxjs.dev/'
    },
    '/docs/getting-started': {
        title: 'Getting Started - WSXJS',
        description: 'Learn how to get started with WSXJS in minutes.',
        // ...
    },
    // ...
};
```

**在路由组件中使用**：

```typescript
// App.wsx
protected onConnected(): void {
    // 监听路由变化
    this.router?.onRouteChange((route) => {
        const meta = routeMeta[route] || routeMeta['/'];
        MetaManager.update(meta);
    });
}
```

#### 2.2 结构化数据（JSON-LD）

添加结构化数据以提升 SEO：

```typescript
// src/utils/structured-data.ts
export function addStructuredData(data: StructuredData) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
}

// 使用示例
addStructuredData({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'WSXJS',
    applicationCategory: 'Web Development Framework',
    operatingSystem: 'Web',
    offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
    }
});
```

### 3. 搜索功能（高优先级）- 参考 Vue.js 和 React

**参考标准**：
- Vue.js: 全局搜索，支持快捷键 Cmd/Ctrl + K
- React: 强大的搜索功能，支持全文搜索

#### 3.1 客户端搜索实现

**方案 A: 使用 Fuse.js（推荐）**

```typescript
// src/utils/search.ts
import Fuse from 'fuse.js';

// 构建搜索索引（从所有文档页面）
const searchIndex = [
    { 
        title: 'Getting Started', 
        content: 'Learn how to get started with WSXJS...', 
        url: '/docs/guide/essentials/getting-started',
        category: 'Guide',
        tags: ['beginner', 'setup', 'installation']
    },
    { 
        title: 'WebComponent API', 
        content: 'The WebComponent base class provides...', 
        url: '/docs/api/web-component',
        category: 'API',
        tags: ['api', 'web-component', 'base-class']
    },
    // ... 从所有文档页面生成索引
];

const fuse = new Fuse(searchIndex, {
    keys: ['title', 'content', 'tags'],
    threshold: 0.3,
    includeScore: true,
    minMatchCharLength: 2
});

export function search(query: string): SearchResult[] {
    if (!query || query.length < 2) return [];
    return fuse.search(query).map(result => ({
        ...result.item,
        score: result.score
    }));
}
```

**方案 B: 使用 Algolia（高级，未来考虑）**

如果需要更强大的搜索功能（如 Vue.js 使用的 Algolia），可以后续集成。

**推荐方案 A（Fuse.js）**，因为：
- 零依赖外部服务
- 实现简单
- 满足当前需求
- 可以后续升级到 Algolia

#### 3.2 搜索 UI 组件（WSX 实现）- 参考 Vue.js 搜索

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
// src/components/DocSearch.wsx
import { LightComponent, autoRegister, state } from '@wsxjs/wsx-core';
import { search } from '../utils/search';

@autoRegister({ tagName: 'doc-search' })
export class DocSearch extends LightComponent {
    @state private query: string = '';
    @state private results: SearchResult[] = [];
    @state private isOpen: boolean = false;
    @state private selectedIndex: number = 0;
    
    protected onConnected(): void {
        // 添加快捷键支持（Cmd/Ctrl + K）
        document.addEventListener('keydown', this.handleKeyboard);
    }
    
    protected onDisconnected(): void {
        document.removeEventListener('keydown', this.handleKeyboard);
    }
    
    render() {
        return (
            <div class="search-container">
                {/* 搜索触发器按钮（显示在导航栏） */}
                <button 
                    class="search-trigger"
                    onClick={() => { this.isOpen = true; }}
                    aria-label="Search documentation (Cmd+K)"
                >
                    <svg-icon name="search" size="20"></svg-icon>
                    <span class="search-hint">Search (⌘K)</span>
                </button>
                
                {/* 搜索模态框 */}
                {this.isOpen && (
                    <div class="search-modal" onClick={this.handleBackdropClick}>
                        <div class="search-modal-content" onClick={(e) => e.stopPropagation()}>
                            <div class="search-input-wrapper">
                                <svg-icon name="search" size="20"></svg-icon>
                                <input
                                    type="text"
                                    placeholder="Search documentation..."
                                    value={this.query}
                                    onInput={this.handleInput}
                                    onKeyDown={this.handleKeyDown}
                                    autofocus
                                />
                                {this.query && (
                                    <button onClick={this.clearQuery} aria-label="Clear">
                                        <svg-icon name="close" size="16"></svg-icon>
                                    </button>
                                )}
                            </div>
                            
                            {/* 搜索结果 */}
                            {this.query && (
                                <div class="search-results">
                                    {this.results.length > 0 ? (
                                        this.results.map((result, index) => (
                                            <a
                                                href={result.url}
                                                class={`search-result-item ${index === this.selectedIndex ? 'selected' : ''}`}
                                                onClick={this.handleResultClick}
                                                onMouseEnter={() => { this.selectedIndex = index; }}
                                            >
                                                <div class="result-category">{result.category}</div>
                                                <h4>{this.highlightMatch(result.title, this.query)}</h4>
                                                <p>{this.highlightMatch(result.snippet, this.query)}</p>
                                            </a>
                                        ))
                                    ) : (
                                        <div class="search-no-results">
                                            No results found for "{this.query}"
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* 搜索提示 */}
                            {!this.query && (
                                <div class="search-tips">
                                    <div class="tip-item">
                                        <kbd>↑</kbd><kbd>↓</kbd> Navigate
                                    </div>
                                    <div class="tip-item">
                                        <kbd>Enter</kbd> Select
                                    </div>
                                    <div class="tip-item">
                                        <kbd>Esc</kbd> Close
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }
    
    private handleInput = (e: Event): void => {
        const target = e.target as HTMLInputElement;
        this.query = target.value;
        this.results = search(this.query);
        this.selectedIndex = 0;
    };
    
    private handleKeyDown = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') {
            this.isOpen = false;
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = Math.min(this.selectedIndex + 1, this.results.length - 1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        } else if (e.key === 'Enter' && this.results.length > 0) {
            e.preventDefault();
            window.location.href = this.results[this.selectedIndex].url;
            this.isOpen = false;
        }
    };
    
    private handleKeyboard = (e: KeyboardEvent): void => {
        // Cmd/Ctrl + K 打开搜索
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            this.isOpen = !this.isOpen;
        }
    };
    
    private handleBackdropClick = (): void => {
        this.isOpen = false;
    };
    
    private clearQuery = (): void => {
        this.query = '';
        this.results = [];
    };
    
    private handleResultClick = (): void => {
        this.isOpen = false;
        this.query = '';
    };
    
    private highlightMatch(text: string, query: string): string {
        // 高亮匹配的文本（简化版，实际可以使用更复杂的实现）
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
}
```

### 4. 代码 Playground（中优先级）

#### 4.1 在线代码编辑器（WSX 实现）

**方案 A: Monaco Editor（VS Code 编辑器）**

Monaco Editor 是纯 JavaScript 库，可以在 WSX 组件中使用：

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
// src/components/Playground.wsx
import { LightComponent, autoRegister } from '@wsxjs/wsx-core';
import * as monaco from 'monaco-editor';

@autoRegister({ tagName: 'code-playground' })
export class Playground extends LightComponent {
    private editor: monaco.editor.IStandaloneCodeEditor | null = null;
    private editorContainer: HTMLElement | null = null;
    
    protected onConnected(): void {
        // 等待 DOM 渲染完成
        requestAnimationFrame(() => {
            this.editorContainer = this.querySelector('#editor') as HTMLElement;
            if (this.editorContainer) {
                this.editor = monaco.editor.create(this.editorContainer, {
                    value: this.getDefaultCode(),
                    language: 'typescript',
                    theme: 'vs-dark',
                    minimap: { enabled: false }
                });
            }
        });
    }
    
    protected onDisconnected(): void {
        if (this.editor) {
            this.editor.dispose();
            this.editor = null;
        }
    }
    
    render() {
        return (
            <div class="playground-container">
                <div id="editor" class="editor"></div>
                <button onClick={this.runCode}>Run</button>
                <div id="output" class="output"></div>
            </div>
        );
    }
    
    private getDefaultCode(): string {
        return `/** @jsxImportSource @wsxjs/wsx-core */
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister({ tagName: 'my-component' })
export class MyComponent extends WebComponent {
    render() {
        return <div>Hello WSX!</div>;
    }
}`;
    }
    
    private runCode = async (): Promise<void> => {
        if (!this.editor) return;
        const code = this.editor.getValue();
        // 使用 iframe 沙箱执行代码
        await this.executeInSandbox(code);
    };
    
    private async executeInSandbox(code: string): Promise<void> {
        // 实现见下方代码执行沙箱部分
    }
}
```

**方案 B: CodeMirror（轻量级）**

如果 Monaco 太重，可以使用 CodeMirror：

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';

@autoRegister({ tagName: 'code-playground' })
export class Playground extends LightComponent {
    private editor: EditorView | null = null;
    
    protected onConnected(): void {
        const container = this.querySelector('#editor');
        if (container) {
            this.editor = new EditorView({
                parent: container,
                extensions: [basicSetup, javascript()]
            });
        }
    }
}
```

**推荐方案 A（Monaco Editor）**，因为：
- 更好的 TypeScript 支持
- 熟悉的用户体验（VS Code）
- 功能更强大
- 纯 JavaScript 库，完全兼容 WSX

#### 4.2 代码执行沙箱

使用 iframe 沙箱执行用户代码：

```typescript
// src/utils/code-runner.ts
export function runCodeInSandbox(code: string): Promise<string> {
    return new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.sandbox = 'allow-scripts';
        iframe.style.display = 'none';
        
        iframe.onload = () => {
            const result = iframe.contentWindow!.eval(code);
            resolve(result);
            document.body.removeChild(iframe);
        };
        
        iframe.srcdoc = `
            <!DOCTYPE html>
            <html>
                <head>
                    <script src="https://unpkg.com/@wsxjs/wsx-core@latest/dist/index.mjs"></script>
                </head>
                <body>
                    <script>${code}</script>
                </body>
            </html>
        `;
        
        document.body.appendChild(iframe);
    });
}
```

### 5. 学习路径和教程（高优先级）- 参考 Vue.js 和 React

**参考标准**：
- Vue.js: 清晰的学习路径，从基础到高级
- React: Learn React 部分，循序渐进

#### 5.1 学习路径页面

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
// src/components/LearningPathSection.wsx
import { LightComponent, autoRegister, state } from '@wsxjs/wsx-core';

@autoRegister({ tagName: 'learning-path-section' })
export class LearningPathSection extends LightComponent {
    private learningPath = [
        {
            title: 'Essentials',
            description: 'Learn the fundamentals',
            steps: [
                { title: 'Getting Started', url: '/docs/guide/essentials/getting-started', duration: '5 min' },
                { title: 'Installation', url: '/docs/guide/essentials/installation', duration: '3 min' },
                { title: 'Your First Component', url: '/docs/guide/essentials/first-component', duration: '10 min' },
            ]
        },
        {
            title: 'Core Concepts',
            description: 'Understand the core concepts',
            steps: [
                { title: 'Web Components', url: '/docs/guide/core-concepts/web-components', duration: '15 min' },
                { title: 'Light Components', url: '/docs/guide/core-concepts/light-components', duration: '15 min' },
                { title: 'State Management', url: '/docs/guide/core-concepts/state', duration: '20 min' },
            ]
        },
        {
            title: 'Advanced',
            description: 'Master advanced topics',
            steps: [
                { title: 'Component Composition', url: '/docs/guide/advanced/composition', duration: '25 min' },
                { title: 'Routing', url: '/docs/guide/advanced/routing', duration: '20 min' },
            ]
        }
    ];
    
    render() {
        return (
            <div class="learning-path-container">
                <h1>Learning Path</h1>
                <p>Follow this path to master WSXJS</p>
                
                {this.learningPath.map((section, sectionIndex) => (
                    <div class="path-section">
                        <h2>{section.title}</h2>
                        <p>{section.description}</p>
                        <div class="steps-grid">
                            {section.steps.map((step, stepIndex) => (
                                <div class="step-card">
                                    <div class="step-number">{sectionIndex * 10 + stepIndex + 1}</div>
                                    <h3>{step.title}</h3>
                                    <span class="step-duration">{step.duration}</span>
                                    <wsx-link to={step.url} class="step-link">
                                        Start →
                                    </wsx-link>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }
}
```

### 6. 内容增强（中优先级）

#### 6.1 博客/更新日志（WSX 实现）

**路由**：`/blog` 或 `/changelog`

**实现**：

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
// src/components/BlogSection.wsx
import { LightComponent, autoRegister, state } from '@wsxjs/wsx-core';

@autoRegister({ tagName: 'blog-section' })
export class BlogSection extends LightComponent {
    @state private posts: BlogPost[] = [];
    @state private loading: boolean = true;
    
    async connectedCallback() {
        // 从 API 或静态文件加载博客文章
        this.loading = true;
        this.posts = await this.loadPosts();
        this.loading = false;
    }
    
    render() {
        if (this.loading) {
            return <div class="loading">Loading posts...</div>;
        }
        
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
    
    private async loadPosts(): Promise<BlogPost[]> {
        // 从静态文件或 API 加载
        const response = await fetch('/api/posts.json');
        return response.json();
    }
}
```

#### 6.2 常见问题（FAQ）（WSX 实现）

**路由**：`/faq`

创建 FAQ 组件，支持展开/折叠：

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
// src/components/FAQSection.wsx
import { LightComponent, autoRegister, state } from '@wsxjs/wsx-core';

@autoRegister({ tagName: 'faq-section' })
export class FAQSection extends LightComponent {
    private faqs: FAQ[] = [
        {
            question: 'What is WSXJS?',
            answer: 'WSXJS is a modern framework for building Web Components with JSX syntax...'
        },
        // ...
    ];
    
    @state private expandedIndex: number | null = null;
    
    render() {
        return (
            <div class="faq-container">
                {this.faqs.map((faq, index) => (
                    <div class="faq-item">
                        <button 
                            onClick={() => this.toggleFAQ(index)}
                            aria-expanded={this.expandedIndex === index}
                        >
                            {faq.question}
                        </button>
                        {this.expandedIndex === index && (
                            <div class="faq-answer">{faq.answer}</div>
                        )}
                    </div>
                ))}
            </div>
        );
    }
    
    private toggleFAQ = (index: number): void => {
        this.expandedIndex = this.expandedIndex === index ? null : index;
    };
}
```

#### 6.3 版本信息

在导航栏或页脚显示当前版本：

```tsx
// src/components/VersionBadge.wsx
@autoRegister({ tagName: 'version-badge' })
export class VersionBadge extends LightComponent {
    private version: string = '';
    
    async connectedCallback() {
        // 从 package.json 或 API 获取版本
        this.version = await this.getVersion();
        this.rerender();
    }
    
    render() {
        return (
            <span class="version-badge">
                v{this.version}
            </span>
        );
    }
}
```

### 7. 社区功能（中优先级）- 参考 Vue.js 和 React

**参考标准**：
- Vue.js: 社区页面，展示贡献者、使用案例
- React: 社区资源，生态系统展示

#### 7.1 社区展示

**路由**：`/community`

展示：
- 贡献者列表
- 社区项目
- 使用案例
- 社区统计

#### 7.2 社交媒体集成

修复页脚链接，添加真实的社交媒体链接：

```typescript
// src/config/social-links.ts
export const socialLinks = {
    github: 'https://github.com/wsxjs/wsxjs',
    discord: 'https://discord.gg/wsxjs', // 需要创建
    twitter: 'https://twitter.com/wsxjs', // 需要创建
    // ...
};
```

### 8. 性能优化（中优先级）

#### 7.1 代码分割

实现路由级代码分割：

```typescript
// vite.config.ts
build: {
    rollupOptions: {
        output: {
            manualChunks: {
                'home': ['./src/components/HomeSection.wsx'],
                'docs': ['./src/docs/**'],
                'examples': ['./src/components/*Examples*.wsx'],
            }
        }
    }
}
```

#### 7.2 资源预加载

预加载关键资源：

```html
<!-- index.html -->
<link rel="preload" href="/src/components/HomeSection.wsx" as="script" />
<link rel="prefetch" href="/src/components/FeaturesSection.wsx" as="script" />
```

#### 7.3 图片优化

- 使用 WebP 格式
- 实现懒加载
- 响应式图片

### 9. 可访问性（中优先级）

#### 8.1 ARIA 标签

确保所有交互元素都有适当的 ARIA 标签：

```tsx
<button
    aria-label="Toggle navigation menu"
    aria-expanded={this.isNavOpen}
    onClick={this.toggleNav}
>
    <span aria-hidden="true">☰</span>
</button>
```

#### 8.2 键盘导航

确保所有功能都可以通过键盘访问。

#### 8.3 屏幕阅读器支持

测试并优化屏幕阅读器体验。

### 10. 错误处理（高优先级）

#### 9.1 404 页面

```tsx
// src/components/NotFoundSection.wsx
@autoRegister({ tagName: 'not-found-section' })
export class NotFoundSection extends LightComponent {
    render() {
        return (
            <div class="not-found">
                <h1>404</h1>
                <p>Page not found</p>
                <wsx-link to="/">Go home</wsx-link>
            </div>
        );
    }
}

// App.wsx
<wsx-view route="*" component="not-found-section"></wsx-view>
```

#### 9.2 错误边界

添加全局错误处理：

```typescript
// src/utils/error-handler.ts
window.addEventListener('error', (event) => {
    // 记录错误
    console.error('Global error:', event.error);
    // 显示用户友好的错误消息
});
```

## 实施计划

### 阶段 0: 首页价值主张（1 周）- 最高优先级

**作为"前门"，这是最重要的改进**

1. ✅ 首页重构
   - [ ] 优化 Hero Section，突出核心价值主张
   - [ ] 添加与 React/Vue 的对比说明
   - [ ] 添加性能指标展示
   - [ ] 添加快速开始代码示例
   - [ ] 优化 CTA 按钮和导航

2. ✅ 关键信息展示
   - [ ] 添加统计数据（npm downloads, GitHub stars）
   - [ ] 添加"为什么选择 WSXJS"部分
   - [ ] 添加核心特性展示

### 阶段 1: 基础增强（1-2 周）

**优先级：高**

1. ✅ SEO 优化
   - [ ] 实现动态 meta 标签更新
   - [ ] 添加 Open Graph 标签
   - [ ] 添加结构化数据（Schema.org）
   - [ ] 生成 sitemap.xml

2. ✅ 错误处理
   - [ ] 添加 404 页面
   - [ ] 添加错误边界
   - [ ] 添加错误追踪

3. ✅ 内容修复
   - [ ] 修复页脚链接
   - [ ] 配置社交媒体链接
   - [ ] 添加真实的文档链接

### 阶段 2: 文档集成（2-3 周）

**优先级：高**

1. ✅ 文档系统
   - [ ] 创建文档布局组件（参考 Vue.js 布局）
   - [ ] 实现 Markdown 转 WSX
   - [ ] 集成现有文档
   - [ ] 添加文档目录（TOC）
   - [ ] 添加面包屑导航
   - [ ] 添加文档侧边栏导航

2. ✅ 搜索功能
   - [ ] 实现客户端搜索
   - [ ] 创建搜索 UI 组件
   - [ ] 构建搜索索引

### 阶段 3: 高级功能（3-4 周）

**优先级：中**

1. ✅ 代码 Playground
   - [ ] 集成 Monaco Editor
   - [ ] 实现代码执行沙箱
   - [ ] 添加示例模板

2. ✅ 性能优化
   - [ ] 实现代码分割
   - [ ] 添加资源预加载
   - [ ] 优化图片加载

### 阶段 4: 社区功能（2-3 周）

**优先级：中**

1. ✅ 博客系统
   - [ ] 创建博客布局
   - [ ] 实现文章列表
   - [ ] 添加文章详情页
   - [ ] 添加 RSS feed

2. ✅ 社区展示
   - [ ] 贡献者列表（从 GitHub API 获取）
   - [ ] 使用案例展示
   - [ ] 社区统计（GitHub stars, npm downloads）
   - [ ] 社区讨论入口（GitHub Discussions）

3. ✅ 迁移指南
   - [ ] 从 React 迁移指南
   - [ ] 从 Vue 迁移指南
   - [ ] 迁移工具（如果有）

### 阶段 6: 高级功能（2-3 周）

**优先级：中**

1. ✅ 性能展示
   - [ ] 性能对比数据
   - [ ] 基准测试结果
   - [ ] 性能图表

2. ✅ 示例项目
   - [ ] 示例项目展示
   - [ ] 模板和脚手架
   - [ ] 最佳实践案例

3. ✅ 国际化准备
   - [ ] 多语言支持架构
   - [ ] 语言切换功能
   - [ ] 中文文档（如果适用）

## 技术决策

### 文档系统

**选择**: Markdown 转 WSX（构建时）

**理由**：
- 性能更好（构建时转换）
- 完全使用 WSXJS，符合项目约束
- 可以添加语法高亮、代码示例等增强
- 保持 Markdown 可读性
- 类型安全（TypeScript 支持）
- 可以利用 WSX 的所有特性（响应式、生命周期等）

### 搜索实现

**选择**: Fuse.js（客户端搜索）

**理由**：
- 零依赖外部服务
- 实现简单
- 满足当前需求
- 可以后续升级到 Algolia

### 代码编辑器

**选择**: Monaco Editor

**理由**：
- 更好的 TypeScript 支持
- 熟悉的用户体验（VS Code）
- 功能更强大

## 风险评估

### 技术风险

1. **Markdown 转 WSX 转换复杂度**
   - **风险**: 中等
   - **缓解**: 
     - 创建自定义 Vite 插件处理转换
     - 使用 `marked` 或 `markdown-it` 解析 Markdown
     - 使用 AST 转换工具生成 WSX 组件代码
     - 参考现有工具（如 MDX）的实现思路

2. **WSX 组件约束**
   - **风险**: 低
   - **缓解**: 
     - 所有功能必须使用 WSXJS 实现
     - 不能引入 React、Vue 等外部框架
     - 使用纯 JavaScript 库（如 Monaco Editor）而非框架绑定

2. **代码执行安全**
   - **风险**: 高
   - **缓解**: 使用 iframe 沙箱，限制 API 访问

3. **性能影响**
   - **风险**: 低
   - **缓解**: 代码分割、懒加载

### 维护风险

1. **内容更新**
   - **风险**: 低
   - **缓解**: 自动化文档同步

2. **搜索索引更新**
   - **风险**: 低
   - **缓解**: 构建时自动生成索引

## 成功指标

### 用户体验

- [ ] 页面加载时间 < 2 秒
- [ ] 首次内容绘制 (FCP) < 1.5 秒
- [ ] 最大内容绘制 (LCP) < 2.5 秒
- [ ] 可访问性评分 > 90 (Lighthouse)

### SEO

- [ ] SEO 评分 > 90 (Lighthouse)
- [ ] 所有页面都有唯一的 meta 标签
- [ ] 结构化数据验证通过

### 功能完整性

- [ ] 所有文档可访问
- [ ] 搜索功能正常工作
- [ ] Playground 可以运行代码
- [ ] 所有链接有效

## 后续工作

### 国际化（i18n）

考虑添加多语言支持：
- 英文（默认）
- 中文
- 其他语言（根据需求）

### 分析集成

添加网站分析：
- Google Analytics
- Plausible（隐私友好）
- 自定义分析

### 性能监控

添加性能监控：
- Web Vitals 追踪
- 错误追踪
- 用户行为分析

## 相关文档

### 子 RFC（里程碑）

- [RFC-0022: 首页价值主张优化（M0）](./0022-homepage-value-proposition.md)
- [RFC-0023: SEO 优化和错误处理（M1）](./0023-seo-error-handling.md)
- [RFC-0024: 文档系统集成（M2）](./0024-documentation-system.md)
- [RFC-0025: 代码 Playground（M3）](./0025-code-playground.md)
- [RFC-0026: 性能优化（M4）](./0026-performance-optimization.md)
- [RFC-0027: 社区功能（M5）](./0027-community-features.md)
- [RFC-0028: 高级功能（M6）](./0028-advanced-features.md)

### 其他相关文档

- [RFC-0019: 零配置初始化](./0019-zero-config-initialization.md)
- [RFC-0020: JSX Import Source Pragma](./completed/0020-jsx-import-source-pragma-auto-injection.md)
- [网站审查文档](../../packages/examples/WEBSITE_REVIEW.md)
- [执行计划](../../packages/examples/EXECUTION_PLAN.md)

## 总结

本 RFC 规划了 WSXJS 框架网站的全面增强，从简单的示例展示升级为**世界级的框架官方网站**（参考 Vue.js、React 的标准）。作为 WSXJS 的"前门"，网站必须立即传达核心价值，提供完整的文档和学习资源。

**关键改进点**（按优先级排序）：

#### 最高优先级（立即处理）
1. 🎯 **首页价值主张优化** - 清晰传达 WSXJS 的核心优势和差异化
2. 📚 **完整的文档系统** - 集成所有文档、API 参考、教程
3. 🔍 **全局搜索功能** - 快速找到所需信息
4. 🚀 **SEO 优化** - 提升搜索引擎可见性

#### 高优先级（近期处理）
5. 🎮 **代码 Playground** - 在线编辑和运行代码
6. 📖 **学习路径** - 从入门到高级的完整路径
7. ⚡ **性能展示** - 展示框架性能优势
8. ♿ **可访问性改进** - 符合 WCAG 标准

#### 中优先级（中期处理）
9. 👥 **社区展示** - 贡献者、使用案例、统计
10. 📝 **迁移指南** - 从 React/Vue 迁移
11. 📰 **博客系统** - 更新日志和技术文章
12. 🌍 **国际化准备** - 多语言支持

**预期成果**：
- ✅ **更好的第一印象** - 访问者立即理解 WSXJS 的价值
- ✅ **更高的搜索引擎排名** - 通过 SEO 优化提升可见性
- ✅ **更完整的功能展示** - 媲美 Vue.js、React 的文档质量
- ✅ **更强的社区吸引力** - 通过社区展示和互动增强参与度
- ✅ **更好的学习体验** - 清晰的学习路径和交互式示例
- ✅ **更高的转化率** - 从访问者到使用者的转化

**参考标准**：
- Vue.js 官方网站（vuejs.org）
- React 官方网站（react.dev）
- Svelte 官方网站（svelte.dev）

通过这些改进，WSXJS 网站将成为框架的**强大前门**，有效吸引和转化新用户。

