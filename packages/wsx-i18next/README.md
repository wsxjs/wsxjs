# @wsxjs/wsx-i18next

i18next integration for WSXJS components - 为 WSXJS 组件提供 i18next 国际化支持

## 安装

```bash
npm install @wsxjs/wsx-i18next i18next
```

## 快速开始

### 1. 初始化 i18n

```typescript
import { initI18n } from '@wsxjs/wsx-i18next';

initI18n({
    fallbackLng: 'en',
    resources: {
        en: {
            common: { hello: 'Hello' },
        },
        zh: {
            common: { hello: '你好' },
        },
    },
});
```

### 2. 使用装饰器（推荐）

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
import { i18n } from '@wsxjs/wsx-i18next';

@i18n('common')
@autoRegister({ tagName: 'my-component' })
export class MyComponent extends WebComponent {
    render() {
        return <div>{this.t('hello')}</div>;
    }
}
```

### 3. 使用 useTranslation + @state

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
        this.unsubscribe = i18n.on('languageChanged', (lng) => {
            this.currentLang = lng;
        });
    }

    protected onDisconnected(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    render() {
        return <div>{this.translation.t('hello')}</div>;
    }
}
```

### 4. 使用 Mixin

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

## API

### initI18n(config?)

初始化 i18next 实例。

### i18n (装饰器)

为组件自动注入翻译功能。

```tsx
@i18n('namespace')
export class MyComponent extends WebComponent {
    render() {
        return <div>{this.t('key')}</div>;
    }
}
```

### useTranslation(namespace?)

创建翻译对象，API 与 react-i18next 兼容。

### withI18n(Base, defaultNamespace?)

为基类添加 i18n 支持的 mixin。

## 响应式机制

- `@i18n` 装饰器：自动订阅语言变化并触发重渲染
- `useTranslation` + `@state`：手动订阅，通过更新 `@state` 触发重渲染
- `withI18n`：自动订阅语言变化并触发重渲染

## 更多信息

查看 [RFC-0029](../../docs/rfcs/0029-i18next-integration.md) 了解完整设计。

