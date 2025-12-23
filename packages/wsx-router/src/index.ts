/**
 * WSX Router - Native History API-based routing for WSXJS
 *
 * 提供基于原生 History API 的路由功能：
 * - 零依赖路由器组件
 * - 声明式路由配置
 * - 支持参数路由和嵌套路由
 * - 内置导航链接组件
 * - 丰富的路由工具函数
 */

// 导出路由组件 (using default imports to align with base-components)
export { default as WsxRouter } from "./WsxRouter.wsx";
export { default as WsxView } from "./WsxView.wsx";
export { default as WsxLink } from "./WsxLink.wsx";

// 导出工具类和类型
export * from "./RouterUtils";
