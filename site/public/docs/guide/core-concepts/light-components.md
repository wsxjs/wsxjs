---
title: LightComponent Usage Guide
order: 2
category: guide/core-concepts
description: "LightComponent is a lightweight custom element base class provided by WSXJS, designed for scenarios that require integration with third-party libraries or use Light DOM"
---

## Overview

`LightComponent` is a lightweight custom element base class provided by WSXJS, designed for scenarios that require integration with third-party libraries or use Light DOM. It directly inherits from `HTMLElement`, does not use Shadow DOM, and provides complete reactive state management and JSX support.

## Why Use LightComponent?

### Use Cases

1. **Third-party Library Integration**
   - Integration with libraries like EditorJS, Chart.js, etc.
   - Libraries need direct access to DOM elements
   - Libraries use `document.querySelector` to find elements

2. **Routing and Layout Components**
   - Container components need global DOM access
   - Need event bubbling to document level
   - Need integration with external styling systems

3. **Simple Components**
   - Simple components that don't need style isolation
   - Need a more lightweight implementation

### Not Suitable For

- UI components that need style isolation (use `WebComponent`)

## Quick Start

### Basic Usage

**Method 1: Automatic CSS Injection (Recommended)**

If a component file `MyComponent.wsx` has a corresponding `MyComponent.css` file, the Babel plugin will automatically inject CSS without manual import:

```tsx
import { LightComponent, autoRegister } from '@wsxjs/wsx-core';
// CSS auto-injection: If MyComponent.css exists, it will be automatically imported and injected as _autoStyles

@autoRegister()
export class MyComponent extends LightComponent {
  constructor() {
    super({
      styleName: 'my-component', // Only need to specify styleName
    });
  }

  render() {
    return (
      <div class="my-component">
        <h1>Hello LightComponent!</h1>
      </div>
    );
  }
}
```

**Method 2: Manual CSS Import (Optional)**

If you need manual control, you can also explicitly import:

```tsx
import { LightComponent, autoRegister } from '@wsxjs/wsx-core';
import styles from './MyComponent.css?inline';

@autoRegister()
export class MyComponent extends LightComponent {
  constructor() {
    super({
      styles,
      styleName: 'my-component',
    });
  }

  render() {
    return (
      <div class="my-component">
        <h1>Hello LightComponent!</h1>
      </div>
    );
  }
}
```

**Note**: If CSS is manually imported, the Babel plugin will detect it and skip automatic injection to avoid duplication.

### Using Reactive State

`LightComponent` fully supports reactive state management with three approaches:

#### Method 1: Using @state Decorator (Recommended)

Using the `@state` decorator is the most concise way, and the Babel plugin will automatically handle it at compile time:

```tsx
import { LightComponent, autoRegister, state } from '@wsxjs/wsx-core';

@autoRegister()
export class Counter extends LightComponent {
  // ✅ Using @state decorator (must have initial value)
  @state private count = 0;
  @state private name = "";
  @state private user = { name: "John", age: 30 };
  @state private items: string[] = [];

  render() {
    return (
      <div>
        <p>Count: {this.count}</p>
        <p>Name: {this.name}</p>
        <p>User: {this.user.name}</p>
        <p>Items: {this.items.length}</p>
        <button onClick={() => this.count++}>
          Increment
        </button>
      </div>
    );
  }
}
```

**Important Notes**:
- ⚠️ Properties with `@state` decorator **must have initial values**
- ✅ ESLint rule `wsx/state-requires-initial-value` will check during development
- ✅ Babel plugin will validate at build time, missing initial values will cause build failure
- 📖 See [RFC-0013](../rfcs/completed/0013-state-initial-value-validation.md) for detailed explanation

**Valid Examples**:
```tsx
@state private count = 0;           // ✅ Number
@state private name = "";           // ✅ String
@state private enabled = false;     // ✅ Boolean
@state private user = {};           // ✅ Object
@state private items = [];          // ✅ Array
@state private optional: string | undefined = undefined; // ✅ Optional type (explicit undefined)
```

**Invalid Examples** (will be detected by ESLint and Babel):
```tsx
@state private count;               // ❌ Missing initial value
@state private name;                 // ❌ Missing initial value
@state private user;                 // ❌ Missing initial value
```

#### Method 2: Using reactive() Method

```tsx
import { LightComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister()
export class Counter extends LightComponent {
  // Use reactive() to create reactive object
  private state = this.reactive({ count: 0 });

  render() {
    return (
      <div>
        <p>Count: {this.state.count}</p>
        <button onClick={() => this.state.count++}>
          Increment
        </button>
      </div>
    );
  }
}
```

