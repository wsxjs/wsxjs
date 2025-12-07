# Changelog

All notable changes to the WSX Framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Initial release of WSX Framework
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
