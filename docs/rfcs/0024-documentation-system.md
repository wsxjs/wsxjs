# RFC-0024: WSX-Press 文档系统（M2）

- **RFC编号**: 0024
- **父 RFC**: [RFC-0021](./0021-framework-website-enhancement.md)
- **里程碑**: M2
- **开始日期**: 2025-12-24
- **状态**: Approved
- **作者**: WSX Team

## 摘要

创建 `@wsxjs/wsx-press`：一个类似 VitePress 的文档系统，使用 wsx 构建。通过参数路由实现极简设计，只需 2 个路由即可处理所有文档页面，支持 Markdown 文档和 TypeScript API 文档自动生成。

## 动机

### 为什么需要这个功能？

当前文档分散在 `docs/` 目录，未集成到网站中：
- ❌ 文档未在网站中可访问
- ❌ 缺少文档导航和搜索
- ❌ 缺少 API 文档自动生成
- ❌ 用户体验不佳

### 目标用户

- 学习 WSXJS 的开发者
- 查找 API 参考的开发者
- 需要教程和指南的开发者
- 希望集成文档系统到现有网站的项目

### 设计原则

1. **极简路由**：使用参数路由 `/docs/:category/:page`，避免为每个文档创建路由
2. **运行时渲染**：复用现有的 MarkedBuilder，运行时动态加载 Markdown
3. **易于集成**：可以轻松添加到任何现有 wsx 网站
4. **自动化**：API 文档从 TypeScript 代码自动生成

## 详细设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                  WSX-Press 文档系统                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐        ┌──────────────────┐          │
│  │  TypeScript 源码  │        │  Markdown 文档    │          │
│  │  (packages/*/src) │        │  (docs/**/*.md)  │          │
│  └────────┬─────────┘        └────────┬─────────┘          │
│           │                           │                     │
│           ▼                           ▼                     │
│  ┌──────────────────┐        ┌──────────────────┐          │
│  │ TypeDoc +        │        │ 元数据扫描        │          │
│  │ Markdown Plugin  │        │ (frontmatter)    │          │
│  └────────┬─────────┘        └────────┬─────────┘          │
│           │                           │                     │
│           │  生成 Markdown            │ 生成 meta.json     │
│           └────────┬──────────────────┘                     │
│                    ▼                                        │
│           ┌──────────────────┐                              │
│           │  docs-meta.json  │                              │
│           │  search-index.json│                              │
│           └────────┬──────────┘                              │
│                    │                                        │
│                    ▼                                        │
│         ┌──────────────────────┐                            │
│         │  参数路由 (2 个)      │                            │
│         │  /docs/:category/:page│                            │
│         │  /api/:module/:item  │                            │
│         └──────────┬────────────┘                            │
│                    │                                        │
│                    ▼                                        │
│         ┌──────────────────────┐                            │
│         │  DocPage 组件         │                            │
│         │  (动态加载 Markdown)  │                            │
│         └──────────┬────────────┘                            │
│                    │                                        │
│                    ▼                                        │
│         ┌──────────────────────┐                            │
│         │  MarkedBuilder       │                            │
│         │  (运行时渲染)         │                            │
│         └──────────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

### 核心概念

#### 1. 参数路由（极简设计）

**只需 2 个路由处理所有文档：**

```tsx
<wsx-router>
    {/* 文档路由 - 处理所有 Markdown 文档 */}
    <wsx-view route="/docs/:category/:page" component="wsx-doc-page"></wsx-view>

    {/* API 文档路由 - 处理所有 API 文档 */}
    <wsx-view route="/api/:module/:item" component="wsx-api-doc-page"></wsx-view>
</wsx-router>
```

**工作原理：**
1. 用户访问 `/docs/guide/getting-started`
2. wsx-router 匹配 `/docs/:category/:page`
3. 提取参数：`{ category: 'guide', page: 'getting-started' }`
4. `doc-page` 组件接收参数，动态加载 Markdown
5. 使用 MarkedBuilder 渲染内容

#### 2. 运行时文档加载

**无需构建时转换，直接加载 Markdown：**

```typescript
// 开发模式：直接读取原始 .md 文件
await fetch('/docs/guide/getting-started.md')

// 生产模式：同样读取 .md 文件（Vite 会处理）
await fetch('/docs/guide/getting-started.md')
```

#### 3. API 文档自动生成

**使用 TypeDoc + typedoc-plugin-markdown：**

```bash
# 从 TypeScript 代码生成 Markdown API 文档
npx typedoc --plugin typedoc-plugin-markdown \
  --entryPoints packages/core/src/index.ts \
  --out docs/api
```

生成的文档自动成为普通 Markdown 文档，通过相同的路由系统访问。

### 类型定义（零 any 类型）

**核心类型接口：**

```typescript
// packages/wsx-press/src/types.ts

/**
 * 文档元数据
 */
export interface DocMetadata {
    /** 文档标题 */
    title: string;
    /** 文档类别 */
    category: string;
    /** 文档路由 */
    route: string;
    /** 上一篇文档路由 */
    prev?: string | null;
    /** 下一篇文档路由 */
    next?: string | null;
    /** 文档描述 */
    description?: string;
    /** 标签 */
    tags?: string[];
    /** 扩展字段 */
    [key: string]: unknown;
}

/**
 * 文档元数据集合
 */
export type DocsMetaCollection = Record<string, DocMetadata>;

/**
 * 搜索文档
 */
export interface SearchDocument {
    /** 文档唯一ID */
    id: string;
    /** 文档标题 */
    title: string;
    /** 文档类别 */
    category: string;
    /** 文档路由 */
    route: string;
    /** 文档内容片段（用于搜索） */
    content: string;
}

/**
 * 搜索结果
 */
export interface SearchResult {
    /** 匹配的文档 */
    item: SearchDocument;
    /** 匹配分数 */
    score?: number;
    /** 匹配位置 */
    matches?: Array<{
        indices: [number, number][];
        value: string;
        key: string;
    }>;
}

/**
 * 搜索索引
 */
export interface SearchIndex {
    /** 所有文档 */
    documents: SearchDocument[];
    /** Fuse.js 配置 */
    options: {
        keys: Array<{ name: string; weight: number }>;
        threshold: number;
        includeScore: boolean;
        includeMatches?: boolean;
    };
}

/**
 * 路由参数
 */
export interface RouteParams {
    category: string;
    page: string;
}

/**
 * API 路由参数
 */
export interface ApiRouteParams {
    module: string;
    item: string;
}

/**
 * 加载状态
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * 文档加载错误
 */
export class DocumentLoadError extends Error {
    constructor(
        message: string,
        public readonly code: 'NOT_FOUND' | 'NETWORK_ERROR' | 'PARSE_ERROR',
        public readonly details?: unknown
    ) {
        super(message);
        this.name = 'DocumentLoadError';
    }
}
```

### CSS 变量命名规范（避免冲突）

**所有 wsx-press 的 CSS 变量使用 `--wsx-press-*` 前缀：**

