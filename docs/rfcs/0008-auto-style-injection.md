# RFC 0008: Automatic Style Injection for WSX Components

## Summary

Add automatic CSS style injection for WSX components. When a component file `A.wsx` exists, automatically detect and inject the corresponding `A.css` file, eliminating the need for manual `import styles from "./A.css?inline"` and constructor boilerplate. Styles are injected as a class property `private _autoStyles = styles;`, and base classes automatically detect and use it.

## Motivation

Currently, using CSS styles with WSX components requires manual steps:

```typescript
// ReactiveCounter.wsx
import { WebComponent } from "@wsxjs/wsx-core";
import styles from "./ReactiveCounter.css?inline";  // Manual import

export default class ReactiveCounter extends WebComponent {
    constructor() {
        super({ styles });  // Manual injection
    }
    // ...
}
```

With automatic style injection, it becomes:

```typescript
// ReactiveCounter.wsx
import { WebComponent } from "@wsxjs/wsx-core";
// No manual import needed - automatically injected by Babel plugin

export default class ReactiveCounter extends WebComponent {
    constructor() {
        super();  // Styles automatically injected
    }
    // ...
}
```

**Benefits**:
- ✅ Less boilerplate code
- ✅ Consistent naming convention (`A.wsx` → `A.css`)
- ✅ Reduced chance of errors (forgetting to import styles)
- ✅ Better developer experience
- ✅ Works seamlessly with existing Babel plugin infrastructure

## Design

### Automatic Detection Rules

**Core Principle**: If `A.css` exists, styles **MUST** be injected, regardless of constructor presence or structure. The injection should never break existing code.

**Better Approach**: Since we have Babel plugin, we can inject styles as a class property instead of modifying constructor calls.

1. **File Matching**: For a component file `A.wsx`, look for `A.css` in the same directory
2. **Import Injection**: If `A.css` exists, automatically add `import styles from "./A.css?inline";` (unless already imported)
3. **Class Property Injection** (only if CSS file exists):
   - Add class property: `private _autoStyles = styles;`
   - No need to modify constructor calls at all!
   - Base classes (`WebComponent`/`LightComponent`) will automatically detect and use `_autoStyles`
   - **Manual styles import detected**: Skip auto-injection to avoid duplication

### Component Types Supported

- **WebComponent**: Styles injected as class property `private _autoStyles = styles;`, auto-detected in constructor
- **LightComponent**: Styles injected as class property `private _autoStyles = styles;`, auto-detected in `connectedCallback`
- Both use the same mechanism, handled by `BaseComponent`

**Note**: Constructor is **not required** by the base classes (they have default constructors), but:
- If CSS file exists, auto-injection will create/modify constructor to pass styles
- If using `@state` decorator, Babel plugin also injects code in constructor
- In practice, most components will have a constructor after transformation

### Implementation Strategy

Use a **Babel plugin** (`babel-plugin-wsx-style`) to transform code at compile time:

1. **Detection Phase**: 
   - Process `.wsx` files
   - Check if corresponding `.css` file exists in the same directory
   - Use Vite's `resolveId` to check file existence

2. **Transformation Phase** (only if CSS file exists):
   - **Always inject CSS import** (unless already present): Add `import styles from "./A.css?inline";`
   - **Class property injection** (much simpler!):
     - Add class property: `private _autoStyles = styles;`
     - No constructor modification needed at all!
     - Base classes will automatically detect `_autoStyles` and use it
     - If styles already manually imported: Skip all injection to avoid duplication

3. **Integration**:
   - Run before `babel-plugin-wsx-state` (style injection should happen first)
   - Work with existing Vite plugin infrastructure

## Implementation Details

### Babel Plugin: `babel-plugin-wsx-style`

**Plugin Order**: Must run **before** `babel-plugin-wsx-state` to ensure styles are available when state initialization happens.

**Transformation Example**:

```typescript
// Before transformation (source code)
// ReactiveCounter.wsx
import { WebComponent } from "@wsxjs/wsx-core";

export default class ReactiveCounter extends WebComponent {
    // No constructor needed!
    // ...
}
```

