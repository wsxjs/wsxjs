# RFC-0051: WSX-Press 国际化文档支持

- **RFC编号**: 0051
- **父 RFC**: [RFC-0024](./0024-documentation-system.md)
- **开始日期**: 2025-01-20
- **状态**: Draft
- **作者**: WSX Team

## 摘要

为 `@wsxjs/wsx-press` 文档系统添加国际化（i18n）支持，使文档能够以多种语言提供，并支持语言切换、多语言搜索和自动语言检测。该功能将集成现有的 `@wsxjs/wsx-i18next` 包，提供完整的国际化文档体验。

## 动机

### 为什么需要这个功能？

当前 wsx-press 文档系统仅支持单一语言（默认中文），限制了框架的国际化推广：

- ❌ 无法为不同语言用户提供本地化文档
- ❌ 缺少语言切换功能
- ❌ 搜索功能不支持多语言
- ❌ 无法根据用户浏览器语言自动选择文档语言
- ❌ 文档维护者需要手动管理多语言版本

### 目标用户

- **国际开发者**：希望使用母语阅读文档的开发者
- **文档维护者**：需要维护多语言文档的团队
- **框架推广者**：希望将 WSXJS 推广到国际社区

### 设计原则

1. **向后兼容**：现有单语言文档继续工作，无需修改
2. **渐进增强**：支持部分文档翻译，未翻译的文档回退到默认语言
3. **零配置启动**：默认情况下使用单语言模式，启用 i18n 只需简单配置
4. **与 i18next 集成**：复用现有的 `@wsxjs/wsx-i18next` 基础设施
5. **SEO 友好**：支持语言前缀路由，便于搜索引擎索引

## 详细设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│            WSX-Press 国际化文档系统                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐        ┌──────────────────┐          │
│  │  文档目录结构     │        │  语言配置         │          │
│  │  docs/           │        │  i18n: {         │          │
│  │  ├── en/         │        │    locales: [...] │          │
│  │  │   └── guide/ │        │    default: 'en'  │          │
│  │  ├── zh/         │        │  }                │          │
│  │  │   └── guide/ │        └────────┬─────────┘          │
│  │  └── ja/         │                 │                     │
│  │      └── guide/  │                 │                     │
│  └────────┬─────────┘                 │                     │
│           │                            │                     │
│           ▼                            ▼                     │
│  ┌──────────────────┐        ┌──────────────────┐          │
│  │ 元数据扫描        │        │ 语言检测          │          │
│  │ (按语言分组)      │        │ (浏览器/URL)      │          │
│  └────────┬─────────┘        └────────┬─────────┘          │
│           │                            │                     │
│           │  生成多语言元数据            │ 确定当前语言        │
│           └────────┬───────────────────┘                     │
│                    ▼                                        │
│           ┌──────────────────┐                              │
│           │  docs-meta.json   │                              │
│           │  (按语言组织)      │                              │
│           └────────┬──────────┘                              │
│                    │                                        │
│                    ▼                                        │
│         ┌──────────────────────┐                            │
│         │  路由系统             │                            │
│         │  /:lang/docs/...      │                            │
│         │  /docs/... (默认)     │                            │
│         └──────────┬────────────┘                            │
│                    │                                        │
│                    ▼                                        │
│         ┌──────────────────────┐                            │
│         │  DocPage 组件          │                            │
│         │  (语言感知)            │                            │
│         └──────────┬────────────┘                            │
│                    │                                        │
│                    ▼                                        │
│         ┌──────────────────────┐                            │
│         │  语言切换器           │                            │
│         │  (DocLangSwitcher)   │                            │
│         └──────────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

### 核心概念

#### 1. 文档目录结构

支持两种目录组织方式：

**方式一：按语言前缀组织（推荐）**

```
docs/
├── en/                    # 英文文档
│   ├── guide/
│   │   ├── getting-started.md
│   │   └── components.md
│   └── api/
│       └── core.md
├── zh/                    # 中文文档
│   ├── guide/
│   │   ├── getting-started.md
│   │   └── components.md
│   └── api/
│       └── core.md
└── ja/                    # 日文文档
    └── guide/
        └── getting-started.md
```

