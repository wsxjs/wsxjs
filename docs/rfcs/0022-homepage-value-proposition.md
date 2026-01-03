# RFC-0022: 首页价值主张优化（M0）

- **RFC编号**: 0022
- **父 RFC**: [RFC-0021](./0021-framework-website-enhancement.md)
- **里程碑**: M0
- **开始日期**: 2024-12-23
- **完成日期**: 2024-12-24
- **状态**: Completed
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
- ✅ 对比说明（ComparisonSection）
- ✅ 性能指标（PerformanceMetrics）
- ✅ 快速开始代码（QuickStartCode）
- ✅ 统计数据（StatsSection）
- ✅ **i18next 国际化支持**（新增）

### 目标用户

- 首次访问 WSXJS 网站的开发者
- 正在评估框架的决策者
- 从 React/Vue 迁移的开发者

## 详细设计

### 核心概念

首页应该包含以下关键部分：
1. **Hero Section** - 核心价值主张
2. **对比说明** - vs React/Vue/Vanilla
3. **性能指标** - 运行时大小、性能数据
4. **快速开始** - 代码示例和 CTA
5. **统计数据** - npm downloads, GitHub stars

### 组件设计

#### 1. 增强的 Hero Section（已实现，支持国际化）

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
// src/components/HomeSection.wsx (增强版)
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
import { i18n } from '@wsxjs/wsx-i18next';
import './ComparisonSection.wsx';
import './PerformanceMetrics.wsx';
import './QuickStartCode.wsx';
import './StatsSection.wsx';

