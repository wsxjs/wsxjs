---
title: WSXJS JSX Support Documentation
order: 3
category: guide/core-concepts
description: "WSXJS provides complete JSX support without relying on React or other frameworks. Through framework-level configuration, any project using WSX can get out-of-the-box JSX experience."
---

## Overview

WSXJS provides complete JSX support without relying on React or other frameworks. Through framework-level configuration, any project using WSX can get out-of-the-box JSX experience.

## Core Features

- ✅ **Zero React Dependency**: Completely independent JSX implementation
- ✅ **Framework-level Support**: No additional configuration needed in consumer projects
- ✅ **TypeScript Native Support**: Complies with TypeScript standard mechanisms
- ✅ **IDE Friendly**: Complete type hints and error checking
- ✅ **Web Components Integration**: Perfect integration with custom elements

## Technical Architecture

### JSX Factory Function

WSXJS uses pure native JSX factory functions:

```typescript
// JSX factory function
export function h(
    tag: string | ((...args: unknown[]) => HTMLElement),
    props?: Record<string, unknown> | null,
    ...children: JSXChildren[]
): HTMLElement

// JSX Fragment
export function Fragment(_props: unknown, children: JSXChildren[]): DocumentFragment
```

### Type System

The framework provides complete TypeScript type support:

```typescript
// Global JSX namespace
declare global {
    namespace JSX {
        interface IntrinsicElements {
            div: any;
            button: any;
            a: any;
            span: any;
            input: any;
            p: any;
            h1: any;
            h2: any;
            h3: any;
            ul: any;
            li: any;
            section: any;
            slot: any;
            // Supports any HTML element
            [elemName: string]: any;
        }
    }
}
```

## Configuration Guide

### 1. TypeScript Configuration

Add the following configuration to your project's `tsconfig.json`:

```json
{
    "compilerOptions": {
        "jsx": "react-jsx",
        "jsxImportSource": "@wsxjs/wsx-core/jsx"
    }
}
```

### 2. Vite Configuration

WSXJS provides a dedicated Vite plugin:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { wsx } from '@wsxjs/wsx-vite-plugin';

export default defineConfig({
    plugins: [
        wsx({
            jsxFactory: 'h',
            jsxFragment: 'Fragment',
            debug: false
        })
    ]
});
```

### 3. ESLint Configuration

Use WSX-specific ESLint plugin:

```javascript
// eslint.config.js
import wsxPlugin from '@wsxjs/eslint-plugin-wsx';

export default [
    {
        files: ['**/*.{ts,tsx,js,jsx,wsx}'],
        languageOptions: {
            parserOptions: {
                jsxPragma: 'h',
                jsxFragmentName: 'Fragment'
            }
        },
        plugins: {
            wsx: wsxPlugin
        },
        rules: {
            'wsx/no-react-imports': 'error',
            'wsx/render-method-required': 'error',
            'wsx/web-component-naming': 'warn'
        }
    }
];
```

## Usage

### Basic JSX Syntax

```typescript
// Button.wsx
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister({ tagName: 'wsx-button' })
export default class Button extends WebComponent {
    render(): HTMLElement {
        return (
            <div className="button-container">
                <button 
                    className="btn"
                    onClick={(e) => this.handleClick(e)}
                    ref={(el) => this.buttonRef = el}
                >
                    <slot />
                </button>
            </div>
        );
    }
}
```

### Event Handling

```typescript
render(): HTMLElement {
    return (
        <button
            onClick={(event: Event) => this.handleClick(event)}
            onMouseDown={(event: MouseEvent) => this.handleMouseDown(event)}
            onKeyDown={(event: KeyboardEvent) => this.handleKeyDown(event)}
        >
            Click me
        </button>
    );
}
```

### Ref Callbacks

```typescript
render(): HTMLElement {
    return (
        <div>
            <input 
                ref={(el: HTMLInputElement) => this.inputRef = el}
                type="text"
            />
            <button 
                ref={(el: HTMLButtonElement) => this.buttonRef = el}
            >
                Submit
            </button>
        </div>
    );
}
```

### Conditional Rendering

```typescript
render(): HTMLElement {
    const { loading, disabled } = this;
    
    return (
        <div className="container">
            {loading && <div className="loading">Loading...</div>}
            {!loading && (
                <button disabled={disabled}>
                    <slot />
                </button>
            )}
        </div>
    );
}
```

### List Rendering

```typescript
render(): HTMLElement {
    const items = ['Item 1', 'Item 2', 'Item 3'];
    
    return (
        <ul className="list">
            {items.map((item, index) => (
                <li key={index} className="list-item">
                    {item}
                </li>
            ))}
        </ul>
    );
}
```

## Framework Internal Implementation

### JSX Entry Point

WSXJS creates a dedicated JSX entry point:

```typescript
// packages/core/src/jsx.ts
declare global {
    namespace JSX {
        interface IntrinsicElements {
            // HTML element type definitions
        }
    }
}

export { h, Fragment } from './jsx-factory';
```

### Package Export Configuration

```json
// packages/core/package.json
{
    "exports": {
        ".": {
            "types": "types/index.d.ts",
            "import": "./dist/index.mjs",
            "require": "./dist/index.js"
        },
        "./jsx": {
            "types": "types/jsx.d.ts",
            "import": "./dist/jsx.mjs",
            "require": "./dist/jsx.js"
        }
    }
}
```

## Best Practices

### 1. Type Safety

```typescript
// Use specific types instead of any
render(): HTMLElement {
    return (
        <button
            ref={(el: HTMLButtonElement) => this.buttonRef = el}
            onClick={(e: MouseEvent) => this.handleClick(e)}
        >
            Click me
        </button>
    );
}
```

### 2. Event Handling

```typescript
// Use arrow functions to bind this
private handleClick = (event: MouseEvent): void => {
    console.log('Button clicked', event);
};
```

### 3. Component Composition

```typescript
// Use slot for component composition
render(): HTMLElement {
    return (
        <div className="card">
            <header className="card-header">
                <slot name="header" />
            </header>
            <main className="card-body">
                <slot />
            </main>
            <footer className="card-footer">
                <slot name="footer" />
            </footer>
        </div>
    );
}
```

## Troubleshooting

### Common Issues

1. **"React in scope" Error**
   - Ensure `jsxImportSource` is configured correctly
   - Restart TypeScript language server
   - Check if packages are correctly installed

2. **Type Errors**
   - Ensure correct type annotations are used
   - Check if JSX namespace is correctly loaded

3. **Build Errors**
   - Ensure Vite plugin is configured correctly
   - Check if file extension is `.wsx`

### Debugging Tips

```typescript
// Enable Vite plugin debugging
wsx({
    debug: true,
    jsxFactory: 'h',
    jsxFragment: 'Fragment'
})
```

## Migration Guide

### From React

1. Remove React imports
2. Change `jsxImportSource` to `"@wsxjs/wsx-core/jsx"`
3. Use WSX's `h` and `Fragment` functions
4. Update event handler types

### From Other Frameworks

1. Configure TypeScript JSX settings
2. Install WSX related packages
3. Configure build tools
4. Update component syntax

## Summary

WSXJS's JSX support provides:

- **Zero-config Experience**: Out-of-the-box JSX support
- **Type Safety**: Complete TypeScript type system
- **Performance Optimization**: Native DOM operations, no virtual DOM overhead
- **Web Components Integration**: Perfect integration with custom elements
- **Developer Experience**: IDE-friendly type hints and error checking

Through framework-level implementation, developers can focus on business logic without worrying about the complexity of JSX configuration.
