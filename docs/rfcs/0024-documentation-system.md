# RFC-0024: 文档系统集成（M2）

- **RFC编号**: 0024
- **父 RFC**: [RFC-0021](./0021-framework-website-enhancement.md)
- **里程碑**: M2
- **开始日期**: 2025-01-XX
- **状态**: Proposed
- **作者**: WSX Team

## 摘要

集成完整的文档系统到 WSXJS 网站，包括 Markdown 转 WSX 转换、文档布局组件、全局搜索功能，参考 Vue.js 的文档结构设计。

## 动机

### 为什么需要这个功能？

当前文档分散在 `docs/` 目录，未集成到网站中：
- 文档未在网站中可访问
- 缺少文档导航和搜索
- 文档格式不统一
- 用户体验不佳

### 目标用户

- 学习 WSXJS 的开发者
- 查找 API 参考的开发者
- 需要教程和指南的开发者

## 详细设计

### 核心概念

文档系统包含：
1. **文档布局** - 三栏布局（侧边栏、内容、目录）
2. **Markdown 转 WSX** - 构建时转换
3. **搜索功能** - 全局搜索（Cmd/Ctrl + K）
4. **导航系统** - 侧边栏、面包屑、目录

### 文档结构

参考 Vue.js 的文档结构：
- **Guide（指南）** - 概念性文档
- **API Reference** - 技术性文档
- **Tutorials** - 实践性文档
- **Migration** - 迁移指南

### 组件设计

#### 1. 文档布局组件

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
// src/docs/DocLayout.wsx
import { LightComponent, autoRegister } from '@wsxjs/wsx-core';
import './DocSidebar.wsx';
import './DocContent.wsx';
import './DocTOC.wsx';
import './DocBreadcrumb.wsx';

@autoRegister({ tagName: 'docs-layout' })
export class DocLayout extends LightComponent {
    render() {
        return (
            <div class="docs-layout">
                <doc-sidebar></doc-sidebar>
                <div class="docs-main">
                    <doc-breadcrumb></doc-breadcrumb>
                    <doc-content></doc-content>
                </div>
                <doc-toc></doc-toc>
            </div>
        );
    }
}
```

#### 2. Markdown 转 WSX 插件

```typescript
// packages/examples/plugins/markdown-to-wsx-plugin.ts
import { Plugin } from 'vite';
import { marked } from 'marked';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

export function markdownToWsxPlugin(options: {
    basePath: string;
    outputPath: string;
}): Plugin {
    return {
        name: 'markdown-to-wsx',
        buildStart() {
            // 扫描所有 Markdown 文件
            // 转换为 WSX 组件
            // 写入输出目录
        },
        resolveId(id) {
            if (id.endsWith('.md')) {
                return id.replace('.md', '.wsx');
            }
        }
    };
}
```

#### 3. 搜索功能

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
        document.addEventListener('keydown', this.handleKeyboard);
    }
    
    render() {
        return (
            <div class="search-container">
                <button onClick={() => { this.isOpen = true; }}>
                    Search (⌘K)
                </button>
                {this.isOpen && (
                    <div class="search-modal">
                        <input
                            type="text"
                            value={this.query}
                            onInput={this.handleInput}
                            onKeyDown={this.handleKeyDown}
                        />
                        {this.results.length > 0 && (
                            <div class="search-results">
                                {this.results.map((result, index) => (
                                    <a
                                        href={result.url}
                                        class={index === this.selectedIndex ? 'selected' : ''}
                                    >
                                        <h4>{result.title}</h4>
                                        <p>{result.snippet}</p>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }
    
    private handleKeyboard = (e: KeyboardEvent): void => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            this.isOpen = !this.isOpen;
        }
    };
}
```

## 实施计划

### 步骤 2.1: 创建文档布局组件（3 天）
- [ ] 创建 `DocLayout.wsx`
- [ ] 创建 `DocSidebar.wsx`
- [ ] 创建 `DocTOC.wsx`
- [ ] 创建 `DocBreadcrumb.wsx`

### 步骤 2.2: 实现 Markdown 转 WSX（5 天）
- [ ] 创建 Vite 插件
- [ ] 配置插件
- [ ] 转换现有文档
- [ ] 创建 `DocContent.wsx`

### 步骤 2.3: 实现搜索功能（3 天）
- [ ] 创建搜索工具（Fuse.js）
- [ ] 创建搜索 UI 组件
- [ ] 集成搜索功能

### 步骤 2.4: 添加文档导航（2 天）
- [ ] 面包屑导航
- [ ] 侧边栏导航

### 步骤 2.5: 集成现有文档（2 天）
- [ ] 整理文档结构
- [ ] 转换所有 Markdown 为 WSX

## 验收标准

- [ ] 所有文档可访问
- [ ] 搜索功能正常工作（Cmd/Ctrl + K）
- [ ] 文档导航正常
- [ ] Markdown 正确转换为 WSX
- [ ] 代码高亮正常
- [ ] 响应式设计正常

## 交付物

- ✅ 完整的文档布局系统
- ✅ Markdown 转 WSX 插件
- ✅ 所有文档转换为 WSX 组件
- ✅ 全局搜索功能
- ✅ 文档导航系统

## 相关文档

- [RFC-0021: 框架网站增强计划](./0021-framework-website-enhancement.md)
- [执行计划](../../packages/examples/EXECUTION_PLAN.md)

