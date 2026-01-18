---
title: WSXJS Design Philosophy
order: 4
category: guide/core-concepts
description: "WSXJS is a native-first Web Components framework dedicated to providing the closest experience to native Web development"
---

## Overview

WSXJS is a **native-first** Web Components framework dedicated to providing the closest experience to native Web development while maintaining the convenience of modern frameworks.

## Core Design Principles

### 1. Native-First

WSXJS prioritizes native Web standards and APIs over creating abstraction layers.

#### Example: class vs className

```jsx
// ✅ WSXJS - Uses native HTML attribute names
<div class="container">
  <button class="btn btn-primary">Click me</button>
</div>

// ❌ React - Uses JavaScriptized attribute names
<div className="container">
  <button className="btn btn-primary">Click me</button>
</div>
```

**Design Rationale**:
- `class` is the standard HTML attribute name
- Avoids JavaScript reserved word conflicts
- More aligned with native Web development habits
- Reduces learning curve

**Compatibility**: WSX supports both `class` and `className` to ensure smooth migration for React developers.

### 2. Zero Dependencies

The framework core has no dependencies on third-party libraries, ensuring:
- Smaller bundle size
- Faster load times
- Better performance
- Avoids dependency conflicts

### 3. Progressive Enhancement

```jsx
// Start with simple HTML
<div>Hello World</div>

// Gradually add interactivity
<div onClick={this.handleClick}>Click me</div>

// Finally become a complete Web Component
class MyComponent extends WebComponent {
  render() {
    return <div onClick={this.handleClick}>Enhanced Component</div>
  }
}
```

### 4. Standards Compliant

- Fully compatible with Web Components standards
- Supports Shadow DOM
- Supports Custom Elements
- Supports HTML Templates

## Comparison with React

| Feature | WSXJS | React |
|---------|-------|-------|
| Attribute Names | `class` | `className` |
| Event Handling | `onClick` | `onClick` |
| Component Definition | Native Classes | Function/Class Components |
| State Management | Native Properties | useState/useReducer |
| Lifecycle | Native Lifecycle | useEffect/useLayoutEffect |
| Rendering | Native DOM | Virtual DOM |

## Performance Advantages

### 1. No Virtual DOM

```jsx
// WSX - Direct DOM manipulation
render() {
  return <div class="container">Content</div>
}

// React - Through Virtual DOM
render() {
  return <div className="container">Content</div>
}
```

### 2. Smaller Runtime

- No Virtual DOM diff algorithm
- No state management library
- No event system abstraction

### 3. Native Performance

- Direct use of browser optimizations
- No additional abstraction layer overhead
- Less memory usage

## Developer Experience

### 1. Familiar Syntax

```jsx
// Use standard JSX syntax
class MyButton extends WebComponent {
  render() {
    return (
      <button 
        class="btn btn-primary"
        onClick={this.handleClick}
        disabled={this.disabled}
      >
        {this.text}
      </button>
    )
  }
}
```

### 2. TypeScript Support

```typescript
interface ButtonProps {
  text: string
  disabled?: boolean
  onClick?: (event: Event) => void
}

class MyButton extends WebComponent<ButtonProps> {
  // Full type safety
}
```

### 3. Toolchain Integration

- ESLint plugin support
- Vite plugin support
- Automatic type generation

## Migration Guide

### Migrating from React

1. **Attribute Name Adjustment**
   ```jsx
   // React
   <div className="container">
   
   // WSX
   <div class="container">
   ```

2. **Component Definition**
   ```jsx
   // React
   function MyComponent(props) {
     return <div>{props.text}</div>
   }
   
   // WSX
   class MyComponent extends WebComponent {
     render() {
       return <div>{this.text}</div>
     }
   }
   ```

3. **State Management**
   ```jsx
   // React
   const [count, setCount] = useState(0)
   
   // WSX
   class MyComponent extends WebComponent {
     count = 0
     
     increment() {
       this.count++
       this.update()
     }
   }
   ```

## Best Practices

### 1. Use Native Attribute Names

```jsx
// ✅ Recommended
<div class="container" tabindex="0">
  <input type="text" autocomplete="off" />
</div>

// ❌ Avoid
<div className="container" tabIndex="0">
  <input type="text" autoComplete="off" />
</div>
```

### 2. Leverage Native Lifecycle

```jsx
class MyComponent extends WebComponent {
  connectedCallback() {
    // When component mounts
  }
  
  disconnectedCallback() {
    // When component unmounts
  }
  
  attributeChangedCallback() {
    // When attributes change
  }
}
```

### 3. Use Shadow DOM

```jsx
class MyComponent extends WebComponent {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }
  
  render() {
    return <div class="isolated-component">Content</div>
  }
}
```

## Summary

WSXJS's design philosophy is **return to native, embrace standards**. By using native Web technologies, we gain:

- **Better Performance** - No abstraction layer overhead
- **Smaller Size** - Zero dependencies
- **Better Compatibility** - Standard Web APIs
- **Simpler Learning Curve** - Native concepts

At the same time, we maintain the convenience of modern frameworks, allowing developers to efficiently build high-quality Web Components.
