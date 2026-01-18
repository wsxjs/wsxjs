---
title: @wsxjs/wsx-i18next Usage Guide
order: 3
category: guide/advanced
description: "@wsxjs/wsx-i18next provides i18next internationalization support for WSXJS components, making it easy for your application to support multiple languages"
---

`@wsxjs/wsx-i18next` provides i18next internationalization support for WSXJS components, making it easy for your application to support multiple languages.

## Installation

```bash
npm install @wsxjs/wsx-i18next i18next
```

## Prerequisites

Using the `@i18n` decorator requires the following configuration:

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "useDefineForClassFields": false
  }
}
```

### Vite Configuration (Required)

```typescript
import { defineConfig } from 'vite';
import { wsx } from '@wsxjs/wsx-vite-plugin';

export default defineConfig({
  plugins: [wsx()]
});
```

> ⚠️ **Critical**: `@wsxjs/wsx-vite-plugin` is **required**, it contains the Babel plugin for processing decorators.
> 
> **Why is this plugin needed?**
> 
> The `@i18n` decorator returns a new class (`I18nEnhanced`), rather than modifying the original class. Babel's decorator transformation (`@babel/plugin-proposal-decorators`) must be correctly configured to handle this case.
> 
> `@wsxjs/wsx-vite-plugin` internally configures the correct Babel plugin chain, ensuring decorators are correctly transformed. Without configuring this plugin, decorators may not be correctly applied, causing `this.t is not a function` errors.
> 
> **Reference**: WSXJS official site (`site/vite.config.ts`) correctly configures this plugin, so decorators work there.

## Quick Start

### 1. Initialize i18n

Initialize i18next in the application entry file:

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

### 2. Use Decorator (Recommended)

The simplest way is to use the `@i18n` decorator, which automatically injects translation functionality into components:

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

**Features**:
- ✅ Automatically subscribes to language changes and triggers re-render
- ✅ Automatically cleans up subscriptions (when component disconnects)
- ✅ Type safe (through type declaration extensions)

### 3. Use useTranslation + @state

If you need more control, you can use `useTranslation` with `@state`:

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
        // Subscribe to language change events
        this.unsubscribe = i18n.on('languageChanged', (lng) => {
            this.currentLang = lng;
            this.rerender(); // Manually trigger re-render
        });
    }

    protected onDisconnected(): void {
        // Clean up subscriptions
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    render() {
        return (
            <div>
                <p>Current language: {this.currentLang}</p>
                <p>{this.translation.t('hello')}</p>
            </div>
        );
    }
}
```

### 4. Use Mixin

Use `withI18n` mixin to add i18n support to base class:

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

## Configuration Options

### Basic Configuration

```typescript
import { initI18n } from '@wsxjs/wsx-i18next';

initI18n({
    fallbackLng: 'en', // Fallback language
    debug: false,      // Whether to enable debug mode
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

### Using HTTP Backend (Recommended)

Load translation files from server:

```typescript
import { initI18n } from '@wsxjs/wsx-i18next';

