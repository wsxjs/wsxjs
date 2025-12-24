// Core exports
export { WebComponent } from "./web-component";
export { LightComponent } from "./light-component";
export { autoRegister, registerComponent } from "./auto-register";
export { h, h as jsx, h as jsxs, Fragment } from "./jsx-factory";
export { StyleManager } from "./styles/style-manager";
// Re-export logger from wsx-logger for backward compatibility
export { WSXLogger, logger, createLogger, createLoggerWithConfig } from "@wsxjs/wsx-logger";
export type { Logger, LogLevel } from "@wsxjs/wsx-logger";

// Reactive exports - Decorator-based API
export { state } from "./reactive-decorator";

// Type exports
export type { WebComponentConfig } from "./web-component";
export type { LightComponentConfig } from "./light-component";
export type { JSXChildren } from "./jsx-factory";
export type { ReactiveCallback } from "./utils/reactive";
