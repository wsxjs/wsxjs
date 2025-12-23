# @wsxjs/wsx-core

## 0.0.17

### Patch Changes

- republish

## 0.0.6

### Major Features

- **ReactiveWebComponent** - New base class extending `WebComponent` with reactive state management
    - Full reactive state support with `reactive()` and `useState()` methods
    - Automatic re-rendering on state changes
    - Focus preservation during re-renders
    - Debug mode support for reactive state tracking

- **LightComponent Enhancements** - Complete reactive state support
    - `LightComponent` now supports the same reactive API as `ReactiveWebComponent`
    - Full `reactive()` and `useState()` support
    - Automatic re-rendering on state changes
    - Perfect for third-party library integration (EditorJS, Chart.js, etc.)

### Added

- `ReactiveWebComponent` class with reactive state management
- `makeReactive()` decorator function for adding reactivity to existing components
- `createReactiveComponent()` helper function
- Reactive state system utilities (`reactive`, `createState`, `ReactiveDebug`)
- Comprehensive documentation for `LightComponent` usage
- Component comparison guide (LightComponent vs ReactiveWebComponent)

### Changed

- `LightComponent` now includes full reactive state management capabilities
- Reactive system is now independent and works with both Shadow DOM and Light DOM
- Improved component architecture documentation

### Documentation

- Added complete `LightComponent` usage guide (`docs/LIGHT_COMPONENT_GUIDE.md`)
- Updated README with component type comparison
- Added reactive state system examples
- Enhanced component architecture documentation

### Breaking Changes

None - all changes are backward compatible.

## 0.0.5

### Patch Changes

- # Native SVG Support

    Added comprehensive SVG support to WSXJS with proper namespace handling.

    ## Features
    - **Automatic namespace detection** - SVG elements use `createElementNS` automatically
    - **Proper attribute handling** - `className` converts to `class` for SVG elements
    - **Full TypeScript support** - Complete type safety for SVG elements and attributes
    - **Event handling** - Standard event listeners work on SVG elements
    - **Mixed content** - Seamlessly mix HTML and SVG in the same component

    ## Implementation
    - Enhanced JSX factory with modular SVG utilities
    - Added comprehensive test suite (108 new SVG-specific tests)
    - Created interactive SVG demo components in examples package
    - Updated documentation with SVG examples and usage guides

    ## Breaking Changes

    None - this is a backward-compatible addition.