#### Method 3: Using useState Hook

```tsx
import { LightComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister()
export class TodoList extends LightComponent {
  // Use useState to create reactive state
  private [todos, setTodos] = this.useState('todos', []);

  addTodo(text: string) {
    setTodos([...todos(), { id: Date.now(), text }]);
  }

  render() {
    return (
      <div>
        <ul>
          {todos().map(todo => (
            <li key={todo.id}>{todo.text}</li>
          ))}
        </ul>
      </div>
    );
  }
}
```

## Core Features

### 1. JSX Support

`LightComponent` fully supports JSX syntax, compiled to native DOM operations:

```tsx
render() {
  return (
    <div class="container">
      <h1>Title</h1>
      <p>Content</p>
      <button onClick={this.handleClick}>Click me</button>
    </div>
  );
}
```

### 2. Reactive State Management

`LightComponent` supports three reactive state management approaches:

#### @state Decorator (Recommended)

Using the `@state` decorator is the most concise way, and the Babel plugin will automatically handle it at compile time:

```tsx
import { state } from '@wsxjs/wsx-core';

export class MyComponent extends LightComponent {
  // Primitive types: use useState
  @state private count = 0;
  @state private name = "";
  
  // Object/Array types: use reactive
  @state private user = { name: "John", age: 30 };
  @state private items: string[] = [];
  
  render() {
    // Use directly, no need for this.state.xxx
    return <div>{this.count} - {this.name}</div>;
  }
}
```

**Key Requirements**:
- ⚠️ **Must have initial value**: Properties with `@state` decorator must provide initial values
- ✅ **Automatic type detection**: Babel plugin automatically chooses `useState` (primitive) or `reactive` (object/array) based on initial value
- ✅ **Compile-time validation**: Missing initial values will cause build failure
- ✅ **Development-time checking**: ESLint rules will provide real-time hints in the editor

**Why is an initial value required?**
1. Babel plugin needs initial value to determine property type (primitive vs object/array)
2. Need to extract initial value from AST to generate initialization code in constructor
3. Ensure state has explicit type to avoid runtime errors

#### reactive() Method

Create reactive object that automatically triggers re-render when properties change:

```tsx
private state = this.reactive({ 
  count: 0,
  name: 'WSX'
});

// Modifying properties automatically triggers re-render
this.state.count++;
this.state.name = 'New Name';
```

#### useState() Method

Create a single reactive state value:

```tsx
private [count, setCount] = this.useState('count', 0);

// Usage
count();        // Get value
setCount(10);   // Set value
setCount(prev => prev + 1); // Functional update
```

### 3. Lifecycle Hooks

```tsx
export class MyComponent extends LightComponent {
  // Called after component is connected to DOM
  protected onConnected() {
    console.log('Component connected');
    // Initialize third-party library
    this.initEditor();
  }

  // Called after component is disconnected from DOM
  protected onDisconnected() {
    console.log('Component disconnected');
    // Cleanup resources
    this.cleanup();
  }

  // Called when attributes change
  protected onAttributeChanged(name: string, oldValue: string, newValue: string) {
    if (name === 'data') {
      this.handleDataChange(newValue);
    }
  }
}
```

### 4. Style Management

#### Automatic CSS Injection (Recommended)

WSXJS provides intelligent CSS auto-injection. If a component file `MyComponent.wsx` has a corresponding `MyComponent.css` file, the Babel plugin will automatically:

1. Auto-import CSS file: `import styles from "./MyComponent.css?inline";`
2. Auto-inject as class property: `private _autoStyles = styles;`
3. Auto-apply styles: Base class will automatically detect and use `_autoStyles`

**No manual import needed**:

```tsx
// MyComponent.wsx
import { LightComponent, autoRegister } from '@wsxjs/wsx-core';
// CSS auto-injection: If MyComponent.css exists, it will be automatically handled

@autoRegister()
export class MyComponent extends LightComponent {
  constructor() {
    super({
      styleName: 'my-component', // Only need to specify styleName
    });
  }

  render() {
    return <div class="my-component">Content</div>;
  }
}
```

```css
/* MyComponent.css - Auto-injected */
.my-component {
  padding: 20px;
  background: #f5f5f5;
}
.my-component h1 {
  color: #333;
}
```

**Manual CSS Import (Optional)**:

If you need manual control, you can also explicitly import. The Babel plugin will detect manual imports and skip auto-injection:

