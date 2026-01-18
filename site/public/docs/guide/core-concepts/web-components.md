---
title: WebComponent Guide
order: 1
category: guide/core-concepts
description: "WebComponent is the standard custom element base class provided by WSXJS, using Shadow DOM to provide complete style isolation and encapsulation"
---

## Overview

`WebComponent` is the standard custom element base class provided by WSXJS, using Shadow DOM to provide complete style isolation and encapsulation. It is the preferred choice for building reusable UI components, especially suitable for scenarios requiring style isolation and complete encapsulation.

## Why Use WebComponent?

### Use Cases

1. **Reusable UI Components**
   - Common components like buttons, inputs, cards, etc.
   - Components requiring complete style isolation
   - Component library development

2. **Style Isolation Requirements**
   - Avoid style conflicts
   - Components requiring complete encapsulation
   - Component styles should not affect external elements

3. **Focus Preservation**
   - Form input components
   - Scenarios requiring user input focus preservation
   - Maintain interaction state during dynamic content updates

4. **Complete Encapsulation**
   - Component internal implementation details need to be hidden
   - Prevent external styles and scripts from interfering
   - Provide stable component API

### Not Suitable For

- Need to integrate with third-party libraries (EditorJS, Chart.js, etc.) → Use `LightComponent`
- Need global DOM access → Use `LightComponent`
- Need events to naturally bubble to document level → Use `LightComponent`

## Quick Start

### Basic Usage

**Method 1: Automatic CSS Injection (Recommended)**

If a `MyButton.css` file exists for the component file `MyButton.wsx`, the Babel plugin will automatically inject CSS without manual import:

```tsx
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
// CSS auto-injection: If MyButton.css exists, it will be automatically imported and injected as _autoStyles

@autoRegister('my-button')
export class MyButton extends WebComponent {
  // No constructor needed, styles will be automatically applied
  // Or just specify styleName (if needed)
  constructor() {
    super({ styleName: 'my-button' });
  }

  render() {
    return (
      <button class="btn">
        <slot />
      </button>
    );
  }
}
```

**Method 2: Manual CSS Import (Optional)**

If manual control is needed, you can also explicitly import:

```tsx
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
import styles from './MyButton.css?inline';

@autoRegister('my-button')
export class MyButton extends WebComponent {
  constructor() {
    super({ styles });
  }

  render() {
    return (
      <button class="btn">
        <slot />
      </button>
    );
  }
}
```

**Note**: If CSS is manually imported, the Babel plugin will detect it and skip auto-injection to avoid duplication.

### Using Reactive State

`WebComponent` fully supports reactive state management, providing three approaches:

#### Method 1: Using @state Decorator (Recommended)

Using the `@state` decorator is the most concise approach, and the Babel plugin will automatically process it at compile time:

```tsx
import { WebComponent, autoRegister, state } from '@wsxjs/wsx-core';

@autoRegister('wsx-counter')
export class Counter extends WebComponent {
  constructor() {
    super({ styles });
  }

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
- ⚠️ Properties with the `@state` decorator **must have initial values**
- ✅ ESLint rule `wsx/state-requires-initial-value` checks at development time
- ✅ Babel plugin validates at build time, missing initial values will cause build failure
- 📖 See [RFC-0013](./rfcs/completed/0013-state-initial-value-validation.md) for detailed explanation

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
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister('wsx-counter')
export class Counter extends WebComponent {
  constructor() {
    super({ styles });
  }

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
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister('wsx-todo-list')
export class TodoList extends WebComponent {
  constructor() {
    super({ styles });
  }

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

### 1. Shadow DOM Style Isolation

`WebComponent` uses Shadow DOM to provide complete style isolation.

#### Automatic CSS Injection (Recommended)

WSXJS provides intelligent CSS auto-injection. If a `MyButton.css` file exists for the component file `MyButton.wsx`, the Babel plugin will automatically:

1. Auto-import CSS file: `import styles from "./MyButton.css?inline";`
2. Auto-inject as class property: `private _autoStyles = styles;`
3. Auto-apply styles: The base class will automatically detect and use `_autoStyles`

**No Manual Import Needed**:

```tsx
// MyButton.wsx
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
// CSS auto-injection: If MyButton.css exists, it will be automatically processed

