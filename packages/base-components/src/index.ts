/** @jsxImportSource @wsxjs/wsx-core */

// Export all base components (using default imports since they're default exports)
// Base components are reusable, generic components that can be used in any project
export { default as Button } from "./Button.wsx";
export { default as ButtonGroup } from "./ButtonGroup.wsx";
export { default as ColorPicker } from "./ColorPicker.wsx";
export { default as ThemeSwitcher } from "./ThemeSwitcher.wsx";
export { default as SvgIcon } from "./SvgIcon.wsx";
export { default as CodeBlock } from "./CodeBlock.wsx";
export type { CodeBlockConfig, CodeSegment } from "./CodeBlock.types";

// Export utilities
export * from "./ColorPickerUtils";

// Note: Example components (ReactiveCounter, TodoList, UserProfile, SlotCard, WsxLogo, etc.)
// have been moved to packages/examples/src/components/examples/
// Base components should only contain reusable, generic components

// Note: Re-exports from core are causing TypeScript rootDir issues
// Users can import directly from @wsxjs/wsx-core if needed
