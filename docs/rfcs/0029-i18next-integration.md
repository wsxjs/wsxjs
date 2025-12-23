# RFC-0029: i18next 国际化支持

- **RFC编号**: 0029
- **父 RFC**: [RFC-0021](./0021-framework-website-enhancement.md)
- **里程碑**: M6 (高级功能)
- **开始日期**: 2025-01-XX
- **状态**: Proposed
- **作者**: WSX Team

## 摘要

为 WSXJS 官方网站集成 i18next 国际化支持，实现多语言切换功能，使网站能够支持中文、英文等多种语言，提升全球开发者的使用体验。

**核心实现**: 创建 `@wsxjs/wsx-i18next` 包，为 WSXJS 组件提供 i18next 国际化支持。参考 `react-i18next` 和 `vue-i18n` 的设计模式，但采用 WSXJS 特有的方式实现，包括装饰器、响应式状态集成和组件生命周期绑定。

## 动机

### 为什么需要这个功能？

国际化支持对于框架网站至关重要：
- 扩大全球开发者社区
- 提升非英语用户的体验
- 符合主流框架网站的最佳实践（Vue.js、React 都支持多语言）
- 为未来扩展到更多语言做准备

### 当前状况

- ❌ 网站仅支持英文
- ❌ 没有语言切换功能
- ❌ 所有文本内容硬编码在组件中
- ❌ 无法支持多语言 SEO

### 目标用户

- 非英语母语的开发者
- 希望使用母语学习 WSXJS 的开发者
- 需要多语言文档的团队

## 详细设计

### 核心概念

使用 i18next 作为国际化解决方案：
- **i18next**: 成熟的 JavaScript 国际化框架
- **WSXJS 适配**: 创建 WSXJS 专用的 i18n 工具类，参考 react-i18next 和 vue-i18n 的设计模式，但采用 WSXJS 特有的方式实现

### 架构设计

#### 创建 @wsxjs/wsx-i18next 包

为了提供统一的 WSXJS 国际化解决方案，我们将创建 `@wsxjs/wsx-i18next` 包，参考 `react-i18next` 和 `vue-i18n` 的设计模式，但采用 WSXJS 特有的方式实现。

**包结构**:
```
packages/wsx-i18next/
├── src/
│   ├── index.ts                 # 主入口
│   ├── i18n.ts                  # i18next 配置和初始化
│   ├── decorator.ts             # @i18n 装饰器
│   ├── hooks.ts                 # useTranslation 等 hooks
│   ├── mixin.ts                 # WebComponent/LightComponent mixin
│   ├── types.ts                 # TypeScript 类型定义
│   └── utils.ts                 # 工具函数
├── package.json
├── tsconfig.json
└── README.md
```

#### 1. i18next 配置和初始化

```typescript
// packages/wsx-i18next/src/i18n.ts
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

export interface I18nConfig {
    fallbackLng?: string;
    debug?: boolean;
    resources?: Record<string, Record<string, object>>;
    backend?: {
        loadPath?: string;
    };
    ns?: string[];
    defaultNS?: string;
}

export function initI18n(config: I18nConfig = {}): typeof i18n {
    i18n
        .use(Backend)
        .use(LanguageDetector)
        .init({
            fallbackLng: 'en',
            debug: false,
            interpolation: {
                escapeValue: false,
            },
            backend: {
                loadPath: '/locales/{{lng}}/{{ns}}.json',
            },
            ns: ['common', 'home', 'docs', 'examples'],
            defaultNS: 'common',
            ...config,
        });

    return i18n;
}

export { i18n };
```

#### 2. 装饰器 API（WSXJS 特有，推荐）

