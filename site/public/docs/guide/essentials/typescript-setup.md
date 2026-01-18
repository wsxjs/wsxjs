---
title: TypeScript Configuration Guide
order: 2
category: guide/essentials
description: "This guide details how to correctly configure TypeScript in your project to use WSXJS."
---

This guide details how to correctly configure TypeScript in your project to use WSXJS.

## 📋 Table of Contents

- [Basic Configuration](#basic-configuration)
- [Complete Configuration Examples](#complete-configuration-examples)
- [Type Reference Mechanism](#type-reference-mechanism)
- [Best Practices](#best-practices)
- [Common Issues](#common-issues)

## Basic Configuration

### 1. JSX Configuration

Configure JSX support in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@wsxjs/wsx-core"
  }
}
```

**Configuration Notes**:
- **`jsx: "react-jsx"`** - Use the new JSX transform (introduced in React 17+)
- **`jsxImportSource: "@wsxjs/wsx-core"`** - Specify JSX runtime source as WSXJS

### 2. Type Reference Configuration

To get complete type support, add the type package to `compilerOptions.types`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@wsxjs/wsx-core",
    "types": ["@wsxjs/wsx-core"]
  }
}
```

**Configuration Notes**:
- **`types: ["@wsxjs/wsx-core"]`** - Explicitly reference WSXJS type definitions
- TypeScript will automatically load `@wsxjs/wsx-core/types/index.d.ts`
- This ensures JSX global types and component types are correctly loaded

### 3. Test Library Types (Optional)

If using `@testing-library/jest-dom` for testing, also add it to the `types` array:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@wsxjs/wsx-core",
    "types": ["@wsxjs/wsx-core", "@testing-library/jest-dom"]
  }
}
```

## Complete Configuration Examples

### Production Project Configuration

```json
{
  "compilerOptions": {
    // Output configuration
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "outDir": "./dist",

    // JSX configuration
    "jsx": "react-jsx",
    "jsxImportSource": "@wsxjs/wsx-core",

    // Type references
    "types": ["@wsxjs/wsx-core"],

    // Module resolution
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,

    // Strict mode
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    // Other
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Test Environment Configuration

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@wsxjs/wsx-core",
    "types": [
      "@wsxjs/wsx-core",
      "@testing-library/jest-dom",
      "vitest/globals"
    ]
  },
  "include": [
    "src/**/*",
    "src/**/*.test.ts"
  ]
}
```

### Monorepo Workspace Configuration

In a monorepo, avoid using relative paths to reference type files:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@wsxjs/wsx-core",
    "types": ["@wsxjs/wsx-core"]
  },
  "include": [
    "src/**/*",
    "src/**/*.wsx"
  ]
}
```

**❌ Don't do this**:
```json
{
  "include": [
    "src/**/*",
    "../core/types/**/*.d.ts"  // ❌ Avoid relative paths
  ]
}
```

**✅ Correct approach**:
- Rely on `compilerOptions.types` configuration
- Let TypeScript automatically resolve types through `node_modules`
- This configuration works in both monorepo internal and external projects

## Type Reference Mechanism

### How TypeScript Loads Types

When you configure `@wsxjs/wsx-core` in `compilerOptions.types`:

1. TypeScript looks for `node_modules/@wsxjs/wsx-core/package.json`
2. Reads the `types` field value: `"./types/index.d.ts"`
3. Loads the corresponding type definition file
4. This process works in both monorepo (via workspace links) and external projects

### Type Definition File Hierarchy

```
@wsxjs/wsx-core/
├── package.json
│   └── "types": "./types/index.d.ts"
├── types/
│   ├── index.d.ts          # Main entry, imports all types
│   ├── wsx-types.d.ts      # JSX global type definitions
│   ├── global.d.ts         # Global type extensions
│   └── css-inline.d.ts     # CSS module declarations
└── src/
    └── ...
```

`types/index.d.ts` content example:
```typescript
// Import all type definitions
import "./css-inline.d.ts";
import "./wsx-types";
import "./global.d.ts";

// Re-export JSX factory functions and types
export { h, Fragment } from "./wsx-types";
export type { JSXChildren } from "../src/jsx-factory";

// Export other core types...
```

### Why Triple-Slash Directives Are Not Needed

**❌ Not recommended** (using triple-slash directives):
```typescript
// global.d.ts
/// <reference types="@wsxjs/wsx-core/types/wsx-types" />
/// <reference types="@testing-library/jest-dom" />
```

**✅ Recommended approach** (using tsconfig.json):
```json
{
  "compilerOptions": {
    "types": ["@wsxjs/wsx-core", "@testing-library/jest-dom"]
  }
}
```

**Reasons**:
1. **Centralized management**: All type configuration in `tsconfig.json`, easy to maintain
2. **Standardization**: Complies with TypeScript official recommendations
3. **Avoid redundancy**: No need to repeat declarations in multiple files
4. **Better IDE support**: IDE can better understand and parse configuration

## Best Practices

### 1. Use Standard TypeScript Type Resolution

**✅ Recommended**:
```json
{
  "compilerOptions": {
    "types": ["@wsxjs/wsx-core"]
  }
}
```

**❌ Avoid**:
- Triple-slash directives: `/// <reference types="..." />`
- Relative path references: `"../core/types/**/*.d.ts"`
- Manual type imports: `import '@wsxjs/wsx-core/types/wsx-types'`

### 2. Separate Production and Test Configuration

Create `tsconfig.test.json` for test environment:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": [
      "@wsxjs/wsx-core",
      "@testing-library/jest-dom",
      "vitest/globals"
    ]
  },
  "include": [
    "src/**/*.test.ts",
    "src/**/__tests__/**/*"
  ]
}
```

### 3. Keep global.d.ts Concise

`global.d.ts` should only contain:
- Module declarations (such as CSS, image imports)
- Project-specific global type extensions

```typescript
// global.d.ts - Recommended content

