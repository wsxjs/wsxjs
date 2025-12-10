# RFC 0007: Reactive Decorator for TypeScript

## Summary

Add a `@state` property decorator to automatically generate reactive code for `WebComponent` and `LightComponent`. `WebComponent` and `LightComponent` already have `reactive()` and `useState()` methods built-in. The `@state` decorator is processed by a Babel plugin at compile time, eliminating the need for manual `this.reactive()` and `this.useState()` calls.

## Motivation

Previously, using reactive state required manual setup:

```typescript
class Counter extends WebComponent {
    private state = this.reactive({ count: 0 });
    private [getCount, setCount] = this.useState("count", 0);
    
    render() {
        return <div>{this.state.count}</div>;
    }
}
```

With the `@state` decorator, it becomes:

```typescript
class Counter extends WebComponent {
    @state private count = 0;
    
    render() {
        return <div>{this.count}</div>;
    }
}
```

## Design

### Built-in Reactive Methods

- **WebComponent** and **LightComponent** now have `reactive()` and `useState()` methods built-in
- No need for `@reactive` class decorator or `ReactiveWebComponent`
- Methods are always available for manual use or automatic initialization via `@state`

### Property Decorator: `@state`

- **Purpose**: Marks a property as reactive state, processed by Babel plugin at compile time
- **Supported Classes**: `WebComponent` and `LightComponent`
- **Types Supported**:
  - Primitive values: `@state private count = 0`
  - Objects: `@state private user = { name: "John" }`
  - Arrays: `@state private items = []`
- **Behavior**:
  - Babel plugin detects `@state` decorator and extracts initial value from AST
  - Generates initialization code in constructor: `this.state = this.reactive(...)` for objects/arrays
  - Generates `useState()` initialization for primitives
  - Removes `@state` decorator from output code
  - Maintains full type safety

## Implementation Strategy

### Babel Plugin for Compile-Time Transformation

We use a custom Babel plugin (`babel-plugin-wsx-state`) to transform `@state` decorators at compile time:

```typescript
// Before transformation (source code)
class Counter extends WebComponent {
    @state private count = 0;
    @state private user = { name: "John" };
}

// After Babel transformation (generated code)
class Counter extends WebComponent {
    private count;
    private user;
    
    constructor() {
        super();
        // ... existing constructor code ...
        
        // Babel-generated initialization code (inserted at end of constructor)
        const [_getcount, _setcount] = this.useState("count", 0);
        Object.defineProperty(this, "count", {
            get: _getcount,
            set: _setcount,
            enumerable: true,
            configurable: true,
        });
        
        this.user = this.reactive({ name: "John" });
    }
}
```

**Key Benefits**:
- ✅ Pure compile-time transformation - zero runtime overhead
- ✅ No metadata storage needed
- ✅ Works with any build tool that supports Babel
- ✅ Type-safe and maintainable

## API Design

### Basic Usage

**With WebComponent + @state (recommended):**
```typescript
import { WebComponent, state, autoRegister } from '@wsxjs/wsx-core';

@autoRegister()
export class Counter extends WebComponent {
    @state private count = 0;  // Auto-initialized by Babel plugin
    @state private step = 1;   // Auto-initialized by Babel plugin
    
    render() {
        return (
            <div>
                <p>Count: {this.count}</p>
                <button onClick={() => this.count += this.step}>
                    Increment
                </button>
            </div>
        );
    }
}
```

**With LightComponent + @state:**
```typescript
import { LightComponent, state, autoRegister } from '@wsxjs/wsx-core';

@autoRegister()
export class Counter extends LightComponent {
    @state private count = 0;  // Auto-initialized by Babel plugin
    @state private step = 1;   // Auto-initialized by Babel plugin
    
    render() {
        return (
            <div>
                <p>Count: {this.count}</p>
                <button onClick={() => this.count += this.step}>
                    Increment
                </button>
            </div>
        );
    }
}
```

**Manual approach (still works):**
```typescript
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister()
export class Counter extends WebComponent {
    private state = this.reactive({ count: 0, step: 1 });  // Manual
    
    render() {
        return (
            <div>
                <p>Count: {this.state.count}</p>
                <button onClick={() => this.state.count += this.state.step}>
                    Increment
                </button>
            </div>
        );
    }
}
```

### Object State

```typescript
export class UserProfile extends WebComponent {
    @state private user = {
        name: "John",
        age: 30,
        email: "john@example.com"
    };
    
    render() {
        return (
            <div>
                <p>Name: {this.user.name}</p>
                <p>Age: {this.user.age}</p>
            </div>
        );
    }
}
```

### Mixed State Types

