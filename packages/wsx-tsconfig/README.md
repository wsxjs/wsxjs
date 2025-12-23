# @wsxjs/wsx-tsconfig

Shared TypeScript configuration for WSXJS projects.

## Installation

```bash
npm install --save-dev @wsxjs/wsx-tsconfig
```

## Usage

### Basic Setup

Extend the base configuration in your `tsconfig.json`:

```json
{
  "extends": "@wsxjs/wsx-tsconfig/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

### With Build Output

If you need to emit declaration files:

```json
{
  "extends": "@wsxjs/wsx-tsconfig/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

### Development Only (No Emit)

For development projects that don't need to emit files:

```json
{
  "extends": "@wsxjs/wsx-tsconfig/tsconfig.json",
  "include": ["src/**/*"]
}
```

## What's Included

The base configuration includes:

- ✅ **JSX Support**: `jsx: "react-jsx"` with `jsxImportSource: "@wsxjs/wsx-core"`
- ✅ **Decorator Support**: `experimentalDecorators: true` and `useDefineForClassFields: false` (required for `@state` decorator)
- ✅ **Modern ES Features**: ES2020 target with ESNext modules
- ✅ **Type Safety**: Strict mode enabled with additional checks
- ✅ **WSX Types**: Automatically includes `@wsxjs/wsx-core` types

## Configuration Details

### Required Options for @state Decorator

The configuration includes these critical options for `@state` decorator support:

```json
{
  "experimentalDecorators": true,
  "useDefineForClassFields": false
}
```

**Important**: Without these options, the `@state` decorator will not work correctly.

## Examples

### Vite Project

```json
{
  "extends": "@wsxjs/wsx-tsconfig/tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src/**/*", "src/**/*.wsx"]
}
```

### Library Package

```json
{
  "extends": "@wsxjs/wsx-tsconfig/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules", "**/__tests__/**"]
}
```

### Test Configuration

```json
{
  "extends": "@wsxjs/wsx-tsconfig/tsconfig.base.json",
  "compilerOptions": {
    "types": [
      "@wsxjs/wsx-core",
      "@testing-library/jest-dom",
      "vitest/globals"
    ]
  },
  "include": ["src/**/*", "src/**/*.test.ts"]
}
```

## Related Packages

- [`@wsxjs/wsx-core`](../core) - Core WSXJS
- [`@wsxjs/wsx-vite-plugin`](../vite-plugin) - Vite plugin (required for `@state` decorator)

## License

MIT

