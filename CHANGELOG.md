# Changelog

All notable changes to the WSXJS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.8] - 2025-01-15

### Added

- **@wsxjs/wsx-tsconfig** - New package for shared TypeScript configuration
  - Provides pre-configured TypeScript settings for WSXJS projects
  - Includes all required options: JSX support, decorators, and type safety
  - Simplifies setup by extending `@wsxjs/wsx-tsconfig/tsconfig.base.json`
  - Reduces configuration errors and ensures consistency across projects

- **Automatic CSS Style Injection** - RFC 0008 implementation
  - Automatically detects and injects CSS files for WSX components
  - No need to manually import CSS or pass styles to constructor
  - Works with both `WebComponent` and `LightComponent`
  - Uses getter `get _autoStyles()` for lazy evaluation
  - Respects manual style imports (skips auto-injection if styles already imported)

### Changed

- **Babel Plugin Configuration** - Improved decorator handling
  - Added `@babel/plugin-proposal-decorators` with legacy mode for TypeScript compatibility
  - Removed unnecessary decorators transformation (TypeScript handles `@autoRegister`)
  - Set `loose: true` for class-properties to use native JavaScript assignments
  - Fixed plugin order: decorators plugin must come before class-properties

- **BaseComponent observedAttributes** - Changed from class property to getter
  - `observedAttributes` is now a static getter instead of class property
  - Prevents "Cannot set property" errors when subclasses try to override
  - Updated `WsxView`, `WsxLink`, and `WsxLogo` to use getter syntax

### Fixed

- **WsxView Container Not Found** - Fixed route view container lookup
  - Improved container detection using `querySelector` and `firstElementChild` fallback
  - Handles cases where `onAttributeChanged` is called before `connectedCallback`
  - Better error handling and fallback behavior

- **Babel Decorator Parsing** - Fixed Babel unable to parse decorator syntax
  - Added decorators plugin to allow Babel to parse `@autoRegister` and `@state` decorators
  - Uses legacy mode to match TypeScript's `experimentalDecorators` behavior

- **Improved @state Decorator Error Messages** - Better error messages for missing configuration
  - Error messages now include step-by-step setup instructions
  - Recommends using `@wsxjs/wsx-tsconfig` for TypeScript configuration
  - Provides both recommended and manual configuration options

## [0.0.7] - 2025-12-07

### Fixed

- **LightComponent Style Preservation** - Fixed styles being removed during rerender
  - Styles are now correctly recreated and positioned after rerender
  - Added comprehensive tests for style preservation scenarios
  - Ensures styles remain in the correct position (before content) after multiple rerenders

- **TypeScript Module Resolution** - Fixed `.wsx` file type declarations
  - Standardized `.wsx` module type declarations in core package
  - Removed duplicate declarations from examples package
  - Improved type accuracy for WebComponent and LightComponent exports

### Changed

- Updated standard `.wsx` type declarations to support both `WebComponent` and `LightComponent`
- Improved test coverage for `LightComponent` (44 tests total)

### Testing

- Added 3 new tests for style preservation after rerender
- All existing tests continue to pass

## [0.0.6] - 2025-01-26

### Added

- **ReactiveWebComponent** - New base class for reactive state management
  - Extends `WebComponent` with reactive capabilities
  - Supports `reactive()` and `useState()` methods
  - Automatic re-rendering on state changes
  - Focus preservation during re-renders
  - Debug mode for reactive state tracking

- **LightComponent Reactive Support** - Full reactive state management
  - `LightComponent` now supports the same reactive API as `ReactiveWebComponent`
  - Perfect for third-party library integration
  - Automatic re-rendering on state changes

- **Reactive State System** - Lightweight reactivity based on Proxy API
  - `reactive()` function for creating reactive objects
  - `useState()` hook for state management
  - `ReactiveDebug` utilities for debugging
  - Independent system that works with both Shadow DOM and Light DOM

- **Documentation**
  - Complete `LightComponent` usage guide
  - Component comparison guide (LightComponent vs ReactiveWebComponent)
  - Reactive state system examples
  - Enhanced architecture documentation

### Changed

- `LightComponent` now includes full reactive state management
- Reactive system is independent of DOM rendering strategy
- Improved component architecture documentation

### Fixed

- TypeScript type definitions for `.wsx` modules
- Component export consistency

### Breaking Changes

None - all changes are backward compatible.

## [0.0.5] - 2025-01-20

### Added
- **Native SVG Support** - Complete SVG element support with proper namespace handling
  - Automatic detection of SVG elements using `createElementNS`
  - Proper attribute mapping (`className` → `class` for SVG elements)
  - Full TypeScript support for SVG elements and attributes
  - Event handling support for SVG elements
  - Mixed HTML/SVG content in the same component

### Changed
- **JSX Factory Enhancement** - Updated to handle both HTML and SVG elements seamlessly
- **Type System** - Extended `JSXChildren` type to include `SVGElement`
- **Examples Package** - Added comprehensive SVG demos and interactive examples

### Added Components
- **SvgIcon** - Reusable SVG icon component with multiple built-in icons
- **SvgDemo** - Interactive SVG showcase with shapes, gradients, animations, and charts

### Testing
- Added 108 new tests specifically for SVG functionality
- Comprehensive test coverage for SVG element creation, attributes, events, and mixed content
- All existing tests continue to pass (146 total tests)

### Documentation
- Added SVG support section to README with examples
- Updated feature list to highlight native SVG capabilities
- Added interactive SVG examples in the examples package

## [0.0.4] - 2025-01-15

### Added
- Initial release of WSXJS
- Core WebComponent base class with JSX support
- Auto-registration decorator system
- Vite plugin for .wsx file processing
- ESLint plugin with WSX-specific rules
- Comprehensive test suite
- Example components and applications

### Features
- Zero React dependency
- TypeScript-first development
- CSS-in-JS with Shadow DOM
- Hot reload support
- Professional code quality tools
