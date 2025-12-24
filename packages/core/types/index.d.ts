// 导入所有类型定义
import "./css-inline.d.ts";
import "./wsx-types";
import "./global.d.ts";

// 重新导出 JSX 工厂函数和类型
export { h, Fragment } from "./wsx-types";
export type { JSXChildren } from "../src/jsx-factory";

// 导出 WebComponent 类和配置
export { WebComponent, type WebComponentConfig } from "../src/web-component";

// 导出响应式装饰器 (@state)
export { state } from "../src/reactive-decorator";

// 导出 LightComponent 类和配置
export { LightComponent, type LightComponentConfig } from "../src/light-component";
// 导出 auto-register 相关类型和函数
export {
    autoRegister,
    registerComponent,
    registerAll,
    isRegistered,
    getTagName,
} from "../src/auto-register";
export type { AutoRegistrationOptions } from "../src/auto-register";

// 导出 StyleManager
export { StyleManager } from "../src/styles/style-manager";

// 导出 Logger 相关类型和函数 (re-exported from @wsxjs/wsx-logger for backward compatibility)
export type { Logger, LogLevel } from "@wsxjs/wsx-logger";
export { WSXLogger, logger, createLogger, createLoggerWithConfig } from "@wsxjs/wsx-logger";

// 导出 DOM 工具函数
export { parseHTMLToNodes } from "../src/utils/dom-utils";

// 重新导出 JSX 运行时
export { h as jsx, h as jsxs, Fragment as F } from "../src/jsx-factory";
export type { JSXChildren as J } from "../src/jsx-factory";