```typescript
// packages/wsx-i18next/src/decorator.ts
import { i18n } from './i18n';

/**
 * @i18n 装饰器 - 自动为组件注入翻译功能
 * 
 * 使用方式：
 * ```tsx
 * @i18n('common')
 * export class MyComponent extends WebComponent {
 *     render() {
 *         return <div>{this.t('welcome')}</div>;
 *     }
 * }
 * ```
 */
export function i18n(namespace: string = 'common') {
    return function <T extends { new (...args: any[]): any }>(constructor: T) {
        return class extends constructor {
            private _i18nNamespace = namespace;
            private _i18nUnsubscribe?: () => void;

            // 注入 t 方法
            protected t(key: string, options?: object): string {
                return i18n.t(key, { ns: this._i18nNamespace, ...options });
            }

            // 注入 i18n 实例
            protected get i18n() {
                return i18n;
            }

            // 生命周期：组件连接时订阅语言变化
            protected onConnected(): void {
                super.onConnected?.();
                this._i18nUnsubscribe = i18n.on('languageChanged', () => {
                    if (this.rerender) {
                        this.rerender();
                    }
                });
            }

            // 生命周期：组件断开时取消订阅
            protected onDisconnected(): void {
                super.onDisconnected?.();
                if (this._i18nUnsubscribe) {
                    this._i18nUnsubscribe();
                }
            }
        };
    };
}
```

#### 3. useTranslation 函数（API 与 react-i18next 兼容）

```typescript
// packages/wsx-i18next/src/hooks.ts
import { i18n } from './i18n';
import type { TFunction, i18n as I18nType } from 'i18next';

export interface UseTranslationResponse {
    t: TFunction;
    i18n: I18nType;
    ready: boolean;
}

/**
 * useTranslation - API 与 react-i18next 兼容的翻译函数
 * 
 * **重要说明**：
 * - 这不是 React hook，而是 WSXJS 的普通函数
 * - API 设计参考 react-i18next，但实现方式完全不同
 * - 在 WSXJS 中，需要配合 @state 或 @i18n 装饰器实现响应式
 * - 不会自动响应语言变化，需要手动订阅 languageChanged 事件
 * 
 * **响应式机制说明**：
 * - `i18n.t()` 函数会使用当前的 `i18n.language` 来获取翻译
 * - 当调用 `i18n.changeLanguage()` 时，i18next 会触发 `languageChanged` 事件
 * - 组件需要订阅此事件并触发重渲染，这样 `t()` 函数才会返回新的翻译
 * 
 * **使用方式 1：配合 @state（推荐）**
 * ```tsx
 * export class MyComponent extends LightComponent {
 *     private translation = useTranslation('common');
 *     @state private currentLang: string = i18n.language;
 *     private unsubscribe?: () => void;
 *     
 *     protected onConnected(): void {
 *         // 订阅语言变化事件
 *         // i18n.on() 返回取消订阅的函数
 *         this.unsubscribe = i18n.on('languageChanged', (lng) => {
 *             // 更新 @state，自动触发 rerender()
 *             this.currentLang = lng;
 *         });
 *     }
 *     
 *     protected onDisconnected(): void {
 *         // 取消订阅，避免内存泄漏
 *         if (this.unsubscribe) {
 *             this.unsubscribe();
 *         }
 *     }
 *     
 *     render() {
 *         // 语言变化时，@state 触发重渲染
 *         // 重渲染时，t() 会调用 i18n.t()，使用新的 i18n.language
 *         return <div>{this.translation.t('welcome')}</div>;
 *     }
 * }
 * ```
 * 
 * **使用方式 2：使用 @i18n 装饰器（更简单，自动处理响应式）**
 * ```tsx
 * @i18n('common')
 * export class MyComponent extends WebComponent {
 *     render() {
 *         // @i18n 装饰器自动订阅语言变化并触发 rerender()
 *         return <div>{this.t('welcome')}</div>;
 *     }
 * }
 * ```
 */
export function useTranslation(namespace: string = 'common'): UseTranslationResponse {
    return {
        t: (key: string, options?: object) => {
            // 每次调用 t() 时，i18n.t() 会使用当前的 i18n.language
            // 所以只要组件重渲染，就会得到新的翻译
            return i18n.t(key, { ns: namespace, ...options });
        },
        i18n,
        ready: i18n.isInitialized,
    };
}
```