@autoRegister('my-button')
export class MyButton extends WebComponent {
  // No constructor needed, or just specify styleName
  constructor() {
    super({ styleName: 'my-button' });
  }

  render() {
    return <button class="btn">Click me</button>;
  }
}
```

```css
/* MyButton.css - Auto-injected */
.btn {
  padding: 10px 20px;
  background: blue;
  color: white;
}
```

**Manual CSS Import (Optional)**:

If manual control is needed, you can also explicitly import. The Babel plugin will detect manual imports and skip auto-injection:

```tsx
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
import styles from './MyButton.css?inline'; // Manual import

@autoRegister('my-button')
export class MyButton extends WebComponent {
  constructor() {
    super({ styles }); // Manual pass
  }

  render() {
    return <button class="btn">Click me</button>;
  }
}
```

**Advantages**:
- ✅ Complete style isolation, won't affect external elements
- ✅ External styles won't affect component internals
- ✅ Uses Constructable StyleSheets for better performance
- ✅ Automatic CSS injection reduces boilerplate code
- ✅ Unified file naming convention (`Component.wsx` → `Component.css`)

### 2. JSX Support

`WebComponent` fully supports JSX syntax, compiled to native DOM operations:

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

### 3. Reactive State Management

#### @state Decorator (Recommended)

Using the `@state` decorator is the most concise approach, and the Babel plugin will automatically process it at compile time:

```tsx
import { state } from '@wsxjs/wsx-core';

export class MyComponent extends WebComponent {
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
- ⚠️ **Must have initial value**: Properties with the `@state` decorator must provide initial values
- ✅ **Automatic type detection**: Babel plugin automatically chooses `useState` (primitive) or `reactive` (object/array) based on initial value
- ✅ **Compile-time validation**: Missing initial values will cause build failure
- ✅ **Development-time checks**: ESLint rules provide real-time hints in the editor

**Why are initial values required?**
1. Babel plugin needs initial values to determine property types (primitive vs object/array)
2. Need to extract initial values from AST to generate initialization code in constructor
3. Ensure state has explicit types to avoid runtime errors

#### reactive() Method

Create reactive objects that automatically trigger re-renders when properties change:

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

### 4. Lifecycle Hooks

```tsx
export class MyComponent extends WebComponent {
  // Called after component is connected to DOM
  protected onConnected() {
    console.log('Component connected');
    // Initialization logic
    this.init();
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

### 5. Focus Preservation

`WebComponent` supports focus preservation, maintaining user input focus during re-renders:

```tsx
export class FormInput extends WebComponent {
  @state private value = "";

  render() {
    return (
      <input
        type="text"
        value={this.value}
        onInput={(e) => {
          this.value = (e.target as HTMLInputElement).value;
        }}
        data-wsx-key="input" // For focus preservation
      />
    );
  }
}
```

When `value` changes trigger a re-render, the input's focus and cursor position are automatically preserved.

### 6. Error Handling

`WebComponent` has built-in error handling:

```tsx
render() {
  try {
    return <div>{/* your content */}</div>;
  } catch (error) {
    // Errors are automatically caught and display friendly error messages
    throw error;
  }
}
```

## Practical Examples

### Example 1: Button Component

```tsx
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
import styles from './Button.css?inline';

@autoRegister('wsx-button')
export class Button extends WebComponent {
  static observedAttributes = ['variant', 'disabled'];

  constructor() {
    super({ styles });
  }

  @state private clicked = false;

  protected onAttributeChanged(name: string, _old: string, newValue: string) {
    if (name === 'disabled') {
      this.rerender();
    }
  }

  private handleClick = () => {
    this.clicked = true;
    this.dispatchEvent(new CustomEvent('click', { 
      bubbles: true, 
      composed: true 
    }));
  };