```typescript
// After transformation (generated code)
// ReactiveCounter.wsx
import { WebComponent } from "@wsxjs/wsx-core";
import styles from "./ReactiveCounter.css?inline";  // Auto-injected

export default class ReactiveCounter extends WebComponent {
    private _autoStyles = styles;  // Auto-injected as class property
    
    // No constructor modification needed!
    // Base class will automatically detect and use _autoStyles
    // ...
}
```

**Key Benefits**:
- ✅ No constructor modification needed
- ✅ Works even if no constructor exists
- ✅ Doesn't break existing constructor code
- ✅ Simpler transformation logic

**Edge Cases** (all assume CSS file exists):

1. **No constructor**: Just add class property, no constructor needed!
   ```typescript
   // Before: No constructor (valid - base class has default constructor)
   export default class Button extends WebComponent {
       render() { ... }
   }
   
   // After: Class property auto-injected
   export default class Button extends WebComponent {
       private _autoStyles = styles;  // Auto-injected
       render() { ... }
   }
   ```
   
   **Important**: Constructor is not required. Base classes will automatically detect `_autoStyles` and use it.

2. **Has constructor**: No modification needed, just add class property
   ```typescript
   // Before:
   constructor() {
       super();
       this.init();
   }
   
   // After:
   private _autoStyles = styles;  // Auto-injected
   constructor() {
       super();  // No modification needed!
       this.init();
   }
   ```

3. **Constructor with custom config**: No modification needed
   ```typescript
   // Before:
   constructor() {
       super({ debug: true });
   }
   
   // After:
   private _autoStyles = styles;  // Auto-injected
   constructor() {
       super({ debug: true });  // No modification needed!
   }
   ```

4. **Existing styles import**: If user already imports styles, skip all auto-injection
   ```typescript
   // User already has: import styles from "./ReactiveCounter.css?inline";
   // Plugin detects and skips: no import injection, no property injection
   ```

5. **No CSS file**: If `A.css` doesn't exist, do nothing (no error, no injection)

6. **Multiple CSS files**: Only inject the matching one (`A.css` for `A.wsx`)

**Critical Rule**: CSS file existence is the **only** condition for injection. If CSS exists, injection happens by adding a class property. No constructor modification needed!

### Implementation Approach: Class Property Injection (Recommended)

Since we have Babel plugin infrastructure, the best approach is to inject styles as a class property:

```typescript
// Babel plugin adds:
private _autoStyles = styles;
```

**Why This Is Better**:
- ✅ **No constructor modification** - works with any constructor structure
- ✅ **Simpler transformation** - just add one class property
- ✅ **No breaking changes** - doesn't touch existing code
- ✅ **Works without constructor** - base classes handle it automatically

**Implementation**:

```typescript
// babel-plugin-wsx-style.ts
export default function babelPluginWSStyle(): PluginObj {
    return {
        name: "babel-plugin-wsx-style",
        visitor: {
            ClassDeclaration(path) {
                // 1. Check if CSS file exists (from plugin options)
                if (!cssExists) return;
                
                // 2. Check if styles already imported
                if (hasStylesImport(path)) return;
                
                // 3. Add CSS import
                addStylesImport(path);
                
                // 4. Add class property
                const classBody = path.node.body;
                classBody.body.unshift(
                    t.classPrivateProperty(
                        t.privateName(t.identifier("_autoStyles")),
                        t.identifier("styles")
                    )
                );
            },
        },
    };
}
```

**Base Class Modification Required**:

Following the `BaseComponent` design pattern, style detection should happen in `BaseComponent` constructor, not in subclasses. This ensures consistency and follows the DRY principle.

**BaseComponent** (in constructor - handles for both WebComponent and LightComponent):
```typescript
constructor(config: BaseComponentConfig = {}) {
    super();
    
    // Auto-detect injected styles from class property
    // This works for both WebComponent and LightComponent
    if ((this as any)._autoStyles && !config.styles) {
        config.styles = (this as any)._autoStyles;
    }
    
    this.config = config;
    this._isDebugEnabled = config.debug ?? false;
}
```