#### 4. Mixin API（为基类添加方法）

```typescript
// packages/wsx-i18next/src/mixin.ts
import { i18n } from './i18n';
import type { WebComponent, LightComponent } from '@wsxjs/wsx-core';

/**
 * 为任何继承自 WebComponent 或 LightComponent 的类添加 i18n 支持
 * 
 * 使用方式：
 * ```tsx
 * export class MyComponent extends withI18n(WebComponent, 'common') {
 *     render() {
 *         return <div>{this.t('welcome')}</div>;
 *     }
 * }
 * 
 * export class MyLightComponent extends withI18n(LightComponent, 'common') {
 *     render() {
 *         return <div>{this.t('welcome')}</div>;
 *     }
 * }
 * ```
 */
export function withI18n<T extends typeof WebComponent | typeof LightComponent>(
    Base: T,
    defaultNamespace: string = 'common'
): T {
    return class extends Base {
        protected t(key: string, namespace?: string, options?: object): string {
            return i18n.t(key, { ns: namespace || defaultNamespace, ...options });
        }

        protected get i18n() {
            return i18n;
        }

        protected onConnected(): void {
            super.onConnected?.();
            // 订阅语言变化事件，直接触发重渲染
            // i18n.on() 返回取消订阅的函数，但 mixin 中不存储（简化实现）
            // 如果需要取消订阅，可以在子类中重写 onDisconnected
            i18n.on('languageChanged', () => {
                if (this.rerender) {
                    this.rerender();
                }
            });
        }
    } as T;
}
```

#### 5. WSXJS 组件集成示例

**方式 1: 使用装饰器（推荐，WSXJS 特有）**

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
// src/components/HomeSection.wsx (支持 i18n)
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
import { i18n } from '@wsxjs/wsx-i18next';

@i18n('home')
@autoRegister({ tagName: 'home-section' })
export class HomeSection extends WebComponent {
    render() {
        return (
            <div>
                <h1>{this.t('title')}</h1>
                <p>{this.t('description')}</p>
                <button onClick={this.toggleLanguage}>
                    {this.t('switchLanguage', 'common')}
                </button>
            </div>
        );
    }

    private toggleLanguage = async (): Promise<void> => {
        const newLang = this.i18n.language === 'en' ? 'zh' : 'en';
        await this.i18n.changeLanguage(newLang);
    };
}
```

**方式 2: 使用 useTranslation 函数（配合 @state 实现响应式）**

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
// src/components/HomeSection.wsx (支持 i18n)
import { LightComponent, autoRegister, state } from '@wsxjs/wsx-core';
import { i18n, useTranslation } from '@wsxjs/wsx-i18next';

@autoRegister({ tagName: 'home-section' })
export class HomeSection extends LightComponent {
    private translation = useTranslation('home');
    @state private currentLang: string = i18n.language;
    private unsubscribe?: () => void;

    protected onConnected(): void {
        // 订阅语言变化事件
        // i18n.on() 返回取消订阅的函数
        this.unsubscribe = i18n.on('languageChanged', (lng) => {
            // 更新 @state，自动触发 rerender()
            this.currentLang = lng;
        });
    }

    protected onDisconnected(): void {
        // 取消订阅，避免内存泄漏
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    render() {
        // 语言变化时，@state 触发重渲染
        // 重渲染时，t() 会调用 i18n.t()，使用新的 i18n.language
        return (
            <div>
                <h1>{this.translation.t('title')}</h1>
                <p>{this.translation.t('description')}</p>
            </div>
        );
    }
}
```

**注意**：配合 `@state` 使用，语言切换时会自动触发组件重渲染。

**方式 3: 使用 Mixin**

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
// src/components/HomeSection.wsx (支持 i18n)
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
import { withI18n } from '@wsxjs/wsx-i18next';

