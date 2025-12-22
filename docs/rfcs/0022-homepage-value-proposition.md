# RFC-0022: 首页价值主张优化（M0）

- **RFC编号**: 0022
- **父 RFC**: [RFC-0021](./0021-framework-website-enhancement.md)
- **里程碑**: M0
- **开始日期**: 2025-01-XX
- **状态**: Proposed
- **作者**: WSX Team

## 摘要

优化 WSXJS 官方网站首页，使其作为框架的"前门"能够立即传达核心价值主张，参考 Vue.js 和 React 的首页设计，突出 WSXJS 的差异化优势和性能特点。

## 动机

### 为什么需要这个功能？

首页是访问者了解 WSXJS 的第一印象。当前首页缺少：
- 清晰的核心价值主张
- 与主流框架（React/Vue）的对比说明
- 性能指标展示
- 快速开始代码示例
- 统计数据展示

### 当前状况

`HomeSection.wsx` 当前实现：
- ✅ 基本的 Hero Section
- ✅ Logo 和标题
- ✅ 简单的描述
- ❌ 缺少对比说明
- ❌ 缺少性能指标
- ❌ 缺少快速开始代码
- ❌ 缺少统计数据

### 目标用户

- 首次访问 WSXJS 网站的开发者
- 正在评估框架的决策者
- 从 React/Vue 迁移的开发者

## 详细设计

### 核心概念

首页应该包含以下关键部分：
1. **Hero Section** - 核心价值主张
2. **对比说明** - vs React/Vue/Plain Web Components
3. **性能指标** - 运行时大小、性能数据
4. **快速开始** - 代码示例和 CTA
5. **统计数据** - npm downloads, GitHub stars

### 组件设计

#### 1. 增强的 Hero Section

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
// src/components/HomeSection.wsx (增强版)
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
import './ComparisonSection.wsx';
import './PerformanceMetrics.wsx';
import './QuickStartCode.wsx';
import './StatsSection.wsx';

@autoRegister({ tagName: 'home-section' })
export class HomeSection extends WebComponent {
    render() {
        return (
            <div>
                {/* Hero Section */}
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
                    <div class="hero-actions">
                        <wsx-link to="/docs/getting-started" class="btn-primary">
                            Get Started
                        </wsx-link>
                        <button class="btn-secondary" onClick={this.openPlayground}>
                            Try Online
                        </button>
                    </div>
                </section>

                {/* 对比说明 */}
                <comparison-section></comparison-section>

                {/* 性能指标 */}
                <performance-metrics></performance-metrics>

                {/* 快速开始代码 */}
                <quick-start-code></quick-start-code>

                {/* 统计数据 */}
                <stats-section></stats-section>
            </div>
        );
    }
}
```

#### 2. 对比说明组件

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
// src/components/ComparisonSection.wsx
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister({ tagName: 'comparison-section' })
export class ComparisonSection extends WebComponent {
    render() {
        return (
            <section class="comparison-section">
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
        );
    }
}
```

#### 3. 性能指标组件

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
// src/components/PerformanceMetrics.wsx
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister({ tagName: 'performance-metrics' })
export class PerformanceMetrics extends WebComponent {
    render() {
        return (
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
        );
    }
}
```

#### 4. 快速开始代码组件

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
// src/components/QuickStartCode.wsx
import { LightComponent, autoRegister, state } from '@wsxjs/wsx-core';

@autoRegister({ tagName: 'quick-start-code' })
export class QuickStartCode extends LightComponent {
    @state private copied: boolean = false;
    
    private code = `npm install @wsxjs/wsx-core

// MyComponent.wsx
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister()
export class MyComponent extends WebComponent {
    render() {
        return <div>Hello WSXJS!</div>;
    }
}`;

    render() {
        return (
            <section class="code-example-section">
                <h2>Get Started in 60 Seconds</h2>
                <div class="code-block">
                    <pre><code>{this.code}</code></pre>
                    <div class="code-actions">
                        <button onClick={this.copyCode} class="btn-copy">
                            {this.copied ? 'Copied!' : 'Copy'}
                        </button>
                        <button onClick={this.openPlayground} class="btn-try">
                            Try Online
                        </button>
                    </div>
                </div>
            </section>
        );
    }
    
    private copyCode = async (): Promise<void> => {
        await navigator.clipboard.writeText(this.code);
        this.copied = true;
        setTimeout(() => { this.copied = false; }, 2000);
    };
    
    private openPlayground = (): void => {
        window.location.href = '/playground';
    };
}
```