- **CSS 变量**：`--wsx-press-*`（如 `--wsx-press-text-primary`, `--wsx-press-bg-primary`, `--wsx-press-sidebar-width`）
  - **重要**：CSS 变量使用统一的 `--wsx-press-*` 前缀，而不是基于组件名的变量（如 `--doc-layout-*`）
  - 这样可以确保所有组件共享同一套主题变量，便于统一管理和覆盖
  - 避免与宿主环境或其他库的 CSS 变量冲突

**示例：**
```css
/* ✅ 正确 - 使用统一的 --wsx-press- 前缀 */
:root {
    --wsx-press-text-primary: var(--text-primary, #2c3e50);
    --wsx-press-text-secondary: var(--text-secondary, #7f8c8d);
    --wsx-press-bg-primary: var(--bg-primary, #ffffff);
    --wsx-press-bg-secondary: var(--bg-secondary, #f9fafb);
    --wsx-press-border-color: var(--border-color, #e5e7eb);
    --wsx-press-primary: var(--primary-red, #dc2626);
    --wsx-press-sidebar-width: 280px;
    --wsx-press-toc-width: 240px;
    --wsx-press-content-max-width: 1200px;
}

/* 组件样式使用这些变量 */
wsx-doc-layout {
    color: var(--wsx-press-text-primary);
    background: var(--wsx-press-bg-primary);
}

wsx-doc-search {
    color: var(--wsx-press-text-primary); /* 复用同一变量 */
    background: var(--wsx-press-bg-secondary);
}

/* ❌ 错误 - 不要使用组件名作为变量前缀 */
:root {
    --doc-layout-text-primary: #2c3e50;
    --doc-search-text-primary: #2c3e50;
}
```

**注意**：
- 组件标签名和 CSS 类名保持原有命名（如 `wsx-doc-*`, `doc-*`）
- 只有 CSS 变量使用 `--wsx-press-*` 前缀以避免冲突

### 包结构设计

创建新的 monorepo package：`@wsxjs/wsx-press`

```
packages/wsx-press/
├── src/
│   ├── node/                    # Node.js 构建工具
│   │   ├── __tests__/          # Node.js 模块测试
│   │   │   ├── metadata.test.ts
│   │   │   ├── search.test.ts
│   │   │   ├── typedoc.test.ts
│   │   │   └── plugin.test.ts
│   │   ├── plugin.ts           # Vite 插件
│   │   ├── typedoc.ts          # TypeDoc 集成
│   │   ├── metadata.ts         # 元数据扫描
│   │   └── search.ts           # 搜索索引生成
│   │
│   ├── client/                  # 客户端组件
│   │   ├── components/
│   │   │   ├── __tests__/      # 组件测试
│   │   │   │   ├── DocPage.test.ts
│   │   │   │   ├── DocSearch.test.ts
│   │   │   │   ├── DocLayout.test.ts
│   │   │   │   └── ...
│   │   │   ├── DocPage.wsx     # 文档页面组件
│   │   │   ├── DocPage.css     # DocPage 样式
│   │   │   ├── ApiDocPage.wsx  # API 文档页面组件
│   │   │   ├── ApiDocPage.css
│   │   │   ├── DocLayout.wsx   # 文档布局
│   │   │   ├── DocLayout.css
│   │   │   ├── DocSidebar.wsx  # 侧边栏
│   │   │   ├── DocSidebar.css
│   │   │   ├── DocTOC.wsx      # 目录
│   │   │   ├── DocTOC.css
│   │   │   ├── DocSearch.wsx   # 搜索组件
│   │   │   ├── DocSearch.css
│   │   │   ├── DocBreadcrumb.wsx # 面包屑
│   │   │   └── DocBreadcrumb.css
│   │   ├── styles/             # 全局样式系统
│   │   │   ├── theme.css       # 主题变量（亮/暗模式）
│   │   │   ├── typography.css  # 排版样式
│   │   │   ├── code.css        # 代码高亮样式
│   │   │   └── reset.css       # CSS Reset
│   │   └── index.ts
│   │
│   ├── types.ts                # 类型定义
│   └── index.ts
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### 组件设计

#### 1. DocPage 组件（核心 - 类型安全 + 错误处理）

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
// packages/wsx-press/src/client/components/DocPage.wsx

import { LightComponent, autoRegister, state } from '@wsxjs/wsx-core';
import type { DocMetadata, DocsMetaCollection, RouteParams, LoadingState } from '../../types';
import { DocumentLoadError } from '../../types';
import './DocLayout.wsx';

@autoRegister({ tagName: 'wsx-doc-page' })
export class DocPage extends LightComponent {
    @state private markdown = '';
    @state private loadingState: LoadingState = 'idle';
    @state private metadata: DocMetadata | null = null;
    @state private error: DocumentLoadError | null = null;

    // 缓存元数据，避免重复加载
    private static metaCache: DocsMetaCollection | null = null;
    private static metaCachePromise: Promise<DocsMetaCollection> | null = null;

    // 当前加载的文档 ID，用于防止竞态
    private currentLoadId = 0;

    static observedAttributes = ['params'];

    protected async onAttributeChanged(name: string, _old: string, newValue: string) {
        if (name === 'params' && newValue) {
            try {
                const params = JSON.parse(newValue) as RouteParams;

                // 验证参数
                if (!params.category || !params.page) {
                    throw new DocumentLoadError(
                        'Invalid route parameters',
                        'PARSE_ERROR',
                        { params }
                    );
                }

                await this.loadDocument(params.category, params.page);
            } catch (err) {
                if (err instanceof SyntaxError) {
                    this.error = new DocumentLoadError(
                        'Failed to parse route parameters',
                        'PARSE_ERROR',
                        err
                    );
                    this.loadingState = 'error';
                } else {
                    throw err;
                }
            }
        }
    }

    /**
     * 加载元数据（带缓存）
     */
    private static async loadMetadata(): Promise<DocsMetaCollection> {
        // 如果已有缓存，直接返回
        if (this.metaCache) {
            return this.metaCache;
        }

        // 如果正在加载，等待现有请求
        if (this.metaCachePromise) {
            return this.metaCachePromise;
        }

        // 创建新的加载请求
        this.metaCachePromise = (async () => {
            try {
                const response = await fetch('/docs-meta.json');
                if (!response.ok) {
                    throw new DocumentLoadError(
                        'Failed to load documentation metadata',
                        'NETWORK_ERROR',
                        { status: response.status }
                    );
                }
                const data = await response.json() as DocsMetaCollection;
                this.metaCache = data;
                return data;
            } finally {
                this.metaCachePromise = null;
            }
        })();

        return this.metaCachePromise;
    }

    private async loadDocument(category: string, page: string) {
        // 递增加载 ID，用于检测竞态
        const loadId = ++this.currentLoadId;

        this.loadingState = 'loading';
        this.error = null;

        try {
            // 1. 加载元数据（带缓存）
            const allMeta = await DocPage.loadMetadata();

            // 检查是否被新的加载请求替代
            if (loadId !== this.currentLoadId) {
                return;
            }

            const docKey = `${category}/${page}`;
            const docMeta = allMeta[docKey];

            if (!docMeta) {
                throw new DocumentLoadError(
                    `Document not found: ${category}/${page}`,
                    'NOT_FOUND',
                    { category, page, docKey }
                );
            }

            // 2. 加载 Markdown
            const mdResponse = await fetch(`/docs/${category}/${page}.md`);

            // 再次检查竞态
            if (loadId !== this.currentLoadId) {
                return;
            }

            if (!mdResponse.ok) {
                if (mdResponse.status === 404) {
                    throw new DocumentLoadError(
                        `Document file not found: ${category}/${page}`,
                        'NOT_FOUND',
                        { status: mdResponse.status }
                    );
                }
                throw new DocumentLoadError(
                    `Failed to load document: ${mdResponse.statusText}`,
                    'NETWORK_ERROR',
                    { status: mdResponse.status }
                );
            }

            const markdown = await mdResponse.text();

            // 最终检查竞态
            if (loadId !== this.currentLoadId) {
                return;
            }

            // 成功加载
            this.markdown = markdown;
            this.metadata = docMeta;
            this.loadingState = 'success';

        } catch (err) {
            // 检查是否被新的加载请求替代
            if (loadId !== this.currentLoadId) {
                return;
            }

            if (err instanceof DocumentLoadError) {
                this.error = err;
            } else {
                this.error = new DocumentLoadError(
                    'Unexpected error loading document',
                    'NETWORK_ERROR',
                    err
                );
            }
            this.loadingState = 'error';
        }
    }

    render() {
        // 加载中
        if (this.loadingState === 'loading') {
            return (
                <div class="doc-loading">
                    <div class="spinner"></div>
                    <p>Loading documentation...</p>
                </div>
            );
        }

        // 错误状态
        if (this.loadingState === 'error' && this.error) {
            return (
                <div class="doc-error">
                    <h2>Failed to Load Document</h2>
                    <p class="error-message">{this.error.message}</p>
                    {this.error.code === 'NOT_FOUND' && (
                        <div class="error-suggestions">
                            <p>The document you're looking for doesn't exist.</p>
                            <wsx-link to="/docs">← Back to Documentation</wsx-link>
                        </div>
                    )}
                    {this.error.code === 'NETWORK_ERROR' && (
                        <div class="error-suggestions">
                            <p>There was a problem loading the document.</p>
                            <button onClick={() => window.location.reload()}>
                                Retry
                            </button>
                        </div>
                    )}
                </div>
            );
        }

        // 成功加载
        if (this.loadingState === 'success' && this.metadata) {
            return (
                <wsx-doc-layout
                    title={this.metadata.title}
                    category={this.metadata.category}
                    prev={this.metadata.prev ?? ''}
                    next={this.metadata.next ?? ''}
                >
                    {/* 使用现有的 MarkedBuilder 渲染 */}
                    <wsx-marked-renderer-pattern1 markdown={this.markdown} />
                </wsx-doc-layout>
            );
        }

        // 默认状态
        return null;
    }
}
```

