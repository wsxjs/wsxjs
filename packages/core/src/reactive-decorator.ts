/**
 * Reactive Decorators for WSX Components
 *
 * Provides @state property decorator to mark properties as reactive state.
 * WebComponent and LightComponent already have reactive() and useState() methods.
 * Babel plugin handles @state initialization at compile time.
 *
 * @example
 * ```typescript
 * class Counter extends WebComponent {
 *   @state private count = 0;
 *   @state private user = { name: "John" };
 * }
 * ```
 */

/**
 * State property decorator
 *
 * Marks a property as reactive state. Babel plugin processes this decorator at compile time
 * and generates initialization code in the constructor.
 *
 * Automatically uses reactive() for objects/arrays and useState() for primitives.
 *
 * @param target - The class prototype
 * @param propertyKey - The property name
 *
 * @example
 * ```typescript
 * class MyComponent extends WebComponent {
 *   @state private count = 0;  // Auto-initialized by Babel plugin
 *   @state private user = { name: "John" };  // Auto-initialized by Babel plugin
 * }
 * ```
 */
export function state(target: unknown, propertyKey: string | symbol | unknown): void {
    /**
     * @state decorator is a compile-time marker for Babel plugin.
     * Babel plugin will:
     * 1. Detect @state decorator on properties
     * 2. Extract initial value from AST
     * 3. Remove @state decorator
     * 4. Generate initialization code in constructor (this.state = this.reactive(...) or useState)
     *
     * This runtime function only performs basic validation.
     * If Babel plugin is not configured, this will throw an error.
     */

    // Normalize propertyKey
    let normalizedPropertyKey: string | symbol;
    if (typeof propertyKey === "string" || typeof propertyKey === "symbol") {
        normalizedPropertyKey = propertyKey;
    } else {
        const propertyKeyStr = String(propertyKey);
        if (propertyKeyStr === "[object Object]") {
            // Invalid propertyKey - likely a build configuration issue
            throw new Error(
                `@state decorator: Invalid propertyKey. ` +
                    `This usually means the build tool doesn't support decorators properly. ` +
                    `Please ensure Babel plugin is configured in vite.config.ts`
            );
        }
        normalizedPropertyKey = propertyKeyStr;
    }

    // Basic validation: ensure target is valid
    if (target == null) {
        const propertyKeyStr =
            typeof normalizedPropertyKey === "string"
                ? normalizedPropertyKey
                : normalizedPropertyKey.toString();
        throw new Error(
            `@state decorator: Cannot access property "${propertyKeyStr}". ` +
                `Target is ${target === null ? "null" : "undefined"}. ` +
                `Please ensure Babel plugin is configured in vite.config.ts`
        );
    }

    if (typeof target !== "object") {
        const propertyKeyStr =
            typeof normalizedPropertyKey === "string"
                ? normalizedPropertyKey
                : normalizedPropertyKey.toString();
        throw new Error(
            `@state decorator: Cannot be used on "${propertyKeyStr}". ` +
                `@state is for properties only, not methods.`
        );
    }

    // Validate that property has an initial value
    const descriptor = Object.getOwnPropertyDescriptor(target, normalizedPropertyKey);
    if (descriptor?.get) {
        const propertyKeyStr =
            typeof normalizedPropertyKey === "string"
                ? normalizedPropertyKey
                : normalizedPropertyKey.toString();
        throw new Error(
            `@state decorator cannot be used with getter properties. Property: "${propertyKeyStr}"`
        );
    }

    // Note: We don't store metadata or remove the property here.
    // Babel plugin handles everything at compile time.
    // If this function is called at runtime, it means Babel plugin didn't process the decorator.
}