**WebComponent** (no modification needed - uses config.styles from BaseComponent):
```typescript
constructor(config: WebComponentConfig = {}) {
    super(config);  // BaseComponent already merged _autoStyles into config
    this.config = config;
    this._preserveFocus = config.preserveFocus ?? true;
    this.attachShadow({ mode: "open" });
    
    // Apply styles (config.styles already includes auto-injected styles from BaseComponent)
    if (config.styles) {
        const styleName = config.styleName || this.constructor.name;
        StyleManager.applyStyles(this.shadowRoot, styleName, config.styles);
    }
}
```

**LightComponent** (no modification needed - uses config.styles from BaseComponent):
```typescript
constructor(config: LightComponentConfig = {}) {
    super(config);  // BaseComponent already merged _autoStyles into config
    this.config = config;
}

connectedCallback(): void {
    this.connected = true;
    try {
        // Apply CSS styles (config.styles already includes auto-injected styles from BaseComponent)
        if (this.config.styles) {
            const styleName = this.config.styleName || this.constructor.name;
            this.applyScopedStyles(styleName, this.config.styles);
        }
        
        // ... rest of connectedCallback
    }
}
```

**Key Design Principles**:
- ✅ **Single Responsibility**: `BaseComponent` handles style detection (common functionality)
- ✅ **DRY**: No duplication between `WebComponent` and `LightComponent`
- ✅ **Consistency**: Both component types get auto-injection from the same place
- ✅ **Priority**: Manual `config.styles` takes precedence over `_autoStyles`
- ✅ **No Breaking Changes**: Existing style application logic in subclasses works unchanged

### File System Check

**Option 1: Vite Plugin Checks** (Recommended)
- Vite plugin has access to file system
- Check CSS file existence in `resolveId` or `transform`
- Pass result to Babel plugin via options

**Option 2: Babel Plugin Checks**
- Babel plugin uses `fs` module directly
- Requires file path from plugin options
- Simpler but less integrated with Vite

**Recommendation**: Use Option 1 (Vite plugin checks) for better integration.

## API Design

### Configuration

The feature is **enabled by default** but can be disabled:

```typescript
// vite.config.ts
import { wsx } from "@wsxjs/wsx-vite-plugin";

export default defineConfig({
    plugins: [
        wsx({
            jsxFactory: "h",
            jsxFragment: "Fragment",
            autoStyleInjection: true,  // Default: true
        }),
    ],
});
```

### File Naming Convention

- **Component**: `MyComponent.wsx`
- **Styles**: `MyComponent.css` (same directory)
- **Case-sensitive**: Must match exactly (including case)

### Import Path Resolution

The CSS import uses Vite's `?inline` query parameter:

```typescript
import styles from "./MyComponent.css?inline";
```

This ensures:
- CSS is loaded as a string (not processed as a stylesheet)
- Works with Vite's asset handling
- Compatible with existing `StyleManager` and component config

## Examples

### Basic Usage

**Case 1: No constructor** (Class property auto-injected)
```typescript
// Button.wsx
import { WebComponent } from "@wsxjs/wsx-core";

export default class Button extends WebComponent {
    // No constructor - valid because base class has default constructor
    render() {
        return <button class="btn">Click me</button>;
    }
}
```

**If Button.css exists**, the plugin will generate:
```typescript
// After transformation
import styles from "./Button.css?inline";  // Auto-injected
export default class Button extends WebComponent {
    private _autoStyles = styles;  // Class property auto-injected
    
    // No constructor needed! Base class will auto-detect _autoStyles
    render() {
        return <button class="btn">Click me</button>;
    }
}
```

**If Button.css does NOT exist**, no transformation happens (component works without styles).

**Case 2: Has constructor** (No modification needed)
```typescript
// Button.wsx
import { WebComponent } from "@wsxjs/wsx-core";

export default class Button extends WebComponent {
    constructor() {
        super();  // No modification needed!
    }
    
    render() {
        return <button class="btn">Click me</button>;
    }
}
```

