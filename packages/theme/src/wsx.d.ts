declare module "*.wsx" {
    import { WebComponent, LightComponent } from "@wsxjs/wsx-core";
    const Component: new (...args: unknown[]) => WebComponent | LightComponent;
    export default Component;
}