@autoRegister({ tagName: 'home-section' })
export class HomeSection extends withI18n(WebComponent, 'home') {
    render() {
        return (
            <div>
                <h1>{this.t('title')}</h1>
                <p>{this.t('description')}</p>
            </div>
        );
    }
}
```

#### 4. 翻译文件结构

```
public/locales/
├── en/
│   ├── common.json
│   ├── home.json
│   ├── docs.json
│   └── examples.json
└── zh/
    ├── common.json
    ├── home.json
    ├── docs.json
    └── examples.json
```

**示例翻译文件** (`public/locales/en/home.json`):
```json
{
    "title": "WSXJS",
    "subtitle": "JSX for Native Web Components",
    "description": "Not a framework, just better developer experience. Write JSX syntax, get native Web Components.",
    "getStarted": "Get Started",
    "tryOnline": "Try Online",
    "viewGitHub": "View on GitHub"
}
```

**示例翻译文件** (`public/locales/zh/home.json`):
```json
{
    "title": "WSXJS",
    "subtitle": "原生 Web Components 的 JSX 语法",
    "description": "不是框架，只是更好的开发体验。编写 JSX 语法，获得原生 Web Components。",
    "getStarted": "开始使用",
    "tryOnline": "在线体验",
    "viewGitHub": "查看 GitHub"
}
```

#### 6. 语言切换组件

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
// src/components/LanguageSwitcher.wsx
import { LightComponent, autoRegister, state } from '@wsxjs/wsx-core';
import { i18n, useTranslation } from '@wsxjs/wsx-i18next';

@autoRegister({ tagName: 'language-switcher' })
export class LanguageSwitcher extends LightComponent {
    private translation = useTranslation('common');
    @state private currentLang: string = i18n.language;
    private unsubscribe?: () => void;

    protected onConnected(): void {
        // 订阅语言变化事件
        // i18n.on() 返回取消订阅的函数
        this.unsubscribe = i18n.on('languageChanged', (lng) => {
            // 更新 @state，自动触发 rerender()
            this.currentLang = lng;
        });
    }

    protected onDisconnected(): void {
        // 取消订阅，避免内存泄漏
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    render() {
        const languages = [
            { code: 'en', name: 'English', flag: '🇺🇸' },
            { code: 'zh', name: '中文', flag: '🇨🇳' },
        ];

        return (
            <div class="language-switcher">
                {languages.map((lang) => (
                    <button
                        key={lang.code}
                        class={`lang-btn ${this.currentLang === lang.code ? 'active' : ''}`}
                        onClick={() => this.changeLanguage(lang.code)}
                    >
                        <span class="lang-flag">{lang.flag}</span>
                        <span class="lang-name">{lang.name}</span>
                    </button>
                ))}
            </div>
        );
    }

    private changeLanguage = async (lng: string): Promise<void> => {
        await i18n.changeLanguage(lng);
        // 状态会自动更新（通过 i18n.on('languageChanged')）
    };
}
```

## 实施计划

### 步骤 1: 创建 @wsxjs/wsx-i18next 包（5-7 天）
- [ ] 创建 `packages/wsx-i18next` 目录结构
- [ ] 初始化 `package.json` 和配置
- [ ] 安装 i18next 和相关依赖
- [ ] 实现 i18n 配置和初始化
- [ ] 实现 `@i18n` 装饰器
- [ ] 实现 `useTranslation` 函数
- [ ] 实现 `withI18n` mixin
- [ ] 添加 TypeScript 类型定义
- [ ] 编写测试和文档

### 步骤 2: 创建翻译文件结构（1 天）
- [ ] 创建 `public/locales/` 目录结构
- [ ] 创建英文翻译文件（en）
- [ ] 创建中文翻译文件（zh）
- [ ] 提取现有组件中的文本内容

### 步骤 3: 集成到现有组件（2-3 天）
- [ ] 在网站项目中安装 `@wsxjs/wsx-i18next` 包
- [ ] 初始化 i18n 配置
- [ ] 更新 HomeSection 组件（使用装饰器或 hook）
- [ ] 更新 ComparisonSection 组件
- [ ] 更新其他主要组件
- [ ] 创建 LanguageSwitcher 组件