**If Button.css exists**, the plugin will generate:
```typescript
// After transformation
import styles from "./Button.css?inline";  // Auto-injected
export default class Button extends WebComponent {
    private _autoStyles = styles;  // Class property auto-injected
    
    constructor() {
        super();  // No modification needed! Base class auto-detects _autoStyles
    }
    
    render() {
        return <button class="btn">Click me</button>;
    }
}
```

```css
/* Button.css */
.btn {
    padding: 10px 20px;
    background: blue;
    color: white;
}
```

**Generated code** (both cases):
```typescript
// Button.wsx (after Babel transformation)
import { WebComponent } from "@wsxjs/wsx-core";
import styles from "./Button.css?inline";  // Auto-injected

export default class Button extends WebComponent {
    private _autoStyles = styles;  // Class property auto-injected
    
    // Constructor unchanged - base class auto-detects _autoStyles
    // ...
}
```

### With Custom Config

```typescript
// Button.wsx
export default class Button extends WebComponent {
    constructor() {
        super({ debug: true });  // Custom config
    }
    // ...
}
```

**Generated code**:
```typescript
// Button.wsx (after transformation)
import styles from "./Button.css?inline";  // Auto-injected

export default class Button extends WebComponent {
    private _autoStyles = styles;  // Class property auto-injected
    
    constructor() {
        super({ debug: true });  // No modification needed!
        // Base class will auto-detect _autoStyles and merge with config
    }
    // ...
}
```

### Manual Override

If user manually imports styles, plugin detects and skips **all** auto-injection (no import, no constructor modification):

```typescript
// Button.wsx
import { WebComponent } from "@wsxjs/wsx-core";
import styles from "./Button.css?inline";  // Manual import detected

export default class Button extends WebComponent {
    constructor() {
        super({ styles });  // Manual injection - plugin does nothing
    }
    // ...
}
```

**Result**: Plugin detects existing import and skips all injection (no duplication, no modification).

### Constructor with Complex Logic

Plugin preserves all existing code, no constructor modification needed:

```typescript
// Before
export default class ComplexComponent extends WebComponent {
    constructor() {
        const config = this.getConfig();
        super(config);
        this.initialize();
    }
}

// After (if ComplexComponent.css exists)
export default class ComplexComponent extends WebComponent {
    private _autoStyles = styles;  // Class property auto-injected
    
    constructor() {
        const config = this.getConfig();
        super(config);  // No modification needed!
        this.initialize();  // Preserved
        // Base class will auto-detect _autoStyles and merge with config
    }
}
```

### LightComponent

Works the same way for `LightComponent`:

```typescript
// Editor.wsx
import { LightComponent } from "@wsxjs/wsx-core";

export default class Editor extends LightComponent {
    constructor() {
        super();  // Styles automatically injected
    }
    // ...
}
```

## Type Safety

TypeScript types are preserved:

```typescript
// styles is typed as string (from ?inline import)
import styles from "./Button.css?inline";  // string
```

The `styles` variable is correctly typed as `string`, matching the `BaseComponentConfig.styles?: string` type.

## Constraints

1. **File Location**: CSS file must be in the same directory as WSX file
2. **File Naming**: Must match exactly (case-sensitive)
3. **Import Format**: Uses `?inline` query parameter (Vite-specific)
4. **Plugin Order**: Style injection plugin must run before state plugin
5. **Base Class**: Only works with `WebComponent` and `LightComponent` (extends `BaseComponent`)
6. **Code Preservation**: Plugin must never break existing code - only modify `super()` calls and add imports
7. **Injection Guarantee**: If CSS file exists and no manual import detected, injection **MUST** happen regardless of constructor structure
8. **Constructor Not Required**: Base classes have default constructors, so components can work without explicit constructor. However:
   - If CSS file exists, constructor will be auto-generated or modified
   - If using `@state` decorator, constructor will be modified by state plugin
   - In practice, most components will have a constructor after transformation

## Migration Path

