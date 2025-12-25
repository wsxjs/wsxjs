# @wsxjs/wsx-i18next 使用指南

`@wsxjs/wsx-i18next` 为 WSXJS 组件提供 i18next 国际化支持，让您的应用轻松支持多语言。

## 安装

```bash
npm install @wsxjs/wsx-i18next i18next
```

## 前置要求

使用 `@i18n` 装饰器需要以下配置：

### TypeScript 配置

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "useDefineForClassFields": false
  }
}
```

### Vite 配置（必需）

```typescript
import { defineConfig } from 'vite';
import { wsx } from '@wsxjs/wsx-vite-plugin';

export default defineConfig({
  plugins: [wsx()]
});
```

> ⚠️ **关键**：`@wsxjs/wsx-vite-plugin` 是**必需的**，它包含处理装饰器的 Babel 插件。
> 
> **为什么需要这个插件？**
> 
> `@i18n` 装饰器返回一个新类（`I18nEnhanced`），而不是修改原类。Babel 的装饰器转换（`@babel/plugin-proposal-decorators`）必须正确配置才能处理这种情况。
> 
> `@wsxjs/wsx-vite-plugin` 内部配置了正确的 Babel 插件链，确保装饰器被正确转换。如果没有配置此插件，装饰器可能不会被正确应用，导致 `this.t is not a function` 错误。
> 
> **参考**：WSXJS 官方 site（`site/vite.config.ts`）中正确配置了此插件，所以装饰器在那里可以正常工作。

## 快速开始

### 1. 初始化 i18n

在应用入口文件中初始化 i18next：

```typescript
import { initI18n } from '@wsxjs/wsx-i18next';

initI18n({
    fallbackLng: 'en',
    resources: {
        en: {
            common: {
                hello: 'Hello',
                welcome: 'Welcome, {{name}}!',
            },
        },
        zh: {
            common: {
                hello: '你好',
                welcome: '欢迎，{{name}}！',
            },
        },
    },
});
```

### 2. 使用装饰器（推荐）

最简单的方式是使用 `@i18n` 装饰器，它会自动为组件注入翻译功能：

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
import { i18n } from '@wsxjs/wsx-i18next';

@autoRegister({ tagName: 'my-component' })
@i18n('common') // must after @autoRegister due to order from button to top
export class MyComponent extends WebComponent {
    render() {
        return (
            <div>
                <h1>{this.t('hello')}</h1>
                <p>{this.t('welcome', { name: 'World' })}</p>
            </div>
        );
    }
}
```

**特点**：
- ✅ 自动订阅语言变化并触发重渲染
- ✅ 自动清理订阅（组件断开时）
- ✅ 类型安全（通过类型声明扩展）

### 3. 使用 useTranslation + @state

如果您需要更多控制，可以使用 `useTranslation` 配合 `@state`：

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
import { LightComponent, autoRegister, state } from '@wsxjs/wsx-core';
import { i18n, useTranslation } from '@wsxjs/wsx-i18next';

@autoRegister({ tagName: 'my-component' })
export class MyComponent extends LightComponent {
    private translation = useTranslation('common');
    @state private currentLang: string = i18n.language;
    private unsubscribe?: () => void;

    protected onConnected(): void {
        // 订阅语言变化事件
        this.unsubscribe = i18n.on('languageChanged', (lng) => {
            this.currentLang = lng;
            this.rerender(); // 手动触发重渲染
        });
    }

