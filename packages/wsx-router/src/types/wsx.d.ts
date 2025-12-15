// Type declaration for .wsx files
declare module "*.wsx" {
    import { WebComponent, LightComponent } from "@wsxjs/wsx-core";
    // Allow any class that extends WebComponent or LightComponent
    const Component: new (...args: unknown[]) => WebComponent | LightComponent;
    export default Component;
}