**方式二：扁平结构（向后兼容）**

```
docs/
├── guide/                 # 默认语言（配置中的 defaultLocale）
│   ├── getting-started.md
│   └── components.md
├── en/
│   └── guide/             # 英文覆盖
│       └── getting-started.md
└── zh/
    └── guide/             # 中文覆盖
        └── getting-started.md
```

#### 2. 路由设计

**支持语言前缀路由（可选）**：

```tsx
// 启用语言前缀
/docs/en/guide/getting-started  // 英文文档
/docs/zh/guide/getting-started   // 中文文档
/docs/ja/guide/getting-started   // 日文文档

// 默认语言（无前缀）
/docs/guide/getting-started      // 使用默认语言（如 en）
```

**路由匹配规则**：

1. 如果 URL 包含语言前缀（如 `/docs/en/...`），使用该语言
2. 如果 URL 无语言前缀，根据以下顺序确定语言：
   - 用户选择的语言（localStorage）
   - 浏览器语言（navigator.language）
   - 配置的默认语言

#### 3. 元数据扫描增强

**多语言元数据结构**：

```typescript
// docs-meta.json
{
  "en": {
    "guide/getting-started": {
      "title": "Getting Started",
      "category": "guide",
      "route": "/docs/en/guide/getting-started",
      "lang": "en"
    }
  },
  "zh": {
    "guide/getting-started": {
      "title": "快速开始",
      "category": "guide",
      "route": "/docs/zh/guide/getting-started",
      "lang": "zh"
    }
  }
}
```

**扫描逻辑**：

```typescript
// packages/wsx-press/src/node/metadata.ts

export interface I18nConfig {
  /** 支持的语言列表 */
  locales: string[];
  /** 默认语言 */
  defaultLocale: string;
  /** 是否启用语言前缀路由 */
  localeInPath?: boolean;
}

export async function scanDocsMetadata(
  docsRoot: string,
  i18nConfig?: I18nConfig
): Promise<DocsMetaCollection | Record<string, DocsMetaCollection>> {
  if (!i18nConfig) {
    // 向后兼容：单语言模式
    return scanDocsMetadataSingle(docsRoot);
  }

  // 多语言模式：按语言扫描
  const result: Record<string, DocsMetaCollection> = {};
  
  for (const locale of i18nConfig.locales) {
    const localeDocsRoot = path.join(docsRoot, locale);
    if (await fs.pathExists(localeDocsRoot)) {
      result[locale] = await scanDocsMetadataSingle(localeDocsRoot, locale);
    }
  }

  // 处理默认语言的扁平结构
  const defaultLocaleRoot = docsRoot;
  if (await fs.pathExists(defaultLocaleRoot)) {
    const defaultMeta = await scanDocsMetadataSingle(
      defaultLocaleRoot,
      i18nConfig.defaultLocale
    );
    result[i18nConfig.defaultLocale] = {
      ...result[i18nConfig.defaultLocale],
      ...defaultMeta,
    };
  }

  return result;
}
```

#### 4. 搜索索引增强

**多语言搜索索引**：

```typescript
// search-index.json
{
  "en": {
    "documents": [...],
    "options": {...}
  },
  "zh": {
    "documents": [...],
    "options": {...}
  }
}
```

**搜索逻辑**：

- 默认在当前语言范围内搜索
- 可选：支持跨语言搜索（显示语言标签）

#### 5. 类型定义扩展

```typescript
// packages/wsx-press/src/types.ts

/**
 * 国际化配置
 */
export interface I18nConfig {
  /** 支持的语言列表 */
  locales: string[];
  /** 默认语言 */
  defaultLocale: string;
  /** 是否在 URL 路径中包含语言前缀 */
  localeInPath?: boolean;
  /** 是否启用自动语言检测 */
  autoDetect?: boolean;
}

/**
 * 扩展 DocMetadata 支持语言字段
 */
export interface DocMetadata {
  // ... 现有字段
  /** 文档语言 */
  lang?: string;
}

/**
 * 多语言路由参数
 */
export interface I18nRouteParams extends RouteParams {
  /** 语言代码 */
  lang?: string;
}
```