    protected onDisconnected(): void {
        // 清理订阅
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    render() {
        return (
            <div>
                <p>当前语言: {this.currentLang}</p>
                <p>{this.translation.t('hello')}</p>
            </div>
        );
    }
}
```

### 4. 使用 Mixin

使用 `withI18n` mixin 为基类添加 i18n 支持：

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
import { withI18n } from '@wsxjs/wsx-i18next';

@autoRegister({ tagName: 'my-component' })
export class MyComponent extends withI18n(WebComponent, 'common') {
    render() {
        return <div>{this.t('hello')}</div>;
    }
}
```

## 配置选项

### 基本配置

```typescript
import { initI18n } from '@wsxjs/wsx-i18next';

initI18n({
    fallbackLng: 'en', // 回退语言
    debug: false,      // 是否开启调试模式
    resources: {
        en: {
            common: { /* ... */ },
            home: { /* ... */ },
        },
        zh: {
            common: { /* ... */ },
            home: { /* ... */ },
        },
    },
});
```

### 使用 HTTP Backend（推荐）

从服务器加载翻译文件：

```typescript
import { initI18n } from '@wsxjs/wsx-i18next';

initI18n({
    fallbackLng: 'en',
    backend: {
        loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    ns: ['common', 'home', 'examples'], // 命名空间列表
    defaultNS: 'common',
});
```

**文件结构**：
```
public/
└── locales/
    ├── en/
    │   ├── common.json
    │   ├── home.json
    │   └── examples.json
    └── zh/
        ├── common.json
        ├── home.json
        └── examples.json
```

### 语言检测

`@wsxjs/wsx-i18next` 默认集成了 `i18next-browser-languagedetector`，会自动检测浏览器语言：

```typescript
initI18n({
    fallbackLng: 'en',
    // 语言检测会自动启用
    // 检测顺序：localStorage -> navigator -> cookie -> querystring -> htmlTag
});
```

## API 参考

### initI18n(config?)

初始化 i18next 实例。

**参数**：
- `config` (可选): i18next 配置选项

**返回**：i18n 实例

**示例**：
```typescript
const i18n = initI18n({
    fallbackLng: 'en',
    resources: { /* ... */ },
});
```

### @i18n(namespace?)

类装饰器，为组件自动注入翻译功能。

**参数**：
- `namespace` (可选): 默认命名空间，默认为 `'common'`

**注入的方法**：
- `this.t(key, options?)`: 翻译函数
- `this.i18n`: i18n 实例

**示例**：
```tsx
@i18n('common')
export class MyComponent extends WebComponent {
    render() {
        return <div>{this.t('hello')}</div>;
    }
}
```

### useTranslation(namespace?)

创建翻译对象，API 与 `react-i18next` 兼容。

**参数**：
- `namespace` (可选): 命名空间，默认为 `'common'`

**返回**：
```typescript
{
    t: (key: string, options?: object) => string;
    i18n: typeof i18n;
    ready: boolean;
}
```

**示例**：
```typescript
const translation = useTranslation('common');
const text = translation.t('hello');
```

### withI18n(Base, defaultNamespace?)

为基类添加 i18n 支持的 mixin。

**参数**：
- `Base`: 基类（`WebComponent` 或 `LightComponent`）
- `defaultNamespace` (可选): 默认命名空间，默认为 `'common'`

**返回**：增强后的类

**示例**：
```tsx
export class MyComponent extends withI18n(WebComponent, 'common') {
    render() {
        return <div>{this.t('hello')}</div>;
    }
}
```

## 响应式机制

不同的使用方式有不同的响应式机制：

### @i18n 装饰器

- ✅ **自动订阅**：组件连接时自动订阅 `languageChanged` 事件
- ✅ **自动重渲染**：语言变化时自动调用 `rerender()`
- ✅ **自动清理**：组件断开时自动取消订阅

### useTranslation + @state

- ⚠️ **手动订阅**：需要在 `onConnected()` 中手动订阅
- ⚠️ **手动重渲染**：需要手动调用 `rerender()` 或更新 `@state` 属性
- ⚠️ **手动清理**：需要在 `onDisconnected()` 中手动取消订阅

### withI18n Mixin

- ✅ **自动订阅**：组件连接时自动订阅 `languageChanged` 事件
- ✅ **自动重渲染**：语言变化时自动调用 `rerender()`
- ✅ **自动清理**：组件断开时自动取消订阅

## 切换语言

```typescript
import { i18n } from '@wsxjs/wsx-i18next';

// 切换语言
i18n.changeLanguage('zh');

// 获取当前语言
const currentLang = i18n.language;

// 监听语言变化
i18n.on('languageChanged', (lng) => {
    console.log('Language changed to:', lng);
});
```

## 插值（Interpolation）

支持变量插值：

```typescript
// 翻译资源
{
    welcome: 'Welcome, {{name}}!',
    items: 'You have {{count}} items',
}

// 使用
this.t('welcome', { name: 'World' });
// => "Welcome, World!"

this.t('items', { count: 5 });
// => "You have 5 items"
```

## 复数形式

支持复数形式：

```typescript
// 翻译资源
{
    items: '{{count}} item',
    items_plural: '{{count}} items',
}

// 使用
this.t('items', { count: 1 });
// => "1 item"

this.t('items', { count: 5 });
// => "5 items"
```

## 命名空间

使用命名空间组织翻译：

```typescript
// 初始化时定义命名空间
initI18n({
    ns: ['common', 'home', 'examples'],
    defaultNS: 'common',
});

// 使用不同命名空间
@i18n('home')
export class HomeComponent extends WebComponent {
    render() {
        return <div>{this.t('title')}</div>; // 使用 'home' 命名空间
    }
}

// 临时使用其他命名空间
this.t('title', { ns: 'examples' });
```

## 类型安全

为了获得完整的类型支持，需要添加类型声明：

```typescript
// types/i18n.d.ts
declare module '@wsxjs/wsx-core' {
    interface WebComponent {
        t(key: string, options?: object): string;
    }

    interface LightComponent {
        t(key: string, options?: object): string;
    }
}
```

## 最佳实践

### 1. 使用装饰器（推荐）

对于大多数场景，使用 `@i18n` 装饰器是最简单的方式：

```tsx
@i18n('common')
export class MyComponent extends WebComponent {
    render() {
        return <div>{this.t('hello')}</div>;
    }
}
```

### 2. 组织翻译文件

按功能模块组织翻译文件：

```
locales/
├── en/
│   ├── common.json      # 通用翻译
│   ├── home.json        # 首页翻译
│   └── examples.json    # 示例翻译
└── zh/
    ├── common.json
    ├── home.json
    └── examples.json
```

### 3. 使用 HTTP Backend

对于大型应用，使用 HTTP Backend 从服务器加载翻译文件，而不是内联在代码中。

### 4. 语言切换组件

创建一个语言切换组件：

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
import { LightComponent, autoRegister, state } from '@wsxjs/wsx-core';
import { i18n } from '@wsxjs/wsx-i18next';

@autoRegister({ tagName: 'language-switcher' })
export class LanguageSwitcher extends LightComponent {
    @state private currentLang: string = i18n.language;
    private unsubscribe?: () => void;

