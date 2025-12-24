/**
 * WSX TypeScript 声明文件
 * 支持 .wsx 文件导入
 */

declare module "*.wsx" {
    import type { LightComponent, WebComponent } from "@wsxjs/wsx-core";
    // Allow any class that extends WebComponent or LightComponent
    const Component: new (...args: unknown[]) => WebComponent | LightComponent;
    export default Component;
}