#### 6. 组件设计

**DocPage 组件增强**：

```tsx
// packages/wsx-press/src/client/components/DocPage.wsx

@autoRegister({ tagName: 'wsx-doc-page' })
export class DocPage extends LightComponent {
  @state private currentLang: string = 'en';
  
  protected async onAttributeChanged(name: string, _old: string, newValue: string) {
    if (name === 'params' && newValue) {
      const params = JSON.parse(newValue) as I18nRouteParams;
      
      // 确定语言
      this.currentLang = this.determineLanguage(params);
      
      // 加载对应语言的文档
      await this.loadDocument(
        this.currentLang,
        params.category,
        params.page
      );
    }
  }

  private determineLanguage(params: I18nRouteParams): string {
    // 1. 从路由参数获取
    if (params.lang) {
      return params.lang;
    }
    
    // 2. 从 i18next 获取
    if (this.i18n?.language) {
      return this.i18n.language;
    }
    
    // 3. 从配置获取默认语言
    return this.config?.defaultLocale || 'en';
  }
}
```

**DocLangSwitcher 组件（新增）**：

```tsx
// packages/wsx-press/src/client/components/DocLangSwitcher.wsx

@autoRegister({ tagName: 'wsx-doc-lang-switcher' })
export class DocLangSwitcher extends LightComponent {
  @state private currentLang: string = 'en';
  @state private availableLangs: string[] = ['en', 'zh'];

  protected onConnected() {
    // 监听语言变化
    this.i18n?.on('languageChanged', (lang) => {
      this.currentLang = lang;
      this.updateRoute();
    });
  }

  private switchLanguage(lang: string) {
    this.i18n?.changeLanguage(lang);
    this.updateRoute();
  }

  private updateRoute() {
    const currentPath = window.location.pathname;
    const newPath = this.replaceLangInPath(currentPath, this.currentLang);
    RouterUtils.navigate(newPath);
  }

  render() {
    return (
      <div class="lang-switcher">
        {this.availableLangs.map(lang => (
          <button
            class={lang === this.currentLang ? 'active' : ''}
            onClick={() => this.switchLanguage(lang)}
          >
            {this.getLangLabel(lang)}
          </button>
        ))}
      </div>
    );
  }
}
```

#### 7. Vite 插件配置

```typescript
// vite.config.ts
import { wsxPress } from '@wsxjs/wsx-press';

export default defineConfig({
  plugins: [
    wsxPress({
      docsRoot: './docs',
      i18n: {
        locales: ['en', 'zh', 'ja'],
        defaultLocale: 'en',
        localeInPath: true,  // 启用语言前缀路由
        autoDetect: true,     // 启用自动语言检测
      },
    }),
  ],
});
```

### 与 i18next 集成

**初始化 i18next**：

```typescript
// 在应用入口初始化
import { initI18n } from '@wsxjs/wsx-i18next';

initI18n({
  fallbackLng: 'en',
  supportedLngs: ['en', 'zh', 'ja'],
  detection: {
    order: ['localStorage', 'navigator'],
    caches: ['localStorage'],
    lookupLocalStorage: 'wsx-docs-language',
  },
});
```

**在组件中使用**：

```tsx
@i18n('docs')
@autoRegister({ tagName: 'wsx-doc-layout' })
export class DocLayout extends LightComponent {
  render() {
    return (
      <div>
        <h1>{this.t('title')}</h1>
        <wsx-doc-lang-switcher />
        <slot></slot>
      </div>
    );
  }
}
```

## 使用方式

### 1. 基本配置（单语言，向后兼容）

```typescript
// vite.config.ts
wsxPress({
  docsRoot: './docs',
  // 不配置 i18n，使用单语言模式
})
```