```typescript
export class ComplexComponent extends WebComponent {
    @state private count = 0;  // Primitive -> useState
    @state private user = { name: "John" };  // Object -> reactive
    @state private items: string[] = [];  // Array -> reactive
    
    render() {
        return (
            <div>
                <p>Count: {this.count}</p>
                <p>User: {this.user.name}</p>
                <p>Items: {this.items.length}</p>
            </div>
        );
    }
}
```

## Type Safety

The decorator maintains full TypeScript type safety:

```typescript
class Counter extends WebComponent {
    @state private count: number = 0;  // Type is preserved
    
    increment() {
        this.count++;  // TypeScript knows this is a number
        // this.count = "string";  // Type error!
    }
}
```

## Constraints

1. **Only for Reactive Components**: 
   - Must extend `WebComponent` or `LightComponent`
   - `WebComponent` and `LightComponent` already have `reactive()` and `useState()` methods

2. **Property Initialization**:
   - `@state` properties must have initial values
   - Cannot be used with `undefined` or optional properties
   - Initial values are required for Babel plugin to extract from AST

3. **Build Tool Requirements**:
   - Babel plugin must be configured in `vite.config.ts` (via `@wsxjs/wsx-vite-plugin`)
   - `experimentalDecorators: true` in `tsconfig.json`
   - `useDefineForClassFields: false` in `tsconfig.json` (for decorator compatibility)

4. **Read-only Properties**:
   - Can support `@state readonly` for immutable state

## Implementation Details

### TypeScript Configuration

Requires:
- `experimentalDecorators: true` (for decorator syntax)
- `useDefineForClassFields: false` (critical for decorator compatibility)

### Build Tool Compatibility

#### The Solution: Babel Plugin for Compile-Time Transformation

**Architecture**: We use a custom Babel plugin to transform `@state` decorators at compile time, before esbuild processes the code.

**Why Babel?**:
- esbuild has limited decorator support (no type system, no metadata)
- Babel has full decorator support and can transform code before esbuild
- Pure compile-time transformation - zero runtime overhead
- Works with any build tool that supports Babel

**How It Works**:
1. **Babel Plugin** (`babel-plugin-wsx-state`) runs first (via `enforce: "pre"` in Vite)
2. Detects `@state` decorators on class properties
3. Extracts initial values from AST
4. Generates initialization code in constructor:
   - Objects/Arrays: `this.state = this.reactive({ ... })`
   - Primitives: `const [get, set] = this.useState("key", value); Object.defineProperty(...)`
5. Removes `@state` decorator from output
6. **esbuild** then processes JSX transformation (decorators already removed)

**Key Implementation Details**:
```typescript
// Babel plugin transforms:
@state private count = 0;
@state private user = { name: "John" };

// Into:
private count;
private user;

constructor() {
    super();
    // ... existing code ...
    
    // Generated at end of constructor:
    const [_getcount, _setcount] = this.useState("count", 0);
    Object.defineProperty(this, "count", { get: _getcount, set: _setcount, ... });
    this.user = this.reactive({ name: "John" });
}
```