```tsx
import { LightComponent, autoRegister } from '@wsxjs/wsx-core';
import styles from './MyComponent.css?inline'; // Manual import

@autoRegister()
export class MyComponent extends LightComponent {
  constructor() {
    super({
      styles, // Manual pass
      styleName: 'my-component',
    });
  }

  render() {
    return <div class="my-component">Content</div>;
  }
}
```

#### Scoped Styles

`LightComponent` uses scoped styles, achieving style isolation through data attributes. Styles are automatically injected into the component and scoped using the `data-wsx-light-component` attribute.

### 5. Error Handling

`LightComponent` has built-in error handling:

```tsx
render() {
  try {
    return <div>{/* your content */}</div>;
  } catch (error) {
    // Errors will be automatically caught and display friendly error messages
    throw error;
  }
}
```

## Practical Examples

### Example 1: EditorJS Integration

```tsx
import { LightComponent, autoRegister } from '@wsxjs/wsx-core';
import EditorJS from '@editorjs/editorjs';

@autoRegister({ tagName: 'editor-demo' })
export class EditorDemo extends LightComponent {
  private editor?: EditorJS;

  protected onConnected() {
    // In Light DOM, EditorJS can normally access DOM
    this.editor = new EditorJS({
      holder: this.querySelector('#editor'),
      // EditorJS configuration
    });
  }

  protected onDisconnected() {
    // Cleanup EditorJS instance
    this.editor?.destroy();
  }

  render() {
    return (
      <div>
        <div id="editor"></div>
      </div>
    );
  }
}
```

### Example 2: Route Container

```tsx
import { LightComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister({ tagName: 'wsx-route' })
export class WsxRoute extends LightComponent {
  static observedAttributes = ['path', 'component'];

  private currentComponent?: HTMLElement;

  protected onAttributeChanged(name: string, _old: string, newValue: string) {
    if (name === 'path' || name === 'component') {
      this.loadComponent();
    }
  }

  private loadComponent() {
    const componentName = this.getAttribute('component');
    if (componentName) {
      // Dynamically load component
      this.currentComponent = document.createElement(componentName);
      this.rerender();
    }
  }

  render() {
    return (
      <div class="route-container">
        {this.currentComponent}
      </div>
    );
  }
}
```

### Example 3: Reactive Form

```tsx
import { LightComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister()
export class FormComponent extends LightComponent {
  private formData = this.reactive({
    name: '',
    email: '',
    submitted: false,
  });

  handleSubmit = (e: Event) => {
    e.preventDefault();
    this.formData.submitted = true;
    console.log('Form data:', this.formData);
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={this.formData.name}
          onInput={(e) => {
            this.formData.name = (e.target as HTMLInputElement).value;
          }}
        />
        <input
          type="email"
          placeholder="Email"
          value={this.formData.email}
          onInput={(e) => {
            this.formData.email = (e.target as HTMLInputElement).value;
          }}
        />
        <button type="submit">Submit</button>
        {this.formData.submitted && (
          <p>Form submitted!</p>
        )}
      </form>
    );
  }
}
```

## Best Practices

### 1. Style Scoping

Use unique `styleName` to avoid style conflicts:

```tsx
super({
  styleName: 'my-unique-component-name',
  styles: '/* your styles */',
});
```

### 2. Third-party Library Cleanup

Clean up third-party library resources in `onDisconnected`:

```tsx
protected onDisconnected() {
  // Clean up event listeners
  this.removeEventListener('click', this.handleClick);
  
  // Clean up third-party library instances
  if (this.thirdPartyInstance) {
    this.thirdPartyInstance.destroy();
  }
}
```

### 3. Reactive State Management

Use reactive state appropriately, avoid overuse:

```tsx
// ✅ Good: Only use reactive for data that needs to trigger re-render
private uiState = this.reactive({ count: 0, visible: true });
private staticConfig = { maxCount: 100 }; // No need for reactive

// ❌ Avoid: Using reactive for static data
private staticData = this.reactive({ apiUrl: 'https://api.example.com' });
```

### 4. Attribute Observation

Use `observedAttributes` to observe attribute changes:

```tsx
static observedAttributes = ['data', 'disabled', 'theme'];

protected onAttributeChanged(name: string, _old: string, newValue: string) {
  switch (name) {
    case 'data':
      this.handleDataChange(newValue);
      break;
    case 'disabled':
      this.updateDisabledState(newValue !== null);
      break;
  }
}
```

## Component Comparison: LightComponent vs WebComponent

### Core Differences