**Backward Compatible**: Existing code continues to work. Users can:
- Keep manual imports (plugin detects and skips)
- Gradually adopt auto-injection by removing manual imports
- Mix both approaches (some components manual, some auto)

**No Breaking Changes**: All existing code remains valid.

## Alternatives Considered

### Option 1: Class Property Injection (Recommended - Best Approach)
- **Approach**: Inject styles as class property `private _autoStyles = styles;`, base classes auto-detect and use it
- **Pros**:
  - ✅ **Simplest implementation** - just add a class property
  - ✅ **No constructor modification needed** - works with any constructor structure
  - ✅ **No breaking changes** - doesn't touch existing constructor code
  - ✅ **Works without constructor** - base classes handle it automatically
  - ✅ **Consistent with Babel plugin pattern** - similar to `@state` decorator
  - ✅ **Easy to implement** - Babel plugin just adds one class property
- **Cons**:
  - ⚠️ Requires base class modification to detect `_autoStyles`
  - ⚠️ Uses type casting `(this as any)._autoStyles` (but safe)
- **Status**: **⭐ RECOMMENDED** - simplest and most elegant solution

### Option 2: Vite Plugin Direct Injection
- **Approach**: Handle style injection directly in Vite plugin's `transform` hook, similar to JSX import injection
- **Pros**:
  - ✅ Simpler than constructor modification
  - ✅ Consistent with existing JSX import injection pattern
  - ✅ Easier CSS file existence checking (Vite has file system access)
- **Cons**:
  - ⚠️ Still needs constructor modification (more complex than class property)
  - ⚠️ Less precise than Babel AST manipulation
- **Status**: **Viable alternative** - but class property injection is better

### Option 3: Constructor Modification (Original Approach)
- **Approach**: Modify `super()` calls to include styles
- **Pros**:
  - ✅ No base class modification needed
- **Cons**:
  - ❌ Complex constructor detection and modification logic
  - ❌ Need to handle many edge cases
  - ❌ May break existing constructor code
- **Status**: **Not recommended** - class property injection is much simpler

### Option 3: Runtime CSS Loading
- **Approach**: Load CSS at runtime using `fetch()` or `import()`
- **Rejected**: Adds runtime overhead, async complexity, not compatible with Vite's build process

### Option 4: CSS Modules
- **Approach**: Use CSS Modules with automatic class name generation
- **Rejected**: Different use case, doesn't solve the import boilerplate problem

### Option 5: PostCSS Plugin
- **Approach**: Use PostCSS to inject styles
- **Rejected**: PostCSS works on CSS files, not TypeScript/JSX files

### Option 6: Vite Virtual Modules
- **Approach**: Create virtual CSS modules that auto-import styles
- **Rejected**: Too complex, doesn't solve constructor injection problem

## Testing

- Unit tests for Babel plugin transformation
- Integration tests with actual `.wsx` and `.css` files
- Edge case tests (no CSS file, existing import, custom config)
- Type safety tests
- Build tool compatibility tests (Vite, other bundlers)

## Future Enhancements

1. ~~**Multiple Style Files**: Support `A.wsx` → `A.css` + `A.theme.css`~~ (Rejected: Keep it simple, one CSS per component)
2. **Style Preprocessing**: Support SCSS/SASS with automatic compilation (→ Track in future RFC 0009)
3. **Style Scoping**: Automatic CSS scoping for Light DOM components
4. **Style Extraction**: Extract styles to separate bundle for better caching
5. **Hot Module Replacement**: Better HMR support for style changes

## Critical Implementation Corrections

**⚠️ Important**: The original RFC contained some technical inaccuracies. After thorough review, the following corrections MUST be applied during implementation:

### 1. Babel AST: Use `classProperty` Instead of `classPrivateProperty`

**Problem**: The example code (Line 229-234) uses `t.classPrivateProperty()`, which creates a **JavaScript private field** (`#_autoStyles`). This is **NOT accessible** from base classes via `(this as any)._autoStyles`.