    protected onConnected(): void {
        this.unsubscribe = i18n.on('languageChanged', (lng) => {
            this.currentLang = lng;
        });
    }

    protected onDisconnected(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    private changeLanguage(lng: string): void {
        i18n.changeLanguage(lng);
    }

    render() {
        return (
            <div>
                <button onClick={() => this.changeLanguage('en')}>
                    English
                </button>
                <button onClick={() => this.changeLanguage('zh')}>
                    中文
                </button>
            </div>
        );
    }
}
```

## 故障排查

### `this.t is not a function` 运行时错误

如果遇到 `TypeError: this.t is not a function` 错误，说明装饰器没有被正确应用。

**根本原因**：

`@i18n` 装饰器返回一个新类（`I18nEnhanced`），而不是修改原类。Babel 的装饰器转换（`@babel/plugin-proposal-decorators`）必须正确配置才能处理这种情况。

**可能的原因和解决方案**：

1. **缺少 Vite 插件配置（最常见）**：
   - ⚠️ **这是最常见的原因**：`@i18n` 装饰器**必须**通过 `@wsxjs/wsx-vite-plugin` 中的 Babel 插件处理
   - 确保在 `vite.config.ts` 中配置了 `@wsxjs/wsx-vite-plugin`：
     ```typescript
     import { defineConfig } from 'vite';
     import { wsx } from '@wsxjs/wsx-vite-plugin';
     
     export default defineConfig({
       plugins: [wsx()] // 必需！否则装饰器不会工作
     });
     ```
   - 如果没有配置此插件，Babel 的装饰器转换可能无法正确处理返回新类的装饰器

2. **缺少装饰器配置**：
   - 确保 `tsconfig.json` 中启用了装饰器：
     ```json
     {
       "compilerOptions": {
         "experimentalDecorators": true,
         "useDefineForClassFields": false
       }
     }
     ```

3. **装饰器导入错误**：
   - 确保正确导入装饰器：
     ```typescript
     import { i18n } from '@wsxjs/wsx-i18next';
     // 不是 import { i18nDecorator } from '@wsxjs/wsx-i18next';
     ```

4. **检查装饰器是否被应用**：
   - 在浏览器控制台中检查组件实例：
     ```javascript
     const component = document.querySelector('my-component');
     console.log(component.t); // 应该是 function
     console.log(component.constructor.name); // 应该是组件类名
     ```
   - 如果 `component.t` 是 `undefined`，说明装饰器没有被应用

5. **验证 Babel 配置**：
   - 检查构建输出，确认装饰器被正确转换
   - 如果使用其他构建工具（如 Webpack），需要确保配置了相应的 Babel 插件：
     ```javascript
     // babel.config.js
     {
       "plugins": [
         ["@babel/plugin-proposal-decorators", {
           "version": "2023-05",
           "decoratorsBeforeExport": true
         }]
       ]
     }
     ```

6. **使用替代方案**：
   - 如果装饰器仍然不工作，可以使用 `withI18n` mixin（不依赖装饰器转换）：
     ```tsx
     import { withI18n } from '@wsxjs/wsx-i18next';
     
     export class MyComponent extends withI18n(WebComponent, 'common') {
         render() {
             return <div>{this.t('hello')}</div>;
         }
     }
     ```
   - `withI18n` 使用类继承，不依赖装饰器转换，在所有环境中都能工作

### 翻译不更新

确保组件正确订阅了语言变化事件：

- 使用 `@i18n` 装饰器：自动处理
- 使用 `useTranslation`：需要手动订阅 `languageChanged` 事件
- 使用 `withI18n`：自动处理

### 类型错误

确保添加了类型声明文件（见"类型安全"部分）。

如果类型声明不工作，可以手动创建：

```typescript
// types/i18n.d.ts
declare module '@wsxjs/wsx-core' {
    interface WebComponent {
        t(key: string, options?: object): string;
        readonly i18n: typeof import('i18next').default;
    }

    interface LightComponent {
        t(key: string, options?: object): string;
        readonly i18n: typeof import('i18next').default;
    }
}
```

### 翻译键不存在

检查：
1. 翻译资源是否正确加载
2. 命名空间是否正确
3. 翻译键是否正确

## 更多信息

- [RFC-0029: i18next 国际化支持](../../../docs/rfcs/completed/0029-i18next-integration.md) - 完整的设计文档
- [i18next 官方文档](https://www.i18next.com/) - i18next 的完整文档