#### 2. DocLayout 组件（三栏布局）

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
// packages/wsx-press/src/client/components/DocLayout.wsx

import { LightComponent, autoRegister, state } from '@wsxjs/wsx-core';
import './DocSidebar.wsx';
import './DocTOC.wsx';
import './DocSearch.wsx';
import styles from './DocLayout.css?inline';

@autoRegister({ tagName: 'wsx-doc-layout' })
export class DocLayout extends LightComponent {
    @state private sidebarOpen = true;

    static observedAttributes = ['title', 'category', 'prev', 'next'];

    constructor() {
        super({ styles, styleName: 'wsx-doc-layout', lightDOM: true });
    }

    render() {
        const title = this.getAttribute('title') || '';
        const category = this.getAttribute('category') || '';
        const prev = this.getAttribute('prev');
        const next = this.getAttribute('next');

        return (
            <div class="wsx-doc-layout">
                {/* 全局搜索（Cmd/Ctrl + K） */}
                <wsx-doc-search />

                {/* 左侧边栏 */}
                <wsx-doc-sidebar
                    open={this.sidebarOpen}
                    onToggle={() => { this.sidebarOpen = !this.sidebarOpen; }}
                />

                {/* 主内容区 */}
                <main class={`wsx-doc-main ${this.sidebarOpen ? 'with-sidebar' : ''}`}>
                    {/* 面包屑 */}
                    <wsx-doc-breadcrumb category={category} title={title} />

                    {/* 文档内容 */}
                    <article class="wsx-doc-article">
                        <slot></slot>
                    </article>

                    {/* 上一页/下一页 */}
                    <nav class="wsx-doc-navigation">
                        {prev && <wsx-link to={prev} class="nav-prev">← Previous</wsx-link>}
                        {next && <wsx-link to={next} class="nav-next">Next →</wsx-link>}
                    </nav>
                </main>

                {/* 右侧目录 */}
                <wsx-doc-toc />
            </div>
        );
    }
}
```

#### 3. DocSearch 组件（全局搜索 - 类型安全）

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
// packages/wsx-press/src/client/components/DocSearch.wsx

import { LightComponent, autoRegister, state } from '@wsxjs/wsx-core';
import Fuse from 'fuse.js';
import type { SearchDocument, SearchResult, SearchIndex } from '../../types';
import styles from './DocSearch.css?inline';

@autoRegister({ tagName: 'wsx-doc-search' })
export class DocSearch extends LightComponent {
    @state private isOpen = false;
    @state private query = '';
    @state private results: SearchResult[] = [];
    @state private selectedIndex = 0;
    @state private loading = true;
    @state private error: string | null = null;

    private fuse?: Fuse<SearchDocument>;

    constructor() {
        super({ styles, styleName: 'wsx-doc-search', lightDOM: true });
    }

    protected async onConnected() {
        try {
            // 加载搜索索引
            const response = await fetch('/search-index.json');
            if (!response.ok) {
                throw new Error(`Failed to load search index: ${response.status}`);
            }

            const searchIndex = await response.json() as SearchIndex;

            // 验证搜索索引结构
            if (!searchIndex.documents || !Array.isArray(searchIndex.documents)) {
                throw new Error('Invalid search index format');
            }

            this.fuse = new Fuse<SearchDocument>(
                searchIndex.documents,
                searchIndex.options
            );

            this.loading = false;
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'Unknown error';
            this.loading = false;
            console.error('Failed to load search index:', err);
        }

        // 全局快捷键
        document.addEventListener('keydown', this.handleGlobalKeydown);
    }

    protected onDisconnected() {
        document.removeEventListener('keydown', this.handleGlobalKeydown);
    }

    render() {
        return (
            <>
                <button
                    class="search-trigger"
                    onClick={() => { this.isOpen = true; }}
                    disabled={this.loading || this.error !== null}
                    title={this.error || undefined}
                >
                    <span class="search-icon">🔍</span>
                    <span>Search</span>
                    <kbd>⌘K</kbd>
                </button>

                {this.isOpen && (
                    <div class="search-modal-overlay" onClick={this.closeSearch}>
                        <div class="search-modal" onClick={(e) => e.stopPropagation()}>
                            <input
                                type="text"
                                placeholder="Search documentation..."
                                value={this.query}
                                onInput={this.handleInput}
                                onKeyDown={this.handleKeyDown}
                                ref={(el) => el && setTimeout(() => el.focus(), 0)}
                            />

                            {this.results.length > 0 && (
                                <div class="search-results">
                                    {this.results.map((result, index) => (
                                        <a
                                            href={result.item.route}
                                            class={`search-result-item ${index === this.selectedIndex ? 'selected' : ''}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                this.navigateToResult(result.item.route);
                                            }}
                                        >
                                            <div class="result-category">{result.item.category}</div>
                                            <div class="result-title">{result.item.title}</div>
                                            <div class="result-snippet">
                                                {this.highlightMatch(result)}
                                            </div>
                                            {result.score !== undefined && (
                                                <div class="result-score">
                                                    Match: {(1 - result.score) * 100}%
                                                </div>
                                            )}
                                        </a>
                                    ))}
                                </div>
                            )}

                            {this.query && this.results.length === 0 && !this.loading && (
                                <div class="search-no-results">
                                    <p>No results found for "{this.query}"</p>
                                    <small>Try using different keywords</small>
                                </div>
                            )}

                            <div class="search-footer">
                                <kbd>↑</kbd> <kbd>↓</kbd> Navigate
                                <kbd>↵</kbd> Select
                                <kbd>Esc</kbd> Close
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    private handleGlobalKeydown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            if (!this.loading && !this.error) {
                this.isOpen = !this.isOpen;
            }
        }

        if (e.key === 'Escape' && this.isOpen) {
            this.closeSearch();
        }
    };

    private handleInput = (e: Event) => {
        const target = e.target as HTMLInputElement;
        this.query = target.value;

        if (this.fuse && this.query.trim()) {
            const searchResults = this.fuse.search(this.query, { limit: 10 });
            this.results = searchResults as SearchResult[];
            this.selectedIndex = 0;
        } else {
            this.results = [];
        }
    };

    private handleKeyDown = (e: KeyboardEvent) => {
        if (!this.results.length) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = Math.min(this.selectedIndex + 1, this.results.length - 1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        } else if (e.key === 'Enter' && this.results[this.selectedIndex]) {
            e.preventDefault();
            this.navigateToResult(this.results[this.selectedIndex].item.route);
        }
    };

    private highlightMatch(result: SearchResult): string {
        // 简化版本：返回内容片段
        // 生产环境可以根据 matches 高亮匹配词
        const content = result.item.content;
        return content.length > 150 ? content.substring(0, 150) + '...' : content;
    }

    private navigateToResult(route: string) {
        // 使用 wsx-router 导航
        import('@wsxjs/wsx-router').then(({ RouterUtils }) => {
            RouterUtils.navigate(route);
            this.closeSearch();
        }).catch(() => {
            // 降级到原生导航
            window.location.href = route;
        });
    }

    private closeSearch = () => {
        this.isOpen = false;
        this.query = '';
        this.results = [];
        this.selectedIndex = 0;
    };
}
```

### Vite 插件设计

```typescript
// packages/wsx-press/src/node/plugin.ts
import type { Plugin } from 'vite';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs-extra';
import { generateApiDocs } from './typedoc';
import { scanDocsMetadata, generateSearchIndex } from './metadata';

