# AI Agent Guide: WSXJS Component Development

Quick reference for AI agents developing WSXJS components.

## Required Template

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
import { WebComponent, autoRegister, state } from "@wsxjs/wsx-core";
import styles from "./Component.css?inline";

@autoRegister({ tagName: "wsx-component-name" })
export default class ComponentName extends WebComponent {
    @state private count: number = 0;

    constructor() {
        super({ styles, styleName: "wsx-component-name" });
    }

    protected onConnected(): void {
        super.onConnected(); // ✅ REQUIRED: Always call super lifecycle methods
        
        // Your initialization logic here
    }

    protected onDisconnected(): void {
        super.onDisconnected(); // ✅ REQUIRED: Always call super lifecycle methods
        
        // Your cleanup logic here
    }

    private handleClick = () => {
        this.count++; // Automatically triggers rerender
    };

    render() {
        return (
            <div class="container">
                <button onClick={this.handleClick}>Count: {this.count}</button>
            </div>
        );
    }
}
```

## Critical Rules

1. **Always include `/** @jsxImportSource @wsxjs/wsx-core */` at top**
2. **Use `class` not `className`** - WSXJS uses standard HTML attributes
3. **Import styles with `?inline`**: `import styles from "./Component.css?inline"`
4. **Use `@autoRegister({ tagName: "wsx-kebab-case" })`** - Auto-register custom elements
5. **Use `@state` for reactive state** - Automatically triggers rerender on changes
6. **Use `on` prefix for events**: `onClick`, `onDragStart`, etc.
7. **Use `ref={(el) => (this.element = el)}`** for element references
8. **Always call `super` in lifecycle methods** - ESLint rule enforces this (RFC-0039)

## WebComponent vs LightComponent

### WebComponent (Shadow DOM) - Use for:
- ✅ Reusable UI components (buttons, inputs, cards, modals)
- ✅ Need style isolation (automatic with Shadow DOM)
- ✅ Component libraries
- ✅ Leaf components (RFC-0006: Container-Light, Leaf-Shadow pattern)

**Example**:
```tsx
@autoRegister({ tagName: "wsx-button })
export class Button extends WebComponent {
    constructor() {
        super({ styles }); // Shadow DOM by default
    }
}
```

### LightComponent (Light DOM) - Use for:
- ✅ Third-party library integration (EditorJS, Chart.js, Maps)
- ✅ Routing/layout components (`wsx-route`, `wsx-view`, `wsx-layout`)
- ✅ Need global DOM access
- ✅ Container components (RFC-0006: Container-Light, Leaf-Shadow pattern)

**Example**:
```tsx
@autoRegister({ tagName: "wsx-editor-wrapper" })
export class EditorWrapper extends LightComponent {
    constructor() {
        super({ styles, styleName: "editor-wrapper" }); // Light DOM
    }
    
    protected onConnected(): void {
        super.onConnected(); // ✅ REQUIRED
        
        // Third-party library can access DOM normally
        this.editor = new EditorJS({ holder: this.editorContainer });
    }
}
```

## State Management

### @state Decorator (Recommended)

```tsx
@state private count: number = 0; // ✅ Must have initial value (RFC-0013)

private increment() {
    this.count++; // Automatically triggers rerender
    // ❌ DO NOT call this.rerender() manually when using @state
}
```

**Key Points**:
- ✅ `@state` automatically triggers rerender when state changes
- ✅ Must provide initial value (ESLint and Babel enforce this)
- ✅ Works with primitives, objects, and arrays
- ❌ Never call `this.rerender()` manually when using `@state`

### State Management Best Practices (RFC-0042)

**Use Internal Reactive State, Not External Non-Reactive Data**:

```tsx
// ❌ Wrong: Relying on external non-reactive data
render() {
    const currentLang = this.languages.find(
        (lang) => lang.code === i18nInstance.language  // ← Not reactive!
    );
    return <span>{currentLang?.name}</span>;
}

// ✅ Correct: Use internal reactive state
@state private currentLanguage: string = "en";

render() {
    const currentLang = this.languages.find(
        (lang) => lang.code === this.currentLanguage  // ← Reactive!
    );
    return <span>{currentLang?.name}</span>;
}

// Sync with external state in lifecycle
protected onConnected(): void {
    super.onConnected();
    
    // Initialize from external source
    this.currentLanguage = i18nInstance.language || "en";
    
    // Listen for external changes
    i18nInstance.on("languageChanged", (lang) => {
        this.currentLanguage = lang;  // Update reactive state
    });
}
```

**Update UI Immediately, Execute Side Effects Asynchronously**:

```tsx
// ❌ Wrong: Wait for async operation before updating UI
private selectLanguage = async (languageCode: string): Promise<void> => {
    await i18nInstance.changeLanguage(languageCode);  // ← UI update delayed
    this.currentLanguage = languageCode;
};

// ✅ Correct: Update UI immediately, async in background
private selectLanguage = (languageCode: string): void => {
    // Immediate UI update (synchronous)
    this.currentLanguage = languageCode;
    this.isOpen = false;
    localStorage.setItem("wsx-language", languageCode);
    
    // Async side effect (background)
    i18nInstance.changeLanguage(languageCode).catch(console.error);
};
```

### State Initial Values (RFC-0013)

**✅ Valid**:
```tsx
@state private name = "";           // String
@state private count = 0;           // Number
@state private enabled = false;    // Boolean
@state private user = { name: "John" }; // Object
@state private items = [];         // Array
@state private optional: string | undefined = undefined; // Explicit undefined
```

**❌ Invalid** (ESLint/Babel will error):
```tsx
@state private count;               // Missing initial value
@state private user;                // Missing initial value
@state private optional = undefined; // Implicit undefined (treated as missing)
```

## Lifecycle Methods (RFC-0039)

**CRITICAL**: Always call `super` in lifecycle methods. ESLint rule `@wsxjs/require-super-lifecycle` enforces this.

### onConnected

```tsx
protected onConnected(): void {
    super.onConnected(); // ✅ REQUIRED - ESLint enforces this
    
    // Your initialization logic
    this.setupEventListeners();
    this.initializeThirdPartyLibrary();
}
```

**Why it matters**:
- Parent class/Mixin initialization logic runs
- i18next decorator and other mixins initialize properly
- Component state initializes correctly

### onDisconnected

```tsx
protected onDisconnected(): void {
    super.onDisconnected(); // ✅ REQUIRED
    
    // Your cleanup logic
    this.cleanup();
    this.editor?.destroy();
}
```

### onRendered

```tsx
protected onRendered(): void {
    super.onRendered(); // ✅ REQUIRED if overridden
    
    // DOM is ready, safe to access elements
    this.highlightCode();
    this.initializeChart();
}
```

### onAttributeChanged

```tsx
protected onAttributeChanged(name: string, oldValue: string, newValue: string): void {
    super.onAttributeChanged(name, oldValue, newValue); // ✅ REQUIRED if overridden
    
    if (name === "disabled") {
        this.updateDisabledState(newValue === "true");
    }
}
```

## Ref Callbacks

### Element References

```tsx
private buttonElement?: HTMLElement;
private dropdownElement?: HTMLElement;

render() {
    return (
        <button ref={(el) => (this.buttonElement = el)}>
            Click me
        </button>
    );
}
```

**Important** (RFC-0041):
- ✅ Framework automatically calls ref callback with `null` when element is removed (both prop removal and DOM removal)
- ✅ Always check if ref is null before using: `if (this.buttonElement) { ... }`
- ✅ Refs are cleared automatically on element removal
- ✅ This prevents stale references that can cause bugs (e.g., event handlers checking removed elements)

### Ref Cleanup Pattern

```tsx
protected onDisconnected(): void {
    super.onDisconnected();
    
    // Framework already cleared refs, but you can also manually clear
    this.buttonElement = undefined;
    this.dropdownElement = undefined;
}
```

## DOM Caching and Updates (RFC-0037, RFC-0041, RFC-0040)

**Framework automatically handles**:
- ✅ DOM element caching and reuse
- ✅ Fine-grained updates (only changed elements update)
- ✅ Element order preservation (even with conditional rendering)
- ✅ Text node updates (framework checks actual DOM content, not metadata)
- ✅ Ref callback cleanup (automatic `null` assignment on removal)

**Developer responsibilities**:
- ✅ Use consistent `key` props for list items
- ✅ Use unique key prefixes for elements in different containers (RFC-0037)
- ✅ Don't manually manipulate cached elements
- ✅ Trust the framework's update mechanism
- ✅ Use internal reactive state, not external non-reactive data (RFC-0042)

### Cache Key Generation

```tsx
// Framework automatically generates cache keys based on:
// 1. Component ID
// 2. Tag name
// 3. Key prop (if provided)
// 4. Position/index
// 5. Component-level counter (fallback)

// ✅ Good: Use key for list items
{items.map(item => (
    <div key={item.id}>{item.name}</div>
))}

// ✅ Good: Stable keys for conditional rendering
{isOpen && <div key="dropdown">Content</div>}
```

### Text Node Updates (RFC-0040)

The framework automatically handles text node updates robustly:
- ✅ Checks actual DOM content (not cached metadata) to determine if update is needed
- ✅ Handles cached element reuse correctly (updates existing text nodes instead of creating duplicates)
- ✅ Works correctly even with complex scenarios (multiple text nodes, conditional rendering)

**Developer note**: You don't need to worry about text node updates - the framework handles this automatically and correctly.

### Cache Key Best Practices (RFC-0037)

**Critical Rule**: The same `key` cannot be used for different parent containers!

```tsx
// ❌ Wrong: Same key in different containers
<div class="main-list">
    {items.map(item => <Item key={item.id} />)}
</div>
<div class="archived-list">
    {archived.map(item => <Item key={item.id} />)}  // ← Duplicate key!
</div>

// ✅ Correct: Use unique key prefixes for different locations
<div class="main-list">
    {items.map(item => <Item key={`main-${item.id}`} />)}
</div>
<div class="archived-list">
    {archived.map(item => <Item key={`archived-${item.id}`} />)}
</div>

// ✅ Correct: ResponsiveNav pattern
<div class="nav-menu">
    {items.map((item, index) => (
        <wsx-link key={`nav-${index}`}>{item.label}</wsx-link>
    ))}
</div>
<div class="nav-overflow-menu">
    {hiddenItems.map((item, idx) => (
        <wsx-link key={`overflow-${hiddenItemIndices[idx]}`}>
            {item.label}
        </wsx-link>
    ))}
</div>
```

**Why it matters**:
- Framework uses cache keys to identify and reuse DOM elements
- Duplicate keys in different containers cause elements to be moved incorrectly
- Use semantic prefixes (`nav-`, `overflow-`, `main-`, `archived-`) to ensure uniqueness

## Vite Config (Required)

```typescript
import { defineConfig } from "vite";
import { wsx } from "@wsxjs/vite-plugin";

export default defineConfig({
    build: {
        cssCodeSplit: false, // ✅ REQUIRED for Shadow DOM
    },
    plugins: [wsx()], // ✅ REQUIRED - Auto-injects JSX pragma and handles .wsx files
});
```

## Component Architecture Pattern (RFC-0006)

### Container-Light, Leaf-Shadow Pattern

**Container Components** (Light DOM):
- Routing: `wsx-route`, `wsx-view`
- Layout: `wsx-layout`, `wsx-section`
- Third-party wrappers: `editor-wrapper`, `chart-container`

**Leaf Components** (Shadow DOM):
- UI controls: `wsx-button`, `wsx-input`, `wsx-dropdown`
- Widgets: `wsx-modal`, `wsx-tooltip`, `wsx-card`

**Example Structure**:
```tsx
<wsx-route path="/dashboard">          {/* Container: Light DOM */}
    <wsx-layout>                       {/* Container: Light DOM */}
        <wsx-section class="header">  {/* Container: Light DOM */}
            <wsx-button>Save</wsx-button>    {/* Leaf: Shadow DOM */}
            <wsx-dropdown>                    {/* Leaf: Shadow DOM */}
                <wsx-button>Edit</wsx-button> {/* Leaf: Shadow DOM */}
            </wsx-dropdown>
        </wsx-section>
    </wsx-layout>
</wsx-route>
```

## Common Mistakes

### ❌ Wrong

```tsx
// Using className instead of class
<div className="container">  // ❌

// Forgetting @jsxImportSource
import { WebComponent } from "@wsxjs/wsx-core";  // ❌ Missing pragma

// Importing styles without ?inline
import styles from "./Component.css";  // ❌

// Manually calling rerender with @state
@state private count = 0;
increment() {
    this.count++;
    this.rerender();  // ❌ Unnecessary, @state handles this
}

// Missing super call in lifecycle
protected onConnected(): void {
    // ❌ Missing super.onConnected()
    this.init();
}

// Missing initial value for @state
@state private count;  // ❌ ESLint/Babel will error

// Using external non-reactive data in render
render() {
    const value = externalLibrary.getValue();  // ❌ Not reactive
}

// Waiting for async before updating state
async handleClick() {
    await api.call();
    this.state = newValue;  // ❌ UI update delayed
}

// Duplicate keys in different containers
<div><Item key="1" /></div>
<div><Item key="1" /></div>  // ❌ Same key in different containers

// Using React APIs
const [state, setState] = useState(0);  // ❌ Wrong framework
```

### ✅ Correct

```tsx
// Use class (standard HTML)
<div class="container">  // ✅

// Always include pragma
/** @jsxImportSource @wsxjs/wsx-core */  // ✅
import { WebComponent } from "@wsxjs/wsx-core";

// Import styles with ?inline
import styles from "./Component.css?inline";  // ✅

// @state automatically rerenders
@state private count = 0;  // ✅
increment() {
    this.count++;  // ✅ Automatically triggers rerender
}

// Always call super in lifecycle
protected onConnected(): void {
    super.onConnected();  // ✅ REQUIRED
    this.init();
}

// Provide initial value for @state
@state private count = 0;  // ✅

// Use internal reactive state
@state private value: string = "";
render() {
    const value = this.value;  // ✅ Reactive
}

// Update UI immediately, async in background
handleClick() {
    this.state = newValue;  // ✅ Immediate UI update
    api.call().catch(handleError);  // ✅ Async in background
}

// Use unique key prefixes for different containers
<div><Item key="main-1" /></div>
<div><Item key="archived-1" /></div>  // ✅ Different prefixes

// Use WSXJS APIs
@state private count = 0;  // ✅
```

## Quick Checklist

Before submitting code, verify:

- [ ] `.wsx` file extension
- [ ] `/** @jsxImportSource @wsxjs/wsx-core */` pragma at top
- [ ] `@autoRegister({ tagName: "wsx-kebab-case" })` decorator
- [ ] `class` not `className` for HTML attributes
- [ ] Styles imported with `?inline`: `import styles from "./Component.css?inline"`
- [ ] `@state` properties have initial values
- [ ] `super.onConnected()` called in `onConnected()` (if overridden)
- [ ] `super.onDisconnected()` called in `onDisconnected()` (if overridden)
- [ ] `super.onRendered()` called in `onRendered()` (if overridden)
- [ ] `super.onAttributeChanged()` called in `onAttributeChanged()` (if overridden)
- [ ] No manual `this.rerender()` calls when using `@state`
- [ ] Vite config: `cssCodeSplit: false` for Shadow DOM
- [ ] Vite config: `wsx()` plugin included
- [ ] Ref callbacks handle `null` values: `if (this.element) { ... }`
- [ ] Component type chosen correctly: WebComponent (Shadow) vs LightComponent (Light)
- [ ] Use unique key prefixes for elements in different containers
- [ ] Use internal reactive state, not external non-reactive data in `render()`
- [ ] Update UI state immediately, execute side effects asynchronously

## File Structure

```
components/
├── MyComponent.wsx        # Component file (.wsx extension)
├── MyComponent.css        # Component styles
└── MyComponent.test.ts    # Component tests
```

## Testing

```tsx
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
    let element: MyComponent;
    
    beforeEach(() => {
        element = new MyComponent();
        document.body.appendChild(element);
    });
    
    afterEach(() => {
        element.remove();
    });
    
    test("renders correctly", () => {
        expect(element.shadowRoot?.querySelector(".container")).toBeTruthy();
    });
});
```

## Additional Resources

### RFCs (Request for Comments)

The following RFCs document important design decisions and best practices:

- **[RFC-0006](./rfcs/completed/0006-light-dom-components.md)**: Container-Light, Leaf-Shadow architecture pattern
- **[RFC-0013](./rfcs/completed/0013-state-initial-value-validation.md)**: @state decorator initial value validation
- **[RFC-0037](./rfcs/completed/0037-vapor-mode-inspired-dom-optimization.md)**: DOM optimization and cache key best practices
- **[RFC-0039](./rfcs/completed/0039-enforce-super-lifecycle-calls.md)**: Enforce super calls in lifecycle methods
- **[RFC-0040](./rfcs/completed/0040-text-node-update-bug-fixes.md)**: Text node update bug fixes
- **[RFC-0041](./rfcs/completed/0041-cache-reuse-element-order-and-ref-callback-fixes.md)**: Cache reuse, element order, and ref callback fixes
- **[RFC-0042](./rfcs/completed/0042-language-switcher-immediate-ui-update.md)**: State management best practices for immediate UI updates

### Related Documentation

- [AI Agent Site Build Guide](./AI_AGENT_SITE_BUILD_GUIDE.md) - Guide for building complete websites with WSXJS
- [WSXJS Design Philosophy](../site/public/docs/guide/DESIGN_PHILOSOPHY.md)
- [Web Component Guide](../site/public/docs/guide/WEB_COMPONENT_GUIDE.md)
- [RFC Index](./rfcs/README.md)

---

**Last Updated**: 2025-01-03 - Based on RFC-0039, RFC-0041, RFC-0006, RFC-0013, RFC-0037, RFC-0040, and RFC-0042
