declare module "*.wsx" {
    import { Component } from "@wsxjs/wsx-core";
    const ComponentClass: typeof Component;
    export default ComponentClass;
}