**Correct Implementation**:
```typescript
// ❌ WRONG - Creates JavaScript private field (#_autoStyles)
classBody.body.unshift(
    t.classPrivateProperty(
        t.privateName(t.identifier("_autoStyles")),
        t.identifier("styles")
    )
);

// ✅ CORRECT - Creates TypeScript private property (_autoStyles)
classBody.body.unshift(
    t.classProperty(
        t.identifier("_autoStyles"),
        t.identifier("styles"),
        null,  // typeAnnotation
        [],    // decorators
        false, // computed
        false  // static
    )
);
```

**Why**: TypeScript `private` is compile-time only and becomes a regular property at runtime, making it accessible via type casting. JavaScript `#private` fields are truly private at runtime and cannot be accessed from outside the class.

### 2. Plugin Execution Order

**Critical**: The Babel plugin **MUST** run **BEFORE** `babel-plugin-wsx-state` to ensure proper initialization order.

**Correct Order**:
```typescript
plugins: [
    babelPluginWSXStyle,   // 1. Style injection (FIRST)
    babelPluginWSXState,   // 2. State decorator transformation
    ["@babel/plugin-proposal-decorators", { version: "2023-05" }],
    ["@babel/plugin-proposal-class-properties", { loose: false }],
]
```

**Why**: Class properties must be injected before state transformations to ensure `_autoStyles` exists when state initialization code runs in the constructor.

### 3. TypeScript Type Safety

**Problem**: Using `(this as any)._autoStyles` bypasses type checking and could lead to runtime errors.

**Solution**: Add proper type declaration in `BaseComponent`:

```typescript
// In packages/core/src/base-component.ts
export abstract class BaseComponent extends HTMLElement {
    // ... existing code

    /**
     * Auto-injected styles from Babel plugin (if CSS file exists)
     * @internal - Managed by babel-plugin-wsx-style
     */
    protected _autoStyles?: string;
}
```

**Benefits**:
- ✅ Type-safe access: `this._autoStyles` instead of `(this as any)._autoStyles`
- ✅ IDE autocomplete support
- ✅ Better error detection at compile time
- ✅ Self-documenting code

### 4. Implementation Priority

**Out of Scope** (removed from RFC 0008):
- ~~Multiple CSS Files Support~~ - Keep it simple, one CSS file per component

**Future RFC** (to be tracked separately):
- SCSS/SASS Preprocessing → RFC 0009 (to be created)

## Implementation Checklist

### Implementation Steps

- [ ] **Modify Base Classes** to auto-detect `_autoStyles`:
  - [ ] `WebComponent`: Check `(this as any)._autoStyles` in constructor and merge with config
  - [ ] `LightComponent`: Check `(this as any)._autoStyles` in connectedCallback and apply styles
- [ ] **Create Babel Plugin** `babel-plugin-wsx-style.ts`:
  - [ ] Add CSS import injection (if CSS file exists)
  - [ ] Add class property: `private _autoStyles = styles;`
  - [ ] Handle edge cases (existing imports, no CSS file)
- [ ] **Update Vite Plugin**:
  - [ ] Add CSS file existence check in `transform` hook
  - [ ] Pass CSS existence info to Babel plugin via options
  - [ ] Add plugin to Babel plugins array (before state plugin)
- [ ] **Add Configuration**:
  - [ ] Add `autoStyleInjection` option to `WSXPluginOptions`
  - [ ] Default to `true`
- [ ] **Testing**:
  - [ ] Write unit tests for Babel plugin
  - [ ] Write integration tests with actual `.wsx` and `.css` files
  - [ ] Test edge cases (no constructor, existing import, custom config)
- [ ] **Documentation**:
  - [ ] Update README
  - [ ] Update examples to use auto-injection
  - [ ] Update component guides

**Key Advantage**: Class property injection is much simpler than constructor modification - just add one property, base classes handle the rest!

## References

- Babel Plugin Handbook: https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md
- Vite Plugin API: https://vitejs.dev/guide/api-plugin.html
- Vite Asset Handling: https://vitejs.dev/guide/assets.html
- RFC 0007: Reactive Decorator (for Babel plugin reference)

