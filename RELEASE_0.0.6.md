# WSX Framework 0.0.6 Release Notes

## 🎉 Major Features

### ReactiveWebComponent

A new base class that extends `WebComponent` with reactive state management capabilities:

```tsx
import { ReactiveWebComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister()
export class Counter extends ReactiveWebComponent {
  private state = this.reactive({ count: 0 });
  
  render() {
    return (
      <div>
        <p>Count: {this.state.count}</p>
        <button onClick={() => this.state.count++}>Increment</button>
      </div>
    );
  }
}
```

**Features:**
- ✅ Full reactive state support with `reactive()` and `useState()`
- ✅ Automatic re-rendering on state changes
- ✅ Focus preservation during re-renders
- ✅ Debug mode for reactive state tracking
- ✅ Based on native Proxy API - zero framework overhead

### LightComponent Reactive Support

`LightComponent` now supports the same reactive API as `ReactiveWebComponent`:

```tsx
import { LightComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister()
export class EditorDemo extends LightComponent {
  private state = this.reactive({ content: '' });
  
  render() {
    return <div id="editor">{/* EditorJS can access this */}</div>;
  }
}
```

**Perfect for:**
- Third-party library integration (EditorJS, Chart.js, etc.)
- Routing and layout containers
- Components that need global DOM access

## 📚 Documentation

### New Guides

- **LightComponent Guide** (`docs/LIGHT_COMPONENT_GUIDE.md`)
  - Complete usage guide
  - Best practices
  - Real-world examples
  - Component comparison

### Updated Documentation

- README with component type comparison
- Enhanced architecture documentation
- Reactive state system examples

## 🔧 Technical Details

### Reactive State System

The reactive system is completely independent of the DOM rendering strategy:

- Works with both Shadow DOM (`ReactiveWebComponent`) and Light DOM (`LightComponent`)
- Based on native Proxy API
- Zero framework overhead
- Automatic re-rendering on state changes

### Component Architecture

```
HTMLElement
├── WebComponent (Shadow DOM)
│   └── ReactiveWebComponent (Shadow DOM + Reactive)
└── LightComponent (Light DOM + Reactive)
```

## 📦 Updated Packages

All packages updated to version 0.0.6:

- `@wsxjs/wsx-core` - Core framework with reactive support
- `@wsxjs/wsx-vite-plugin` - Vite integration
- `@wsxjs/eslint-plugin-wsx` - ESLint rules
- `@wsxjs/wsx-router` - Router package
- `@wsxjs/wsx-base-components` - Base UI components

## 🚀 Migration Guide

### No Breaking Changes

All changes are backward compatible. Existing components continue to work without modification.

### Using ReactiveWebComponent

If you want to add reactive state to existing `WebComponent` classes:

```tsx
// Before
export class MyComponent extends WebComponent {
  private count = 0;
  
  increment() {
    this.count++;
    this.rerender(); // Manual re-render
  }
}

// After
export class MyComponent extends ReactiveWebComponent {
  private state = this.reactive({ count: 0 });
  
  increment() {
    this.state.count++; // Automatic re-render!
  }
}
```

### Using LightComponent with Reactive State

```tsx
// LightComponent now supports reactive state
export class MyComponent extends LightComponent {
  private state = this.reactive({ data: [] });
  
  render() {
    return <div>{/* Your JSX */}</div>;
  }
}
```

## 🎯 What's Next

- Enhanced component composition patterns
- More examples and use cases
- Performance optimizations
- Additional utility functions

## 🙏 Thank You

Thank you for using WSX Framework! We're excited to see what you build with the new reactive capabilities.

For questions and feedback, please visit our [GitHub repository](https://github.com/wsxjs/wsxjs).