| Feature | LightComponent | WebComponent |
|------|---------------|---------------|
| **Inheritance** | `HTMLElement` | `HTMLElement` |
| **DOM Type** | Light DOM | Shadow DOM |
| **Style Isolation** | Scoped styles (data attributes) | Complete isolation (Shadow DOM) |
| **Reactive Support** | ✅ Full support | ✅ Full support |
| **Third-party Integration** | ✅ Perfect support | ⚠️ Limited support |
| **Global DOM Access** | ✅ Supported | ❌ Restricted (Shadow DOM boundary) |
| **Event Bubbling** | ✅ Natural bubbling | ⚠️ Need manual forwarding |
| **Focus Retention** | ❌ Not supported | ✅ Supported |
| **Style Scoping** | Manual management (BEM/naming conventions) | Automatic isolation |
| **Performance** | Lighter | Slightly heavier (Shadow DOM overhead) |

### Detailed Comparison

#### 1. DOM Rendering

**LightComponent:**
```tsx
// Render to Light DOM (directly to component interior)
render() {
  return <div>Content</div>; // Directly added to this
}
// DOM structure: <my-component><div>Content</div></my-component>
```

**WebComponent:**
```tsx
// Render to Shadow DOM
render() {
  return <div>Content</div>; // Added to this.shadowRoot
}
// DOM structure: <my-component>#shadow-root<div>Content</div></my-component>
```

#### 2. Style Handling

**LightComponent:**
```tsx
// Use scoped styles (via data attributes)
super({
  styles: '.my-component { color: red; }',
  styleName: 'my-component',
});
// Styles injected as: <style data-wsx-light-component="my-component">...</style>
// Need to manually avoid global conflicts
```

**WebComponent:**
```tsx
// Use Shadow DOM automatic isolation
super({
  styles: 'div { color: red; }', // Automatically isolated, won't affect external
});
// Styles completely isolated, won't affect external styles
```

#### 3. Third-party Library Integration

**LightComponent:**
```tsx
// ✅ EditorJS can work normally
protected onConnected() {
  this.editor = new EditorJS({
    holder: this.querySelector('#editor'), // ✅ Can find element
  });
}
```

**WebComponent:**
```tsx
// ⚠️ EditorJS may not work normally
protected onConnected() {
  this.editor = new EditorJS({
    holder: this.shadowRoot.querySelector('#editor'), // ⚠️ In Shadow DOM
    // But EditorJS's global queries may fail
  });
}
```

#### 4. Reactive API

Both use **exactly the same reactive API**:

```tsx
// Both support
private state = this.reactive({ count: 0 });
private [count, setCount] = this.useState('count', 0);
```

#### 5. Element Queries

**LightComponent:**
```tsx
// Direct query, consistent with standard DOM
this.querySelector('.item'); // Query component interior
document.querySelector('.item'); // Can query globally
```

**WebComponent:**
```tsx
// Query Shadow DOM
this.shadowRoot.querySelector('.item'); // Query Shadow DOM
// document.querySelector cannot access Shadow DOM content
```

#### 6. Event Handling

**LightComponent:**
```tsx
// Events naturally bubble
<button onClick={this.handleClick}>Click</button>
// Events will naturally bubble to document
```

**WebComponent:**
```tsx
// Events don't bubble to external by default (Shadow DOM boundary)
<button onClick={this.handleClick}>Click</button>
// Need to manually forward events to external
this.dispatchEvent(new CustomEvent('click', { bubbles: true, composed: true }));
```

### Selection Guide

#### Use LightComponent When:

- ✅ Need integration with third-party libraries (EditorJS, Chart.js, etc.)
- ✅ Building routing or layout container components
- ✅ Need global DOM access
- ✅ Need natural event bubbling
- ✅ Don't need strict style isolation
- ✅ Pursue lighter implementation

#### Use WebComponent When:

- ✅ Building reusable UI components (buttons, inputs, etc.)
- ✅ Need complete style isolation
- ✅ Need focus retention functionality
- ✅ Components need complete encapsulation
- ✅ Avoiding style conflicts is primary concern

### Code Example Comparison

#### Same: Reactive State

```tsx
// Both use the same reactive API
export class Counter extends LightComponent { // or WebComponent
  // ✅ @state decorator must have initial value
  @state private count = 0;
  
  render() {
    // Use directly, no need for this.state.xxx
    return (
      <div>
        <p>Count: {this.count}</p>
        <button onClick={() => this.count++}>+</button>
      </div>
    );
  }
}
```