### 2. 启用国际化

```typescript
// vite.config.ts
wsxPress({
  docsRoot: './docs',
  i18n: {
    locales: ['en', 'zh'],
    defaultLocale: 'en',
    localeInPath: true,
  },
})
```

### 3. 文档目录结构

```
docs/
├── en/
│   └── guide/
│       └── getting-started.md
└── zh/
    └── guide/
        └── getting-started.md
```

### 4. 在路由中使用

```tsx
// App.wsx
<wsx-router>
  {/* 支持语言前缀的路由 */}
  <wsx-view 
    route="/docs/:lang?/:category/:page" 
    component="wsx-doc-page"
  />
  
  {/* 或使用默认语言路由 */}
  <wsx-view 
    route="/docs/:category/:page" 
    component="wsx-doc-page"
  />
</wsx-router>
```

### 5. 添加语言切换器

```tsx
// DocLayout.wsx
<wsx-doc-layout>
  <wsx-doc-lang-switcher />
  <slot></slot>
</wsx-doc-layout>
```

## 实施计划

### 阶段一：类型定义和配置（1 天）

#### Step 1.1: 扩展类型定义
- 添加 `I18nConfig` 接口
- 扩展 `DocMetadata` 支持 `lang` 字段
- 添加 `I18nRouteParams` 接口
- 更新 `DocsMetaCollection` 支持多语言结构

**测试**：
```typescript
// __tests__/types.test.ts
describe('I18nConfig', () => {
  it('应该正确定义国际化配置', () => {
    const config: I18nConfig = {
      locales: ['en', 'zh'],
      defaultLocale: 'en',
      localeInPath: true,
    };
    expect(config).toBeDefined();
  });
});
```

#### Step 1.2: 更新 Vite 插件配置
- 在 `WsxPressConfig` 中添加 `i18n?: I18nConfig`
- 验证配置有效性

### 阶段二：元数据扫描增强（2 天）

#### Step 2.1: 实现多语言元数据扫描
- 修改 `scanDocsMetadata()` 支持多语言
- 实现按语言目录扫描
- 处理默认语言的扁平结构

**测试**：
```typescript
// __tests__/node/metadata-i18n.test.ts
describe('多语言元数据扫描', () => {
  it('应该扫描所有语言的文档', async () => {
    vol.fromJSON({
      '/docs/en/guide/intro.md': '---\ntitle: Introduction\n---',
      '/docs/zh/guide/intro.md': '---\ntitle: 介绍\n---',
    });

    const result = await scanDocsMetadata('/docs', {
      locales: ['en', 'zh'],
      defaultLocale: 'en',
    });

    expect(result.en).toBeDefined();
    expect(result.zh).toBeDefined();
    expect(result.en['guide/intro'].title).toBe('Introduction');
    expect(result.zh['guide/intro'].title).toBe('介绍');
  });
});
```

#### Step 2.2: 更新搜索索引生成
- 修改 `generateSearchIndex()` 支持多语言
- 为每种语言生成独立的搜索索引

### 阶段三：路由和组件增强（3 天）

#### Step 3.1: 更新 DocPage 组件
- 添加语言检测逻辑
- 支持从路由参数获取语言
- 实现语言回退机制

**测试**：
```typescript
// __tests__/client/DocPage-i18n.test.ts
describe('DocPage 国际化', () => {
  it('应该根据路由参数加载对应语言的文档', async () => {
    const page = new DocPage();
    await page.setAttribute('params', JSON.stringify({
      lang: 'zh',
      category: 'guide',
      page: 'intro',
    }));

    expect(page.currentLang).toBe('zh');
    expect(fetch).toHaveBeenCalledWith('/docs/zh/guide/intro.md');
  });
});
```

#### Step 3.2: 实现 DocLangSwitcher 组件
- 创建语言切换器组件
- 集成 i18next 语言切换
- 实现路由更新

#### Step 3.3: 更新 DocLayout 组件
- 集成语言切换器
- 支持多语言 UI 文本

