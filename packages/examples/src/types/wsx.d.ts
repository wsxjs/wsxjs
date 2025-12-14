// Type declaration for .wsx files
declare module "*.wsx" {
    import { WebComponent, LightComponent } from "@wsxjs/wsx-core";
    const component: new (...args: unknown[]) => WebComponent | LightComponent;
    export default component;
}