export interface WsxPressConfig {
    // 文档根目录
    docsRoot: string;
    // API 文档配置
    api?: {
        entryPoints: string[];
        tsconfig: string;
        outDir?: string;
    };
    // 输出目录
    outDir?: string;
}

export function wsxPress(config: WsxPressConfig): Plugin {
    const outDir = config.outDir || '.wsx-press';

    return {
        name: 'vite-plugin-wsx-press',

        async buildStart() {
            console.log('🚀 WSX-Press: Starting documentation build...');

            // 1. 生成 API 文档（TypeScript → Markdown）
            if (config.api) {
                console.log('📚 Generating API documentation from TypeScript...');
                await generateApiDocs({
                    entryPoints: config.api.entryPoints,
                    tsconfig: config.api.tsconfig,
                    outputDir: config.api.outDir || path.join(config.docsRoot, 'api'),
                });
            }

            // 2. 扫描文档，生成元数据
            console.log('📄 Scanning documentation files...');
            const docsMeta = await scanDocsMetadata(config.docsRoot);

            // 3. 生成搜索索引
            console.log('🔍 Building search index...');
            const searchIndex = await generateSearchIndex(docsMeta, config.docsRoot);

            // 4. 写入输出文件
            await fs.ensureDir(outDir);
            await fs.writeFile(
                path.join(outDir, 'docs-meta.json'),
                JSON.stringify(docsMeta, null, 2)
            );
            await fs.writeFile(
                path.join(outDir, 'search-index.json'),
                JSON.stringify(searchIndex, null, 2)
            );

            console.log('✅ WSX-Press: Documentation build completed!');
        },

        configureServer(server) {
            // 开发模式：提供 Markdown 文件和生成的 JSON
            server.middlewares.use((req, res, next) => {
                // 提供 docs-meta.json
                if (req.url === '/docs-meta.json') {
                    const filePath = path.join(outDir, 'docs-meta.json');
                    if (fs.existsSync(filePath)) {
                        res.setHeader('Content-Type', 'application/json');
                        res.end(fs.readFileSync(filePath, 'utf-8'));
                        return;
                    }
                }

                // 提供 search-index.json
                if (req.url === '/search-index.json') {
                    const filePath = path.join(outDir, 'search-index.json');
                    if (fs.existsSync(filePath)) {
                        res.setHeader('Content-Type', 'application/json');
                        res.end(fs.readFileSync(filePath, 'utf-8'));
                        return;
                    }
                }

                // 提供 Markdown 文件
                if (req.url?.startsWith('/docs/') && req.url.endsWith('.md')) {
                    const filePath = path.join(config.docsRoot, req.url.replace('/docs/', ''));
                    if (fs.existsSync(filePath)) {
                        res.setHeader('Content-Type', 'text/markdown');
                        res.end(fs.readFileSync(filePath, 'utf-8'));
                        return;
                    }
                }

                next();
            });
        },
    };
}
```

### API 文档生成（TypeScript → Markdown）

```typescript
// packages/wsx-press/src/node/typedoc.ts
import { Application, TSConfigReader, TypeDocReader } from 'typedoc';

