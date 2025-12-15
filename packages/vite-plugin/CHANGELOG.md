# @wsxjs/wsx-vite-plugin

## 0.0.17

### Patch Changes

- republish
- Updated dependencies
    - @wsxjs/wsx-core@0.0.17

## 0.0.5

### Patch Changes

- # Native SVG Support

    Added comprehensive SVG support to WSX Framework with proper namespace handling.

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

- Updated dependencies
    - @wsxjs-core@0.0.5