**Benefits**:
- ✅ Pure compile-time transformation - zero runtime overhead
- ✅ Works with esbuild (Vite's default)
- ✅ No metadata storage needed
- ✅ No runtime fallback needed
- ✅ Maintains full type safety
- ✅ Clean generated code

### Required Build Configuration

#### For Vite Projects

**vite.config.ts**:
```typescript
import { defineConfig } from "vite";
import { wsx } from "@wsxjs/wsx-vite-plugin";

export default defineConfig({
    plugins: [
        wsx({
            jsxFactory: "h",
            jsxFragment: "Fragment",
        }),
    ],
    // No esbuild decorator config needed - Babel plugin handles it
});
```

**tsconfig.json**:
```json
{
    "compilerOptions": {
        "experimentalDecorators": true,
        "useDefineForClassFields": false
    }
}
```

#### Vite Plugin Architecture

The `@wsxjs/wsx-vite-plugin` uses Babel to preprocess decorators:

1. **Babel Plugin** (`babel-plugin-wsx-state`) runs first:
   - Processes `@state` decorators
   - Generates initialization code
   - Removes decorators from output

2. **esbuild** then processes JSX:
   - Only handles JSX transformation
   - No decorator processing needed

**Plugin Order**:
```typescript
// In vite-plugin-wsx-babel.ts
plugins: [
    babelPluginWSXState,  // Custom plugin - runs FIRST
    "@babel/plugin-proposal-decorators",  // Standard decorators
    "@babel/plugin-proposal-class-properties",
    // ... then esbuild for JSX
]
```

### Compile-Time Support

- Babel plugin extracts initial values from AST
- Generates initialization code in constructor
- Removes decorators from output
- Zero runtime overhead
- Full type safety maintained

## Alternatives Considered

1. **Macro System**: Use a macro preprocessor (like Babel macros)
2. **Code Generation**: Generate code from annotations
3. **Manual Setup**: Keep current manual approach

## Migration Path

Existing code continues to work. New code can opt-in to `@state` decorator:

```typescript
// Old way (still works)
class Counter extends WebComponent {
    private state = this.reactive({ count: 0 });
}

// New way (recommended)
class Counter extends WebComponent {
    @state private count = 0;  // Babel plugin auto-initializes
}
```

**Note**: `@reactive` class decorator is no longer needed. `WebComponent` and `LightComponent` already have `reactive()` and `useState()` methods built-in.

## Testing

- Unit tests for `@state` decorator validation
- Integration tests with actual components
- Type safety tests
- Performance benchmarks
- **Babel plugin tests**: Verify decorator transformation generates correct code
- **Build tool compatibility tests**: Verify Babel plugin works correctly with Vite

## Future Enhancements

1. **Computed Properties**: `@computed` decorator for derived state
2. **Watchers**: `@watch` decorator for side effects
3. **State Persistence**: `@persist` decorator for localStorage

## Compilation Issues and Solutions

### Problem Summary

When using esbuild (Vite's default bundler), TypeScript decorators may not work correctly:

- **Symptom**: `@state decorator: Cannot access property descriptor for property "...". Target (class prototype) is undefined.`
- **Root Cause**: esbuild doesn't fully support TypeScript decorators because it doesn't implement the type system
- **Impact**: Decorators execute with `target === undefined`, preventing proper processing

### Solution Architecture

We use a **Babel plugin** to preprocess decorators before esbuild:

1. **Babel Plugin** (`babel-plugin-wsx-state`) runs first:
   - Detects `@state` decorators in AST
   - Extracts initial values from AST
   - Generates initialization code in constructor
   - Removes decorators from output

2. **esbuild** then processes JSX:
   - Only handles JSX transformation
   - No decorator processing needed (already removed by Babel)

**Benefits**:
- ✅ Pure compile-time transformation
- ✅ Zero runtime overhead
- ✅ No metadata storage needed
- ✅ Works with esbuild limitations
- ✅ Clean generated code

### Configuration Checklist

To ensure decorators work correctly, verify these settings:

**✅ tsconfig.json**:
```json
{
    "compilerOptions": {
        "experimentalDecorators": true,
        "useDefineForClassFields": false
    }
}
```

**✅ vite.config.ts** (for Vite projects):
```typescript
import { defineConfig } from "vite";
import { wsx } from "@wsxjs/wsx-vite-plugin";

export default defineConfig({
    plugins: [
        wsx({
            jsxFactory: "h",
            jsxFragment: "Fragment",
        }),
    ],
    // No esbuild decorator config needed
});
```

**✅ Package-specific configs**:
- `packages/examples/vite.config.ts` - ✅ Configured
- `packages/base-components/vite.config.ts` - ✅ Configured

### Troubleshooting

**Issue**: `target is undefined` error
- **Check**: Babel plugin must be configured in `vite.config.ts`
- **Solution**: Ensure `@wsxjs/wsx-vite-plugin` is installed and configured

**Issue**: Properties not being initialized
- **Check**: Properties must have initial values (e.g., `@state private count = 0`)
- **Check**: Babel plugin must run before other decorator plugins
- **Solution**: Verify Babel plugin order in `vite-plugin-wsx-babel.ts`

**Issue**: Decorators work in tests but not in browser
- **Check**: Vite plugin configuration
- **Check**: Babel plugin is processing `.wsx` files
- **Solution**: Check browser console for Babel plugin debug logs

## Summary of Changes

### Current Design (v2)

- ✅ `WebComponent` and `LightComponent` have `reactive()` and `useState()` methods built-in
- ✅ Only `@state` property decorator is needed (no `@reactive` class decorator)
- ✅ Babel plugin handles all `@state` transformation at compile time
- ✅ Zero runtime overhead - pure compile-time transformation
- ✅ No metadata storage or fallback logic needed
- ✅ Cleaner, simpler architecture

### Previous Design (v1 - Deprecated)

- ❌ Required `@reactive` class decorator
- ❌ Runtime fallback mechanism for esbuild compatibility
- ❌ Metadata storage in WeakMap
- ❌ More complex implementation

## References

- TypeScript Decorators: https://www.typescriptlang.org/docs/handbook/decorators.html
- Babel Decorators Plugin: https://babeljs.io/docs/babel-plugin-proposal-decorators
- React Hooks Pattern: https://react.dev/reference/react
- Vue 3 Composition API: https://vuejs.org/api/composition-api-setup.html
- esbuild Decorator Limitations: https://esbuild.github.io/content-types/#decorators
- TypeScript useDefineForClassFields: https://www.typescriptlang.org/tsconfig#useDefineForClassFields

