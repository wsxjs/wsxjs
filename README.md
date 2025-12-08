# WSX Framework (@wsxjs)

[![npm version](https://badge.fury.io/js/@wsxjs%2Fwsx-core.svg)](https://badge.fury.io/js/@wsxjs%2Fwsx-core)
[![npm downloads](https://img.shields.io/npm/dm/@wsxjs/wsx-core.svg)](https://www.npmjs.com/package/@wsxjs/wsx-core)
[![CI Status](https://github.com/wsxjs/wsxjs/workflows/CI/badge.svg)](https://github.com/wsxjs/wsxjs/actions)
[![Coverage Status](https://codecov.io/gh/wsxjs/wsxjs/branch/main/graph/badge.svg)](https://codecov.io/gh/wsxjs/wsxjs)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**JSX syntax sugar for native Web Components - Not a framework, just better developer experience.**

## 🚀 Live Demo

**[View Examples on GitHub Pages →](https://www.wsxjs.dev/)**

Experience WSX Framework in action with our interactive examples showcasing:
- Zero-dependency Web Components with JSX syntax
- Router-based navigation
- Theme switching
- Component library examples

## Why WSX Exists

WSX has one simple purpose: **Make Web Components development as enjoyable as writing JSX**, while keeping everything 100% native.

### What WSX Is
- ✅ **JSX syntax compiler** for native Web Components
- ✅ **TypeScript integration** with full IntelliSense
- ✅ **Development tools** (Vite plugin, ESLint rules)
- ✅ **Zero runtime overhead** - compiles to native DOM operations

### What WSX Is NOT
- ❌ Not a React/Vue replacement or alternative
- ❌ Not a state management system
- ❌ Not a virtual DOM implementation
- ❌ Not a component lifecycle reimplementation

## Design Philosophy

WSX embodies a philosophy of restraint and respect for Web standards:

**Core Principles:**
- ✨ **Don't "improve" what browsers already optimize** - Web Components are battle-tested
- ⚡ **Add zero runtime burden** - Compile-time sugar, not runtime framework
- 🎯 **Create no new abstractions** - Use existing Web APIs and standards
- 💝 **Solve one specific problem** - Make Web Component development delightful

**The WSX Equation:**
```
JSX + Web Components = Modern Syntax + Native Performance
```

**Framework Design Philosophy:**
This represents the highest form of framework design: **subtraction over addition, enhancement over replacement**. WSX enables developers to write familiar JSX syntax while the foundation remains 100% native Web Components.

Such frameworks are truly sustainable - they won't become obsolete or abandoned because they're built on Web standards that evolve with the platform itself.

**Core Philosophy**: Trust the browser. Web Components are already optimized. JSX just makes them nicer to write.

```tsx
// Instead of this painful DOM manipulation...
render() {
    const div = document.createElement('div');
    div.className = 'container';
    const button = document.createElement('button');
    button.textContent = 'Click me';
    button.addEventListener('click', this.handleClick);
    div.appendChild(button);
    return div;
}

// Write this modern JSX syntax ✨
render() {
    return (
        <div class="container">
            <button onClick={this.handleClick}>Click me</button>
        </div>
    );
}
```

**Result**: Same native Web Component, better developer experience.

## Features

WSX provides essential tools to make Web Components development modern and enjoyable:

- 🎯 **Pure JSX Syntax Sugar** - Modern JSX syntax that compiles to native DOM operations
- 📦 **TypeScript First** - Full type safety and IntelliSense support  
- ⚡ **Zero Runtime Cost** - No virtual DOM, no framework overhead, just native Web Components
- 🔧 **Seamless Build Integration** - Vite plugin that "just works"
- 🎨 **Native Shadow DOM** - CSS scoping using browser's built-in capabilities
- 💡 **Reactive State System** - Lightweight reactivity based on Proxy API (`reactive`, `useState`)
- 🌐 **Light DOM Components** - `LightComponent` for third-party library integration with full reactive support
- 📝 **Developer Tooling** - ESLint rules, auto-registration decorators
- 🧪 **Testing Ready** - Jest setup with Web Components mocking
- 🎯 **Native SVG Support** - Proper namespace handling for SVG elements
- 🌐 **Web Standards Compliant** - Uses browser APIs, not proprietary abstractions

## Packages

### Published Packages

#### @wsxjs/wsx-core
[![npm version](https://badge.fury.io/js/@wsxjs%2Fwsx-core.svg)](https://badge.fury.io/js/@wsxjs%2Fwsx-core)
[![npm downloads](https://img.shields.io/npm/dm/@wsxjs/wsx-core.svg)](https://www.npmjs.com/package/@wsxjs/wsx-core)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@wsxjs/wsx-core.svg)](https://bundlephobia.com/result?p=@wsxjs/wsx-core)

Core framework with WebComponent base class, JSX factory, logger, and utilities

#### @wsxjs/wsx-vite-plugin
[![npm version](https://badge.fury.io/js/@wsxjs%2Fwsx-vite-plugin.svg)](https://badge.fury.io/js/@wsxjs%2Fwsx-vite-plugin)
[![npm downloads](https://img.shields.io/npm/dm/@wsxjs/wsx-vite-plugin.svg)](https://www.npmjs.com/package/@wsxjs/wsx-vite-plugin)
[![vite compatibility](https://img.shields.io/badge/vite-%3E%3D4.0.0-blueviolet.svg)](https://vitejs.dev/)

Vite integration for .wsx files (auto-injects JSX factory)

#### @wsxjs/eslint-plugin-wsx
[![npm version](https://badge.fury.io/js/@wsxjs%2Feslint-plugin-wsx.svg)](https://badge.fury.io/js/@wsxjs%2Feslint-plugin-wsx)
[![npm downloads](https://img.shields.io/npm/dm/@wsxjs/eslint-plugin-wsx.svg)](https://www.npmjs.com/package/@wsxjs/eslint-plugin-wsx)
[![eslint compatibility](https://img.shields.io/badge/eslint-%3E%3D8.0.0-orange.svg)](https://eslint.org/)

ESLint rules for WSX components

### Development Package
- **@wsxjs/wsx-examples** - Interactive showcase application with example components

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run examples
pnpm --filter @wsxjs/wsx-examples dev

# Run tests
pnpm test

# Start development with watch mode
pnpm dev

# Debug with Chrome DevTools
pnpm debug:wsx
```

## Creating a WSX Component

WSX components are **standard Web Components** with JSX syntax sugar:

```tsx
// MyComponent.wsx - This is a REAL Web Component
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
import styles from './MyComponent.css?inline';

@autoRegister() // Registers as <my-component> custom element
export class MyComponent extends WebComponent {
  constructor() {
    super({ styles }); // Native Shadow DOM with CSS
  }

  // JSX compiles to native DOM operations - no virtual DOM!
  render() {
    return (
      <div class="my-component">
        <h1>Hello WSX!</h1>
        <slot></slot>  {/* Native Web Component slot */}
      </div>
    );
  }
}
```

### What happens under the hood:
1. **JSX compiles** to `document.createElement()` calls
2. **Component registers** as native custom element
3. **Browser handles** rendering, lifecycle, and optimizations
4. **You get** modern syntax with zero runtime overhead

### The WSX Difference
- **Not a framework** - Your components ARE Web Components
- **Not a runtime** - JSX is just syntax sugar for DOM operations  
- **Not a replacement** - Enhances Web Components, doesn't replace them

## JSX Configuration

WSX Framework provides framework-level JSX support. Configure your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@wsxjs/wsx-core",
    "types": ["@wsxjs/wsx-core"]
  }
}
```

This enables complete JSX support without any React dependency!

**📖 [Complete TypeScript Setup Guide →](docs/TYPESCRIPT_SETUP.md)** - Detailed configuration, best practices, and troubleshooting

## Usage in HTML

Since WSX components are native Web Components, use them like any HTML element:

```html
<!-- Standard custom element - works everywhere -->
<my-component>
  <p>This content goes in the native slot</p>
</my-component>

<!-- Works with any framework or vanilla JavaScript -->
<script>
  // Native Web Component APIs work perfectly
  const component = document.querySelector('my-component');
  component.setAttribute('data', 'some value');
  
  // Or create programmatically  
  const newComponent = document.createElement('my-component');
  document.body.appendChild(newComponent);
</script>
```

**No framework lock-in** - Your WSX components work in React, Vue, Angular, or vanilla HTML!

## Component Types

WSX Framework provides three component base classes for different use cases:

### WebComponent (Shadow DOM)
Standard Web Component with Shadow DOM for style isolation:
```tsx
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister()
export class MyButton extends WebComponent {
  constructor() {
    super({ styles: 'button { color: blue; }' });
  }
  render() {
    return <button>Click me</button>;
  }
}
```

### ReactiveWebComponent (Shadow DOM + Reactive)
Extends `WebComponent` with reactive state management:
```tsx
import { ReactiveWebComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister()
export class Counter extends ReactiveWebComponent {
  private state = this.reactive({ count: 0 });
  render() {
    return <div>Count: {this.state.count}</div>;
  }
}
```

### LightComponent (Light DOM + Reactive)
Light DOM component with reactive support, perfect for third-party integration:
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

**📖 [Complete LightComponent Guide →](docs/LIGHT_COMPONENT_GUIDE.md)** - Learn when to use each component type

## Documentation

- [Quick Start Guide](docs/QUICK_START.md) - Get started with WSX Framework in minutes
- [TypeScript Setup Guide](docs/TYPESCRIPT_SETUP.md) - Complete TypeScript configuration and best practices
- [LightComponent Guide](docs/LIGHT_COMPONENT_GUIDE.md) - Complete guide to using LightComponent
- [JSX Support Guide](docs/JSX_SUPPORT.md) - Complete guide to JSX configuration and usage
- [Design Documentation](docs/WSX_DESIGN.md) - Framework architecture and design decisions
- [Development Plan](docs/WSX_PRACTICE_PLAN.md) - Development workflow and best practices
- [Chrome Debugging Guide](docs/chrome-debugging-guide.md) - Debug Web Components with Chrome DevTools
- [Roadmap](docs/ROADMAP.md) - Future development plans and feature timeline
- [Example Development Plan](docs/EXAMPLE_DEVELOPMENT_PLAN.md) - Plan for creating comprehensive examples

## Development

This monorepo uses pnpm workspaces with comprehensive development tooling:

### Prerequisites

- Node.js 16+ (18+ recommended)
- pnpm 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/wsxjs/wsxjs.git
cd wsx-framework

# Install dependencies
pnpm install
```

### Development Scripts

```bash
# Build all packages
pnpm build

# Development with watch mode
pnpm dev

# Chrome debugging
pnpm debug:chrome        # Start Chrome in debug mode
pnpm debug:wsx           # Start WSX app + Chrome debug mode

# Testing
pnpm test                 # Run all tests
pnpm test:coverage        # Run tests with coverage
pnpm test:watch          # Run tests in watch mode

# Code Quality
pnpm lint                # Run ESLint
pnpm lint:fix            # Fix ESLint issues automatically
pnpm format              # Format code with Prettier
pnpm format:check        # Check code formatting
pnpm typecheck           # Run TypeScript type checking

# Maintenance
pnpm clean               # Clean all build artifacts
```

### Project Structure

```
wsx-framework/
├── packages/
│   ├── core/              # Core framework
│   │   ├── src/
│   │   │   ├── WebComponent.ts     # Base component class
│   │   │   ├── jsx-factory.ts      # JSX runtime
│   │   │   ├── auto-register.ts    # Auto-registration
│   │   │   ├── logger.ts           # Logging utilities
│   │   │   └── styles/             # Style management
│   │   └── __tests__/             # Test files
│   ├── vite-plugin/       # Vite integration
│   ├── eslint-plugin/     # ESLint rules
│   ├── components/        # Pre-built components
│   └── examples/          # Example applications
├── scripts/               # Development scripts
│   └── debug-chrome.js    # Chrome debugging script
├── docs/                  # Documentation
│   └── chrome-debugging-guide.md  # Chrome debugging guide
├── test/                  # Global test setup
└── .github/              # GitHub Actions CI/CD
```

### Development Tooling

#### Code Quality
- **ESLint** - TypeScript and code quality rules
- **Prettier** - Code formatting
- **EditorConfig** - Cross-editor consistency
- **Husky** - Git hooks for pre-commit checks
- **lint-staged** - Run linters on staged files only

#### Testing
- **Jest** - Test runner with jsdom environment
- **@testing-library/jest-dom** - DOM testing utilities
- **Coverage** - Code coverage reporting
- **Web Components Mocking** - Custom elements and Shadow DOM mocks

#### Build System
- **tsup** - Fast TypeScript bundler
- **TypeScript** - Type checking and compilation
- **pnpm workspaces** - Monorepo package management

#### Debugging
- **Chrome DevTools** - Web Components debugging with Shadow DOM inspection
- **Browser Tools MCP** - Model Context Protocol integration for AI-assisted debugging
- **Remote Debugging** - Chrome remote debugging on port 9222

### VS Code Setup

The project includes VS Code configuration for optimal development experience:

- Auto-format on save
- ESLint integration
- TypeScript support
- File associations for `.wsx` files
- Recommended extensions

### Git Hooks

Pre-commit hooks automatically run:
- ESLint with auto-fix
- Prettier formatting
- TypeScript type checking

### Continuous Integration

GitHub Actions workflow includes:
- Linting and formatting checks
- TypeScript compilation
- Test execution with coverage
- Multi-version Node.js testing (16, 18, 20)

## Architecture

### Core Concepts

1. **WebComponent Base Class** - Abstract base for all WSX components
2. **JSX Factory** - Zero-dependency JSX implementation
3. **Auto Registration** - Decorator-based component registration
4. **Style Management** - Efficient CSS handling with Shadow DOM
5. **Logging** - Built-in logging system for debugging

### Component Lifecycle

```tsx
@autoRegister()
export class MyComponent extends WebComponent {
  // 1. Constructor - Component initialization
  constructor() {
    super({ styles });
  }

  // 2. render() - JSX rendering (required)
  render() {
    return <div>Content</div>;
  }

  // 3. connectedCallback - Component mounted
  protected onConnected() {
    // Component is in DOM
  }

  // 4. disconnectedCallback - Component unmounted
  protected onDisconnected() {
    // Cleanup
  }

  // 5. attributeChangedCallback - Attributes changed
  protected onAttributeChanged(name: string, oldValue: string, newValue: string) {
    // Handle attribute changes
  }
}
```

## SVG Support

WSX Framework provides native SVG support with proper namespace handling:

```tsx
@autoRegister()
export class SvgIcon extends WebComponent {
  render() {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="blue" />
        <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2" />
      </svg>
    );
  }
}
```

### Features

- **Automatic namespace detection** - SVG elements use `createElementNS` automatically
- **Proper attribute handling** - `className` converts to `class` for SVG elements
- **Full TypeScript support** - Complete type safety for SVG elements and attributes
- **Event handling** - Standard event listeners work on SVG elements
- **Mixed content** - Seamlessly mix HTML and SVG in the same component

### Example: Interactive SVG Chart

```tsx
@autoRegister()
export class SvgChart extends WebComponent {
  render() {
    const data = [30, 80, 45, 60];
    
    return (
      <svg width="300" height="200" viewBox="0 0 300 200">
        <defs>
          <linearGradient id="gradient">
            <stop offset="0%" stopColor="#3498db" />
            <stop offset="100%" stopColor="#9b59b6" />
          </linearGradient>
        </defs>
        
        {data.map((value, index) => (
          <rect
            key={index}
            x={index * 60 + 20}
            y={200 - value * 2}
            width="40"
            height={value * 2}
            fill="url(#gradient)"
            onClick={() => console.log(`Bar ${index}: ${value}`)}
          />
        ))}
      </svg>
    );
  }
}
```

## Installation

To use WSX Framework in your project:

```bash
# Install core framework
npm install @wsxjs/wsx-core

# Install additional packages as needed
npm install @wsxjs/wsx-base-components
npm install @wsxjs/wsx-vite-plugin
npm install @wsxjs/eslint-plugin-wsx
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Run linting: `pnpm lint:fix`
6. Commit changes: `git commit -m "feat: add my feature"`
7. Push to the branch: `git push origin feature/my-feature`
8. Submit a pull request

### Commit Convention

We use conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

## License

MIT

## Package Information

All packages are published under the `@wsxjs` npm organization:

- Core: `npm install @wsxjs/wsx-core`
- Vite Plugin: `npm install @wsxjs/wsx-vite-plugin` 
- ESLint Plugin: `npm install @wsxjs/eslint-plugin-wsx`
- Components: `npm install @wsxjs/wsx-base-components`

## Links

- **Repository**: https://github.com/wsxjs/wsxjs
- **Issues**: https://github.com/wsxjs/wsxjs/issues
- **NPM Organization**: https://www.npmjs.com/org/wsxjs

## Credits

Built with ❤️ by the WSX Framework team.

## Project Context

For comprehensive technical documentation and development context, see [CLAUDE.md](./CLAUDE.md) which contains detailed architecture information, development workflows, and troubleshooting guides.