### 步骤 4: 添加语言切换 UI（1 天）
- [ ] 在导航栏添加语言切换器
- [ ] 实现语言持久化（localStorage）
- [ ] 添加语言切换动画

### 步骤 5: SEO 优化（1 天）
- [ ] 实现 hreflang 标签
- [ ] 更新路由以支持语言前缀（可选）
- [ ] 更新 sitemap 以包含多语言版本

### 步骤 6: 测试和优化（1 天）
- [ ] 测试所有语言的显示
- [ ] 测试语言切换功能
- [ ] 优化翻译内容
- [ ] 性能测试

## 验收标准

- [ ] i18next 正确配置和初始化
- [ ] 所有主要组件支持多语言
- [ ] 语言切换功能正常工作
- [ ] 语言选择持久化保存
- [ ] SEO 优化（hreflang 标签）
- [ ] 至少支持英文和中文
- [ ] 翻译内容准确完整

## 交付物

- ✅ `@wsxjs/wsx-i18next` 包
- ✅ 英文和中文翻译文件
- ✅ 更新后的组件（支持 i18n）
- ✅ LanguageSwitcher 组件
- ✅ 语言切换 UI
- ✅ SEO 优化（hreflang）

## 技术决策

### 为什么创建 @wsxjs/wsx-i18next 包？

1. **统一解决方案**: 为 WSXJS 生态系统提供标准化的国际化方案
2. **WSXJS 原生支持**: 充分利用 WSXJS 的特性（装饰器、响应式状态、组件生命周期）
3. **参考最佳实践**: 借鉴 react-i18next 和 vue-i18n 的成熟模式
4. **类型安全**: 完整的 TypeScript 支持
5. **零运行时开销**: 编译时优化，运行时高效

### 为什么选择 i18next？

1. **成熟稳定**: i18next 是最流行的 JavaScript 国际化库
2. **功能完整**: 支持命名空间、插值、复数等高级功能
3. **生态丰富**: 有丰富的插件和工具
4. **易于集成**: 可以轻松适配到 WSXJS

### 为什么同时提供多种 API？

1. **灵活性**: 不同场景使用不同方式
2. **API 兼容性**: `useTranslation` 的 API 与 react-i18next 兼容，便于从 React 项目迁移到 WSXJS
   - **注意**：虽然 API 兼容，但实现方式不同（WSXJS 不是 React，需要配合 @state 实现响应式）
3. **渐进式**: 开发者可以选择最适合的方式
4. **WSXJS 特色**: `@i18n` 装饰器方式充分利用 WSXJS 的特性（装饰器、响应式状态、组件生命周期）

### 依赖关系

```json
{
  "dependencies": {
    "@wsxjs/wsx-core": "workspace:*",
    "i18next": "^23.0.0",
    "i18next-browser-languagedetector": "^7.0.0",
    "i18next-http-backend": "^2.0.0"
  },
  "peerDependencies": {
    "i18next": "^23.0.0"
  }
}
```

### 替代方案

- **react-intl**: 专为 React 设计，不适合 WSXJS（WSXJS 不是 React 框架）
- **vue-i18n**: 专为 Vue 设计，不适合 WSXJS（WSXJS 不是 Vue 框架）
- **react-i18next**: 虽然 API 可以参考，但不能直接使用（需要 React 环境）
- **自定义方案**: 开发成本高，功能可能不完整

**结论**：创建 `@wsxjs/wsx-i18next` 包是最佳选择，既利用了 i18next 的成熟生态，又完全适配 WSXJS 的特性。

## 相关文档

- [RFC-0021: 框架网站增强计划](./0021-framework-website-enhancement.md)
- [RFC-0028: 高级功能（M6）](./0028-advanced-features.md)
- [react-i18next 文档](https://react.i18next.com/)
- [vue-i18n 文档](https://vue-i18n.intlify.dev/)
- [i18next 官方文档](https://www.i18next.com/)
- [执行计划](../../packages/examples/EXECUTION_PLAN.md)

