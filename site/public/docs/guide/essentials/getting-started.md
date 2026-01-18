---
title: Getting Started
order: 1
category: guide/essentials
description: "Get started with WSXJS in 5 minutes, from installation to creating your first component"
---

## Installation

```bash
npm install @wsxjs/wsx-core @wsxjs/wsx-vite-plugin @wsxjs/eslint-plugin-wsx
npm install --save-dev @wsxjs/wsx-tsconfig
```

## Configuration

### 1. TypeScript Configuration

**Recommended**: Use the `@wsxjs/wsx-tsconfig` package (includes all required configurations):

```json
{
  "extends": "@wsxjs/wsx-tsconfig/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

**Manual Configuration** (if not using `@wsxjs/wsx-tsconfig`):

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@wsxjs/wsx-core",
    "types": ["@wsxjs/wsx-core"],
    "experimentalDecorators": true,
    "useDefineForClassFields": false
  }
}
```

> ⚠️ **Important**: If using the `@state` decorator, you must configure:
> - `experimentalDecorators: true` - Enable decorator syntax
> - `useDefineForClassFields: false` - Ensure decorators are compatible with class fields
>
> Additionally, you must configure `@wsxjs/wsx-vite-plugin` in `vite.config.ts`, which includes the Babel plugin for processing the `@state` decorator.

> 💡 **Tip**: See the [TypeScript Setup Guide](./typescript-setup.md) for complete configuration instructions, best practices, and common issue solutions.

### 2. Vite Configuration

Add to `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import { wsx } from '@wsxjs/wsx-vite-plugin';

export default defineConfig({
  plugins: [wsx()]
});
```

> ⚠️ **Important**: `@wsxjs/wsx-vite-plugin` is **required** for using the `@state` decorator. This plugin includes a Babel plugin that processes the `@state` decorator at compile time. Without this plugin, the `@state` decorator will not work and will throw an error.

### 3. ESLint Configuration

Add to `eslint.config.js`:

```javascript
import wsxPlugin from '@wsxjs/eslint-plugin-wsx';

export default [
  {
    files: ['**/*.{ts,tsx,js,jsx,wsx}'],
    plugins: { wsx: wsxPlugin },
    rules: {
      'wsx/no-react-imports': 'error',
      'wsx/render-method-required': 'error',
      'wsx/state-requires-initial-value': 'error' // ✅ Validates @state must have initial value
    }
  }
];
```

> ⚠️ **Important**: The `wsx/state-requires-initial-value` rule checks at development time whether properties with the `@state` decorator have initial values. This is mandatory because the Babel plugin needs initial values to determine property types and generate correct reactive code.

## Creating Components

### Basic Component

**Automatic CSS Injection (Recommended)**:
If a `MyButton.css` file exists, the Babel plugin will automatically inject styles without manual import:

```typescript
// MyButton.wsx
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
// CSS auto-injection: If MyButton.css exists, it will be automatically imported and injected as _autoStyles

@autoRegister('my-button')
export class MyButton extends WebComponent {
  // No constructor needed, styles will be automatically applied
  render() {
    return (
      <button className="btn" onClick={(e) => this.handleClick(e)}>
        <slot />
      </button>
    );
  }

  private handleClick = (event: MouseEvent) => {
    console.log('Button clicked!');
  };
}
```

**Manual Style Import (Optional)**:
If you've already manually imported styles, the Babel plugin will skip auto-injection to avoid duplication:

```typescript
// MyButton.wsx
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
import styles from './MyButton.css?inline'; // Manual import

@autoRegister('my-button')
export class MyButton extends WebComponent {
  constructor() {
    super({ styles }); // Manual pass
  }
  // ...
}
```

### Using @state Decorator (Reactive State)

```typescript
// Counter.wsx
import { WebComponent, autoRegister, state } from '@wsxjs/wsx-core';
// CSS auto-injection: If Counter.css exists, it will be automatically imported and injected

@autoRegister('wsx-counter')
export class Counter extends WebComponent {
  // No constructor needed, styles will be automatically applied
  }

  // ✅ @state decorator must have initial value
  @state private count = 0;
  @state private name = "";
  @state private user = { name: "John", age: 30 };
  @state private items: string[] = [];

  render() {
    return (
      <div>
        <p>Count: {this.count}</p>
        <p>Name: {this.name}</p>
        <button onClick={() => this.count++}>Increment</button>
        <button onClick={() => this.name = "Updated"}>Update Name</button>
      </div>
    );
  }
}
```

**Important Notes**:
- ⚠️ Properties with the `@state` decorator **must have initial values**
- ✅ ESLint rule checks at development time (`wsx/state-requires-initial-value`)
- ✅ Babel plugin validates at build time, missing initial values will cause build failure
- 📖 See [RFC-0013](./rfcs/completed/0013-state-initial-value-validation.md) for detailed explanation

**Valid Examples**:
```typescript
@state private count = 0;           // ✅ Number
@state private name = "";           // ✅ String
@state private enabled = false;     // ✅ Boolean
@state private user = {};           // ✅ Object
@state private items = [];          // ✅ Array
```

**Invalid Examples** (will be detected by ESLint and Babel):
```typescript
@state private count;               // ❌ Missing initial value
@state private name;                 // ❌ Missing initial value
```

## Using Components

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="./main.ts"></script>
</head>
<body>
  <my-button>Click me!</my-button>
</body>
</html>
```

## Key Features

- ✅ **Zero React Dependencies**: Completely independent JSX implementation
- ✅ **Framework-Level Support**: No additional configuration needed
- ✅ **TypeScript Support**: Full type safety
- ✅ **Web Components**: Native custom elements
- ✅ **CSS Encapsulation**: Shadow DOM style isolation

## Next Steps

- Check out the **[WebComponent Guide](../core-concepts/web-components.md)** to learn about Shadow DOM component development
- Check out the **[LightComponent Guide](../core-concepts/light-components.md)** to learn about Light DOM component development
- Check out the **[JSX Support Documentation](../core-concepts/jsx-support.md)** for more advanced usage