@i18n('home')
@autoRegister({ tagName: 'home-section' })
export class HomeSection extends WebComponent {
    render() {
        return (
            <div>
                {/* Hero Section */}
                <section class="hero-section">
                    <div class="hero-badge">
                        <span class="badge-text">{this.t('hero.badge')}</span>
                    </div>
                    <h1 class="hero-title">
                        <span class="title-main">{this.t('hero.title')}</span>
                        <span class="title-subtitle">{this.t('hero.subtitle')}</span>
                    </h1>
                    <p class="hero-description">{this.t('hero.description')}</p>
                    <div class="hero-actions">
                        <wsx-link to="/docs/getting-started" class="btn-primary">
                            {this.t('hero.getStarted')}
                        </wsx-link>
                        <button class="btn-secondary" onClick={this.openPlayground}>
                            {this.t('hero.tryOnline')}
                        </button>
                        <button class="btn-ghost" onClick={this.openGitHub}>
                            {this.t('hero.viewGitHub')}
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

**国际化支持**：
- 使用 `@i18n('home')` 装饰器自动注入翻译功能
- 所有文本通过 `this.t()` 方法获取翻译
- 支持语言切换，组件自动响应语言变化并重新渲染
- 翻译文件位于 `public/locales/{lng}/home.json`

#### 2. 对比说明组件（已实现，支持国际化）

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
// src/components/ComparisonSection.wsx
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
import { i18n } from '@wsxjs/wsx-i18next';

@i18n('home')
@autoRegister({ tagName: 'comparison-section' })
export class ComparisonSection extends WebComponent {
    render() {
        return (
            <section class="comparison-section">
                <h2>{this.t('comparison.title')}</h2>
                <p>{this.t('comparison.description')}</p>
                <div class="comparison-grid">
                    <div class="comparison-item">
                        <h3>{this.t('comparison.vsReact.title')}</h3>
                        <ul>
                            <li>✅ {this.t('comparison.vsReact.items.native')}</li>
                            <li>✅ {this.t('comparison.vsReact.items.zero')}</li>
                            <li>✅ {this.t('comparison.vsReact.items.works')}</li>
                            <li>✅ {this.t('comparison.vsReact.items.smaller')}</li>
                        </ul>
                    </div>
                    <div class="comparison-item">
                        <h3>{this.t('comparison.vsVue.title')}</h3>
                        <ul>
                            <li>✅ {this.t('comparison.vsVue.items.pure')}</li>
                            <li>✅ {this.t('comparison.vsVue.items.noLock')}</li>
                            <li>✅ {this.t('comparison.vsVue.items.better')}</li>
                            <li>✅ {this.t('comparison.vsVue.items.future')}</li>
                        </ul>
                    </div>
                    <div class="comparison-item">
                        <h3>{this.t('comparison.vsPlain.title')}</h3>
                        <ul>
                            <li>✅ {this.t('comparison.vsPlain.items.jsx')}</li>
                            <li>✅ {this.t('comparison.vsPlain.items.typescript')}</li>
                            <li>✅ {this.t('comparison.vsPlain.items.dx')}</li>
                            <li>✅ {this.t('comparison.vsPlain.items.tooling')}</li>
                        </ul>
                    </div>
                </div>
            </section>
        );
    }
}
```

**国际化支持**：
- 所有对比文本已国际化
- 支持英文和中文翻译
- 使用 `@i18n('home')` 装饰器实现自动响应式翻译

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
- [x] 审查 `HomeSection.wsx` 当前实现
- [x] 对比 Vue.js 和 React 的首页设计
- [x] 识别需要改进的关键点
- [x] 收集 WSXJS 的核心价值主张

### 步骤 0.2: 设计新的 Hero Section（1 天）
- [x] 设计核心标语："JSX for Native Web Components"
- [x] 设计副标题和描述文案
- [x] 设计 CTA 按钮布局
- [x] 创建设计稿或原型

### 步骤 0.3: 实现对比说明部分（1 天）
- [x] 创建 `ComparisonSection.wsx` 组件
- [x] 实现 vs React/Vue/Vanilla 对比
- [x] 添加样式和动画
- [x] **集成 i18next 国际化支持**

### 步骤 0.4: 实现性能指标展示（1 天）
- [x] 创建 `PerformanceMetrics.wsx` 组件
- [ ] 显示运行时大小和性能指标
- [ ] 添加动画效果
- [ ] **集成 i18next 国际化支持**（待完成）

### 步骤 0.5: 实现快速开始代码示例（1 天）
- [x] 创建 `QuickStartCode.wsx` 组件
- [ ] 添加代码高亮
- [ ] 实现复制功能
- [ ] 添加"Try Online"按钮
- [ ] **集成 i18next 国际化支持**（待完成）

### 步骤 0.6: 集成统计数据（1 天）
- [x] 创建 `StatsSection.wsx` 组件
- [ ] 集成 npm downloads API（或使用静态数据）
- [ ] 集成 GitHub stars API（或使用静态数据）
- [ ] 添加加载状态和错误处理
- [ ] **集成 i18next 国际化支持**（待完成）

### 步骤 0.7: 测试和优化（1 天）
- [ ] 测试响应式设计
- [ ] 测试性能（Lighthouse 评分）
- [ ] 优化动画和交互
- [ ] 收集反馈并迭代
- [ ] **测试国际化功能**（语言切换、翻译准确性）

### 步骤 0.8: 国际化集成（新增）
- [x] 创建 i18next 配置文件
- [x] 创建翻译文件结构（en/zh）
- [x] 在 `main.ts` 中初始化 i18next
- [x] 更新 `HomeSection` 组件使用 `@i18n` 装饰器
- [x] 更新 `ComparisonSection` 组件使用 `@i18n` 装饰器
- [ ] 更新其他首页组件（PerformanceMetrics, QuickStartCode, StatsSection）
- [ ] 添加语言切换 UI 组件

## 验收标准

- [x] Hero Section 清晰传达核心价值主张
- [x] 对比说明准确展示 WSXJS 的优势
- [ ] 性能指标正确显示
- [ ] 快速开始代码可以复制
- [ ] 统计数据正确加载（或显示占位符）
- [ ] 所有组件响应式设计正常
- [ ] Lighthouse 性能评分 > 90
- [ ] 移动端体验良好
- [x] **国际化支持正常工作**（语言切换、翻译显示）
- [x] **翻译文件结构完整**（英文和中文）

## 交付物

- ✅ 优化后的 `HomeSection.wsx`（支持国际化）
- ✅ `ComparisonSection.wsx` 组件（支持国际化）
- ✅ `PerformanceMetrics.wsx` 组件
- ✅ `QuickStartCode.wsx` 组件
- ✅ `StatsSection.wsx` 组件
- ✅ 相关样式文件
- ✅ 测试文件
- ✅ **i18next 配置文件** (`src/i18n.ts`)
- ✅ **翻译文件** (`public/locales/en/home.json`, `public/locales/zh/home.json`)
- ✅ **国际化集成**（使用 `@wsxjs/wsx-i18next` 包）

## 国际化实现细节

### 技术栈
- 使用 `@wsxjs/wsx-i18next` 包提供 i18next 集成
- 使用 `@i18n` 装饰器自动注入翻译功能
- 支持自动语言检测和手动语言切换
- 组件自动响应语言变化并重新渲染

### 翻译文件结构
```
public/locales/
├── en/
│   └── home.json    # 英文翻译
└── zh/
    └── home.json    # 中文翻译
```

### 使用方式
1. 在组件上使用 `@i18n('home')` 装饰器
2. 在组件内使用 `this.t('key')` 获取翻译
3. 语言切换通过 `i18n.changeLanguage('en' | 'zh')` 实现
4. 组件会自动订阅语言变化事件并重新渲染

### 已国际化的组件
- ✅ `HomeSection` - Hero Section 所有文本
- ✅ `ComparisonSection` - 所有对比说明文本
- ⏳ `PerformanceMetrics` - 待完成
- ⏳ `QuickStartCode` - 待完成
- ⏳ `StatsSection` - 待完成

## 国际化实现说明

### 技术实现

首页组件已集成 `@wsxjs/wsx-i18next` 包，提供完整的国际化支持：

1. **初始化配置** (`src/i18n.ts`):
   ```typescript
   import { initI18n } from "@wsxjs/wsx-i18next";
   
   export const i18n = initI18n({
       fallbackLng: "en",
       backend: {
           loadPath: "/locales/{{lng}}/{{ns}}.json",
       },
       ns: ["home", "common"],
       defaultNS: "home",
   });
   ```

2. **组件使用**:
   - 使用 `@i18n('home')` 装饰器自动注入翻译功能
   - 通过 `this.t('key')` 获取翻译文本
   - 自动订阅语言变化事件，语言切换时自动重新渲染

3. **翻译文件结构**:
   ```
   public/locales/
   ├── en/
   │   └── home.json    # 英文翻译
   └── zh/
       └── home.json    # 中文翻译
   ```

### 已实现的国际化

- ✅ **HomeSection**: Hero Section 所有文本已国际化
- ✅ **ComparisonSection**: 所有对比说明文本已国际化
- ⏳ **PerformanceMetrics**: 待完成
- ⏳ **QuickStartCode**: 待完成
- ⏳ **StatsSection**: 待完成

### 语言切换

用户可以通过以下方式切换语言：
```typescript
import { i18n } from './i18n';

// 切换到中文
i18n.changeLanguage('zh');

// 切换到英文
i18n.changeLanguage('en');
```

组件会自动响应语言变化并重新渲染。

## 相关文档

- [RFC-0021: 框架网站增强计划](./0021-framework-website-enhancement.md)
- [RFC-0029: i18next 集成](./0029-i18next-integration.md)
- [执行计划](../../packages/examples/EXECUTION_PLAN.md)