export async function generateApiDocs(config: {
    entryPoints: string[];
    tsconfig: string;
    outputDir: string;
}): Promise<void> {
    const app = await Application.bootstrapWithPlugins({
        entryPoints: config.entryPoints,
        tsconfig: config.tsconfig,
        plugin: ['typedoc-plugin-markdown'],
        theme: 'markdown',
        // 输出配置
        readme: 'none',
        excludePrivate: true,
        excludeProtected: false,
        excludeInternal: true,
        // Markdown 插件配置
        outputFileStrategy: 'modules',
        membersWithOwnFile: ['Class', 'Interface', 'Enum'],
        publicPath: '/api/',
    });

    app.options.addReader(new TSConfigReader());
    app.options.addReader(new TypeDocReader());

    const project = await app.convert();

    if (project) {
        await app.generateDocs(project, config.outputDir);
        console.log(`✅ API documentation generated to ${config.outputDir}`);
    } else {
        throw new Error('Failed to generate API documentation');
    }
}
```

### 元数据扫描和搜索索引（类型安全版本）

```typescript
// packages/wsx-press/src/node/metadata.ts
import { glob } from 'glob';
import path from 'path';
import fs from 'fs-extra';
import type { DocsMetaCollection, DocMetadata, SearchIndex, SearchDocument } from '../types';

/**
 * 扫描文档目录，生成元数据集合
 */
export async function scanDocsMetadata(docsRoot: string): Promise<DocsMetaCollection> {
    const files = await glob('**/*.md', { cwd: docsRoot, absolute: true });
    const metadata: DocsMetaCollection = {};

    for (const file of files) {
        const relativePath = path.relative(docsRoot, file);
        const content = await fs.readFile(file, 'utf-8');
        const frontmatter = extractFrontmatter(content);
        const key = relativePath.replace(/\.md$/, '');

        metadata[key] = {
            title: frontmatter.title || path.basename(file, '.md'),
            category: path.dirname(relativePath),
            route: `/docs/${key}`,
            ...frontmatter,
        };
    }

    return addPrevNextLinks(metadata);
}

/**
 * 生成搜索索引
 */
export async function generateSearchIndex(
    metadata: DocsMetaCollection,
    docsRoot: string
): Promise<SearchIndex> {
    const documents: SearchDocument[] = [];

    for (const [key, meta] of Object.entries(metadata)) {
        const filePath = path.join(docsRoot, `${key}.md`);
        const content = await fs.readFile(filePath, 'utf-8');
        const textContent = content
            .replace(/^---[\s\S]*?---/, '') // 移除 frontmatter
            .replace(/```[\s\S]*?```/g, '') // 移除代码块
            .replace(/[#*`_\[\]()]/g, '')   // 移除 Markdown 标记
            .trim();

        documents.push({
            id: key,
            title: meta.title,
            category: meta.category,
            route: meta.route,
            content: textContent.substring(0, 500),
        });
    }

    return {
        documents,
        options: {
            keys: [
                { name: 'title', weight: 0.7 },
                { name: 'content', weight: 0.3 },
            ],
            threshold: 0.3,
            includeScore: true,
        },
    };
}

/**
 * 从 Markdown 中提取 frontmatter
 * 返回部分 DocMetadata，因为不是所有字段都在 frontmatter 中
 */
function extractFrontmatter(markdown: string): Partial<DocMetadata> {
    const match = markdown.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};

    const yaml = match[1];
    const meta: Partial<DocMetadata> = {};

    yaml.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) return;

        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();

        if (key && value) {
            // 类型安全的属性赋值
            if (key === 'title' || key === 'description' || key === 'category') {
                (meta as Record<string, string>)[key] = value;
            } else if (key === 'tags') {
                // 简单的数组解析（实际应使用 YAML 解析器）
                meta.tags = value.replace(/[\[\]]/g, '').split(',').map(t => t.trim());
            } else {
                // 其他扩展字段
                (meta as Record<string, unknown>)[key] = value;
            }
        }
    });

    return meta;
}

/**
 * 为元数据集合添加上一页/下一页链接
 */
function addPrevNextLinks(metadata: DocsMetaCollection): DocsMetaCollection {
    const categories = new Map<string, string[]>();

    // 按类别分组
    for (const [key, meta] of Object.entries(metadata)) {
        const category = meta.category;
        if (!categories.has(category)) {
            categories.set(category, []);
        }
        categories.get(category)!.push(key);
    }

    // 为每个类别添加 prev/next
    for (const [_category, keys] of categories) {
        keys.sort();
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            metadata[key].prev = i > 0 ? `/docs/${keys[i - 1]}` : null;
            metadata[key].next = i < keys.length - 1 ? `/docs/${keys[i + 1]}` : null;
        }
    }

    return metadata;
}
```

## 使用方式

### 1. 安装依赖

```bash
pnpm add -D @wsxjs/wsx-press typedoc typedoc-plugin-markdown fuse.js
```

### 2. 配置 Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { wsx } from '@wsxjs/wsx-vite-plugin';
import { wsxPress } from '@wsxjs/wsx-press';

export default defineConfig({
    plugins: [
        wsx(),
        wsxPress({
            // 文档根目录
            docsRoot: './docs',
            // API 文档配置
            api: {
                entryPoints: [
                    './packages/core/src/index.ts',
                    './packages/router/src/index.ts',
                ],
                tsconfig: './tsconfig.json',
            },
        }),
    ],
});
```

### 3. 在 App.wsx 中集成

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
// site/src/App.wsx

import { LightComponent, autoRegister } from '@wsxjs/wsx-core';
import '@wsxjs/wsx-router';
import '@wsxjs/wsx-press/client';

@autoRegister({ tagName: 'wsx-app' })
export default class App extends LightComponent {
    render() {
        return (
            <div class="app-container">
                <wsx-router>
                    {/* 现有路由 */}
                    <wsx-view route="/" component="home-section"></wsx-view>
                    <wsx-view route="/features" component="features-section"></wsx-view>

                    {/* 文档路由 - 单个路由处理所有文档 */}
                    <wsx-view route="/docs/:category/:page" component="wsx-doc-page"></wsx-view>

                    {/* API 文档路由 - 单个路由处理所有 API 文档 */}
                    <wsx-view route="/api/:module/:item" component="wsx-api-doc-page"></wsx-view>

                    {/* 404 */}
                    <wsx-view route="*" component="not-found-section"></wsx-view>
                </wsx-router>
            </div>
        );
    }
}
```

### 4. 文档目录结构

```
docs/
├── guide/
│   ├── getting-started.md
│   ├── components.md
│   └── routing.md
├── api/                    # 自动生成
│   ├── core/
│   │   ├── LightComponent.md
│   │   └── autoRegister.md
│   └── router/
│       ├── WsxRouter.md
│       └── WsxLink.md
└── tutorials/
    └── build-todo-app.md