**Note**: Properties with `@state` decorator must have initial values. ESLint rules and Babel plugin will validate this.

#### Different: DOM Access

```tsx
// LightComponent - Can access global DOM
export class EditorWrapper extends LightComponent {
  protected onConnected() {
    // ✅ Can access global DOM
    const globalElement = document.querySelector('.global-class');
    this.editor = new EditorJS({ holder: this.querySelector('#editor') });
  }
}

// WebComponent - Shadow DOM isolation
export class EditorWrapper extends WebComponent {
  protected onConnected() {
    // ⚠️ Can only access Shadow DOM interior
    const shadowElement = this.shadowRoot.querySelector('.shadow-class');
    // document.querySelector cannot access Shadow DOM content
  }
}
```

### Summary

- **LightComponent**: Simple, lightweight, suitable for integration, uses Light DOM
- **WebComponent**: Encapsulated, isolated, suitable for UI components, uses Shadow DOM
- **Common**: Both support complete reactive state management (`reactive()` and `useState()` methods)
- **Selection Principle**: Decide based on whether style isolation and third-party library integration are needed

## FAQ

### Q: Does LightComponent support Shadow DOM?

A: No. `LightComponent` is specifically designed not to use Shadow DOM to enable integration with third-party libraries. If you need Shadow DOM, use `WebComponent`.

### Q: Will styles be globally polluted?

A: `LightComponent` uses scoped styles (via data attributes), but the isolation is not as strong as Shadow DOM. It's recommended to use unique `styleName` and BEM naming conventions to avoid conflicts.

### Q: Will reactive state be automatically cleaned up?

A: Yes. In `disconnectedCallback`, all reactive state will be automatically cleaned up.

### Q: Can I use slot in LightComponent?

A: Yes, but you need to use native slot syntax, because Light DOM doesn't support Shadow DOM's slot mechanism.

```tsx
render() {
  return (
    <div>
      <slot></slot>
    </div>
  );
}
```

### Q: How to automatically inject CSS styles?

A: WSXJS provides intelligent CSS auto-injection. If a component file `MyComponent.wsx` has a corresponding `MyComponent.css` file, the Babel plugin will automatically:

1. **Auto-import CSS**: `import styles from "./MyComponent.css?inline";`
2. **Auto-inject as class property**: `private _autoStyles = styles;`
3. **Auto-apply styles**: Base class will automatically detect and use `_autoStyles`

**Usage**:

```tsx
// MyComponent.wsx - No need to manually import CSS
import { LightComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister()
export class MyComponent extends LightComponent {
  constructor() {
    super({
      styleName: 'my-component', // Only need to specify styleName
    });
  }

  render() {
    return <div class="my-component">Content</div>;
  }
}
```

```css
/* MyComponent.css - Auto-injected */
.my-component {
  padding: 1rem;
  background: white;
}
```

**Notes**:
- ✅ File naming convention: `Component.wsx` → `Component.css` (must be in the same directory)
- ✅ If CSS is manually imported, Babel plugin will detect and skip auto-injection to avoid duplication
- ✅ Supports WebComponent and LightComponent
- 📖 See [RFC-0008](../rfcs/0008-auto-style-injection.md) for detailed explanation

### Q: Why must @state decorator have initial values?

A: The `@state` decorator must have initial values because:

1. **Type detection**: Babel plugin needs initial value to determine property type (primitive vs object/array)
   - Primitive (number, string, boolean) → use `useState`
   - Object/Array → use `reactive`

2. **Code generation**: Babel plugin needs to extract initial value from AST to generate initialization code in constructor

3. **Type safety**: Ensure state has explicit type and initial value to avoid runtime errors

**Validation mechanism**:
- ✅ **ESLint rule**: `wsx/state-requires-initial-value` checks during development
- ✅ **Babel plugin**: Validates at build time, missing initial values will cause build failure

**Valid examples**:
```tsx
@state private count = 0;           // ✅
@state private name = "";           // ✅
@state private user = {};           // ✅
@state private items = [];          // ✅
```

**Invalid examples**:
```tsx
@state private count;               // ❌ Missing initial value
@state private name;                 // ❌ Missing initial value
```

See [RFC-0013](../rfcs/completed/0013-state-initial-value-validation.md) for detailed explanation.

## Summary

`LightComponent` provides a simple and powerful way to create custom elements, especially suitable for:

- Scenarios requiring integration with third-party libraries
- Routing and layout components
- Simple components that don't need style isolation

It provides complete reactive state management, JSX support, and lifecycle hooks, making it simple and efficient to write custom elements.