  render() {
    const variant = this.getAttribute('variant') || 'primary';
    const disabled = this.hasAttribute('disabled');
    
    return (
      <button
        class={`btn btn-${variant}`}
        disabled={disabled}
        onClick={this.handleClick}
      >
        <slot />
        {this.clicked && <span> ✓</span>}
      </button>
    );
  }
}
```

### Example 2: Form Input Component

```tsx
import { WebComponent, autoRegister, state } from '@wsxjs/wsx-core';
import styles from './FormInput.css?inline';

@autoRegister('wsx-form-input')
export class FormInput extends WebComponent {
  static observedAttributes = ['label', 'type', 'placeholder'];

  constructor() {
    super({ styles });
  }

  @state private value = "";
  @state private focused = false;

  protected onAttributeChanged(name: string, _old: string, newValue: string) {
    if (name === 'type' || name === 'placeholder') {
      this.rerender();
    }
  }

  private handleInput = (e: Event) => {
    this.value = (e.target as HTMLInputElement).value;
  };

  private handleFocus = () => {
    this.focused = true;
  };

  private handleBlur = () => {
    this.focused = false;
  };

  render() {
    const label = this.getAttribute('label') || '';
    const type = this.getAttribute('type') || 'text';
    const placeholder = this.getAttribute('placeholder') || '';

    return (
      <div class={`form-input ${this.focused ? 'focused' : ''}`}>
        {label && <label>{label}</label>}
        <input
          type={type}
          placeholder={placeholder}
          value={this.value}
          onInput={this.handleInput}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          data-wsx-key="input"
        />
      </div>
    );
  }
}
```

### Example 3: Card Component

```tsx
import { WebComponent, autoRegister, state } from '@wsxjs/wsx-core';
import styles from './Card.css?inline';

@autoRegister('wsx-card')
export class Card extends WebComponent {
  constructor() {
    super({ styles });
  }

  @state private expanded = false;

  private toggleExpand = () => {
    this.expanded = !this.expanded;
  };