```

## 实施计划与测试策略

### 测试要求（强制标准）

每一步实施必须满足以下标准，否则不得进入下一步：

1. **100% 代码覆盖率**
   - 语句覆盖率 (Stmts): 100%
   - 分支覆盖率 (Branch): 100%
   - 函数覆盖率 (Funcs): 100%
   - 行覆盖率 (Lines): 100%
   - 验证命令：`pnpm --filter @wsxjs/wsx-press test:coverage`

2. **零 any 类型**
   - 所有代码必须有明确类型定义
   - 禁止使用 `any`，使用 `unknown` 或具体类型
   - 验证命令：`npx eslint src/ --ext .ts`

3. **零 Lint 错误**
   - 生产代码：零错误、零警告
   - 测试代码：零错误、零警告
   - 验证命令：`pnpm --filter @wsxjs/wsx-press lint`

### 阶段一：项目初始化与类型定义（1 天）

#### Step 1.1: 创建 package 结构
**任务**：
```bash
# 创建基础目录结构（测试目录与代码在同一目录下）
mkdir -p packages/wsx-press/src/node/__tests__
mkdir -p packages/wsx-press/src/client/components/__tests__
```

**测试**：无需测试（仅目录创建）

**验收**：
- ✅ 目录结构符合设计文档
- ✅ 测试目录在各自模块下（`src/node/__tests__`, `src/client/components/__tests__`）

---

#### Step 1.2: 配置 package.json 和构建工具
**任务**：
- 创建 `package.json`，定义依赖和脚本
- 创建 `tsconfig.json`，配置 TypeScript
- 创建 `vite.config.ts`，配置构建
- 配置 ESLint 和 Prettier

**测试**：
```typescript
// __tests__/build.test.ts
import { describe, it, expect } from 'vitest';
import { build } from 'vite';
import config from '../vite.config';

describe('构建配置', () => {
  it('应该能够成功构建', async () => {
    await expect(build(config)).resolves.toBeDefined();
  });

  it('应该生成 ESM 和 CJS 格式', async () => {
    const result = await build(config);
    expect(result).toHaveProperty('output');
  });
});
```

**覆盖率要求**：100%（配置文件本身）
**验收**：`pnpm build` 成功，无错误

---

#### Step 1.3: 定义核心类型系统
**任务**：
- 创建 `src/types.ts`，定义所有接口和类型
- 包括：DocMetadata, SearchDocument, SearchResult, SearchIndex, RouteParams, LoadingState, DocumentLoadError

**测试**：
```typescript
// __tests__/types.test.ts
import { describe, it, expect } from 'vitest';
import { DocumentLoadError } from '../src/types';
import type { DocMetadata, SearchDocument } from '../src/types';

describe('类型定义', () => {
  describe('DocumentLoadError', () => {
    it('应该正确创建 NOT_FOUND 错误', () => {
      const error = new DocumentLoadError('文档未找到', 'NOT_FOUND');
      expect(error.message).toBe('文档未找到');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.name).toBe('DocumentLoadError');
    });

    it('应该正确创建 NETWORK_ERROR 错误', () => {
      const error = new DocumentLoadError('网络错误', 'NETWORK_ERROR', { status: 500 });
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.details).toEqual({ status: 500 });
    });

    it('应该正确创建 PARSE_ERROR 错误', () => {
      const error = new DocumentLoadError('解析错误', 'PARSE_ERROR');
      expect(error.code).toBe('PARSE_ERROR');
    });
  });

  describe('类型兼容性', () => {
    it('DocMetadata 应该符合接口定义', () => {
      const metadata: DocMetadata = {
        title: '测试文档',
        category: 'guide',
        route: '/docs/guide/test',
      };
      expect(metadata).toBeDefined();
    });

    it('SearchDocument 应该符合接口定义', () => {
      const doc: SearchDocument = {
        id: 'test',
        title: '测试',
        category: 'guide',
        route: '/docs/guide/test',
        content: '内容',
      };
      expect(doc).toBeDefined();
    });
  });
});
```

**覆盖率要求**：100%
**验收**：所有类型测试通过，无 any 类型

---

### 阶段二：Node.js 构建工具（3 天）

#### Step 2.1: 实现元数据扫描（metadata.ts）
**任务**：
- 实现 `scanDocsMetadata()` - 扫描 Markdown 文件
- 实现 `extractFrontmatter()` - 解析 YAML frontmatter
- 实现 `addPrevNextLinks()` - 添加上下页链接
- **使用正确类型，移除所有 `Record<string, any>`**

**核心函数签名**：
```typescript
// 使用明确类型，而不是 Record<string, any>
export async function scanDocsMetadata(docsRoot: string): Promise<DocsMetaCollection>;
export function extractFrontmatter(markdown: string): Partial<DocMetadata>;
export function addPrevNextLinks(metadata: DocsMetaCollection): DocsMetaCollection;
```

**测试**：
```typescript
// __tests__/node/metadata.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { vol } from 'memfs';
import { scanDocsMetadata, extractFrontmatter, addPrevNextLinks } from '../../src/node/metadata';

// Mock fs 使用 memfs
vi.mock('fs-extra', () => require('memfs'));