// CSS module declarations
declare module "*.css" {
  const styles: string;
  export default styles;
}

declare module "*.css?inline" {
  const styles: string;
  export default styles;
}

// Image module declarations
declare module "*.png" {
  const src: string;
  export default src;
}

// Project-specific global type extensions
declare global {
  namespace Vi {
    type Assertion<T = any> = jest.Matchers<void, T>;
  }
}

export {};
```

### 4. File Include Configuration

**Recommended `include` configuration**:
```json
{
  "include": [
    "src/**/*",
    "src/**/*.wsx",
    "src/**/*.test.ts"
  ]
}
```

**Avoid**:
- Including `node_modules`
- Including build output directories
- Using monorepo-specific relative paths

## Common Issues

### 1. IDE Error: "This JSX tag requires 'React' to be in scope"

**Solution**:

1. Ensure `jsxImportSource` is configured correctly:
   ```json
   {
     "compilerOptions": {
       "jsx": "react-jsx",
       "jsxImportSource": "@wsxjs/wsx-core"
     }
   }
   ```

2. Add JSX pragma comment at the top of `.wsx` files (optional):
   ```typescript
   /** @jsxImportSource @wsxjs/wsx-core */
   import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
   ```

3. Restart TypeScript language server:
   - VS Code: `Cmd+Shift+P` → "TypeScript: Restart TS Server"
   - Or restart IDE

### 2. Cannot Find JSX Type Definitions

**Issue**: TypeScript reports cannot find JSX types.

**Solution**:

1. Confirm `@wsxjs/wsx-core` is installed:
   ```bash
   npm list @wsxjs/wsx-core
   ```

2. Confirm `types` configuration is correct:
   ```json
   {
     "compilerOptions": {
       "types": ["@wsxjs/wsx-core"]
     }
   }
   ```

3. Clean and reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### 3. Cannot Find `@testing-library/jest-dom` Types in Test Files

**Issue**: Test assertion methods (such as `toBeInTheDocument`) report type errors.

**Solution**:

1. Confirm package is installed:
   ```bash
   npm install -D @testing-library/jest-dom
   ```

2. Add types in `tsconfig.json` or `tsconfig.test.json`:
   ```json
   {
     "compilerOptions": {
       "types": [
         "@wsxjs/wsx-core",
         "@testing-library/jest-dom"
       ]
     }
   }
   ```

3. Don't use triple-slash directives, let TypeScript automatically load.

### 4. Types Not Found in Monorepo

**Issue**: In monorepo workspace, TypeScript cannot find package types.

**Solution**:

1. Confirm workspace links are correct:
   ```bash
   pnpm install  # or npm install
   ```

2. **Avoid** using relative path references:
   ```json
   // ❌ Wrong
   {
     "include": ["../core/types/**/*.d.ts"]
   }
   ```

3. **Use** standard package references:
   ```json
   // ✅ Correct
   {
     "compilerOptions": {
       "types": ["@wsxjs/wsx-core"]
     }
   }
   ```

4. If using pnpm, confirm `.npmrc` configuration is correct:
   ```ini
   shamefully-hoist=false
   strict-peer-dependencies=false
   ```

### 5. Cannot Find Type Declarations for `.wsx` Files

**Issue**: Error "Cannot find module" when importing `.wsx` files.

**Solution**:

1. Confirm `global.d.ts` has `.wsx` module declaration:
   ```typescript
   // This declaration is already provided in @wsxjs/wsx-core
   // Usually no need to manually add
   ```

2. Confirm `include` includes `.wsx` files:
   ```json
   {
     "include": [
       "src/**/*",
       "src/**/*.wsx"
     ]
   }
   ```

3. Check if Vite plugin configuration is correct:
   ```typescript
   // vite.config.ts
   import { wsx } from '@wsxjs/wsx-vite-plugin';

   export default defineConfig({
     plugins: [wsx()]
   });
   ```

### 6. External Project Integration with WSXJS

**Issue**: Integrating WSX in a new project, don't know how to configure.

**Complete Steps**:

1. **Install dependencies**:
   ```bash
   npm install @wsxjs/wsx-core
   npm install -D @wsxjs/wsx-vite-plugin typescript
   ```

2. **Configure `tsconfig.json`**:
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "ESNext",
       "lib": ["ES2020", "DOM"],
       "jsx": "react-jsx",
       "jsxImportSource": "@wsxjs/wsx-core",
       "types": ["@wsxjs/wsx-core"],
       "moduleResolution": "bundler",
       "strict": true,
       "skipLibCheck": true
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist"]
   }
   ```