  render() {
    return (
      <div class="card">
        <div class="card-header">
          <slot name="header" />
          <button onClick={this.toggleExpand}>
            {this.expanded ? '−' : '+'}
          </button>
        </div>
        {this.expanded && (
          <div class="card-body">
            <slot name="body" />
          </div>
        )}
      </div>
    );
  }
}
```

## Best Practices

### 1. Style Isolation

Leverage Shadow DOM's style isolation without worrying about style conflicts:

```tsx
super({
  styles: `
    /* Styles are completely isolated, won't affect external */
    .btn {
      padding: 10px;
      background: blue;
    }
  `
});
```

### 2. Event Forwarding

If events need to bubble to external, use `composed: true`:

```tsx
private handleClick = () => {
  this.dispatchEvent(new CustomEvent('click', { 
    bubbles: true,    // Allow bubbling
    composed: true    // Allow crossing Shadow DOM boundary
  }));
};
```

### 3. Reactive State Management

Use reactive state appropriately, avoid overuse:

```tsx
// ✅ Good: Only use reactive for data that needs to trigger re-renders
@state private uiState = { count: 0, visible: true };
private staticConfig = { maxCount: 100 }; // No need for reactive

// ❌ Avoid: Using reactive for static data
@state private staticData = { apiUrl: 'https://api.example.com' };
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

### 5. Focus Preservation

For form input components, use `data-wsx-key` attribute to enable focus preservation:

```tsx
<input
  data-wsx-key="input"
  value={this.value}
  onInput={(e) => {
    this.value = (e.target as HTMLInputElement).value;
  }}
/>
```

## Component Comparison: WebComponent vs LightComponent

### Core Differences

| Feature | WebComponent | LightComponent |
|---------|--------------|----------------|
| **Inheritance** | `HTMLElement` | `HTMLElement` |
| **DOM Type** | Shadow DOM | Light DOM |
| **Style Isolation** | Complete isolation (Shadow DOM) | Scoped styles (data attributes) |
| **Reactive Support** | ✅ Full support | ✅ Full support |
| **Third-party Integration** | ⚠️ Limited support | ✅ Perfect support |
| **Global DOM Access** | ❌ Restricted (Shadow DOM boundary) | ✅ Supported |
| **Event Bubbling** | ⚠️ Manual forwarding needed | ✅ Natural bubbling |
| **Focus Preservation** | ✅ Supported | ❌ Not supported |
| **Style Scope** | Automatic isolation | Manual management (BEM/naming conventions) |
| **Performance** | Slightly heavier (Shadow DOM overhead) | Lighter |

### Detailed Comparison

#### 1. DOM Rendering

**WebComponent:**
```tsx
// Render to Shadow DOM
render() {
  return <div>Content</div>; // Added to this.shadowRoot
}
// DOM structure: <my-component>#shadow-root<div>Content</div></my-component>
```

**LightComponent:**
```tsx
// Render to Light DOM (directly to component internals)
render() {
  return <div>Content</div>; // Directly added to this
}
// DOM structure: <my-component><div>Content</div></my-component>
```

#### 2. Style Handling

**WebComponent:**
```tsx
// Use Shadow DOM for automatic isolation
super({
  styles: 'div { color: red; }', // Automatically isolated, won't affect external
});
// Styles are completely isolated, won't affect external styles
```

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

#### 3. Third-party Library Integration

**WebComponent:**
```tsx
// ⚠️ EditorJS may not work properly
protected onConnected() {
  this.editor = new EditorJS({
    holder: this.shadowRoot.querySelector('#editor'), // ⚠️ In Shadow DOM
    // But EditorJS's global queries may fail
  });
}
```

**LightComponent:**
```tsx
// ✅ EditorJS works properly
protected onConnected() {
  this.editor = new EditorJS({
    holder: this.querySelector('#editor'), // ✅ Can find element
  });
}
```

#### 4. Reactive API

Both use **exactly the same reactive API**:

```tsx
// Both support
@state private count = 0;
private state = this.reactive({ count: 0 });
private [count, setCount] = this.useState('count', 0);
```

#### 5. Element Queries

**WebComponent:**
```tsx
// Query Shadow DOM
this.shadowRoot.querySelector('.item'); // Query Shadow DOM
// document.querySelector cannot access Shadow DOM content
```

**LightComponent:**
```tsx
// Direct query, consistent with standard DOM
this.querySelector('.item'); // Query component internals
document.querySelector('.item'); // Can query globally
```

#### 6. Event Handling

**WebComponent:**
```tsx
// Events don't bubble to external by default (Shadow DOM boundary)
<button onClick={this.handleClick}>Click</button>
// Need to manually forward events to external
this.dispatchEvent(new CustomEvent('click', { bubbles: true, composed: true }));
```

**LightComponent:**
```tsx
// Events naturally bubble
<button onClick={this.handleClick}>Click</button>
// Events naturally bubble to document
```

### Selection Guide

#### Use WebComponent when:

- ✅ Building reusable UI components (buttons, inputs, etc.)
- ✅ Need complete style isolation
- ✅ Need focus preservation
- ✅ Component needs complete encapsulation
- ✅ Avoiding style conflicts is a primary concern

#### Use LightComponent when:

- ✅ Need to integrate with third-party libraries (EditorJS, Chart.js, etc.)
- ✅ Building routing or layout container components
- ✅ Need global DOM access
- ✅ Need events to naturally bubble
- ✅ Don't need strict style isolation
- ✅ Pursuing lighter implementation

### Code Example Comparison

#### Same: Reactive State

```tsx
// Both use the same reactive API
export class Counter extends WebComponent { // or LightComponent
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

**Note**: Properties with the `@state` decorator must have initial values. ESLint rules and Babel plugin will validate this.

#### Different: DOM Access

```tsx
// WebComponent - Shadow DOM isolation
export class EditorWrapper extends WebComponent {
  protected onConnected() {
    // ⚠️ Can only access Shadow DOM internals
    const shadowElement = this.shadowRoot.querySelector('.shadow-class');
    // document.querySelector cannot access Shadow DOM content
  }
}

// LightComponent - Can access global DOM
export class EditorWrapper extends LightComponent {
  protected onConnected() {
    // ✅ Can access global DOM
    const globalElement = document.querySelector('.global-class');
    this.editor = new EditorJS({ holder: this.querySelector('#editor') });
  }
}
```

### Summary

- **WebComponent**: Encapsulation, isolation, suitable for UI components, uses Shadow DOM
- **LightComponent**: Simple, lightweight, suitable for integration, uses Light DOM
- **Common**: Both support complete reactive state management (`@state` decorator, `reactive()` and `useState()` methods)
- **Selection Principle**: Decide based on whether style isolation and third-party library integration are needed

## FAQ

### Q: Does WebComponent support Light DOM?

A: No. `WebComponent` is specifically designed to use Shadow DOM, providing complete style isolation. If you need Light DOM, please use `LightComponent`.

### Q: Does Shadow DOM affect performance?

A: Shadow DOM has slight performance overhead, but it's usually negligible. For most UI components, the style isolation and encapsulation benefits of Shadow DOM far outweigh the performance cost.

### Q: How to make external styles affect Shadow DOM?

A: By default, external styles cannot affect Shadow DOM internals. If external styles are needed, you can use CSS variables (CSS Custom Properties):

```tsx
// Inside component
super({
  styles: `
    .btn {
      background: var(--button-bg, blue);
      color: var(--button-color, white);
    }
  `
});

// External usage
<style>
  my-button {
    --button-bg: red;
    --button-color: yellow;
  }
</style>
```

### Q: Are reactive states automatically cleaned up?

A: Yes. In `disconnectedCallback`, all reactive states are automatically cleaned up.

### Q: Can I use slots in WebComponent?

A: Yes, Shadow DOM fully supports the slot mechanism:

```tsx
render() {
  return (
    <div>
      <slot name="header"></slot>
      <slot></slot>
      <slot name="footer"></slot>
    </div>
  );
}
```

### Q: How to automatically inject CSS styles?

A: WSXJS provides intelligent CSS auto-injection. If a `MyComponent.css` file exists for the component file `MyComponent.wsx`, the Babel plugin will automatically:

1. **Auto-import CSS**: `import styles from "./MyComponent.css?inline";`
2. **Auto-inject class property**: `private _autoStyles = styles;`
3. **Auto-apply styles**: Base class will automatically detect and use `_autoStyles`

**Usage**:

```tsx
// MyComponent.wsx - No need to manually import CSS
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister('my-component')
export class MyComponent extends WebComponent {
  // No constructor needed, or just specify styleName
  constructor() {
    super({ styleName: 'my-component' });
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
- ✅ File naming convention: `Component.wsx` → `Component.css` (must be in same directory)
- ✅ If CSS is manually imported, Babel plugin will detect and skip auto-injection to avoid duplication
- ✅ Supports both WebComponent and LightComponent
- 📖 See [RFC-0008](../rfcs/0008-auto-style-injection.md) for detailed explanation

### Q: Why must @state decorator have initial values?

A: The `@state` decorator must have initial values because:

1. **Type Detection**: Babel plugin needs initial values to determine property types (primitive vs object/array)
   - Primitive (numbers, strings, booleans) → use `useState`
   - Object/Array → use `reactive`

2. **Code Generation**: Babel plugin needs to extract initial values from AST to generate initialization code in constructor

3. **Type Safety**: Ensure state has explicit types and initial values to avoid runtime errors

**Validation Mechanisms**:
- ✅ **ESLint Rule**: `wsx/state-requires-initial-value` checks at development time
- ✅ **Babel Plugin**: Validates at build time, missing initial values will cause build failure

**Valid Examples**:
```tsx
@state private count = 0;           // ✅
@state private name = "";           // ✅
@state private user = {};           // ✅
@state private items = [];          // ✅
```

**Invalid Examples**:
```tsx
@state private count;               // ❌ Missing initial value
@state private name;                 // ❌ Missing initial value
```

See [RFC-0013](./rfcs/completed/0013-state-initial-value-validation.md) for detailed explanation.

## Summary

`WebComponent` provides a powerful and encapsulated way to create custom elements, especially suitable for:

- Building reusable UI components
- Scenarios requiring complete style isolation
- Form components requiring focus preservation
- Component library development

It provides complete reactive state management, JSX support, lifecycle hooks, and focus preservation, making writing custom elements simple and efficient.