describe('元数据扫描', () => {
  beforeEach(() => {
    vol.reset();
  });

  describe('extractFrontmatter', () => {
    it('应该正确解析 YAML frontmatter', () => {
      const markdown = `---
title: 测试文档
description: 这是描述
tags: [test, demo]
---
# 正文内容`;

      const result = extractFrontmatter(markdown);
      expect(result.title).toBe('测试文档');
      expect(result.description).toBe('这是描述');
    });

    it('应该处理无 frontmatter 的情况', () => {
      const markdown = '# 标题\n正文';
      const result = extractFrontmatter(markdown);
      expect(result).toEqual({});
    });

    it('应该处理格式错误的 frontmatter', () => {
      const markdown = `---
invalid yaml::
---`;
      const result = extractFrontmatter(markdown);
      expect(result).toEqual({});
    });
  });

  describe('scanDocsMetadata', () => {
    it('应该扫描所有 Markdown 文件', async () => {
      vol.fromJSON({
        '/docs/guide/intro.md': '---\ntitle: 介绍\n---\n内容',
        '/docs/guide/advanced.md': '---\ntitle: 高级\n---\n内容',
        '/docs/api/core.md': '---\ntitle: 核心 API\n---\n内容',
      });

      const result = await scanDocsMetadata('/docs');
      expect(Object.keys(result)).toHaveLength(3);
      expect(result['guide/intro'].title).toBe('介绍');
    });

    it('应该正确提取类别', async () => {
      vol.fromJSON({
        '/docs/tutorial/step1.md': '# Step 1',
      });

      const result = await scanDocsMetadata('/docs');
      expect(result['tutorial/step1'].category).toBe('tutorial');
    });

    it('应该生成正确的路由', async () => {
      vol.fromJSON({
        '/docs/guide/test.md': '# Test',
      });

      const result = await scanDocsMetadata('/docs');
      expect(result['guide/test'].route).toBe('/docs/guide/test');
    });
  });

  describe('addPrevNextLinks', () => {
    it('应该为同类别文档添加导航链接', () => {
      const metadata: DocsMetaCollection = {
        'guide/intro': { title: '介绍', category: 'guide', route: '/docs/guide/intro' },
        'guide/basics': { title: '基础', category: 'guide', route: '/docs/guide/basics' },
        'guide/advanced': { title: '高级', category: 'guide', route: '/docs/guide/advanced' },
      };

      const result = addPrevNextLinks(metadata);
      expect(result['guide/basics'].prev).toBe('/docs/guide/advanced');
      expect(result['guide/basics'].next).toBe('/docs/guide/intro');
    });

    it('首尾文档应该有 null 链接', () => {
      const metadata: DocsMetaCollection = {
        'guide/first': { title: '第一', category: 'guide', route: '/docs/guide/first' },
        'guide/last': { title: '最后', category: 'guide', route: '/docs/guide/last' },
      };

      const result = addPrevNextLinks(metadata);
      expect(result['guide/first'].prev).toBeNull();
      expect(result['guide/last'].next).toBeNull();
    });

    it('不同类别的文档不应该互相链接', () => {
      const metadata: DocsMetaCollection = {
        'guide/intro': { title: '指南', category: 'guide', route: '/docs/guide/intro' },
        'api/core': { title: 'API', category: 'api', route: '/docs/api/core' },
      };

      const result = addPrevNextLinks(metadata);
      expect(result['guide/intro'].next).toBeNull();
      expect(result['api/core'].prev).toBeNull();
    });
  });
});
```

**覆盖率要求**：100%（所有分支、边界情况）
**验收**：所有测试通过，覆盖率 100%，无 any 类型

---

#### Step 2.2: 实现搜索索引生成（search.ts）
**任务**：
- 实现 `generateSearchIndex()` - 从元数据生成搜索索引
- 处理 Markdown 内容提取和清理
- 生成 Fuse.js 兼容的索引结构
- **使用明确类型**

**核心函数签名**：
```typescript
export async function generateSearchIndex(
  metadata: DocsMetaCollection,
  docsRoot: string
): Promise<SearchIndex>;
```

**测试**：
```typescript
// __tests__/node/search.test.ts
import { describe, it, expect } from 'vitest';
import { generateSearchIndex } from '../../src/node/search';
import type { DocsMetaCollection } from '../../src/types';

describe('搜索索引生成', () => {
  it('应该生成正确的搜索索引结构', async () => {
    const metadata: DocsMetaCollection = {
      'guide/intro': {
        title: '介绍',
        category: 'guide',
        route: '/docs/guide/intro',
      },
    };

    vol.fromJSON({
      '/docs/guide/intro.md': '---\ntitle: 介绍\n---\n这是介绍文档',
    });

    const index = await generateSearchIndex(metadata, '/docs');
    expect(index.documents).toHaveLength(1);
    expect(index.documents[0].title).toBe('介绍');
    expect(index.options.keys).toBeDefined();
  });

  it('应该移除 Markdown 标记', async () => {
    const metadata: DocsMetaCollection = {
      'test/doc': { title: 'Test', category: 'test', route: '/docs/test/doc' },
    };

    vol.fromJSON({
      '/docs/test/doc.md': '# 标题\n**粗体** *斜体* `代码`',
    });

    const index = await generateSearchIndex(metadata, '/docs');
    const content = index.documents[0].content;
    expect(content).not.toContain('**');
    expect(content).not.toContain('*');
    expect(content).not.toContain('`');
  });

  it('应该限制内容长度', async () => {
    const longContent = 'a'.repeat(1000);
    const metadata: DocsMetaCollection = {
      'test/long': { title: 'Long', category: 'test', route: '/docs/test/long' },
    };

    vol.fromJSON({
      '/docs/test/long.md': longContent,
    });

    const index = await generateSearchIndex(metadata, '/docs');
    expect(index.documents[0].content.length).toBeLessThanOrEqual(500);
  });
});
```

**覆盖率要求**：100%
**验收**：搜索索引正确生成，无 any 类型

---

#### Step 2.3: 实现 TypeDoc 集成（typedoc.ts）
**任务**：
- 实现 `generateApiDocs()` - TypeScript → Markdown
- 配置 TypeDoc 插件和选项
- 处理多入口点

**测试**：
```typescript
// __tests__/node/typedoc.test.ts
import { describe, it, expect, vi } from 'vitest';
import { generateApiDocs } from '../../src/node/typedoc';

describe('TypeDoc 集成', () => {
  it('应该成功生成 API 文档', async () => {
    const config = {
      entryPoints: ['test/fixtures/sample.ts'],
      tsconfig: 'test/fixtures/tsconfig.json',
      outputDir: '/tmp/api-docs',
    };

    await expect(generateApiDocs(config)).resolves.not.toThrow();
  });

  it('应该处理无效入口点', async () => {
    const config = {
      entryPoints: ['nonexistent.ts'],
      tsconfig: 'tsconfig.json',
      outputDir: '/tmp/api-docs',
    };

    await expect(generateApiDocs(config)).rejects.toThrow();
  });
});
```

**覆盖率要求**：100%
**验收**：TypeDoc 正确生成 Markdown

---

#### Step 2.4: 实现 Vite 插件（plugin.ts）
**任务**：
- 实现 `wsxPress()` Vite 插件
- 集成 metadata、search、typedoc
- 实现开发服务器中间件

**测试**：
```typescript
// __tests__/node/plugin.test.ts
import { describe, it, expect } from 'vitest';
import { wsxPress } from '../../src/node/plugin';

describe('Vite 插件', () => {
  it('应该返回有效的 Vite 插件', () => {
    const plugin = wsxPress({ docsRoot: './docs' });
    expect(plugin.name).toBe('vite-plugin-wsx-press');
    expect(plugin.buildStart).toBeDefined();
    expect(plugin.configureServer).toBeDefined();
  });

  it('应该在构建时生成文件', async () => {
    const plugin = wsxPress({ docsRoot: 'test/fixtures/docs' });
    await plugin.buildStart?.call({} as any, {} as any);

    // 验证生成的文件存在
    expect(fs.existsSync('.wsx-press/docs-meta.json')).toBe(true);
    expect(fs.existsSync('.wsx-press/search-index.json')).toBe(true);
  });
});
```

**覆盖率要求**：100%
**验收**：插件正常工作，生成所有必需文件

---

### 阶段三：客户端组件（4 天）

#### Step 3.1: DocPage 组件
**任务**：
- 实现文档动态加载逻辑
- 实现错误处理和加载状态
- 实现竞态条件防护
- 实现元数据缓存

**测试**：
```typescript
// __tests__/client/DocPage.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocPage } from '../../src/client/components/DocPage.wsx';