initI18n({
    fallbackLng: 'en',
    backend: {
        loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    ns: ['common', 'home', 'examples'], // Namespace list
    defaultNS: 'common',
});
```

**File Structure**:
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

### Language Detection

`@wsxjs/wsx-i18next` integrates `i18next-browser-languagedetector` by default, automatically detects browser language:

```typescript
initI18n({
    fallbackLng: 'en',
    // Language detection is automatically enabled
    // Detection order: localStorage -> navigator -> cookie -> querystring -> htmlTag
});
```

## API Reference

### initI18n(config?)

Initialize i18next instance.

**Parameters**:
- `config` (optional): i18next configuration options

**Returns**: i18n instance

**Example**:
```typescript
const i18n = initI18n({
    fallbackLng: 'en',
    resources: { /* ... */ },
});
```

### @i18n(namespace?)

Class decorator that automatically injects translation functionality into components.

**Parameters**:
- `namespace` (optional): Default namespace, defaults to `'common'`

**Injected Methods**:
- `this.t(key, options?)`: Translation function
- `this.i18n`: i18n instance

**Example**:
```tsx
@i18n('common')
export class MyComponent extends WebComponent {
    render() {
        return <div>{this.t('hello')}</div>;
    }
}
```

### useTranslation(namespace?)

Create translation object, API compatible with `react-i18next`.

**Parameters**:
- `namespace` (optional): Namespace, defaults to `'common'`

**Returns**:
```typescript
{
    t: (key: string, options?: object) => string;
    i18n: typeof i18n;
    ready: boolean;
}
```

**Example**:
```typescript
const translation = useTranslation('common');
const text = translation.t('hello');
```

### withI18n(Base, defaultNamespace?)

Mixin that adds i18n support to base class.

**Parameters**:
- `Base`: Base class (`WebComponent` or `LightComponent`)
- `defaultNamespace` (optional): Default namespace, defaults to `'common'`

**Returns**: Enhanced class

**Example**:
```tsx
export class MyComponent extends withI18n(WebComponent, 'common') {
    render() {
        return <div>{this.t('hello')}</div>;
    }
}
```

## Reactive Mechanism

Different usage methods have different reactive mechanisms:

### @i18n Decorator

- ✅ **Auto Subscribe**: Automatically subscribes to `languageChanged` event when component connects
- ✅ **Auto Re-render**: Automatically calls `rerender()` when language changes
- ✅ **Auto Cleanup**: Automatically cancels subscription when component disconnects

### useTranslation + @state

- ⚠️ **Manual Subscribe**: Need to manually subscribe in `onConnected()`
- ⚠️ **Manual Re-render**: Need to manually call `rerender()` or update `@state` property
- ⚠️ **Manual Cleanup**: Need to manually cancel subscription in `onDisconnected()`

### withI18n Mixin

- ✅ **Auto Subscribe**: Automatically subscribes to `languageChanged` event when component connects
- ✅ **Auto Re-render**: Automatically calls `rerender()` when language changes
- ✅ **Auto Cleanup**: Automatically cancels subscription when component disconnects

## Switching Languages

```typescript
import { i18n } from '@wsxjs/wsx-i18next';

// Switch language
i18n.changeLanguage('zh');

// Get current language
const currentLang = i18n.language;

// Listen to language changes
i18n.on('languageChanged', (lng) => {
    console.log('Language changed to:', lng);
});
```

## Interpolation

Supports variable interpolation:

```typescript
// Translation resources
{
    welcome: 'Welcome, {{name}}!',
    items: 'You have {{count}} items',
}

// Usage
this.t('welcome', { name: 'World' });
// => "Welcome, World!"

this.t('items', { count: 5 });
// => "You have 5 items"
```

## Plural Forms

Supports plural forms:

```typescript
// Translation resources
{
    items: '{{count}} item',
    items_plural: '{{count}} items',
}

// Usage
this.t('items', { count: 1 });
// => "1 item"

this.t('items', { count: 5 });
// => "5 items"
```

## Namespaces

Use namespaces to organize translations:

```typescript
// Define namespaces during initialization
initI18n({
    ns: ['common', 'home', 'examples'],
    defaultNS: 'common',
});

// Use different namespaces
@i18n('home')
export class HomeComponent extends WebComponent {
    render() {
        return <div>{this.t('title')}</div>; // Uses 'home' namespace
    }
}

// Temporarily use other namespace
this.t('title', { ns: 'examples' });
```

## Type Safety

To get complete type support, add type declarations:

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

## Best Practices

### 1. Use Decorator (Recommended)

For most scenarios, using the `@i18n` decorator is the simplest way:

```tsx
@i18n('common')
export class MyComponent extends WebComponent {
    render() {
        return <div>{this.t('hello')}</div>;
    }
}
```

### 2. Organize Translation Files

Organize translation files by feature module:

```
locales/
├── en/
│   ├── common.json      # Common translations
│   ├── home.json        # Home page translations
│   └── examples.json    # Example translations
└── zh/
    ├── common.json
    ├── home.json
    └── examples.json
```

### 3. Use HTTP Backend

For large applications, use HTTP Backend to load translation files from server, rather than inlining in code.

### 4. Language Switcher Component

Create a language switcher component:

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

## Troubleshooting

### `this.t is not a function` Runtime Error

If you encounter `TypeError: this.t is not a function` error, it means the decorator was not correctly applied.

**Root Cause**:

The `@i18n` decorator returns a new class (`I18nEnhanced`), rather than modifying the original class. Babel's decorator transformation (`@babel/plugin-proposal-decorators`) must be correctly configured to handle this case.

**Possible Causes and Solutions**:

1. **Missing Vite Plugin Configuration (Most Common)**:
   - ⚠️ **This is the most common cause**: The `@i18n` decorator **must** be processed through the Babel plugin in `@wsxjs/wsx-vite-plugin`
   - Ensure `@wsxjs/wsx-vite-plugin` is configured in `vite.config.ts`:
     ```typescript
     import { defineConfig } from 'vite';
     import { wsx } from '@wsxjs/wsx-vite-plugin';
     
     export default defineConfig({
       plugins: [wsx()] // Required! Otherwise decorators won't work
     });
     ```
   - Without configuring this plugin, Babel's decorator transformation may not correctly handle decorators that return new classes

2. **Missing Decorator Configuration**:
   - Ensure decorators are enabled in `tsconfig.json`:
     ```json
     {
       "compilerOptions": {
         "experimentalDecorators": true,
         "useDefineForClassFields": false
       }
     }
     ```

3. **Incorrect Decorator Import**:
   - Ensure decorator is correctly imported:
     ```typescript
     import { i18n } from '@wsxjs/wsx-i18next';
     // Not import { i18nDecorator } from '@wsxjs/wsx-i18next';
     ```

4. **Check if Decorator is Applied**:
   - Check component instance in browser console:
     ```javascript
     const component = document.querySelector('my-component');
     console.log(component.t); // Should be function
     console.log(component.constructor.name); // Should be component class name
     ```
   - If `component.t` is `undefined`, the decorator was not applied

5. **Verify Babel Configuration**:
   - Check build output, confirm decorators are correctly transformed
   - If using other build tools (like Webpack), ensure corresponding Babel plugin is configured:
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

6. **Use Alternative Solution**:
   - If decorators still don't work, you can use `withI18n` mixin (doesn't depend on decorator transformation):
     ```tsx
     import { withI18n } from '@wsxjs/wsx-i18next';
     
     export class MyComponent extends withI18n(WebComponent, 'common') {
         render() {
             return <div>{this.t('hello')}</div>;
         }
     }
     ```
   - `withI18n` uses class inheritance, doesn't depend on decorator transformation, works in all environments

### Translations Not Updating

Ensure components correctly subscribe to language change events:

- Using `@i18n` decorator: Automatically handled
- Using `useTranslation`: Need to manually subscribe to `languageChanged` event
- Using `withI18n`: Automatically handled

### Type Errors

Ensure type declaration file is added (see "Type Safety" section).

If type declarations don't work, you can manually create:

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

### Translation Key Not Found

Check:
1. Are translation resources correctly loaded
2. Is namespace correct
3. Is translation key correct

## More Information

- [RFC-0029: i18next Internationalization Support](../../../docs/rfcs/completed/0029-i18next-integration.md) - Complete design documentation
- [i18next Official Documentation](https://www.i18next.com/) - Complete i18next documentation