3. **Configure `vite.config.ts`**:
   ```typescript
   import { defineConfig } from 'vite';
   import { wsx } from '@wsxjs/wsx-vite-plugin';

   export default defineConfig({
     plugins: [wsx()]
   });
   ```

4. **Create component**:
   ```typescript
   // src/components/MyButton.wsx
   /** @jsxImportSource @wsxjs/wsx-core */
   import { WebComponent, autoRegister } from '@wsxjs/wsx-core';

   @autoRegister()
   export class MyButton extends WebComponent {
     render() {
       return <button>Click me</button>;
     }
   }
   ```

5. **Use component**:
   ```html
   <!-- index.html -->
   <my-button></my-button>
   <script type="module" src="/src/main.ts"></script>
   ```

## Debugging Tips

### View TypeScript Resolved Type Paths

```bash
# Use tsc's --showConfig option
npx tsc --showConfig

# View type resolution details
npx tsc --traceResolution > trace.log
```

### Verify Type Definition Loading

In TypeScript files:

```typescript
// Test if JSX types are correctly loaded
const testJSX: JSX.Element = <div>Test</div>;

// Test if WebComponent types are correctly loaded
import { WebComponent } from '@wsxjs/wsx-core';
const testComponent: typeof WebComponent = WebComponent;
```

If there are no type errors, the configuration is correct.

## Summary

### ✅ Recommended Configuration Approach

1. Configure `jsx` and `jsxImportSource` in `tsconfig.json`
2. Explicitly reference `@wsxjs/wsx-core` in `compilerOptions.types`
3. Let TypeScript automatically resolve type definitions through `node_modules`
4. Keep `global.d.ts` concise, only put module declarations and project-specific types
5. Avoid using triple-slash directives and relative paths

### ❌ Practices to Avoid

1. Using triple-slash directives to reference types
2. Using monorepo relative paths in `include`
3. Manually importing type definition files
4. Repeating type references in multiple places

### 📚 Related Documentation

- [Quick Start Guide](./getting-started.md) - Get started with WSXJS in 5 minutes
- [JSX Support Details](../core-concepts/jsx-support.md) - Complete JSX syntax and features
- [Vite Plugin Documentation](../packages/vite-plugin/README.md) - Vite integration configuration
- [ESLint Plugin Documentation](../packages/eslint-plugin/README.md) - Code quality checking

---

**Need help?** If you encounter configuration issues, please check the [Common Issues](#common-issues) section or ask questions on [GitHub Issues](https://github.com/wsxjs/wsxjs/issues).