describe('DocPage 组件', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('应该正确加载文档', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        'guide/intro': { title: '介绍', category: 'guide', route: '/docs/guide/intro' },
      }),
    } as Response);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('# 介绍\n内容'),
    } as Response);

    const page = new DocPage();
    await page.setAttribute('params', JSON.stringify({ category: 'guide', page: 'intro' }));

    // 等待加载完成
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(page.loadingState).toBe('success');
  });

  it('应该处理 404 错误', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);

    const page = new DocPage();
    await page.setAttribute('params', JSON.stringify({ category: 'guide', page: 'notfound' }));

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(page.error?.code).toBe('NOT_FOUND');
  });

  it('应该防止竞态条件', async () => {
    const page = new DocPage();

    // 快速切换两次
    page.setAttribute('params', JSON.stringify({ category: 'guide', page: 'doc1' }));
    page.setAttribute('params', JSON.stringify({ category: 'guide', page: 'doc2' }));

    await new Promise(resolve => setTimeout(resolve, 200));

    // 应该只加载最后一个文档
    expect(fetch).toHaveBeenCalledWith('/docs/guide/doc2.md');
  });

  it('应该缓存元数据', async () => {
    const metaResponse = {
      ok: true,
      json: () => Promise.resolve({ 'guide/test': { title: 'Test' } }),
    };

    vi.mocked(fetch).mockResolvedValue(metaResponse as Response);

    const page1 = new DocPage();
    const page2 = new DocPage();

    await page1.setAttribute('params', JSON.stringify({ category: 'guide', page: 'test' }));
    await page2.setAttribute('params', JSON.stringify({ category: 'guide', page: 'test' }));

    await new Promise(resolve => setTimeout(resolve, 100));

    // 元数据只应该加载一次
    expect(fetch).toHaveBeenCalledWith('/docs-meta.json');
    expect(vi.mocked(fetch).mock.calls.filter(call => call[0] === '/docs-meta.json')).toHaveLength(1);
  });
});
```

**覆盖率要求**：100%（所有状态、所有错误类型、竞态条件）
**验收**：组件功能完整，无 any 类型

---

#### Step 3.2: DocSearch 组件
**任务**：
- 实现搜索 UI 和逻辑
- 实现 Fuse.js 集成
- 实现键盘导航

**测试**：
```typescript
// __tests__/client/DocSearch.test.ts
import { describe, it, expect, vi } from 'vitest';
import { DocSearch } from '../../src/client/components/DocSearch.wsx';

describe('DocSearch 组件', () => {
  it('应该加载搜索索引', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        documents: [{ id: '1', title: 'Test', content: 'test content' }],
        options: { keys: ['title'], threshold: 0.3 },
      }),
    } as Response);

    const search = new DocSearch();
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(search.loading).toBe(false);
    expect(search.error).toBeNull();
  });

  it('应该正确搜索文档', async () => {
    // 准备搜索索引...
    const search = new DocSearch();
    search.query = 'test';

    expect(search.results.length).toBeGreaterThan(0);
  });

  it('应该响应键盘快捷键', () => {
    const search = new DocSearch();
    const event = new KeyboardEvent('keydown', { metaKey: true, key: 'k' });

    document.dispatchEvent(event);

    expect(search.isOpen).toBe(true);
  });
});
```

**覆盖率要求**：100%
**验收**：搜索功能完整，键盘导航正常

---

#### Step 3.3-3.5: 其他组件（DocLayout, DocSidebar, DocTOC）
每个组件都遵循相同的测试标准：
- 100% 覆盖率
- 所有状态和交互的测试
- 零 any 类型

---

### 阶段四：集成测试（2 天）

#### Step 4.1: E2E 测试
**任务**：
- 使用 Playwright 测试完整用户流程
- 测试路由导航
- 测试搜索功能
- 测试响应式布局

**测试**：
```typescript
// e2e/wsx-press.spec.ts
import { test, expect } from '@playwright/test';

test.describe('WSX-Press 端到端测试', () => {
  test('应该能够浏览文档', async ({ page }) => {
    await page.goto('/docs/guide/intro');
    await expect(page.locator('h1')).toContainText('介绍');
  });

  test('应该能够使用搜索', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Meta+K');
    await page.fill('input[type="text"]', '测试');
    await expect(page.locator('.search-result-item')).toHaveCount(1);
  });

  test('应该能够导航到上/下页', async ({ page }) => {
    await page.goto('/docs/guide/intro');
    await page.click('.nav-next');
    await expect(page).toHaveURL('/docs/guide/basics');
  });
});
```

**覆盖率要求**：覆盖主要用户流程
**验收**：所有 E2E 测试通过

---

#### Step 4.2: 集成到 wsxjs 网站
**任务**：
- 在 `site/vite.config.ts` 中配置插件
- 在 `site/src/App.wsx` 中添加路由
- 验证所有功能正常

**测试**：手动测试 + E2E
**验收**：文档系统在 wsxjs 网站正常运行

---

### 阶段五：文档和发布（1 天）

#### Step 5.1: 编写使用文档
- README.md
- API 文档
- 示例代码

#### Step 5.2: 发布准备
- 版本号管理
- CHANGELOG
- npm 发布流程

---

## 质量门禁（每一步必须通过）

每完成一步，必须通过以下检查：

```bash
# 1. 类型检查
pnpm --filter @wsxjs/wsx-press typecheck

# 2. Lint 检查（源码 + 测试）
pnpm --filter @wsxjs/wsx-press lint

# 3. 单元测试 + 覆盖率
pnpm --filter @wsxjs/wsx-press test:coverage

# 4. 构建验证
pnpm --filter @wsxjs/wsx-press build

# 验收标准：
# ✅ 类型检查无错误
# ✅ Lint 零错误零警告
# ✅ 测试覆盖率 100%（所有指标）
# ✅ 构建成功
```

**不满足以上任何一项，禁止进入下一步！**

## 验收标准

- [ ] 所有文档通过 `/docs/:category/:page` 可访问
- [ ] API 文档从 TypeScript 自动生成
- [ ] 搜索功能正常（Cmd/Ctrl + K）
- [ ] 三栏布局响应式
- [ ] 上一页/下一页导航
- [ ] 面包屑导航
- [ ] 目录自动生成
- [ ] 代码高亮正常
- [ ] 支持 Markdown frontmatter

## 交付物

- ✅ `@wsxjs/wsx-press` npm package
- ✅ 完整的文档布局系统
- ✅ TypeDoc API 文档生成
- ✅ 全局搜索功能（Fuse.js）
- ✅ 使用文档和示例
- ✅ 单元测试

## 技术参考

- [TypeDoc](https://typedoc.org/) - TypeScript 文档生成器
- [typedoc-plugin-markdown](https://typedoc-plugin-markdown.org/) - TypeDoc Markdown 插件
- [VitePress](https://vitepress.dev/) - Vite 静态站点生成器（架构参考）
- [Fuse.js](https://fusejs.io/) - 轻量级模糊搜索库
- [marked](https://marked.js.org/) - Markdown 解析器

## 相关文档

- [RFC-0021: 框架网站增强计划](./0021-framework-website-enhancement.md)
- [wsx-router 文档](../../packages/router/README.md)