### 阶段四：Vite 插件更新（1 天）

#### Step 4.1: 更新插件逻辑
- 支持多语言元数据生成
- 支持多语言搜索索引生成
- 更新开发服务器中间件

### 阶段五：集成测试和文档（2 天）

#### Step 5.1: E2E 测试
- 测试语言切换流程
- 测试自动语言检测
- 测试语言回退机制

#### Step 5.2: 文档更新
- 更新 README
- 添加国际化使用指南
- 提供迁移指南

## 测试策略

### 单元测试

- **元数据扫描**：测试多语言文档扫描、语言回退、默认语言处理
- **搜索索引**：测试多语言索引生成、跨语言搜索
- **组件**：测试语言检测、语言切换、路由更新

### 集成测试

- **路由系统**：测试语言前缀路由、默认语言路由
- **i18next 集成**：测试语言切换、持久化、自动检测

### 端到端测试

- **用户流程**：访问文档 → 切换语言 → 验证内容更新
- **SEO**：验证语言前缀路由的 SEO 友好性

## 向后兼容性

### 破坏性变更

**无破坏性变更**：所有更改都是可选的，默认行为保持不变。

### 迁移策略

**单语言项目**：
- 无需任何更改，继续使用现有配置

**多语言项目**：
1. 创建语言目录结构
2. 添加 i18n 配置
3. 更新路由（可选，支持语言前缀）

### 废弃计划

无废弃功能。

## 性能影响

### 构建时性能

- **元数据扫描**：多语言扫描会增加构建时间，但可以并行处理
- **搜索索引**：每种语言生成独立索引，增加构建时间

### 运行时性能

- **文档加载**：按需加载对应语言的文档，无额外开销
- **搜索**：在当前语言范围内搜索，性能与单语言相同

### 内存使用

- **元数据缓存**：多语言元数据会增加内存使用，但可以按需加载

## 安全考虑

- **路径遍历**：确保语言代码验证，防止路径遍历攻击
- **XSS**：文档内容通过 MarkedBuilder 渲染，已有 XSS 防护

## 开发者体验

### 学习曲线

- **简单**：单语言项目无需学习新概念
- **中等**：多语言项目需要了解目录结构和配置

### 调试体验

- 提供清晰的错误信息（如文档缺失时的语言回退提示）
- 支持开发模式下的语言切换预览

## 社区影响

### 生态系统

- 提升框架的国际化能力
- 吸引更多国际开发者

### 第三方集成

- 与现有 i18next 生态系统兼容
- 支持 i18next 插件和工具

## 先例

### 业界实践

- **VitePress**：支持多语言，使用语言前缀路由
- **Docusaurus**：支持国际化，使用语言子目录
- **Next.js**：支持国际化路由和内容

### 学习借鉴

- 借鉴 VitePress 的语言前缀路由设计
- 借鉴 Docusaurus 的目录结构组织方式
- 借鉴 Next.js 的语言检测和回退机制

## 未解决问题

1. **部分翻译处理**：如果某个文档只有部分语言版本，如何处理？
   - 方案：回退到默认语言，显示语言切换器但禁用未翻译的语言

2. **API 文档国际化**：TypeDoc 生成的 API 文档如何国际化？
   - 方案：暂不支持，API 文档保持英文，或使用 TypeDoc 的多语言插件

3. **URL 格式**：是否强制使用语言前缀？
   - 方案：可选，通过 `localeInPath` 配置控制

## 附录

### 参考资料

- [RFC-0024: WSX-Press 文档系统](./0024-documentation-system.md)
- [VitePress i18n](https://vitepress.dev/guide/i18n)
- [Docusaurus i18n](https://docusaurus.io/docs/i18n/introduction)
- [i18next Documentation](https://www.i18next.com/)

### 讨论记录

- 2025-01-20: 初始 RFC 草案创建

---

*这个 RFC 扩展了 wsx-press 的国际化能力，使其能够为全球开发者提供本地化文档体验。*