#### 5. 统计数据组件

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
// src/components/StatsSection.wsx
import { LightComponent, autoRegister, state } from '@wsxjs/wsx-core';

@autoRegister({ tagName: 'stats-section' })
export class StatsSection extends LightComponent {
    @state private downloads: string = '...';
    @state private stars: string = '...';
    @state private loading: boolean = true;
    
    async connectedCallback() {
        await this.loadStats();
    }
    
    render() {
        return (
            <section class="stats-section">
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-number">{this.downloads}</span>
                        <span class="stat-label">npm downloads/week</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">{this.stars}</span>
                        <span class="stat-label">GitHub stars</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">0 KB</span>
                        <span class="stat-label">Runtime size</span>
                    </div>
                </div>
            </section>
        );
    }
    
    private async loadStats(): Promise<void> {
        try {
            // 从 API 或静态数据加载
            this.downloads = await this.getNpmDownloads();
            this.stars = await this.getGitHubStars();
        } catch (error) {
            console.error('Failed to load stats:', error);
            this.downloads = 'N/A';
            this.stars = 'N/A';
        } finally {
            this.loading = false;
        }
    }
    
    private async getNpmDownloads(): Promise<string> {
        // 实现 npm downloads API 调用
        return '1.2k';
    }
    
    private async getGitHubStars(): Promise<string> {
        // 实现 GitHub stars API 调用
        return '500+';
    }
}
```

## 实施计划

### 步骤 0.1: 分析当前首页（1 天）
- [ ] 审查 `HomeSection.wsx` 当前实现
- [ ] 对比 Vue.js 和 React 的首页设计
- [ ] 识别需要改进的关键点
- [ ] 收集 WSXJS 的核心价值主张

### 步骤 0.2: 设计新的 Hero Section（1 天）
- [ ] 设计核心标语："JSX for Native Web Components"
- [ ] 设计副标题和描述文案
- [ ] 设计 CTA 按钮布局
- [ ] 创建设计稿或原型

### 步骤 0.3: 实现对比说明部分（1 天）
- [ ] 创建 `ComparisonSection.wsx` 组件
- [ ] 实现 vs React/Vue/Plain Web Components 对比
- [ ] 添加样式和动画

### 步骤 0.4: 实现性能指标展示（1 天）
- [ ] 创建 `PerformanceMetrics.wsx` 组件
- [ ] 显示运行时大小和性能指标
- [ ] 添加动画效果

### 步骤 0.5: 实现快速开始代码示例（1 天）
- [ ] 创建 `QuickStartCode.wsx` 组件
- [ ] 添加代码高亮
- [ ] 实现复制功能
- [ ] 添加"Try Online"按钮

### 步骤 0.6: 集成统计数据（1 天）
- [ ] 创建 `StatsSection.wsx` 组件
- [ ] 集成 npm downloads API（或使用静态数据）
- [ ] 集成 GitHub stars API（或使用静态数据）
- [ ] 添加加载状态和错误处理

### 步骤 0.7: 测试和优化（1 天）
- [ ] 测试响应式设计
- [ ] 测试性能（Lighthouse 评分）
- [ ] 优化动画和交互
- [ ] 收集反馈并迭代

## 验收标准

- [ ] Hero Section 清晰传达核心价值主张
- [ ] 对比说明准确展示 WSXJS 的优势
- [ ] 性能指标正确显示
- [ ] 快速开始代码可以复制
- [ ] 统计数据正确加载（或显示占位符）
- [ ] 所有组件响应式设计正常
- [ ] Lighthouse 性能评分 > 90
- [ ] 移动端体验良好

## 交付物

- ✅ 优化后的 `HomeSection.wsx`
- ✅ `ComparisonSection.wsx` 组件
- ✅ `PerformanceMetrics.wsx` 组件
- ✅ `QuickStartCode.wsx` 组件
- ✅ `StatsSection.wsx` 组件
- ✅ 相关样式文件
- ✅ 测试文件

## 相关文档

- [RFC-0021: 框架网站增强计划](./0021-framework-website-enhancement.md)
- [执行计划](../../packages/examples/EXECUTION_PLAN.md)

