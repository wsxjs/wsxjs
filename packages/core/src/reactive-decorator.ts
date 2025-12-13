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
/**
 * Stage 3 Decorator Context interface
 */
interface DecoratorContext {
    kind: "class" | "method" | "getter" | "setter" | "field" | "accessor";
    name: string | symbol;
    access?: {
        get?(): unknown;
        set?(value: unknown): void;
    };
    private?: boolean;
    static?: boolean;
    addInitializer?(initializer: () => void): void;
}

export function state(
    targetOrContext: unknown | DecoratorContext,
    propertyKey?: string | symbol | unknown
): void | DecoratorContext {
    /**
     * @state decorator supports both:
     * 1. Compile-time processing by Babel plugin (preferred) - decorator is removed at compile time
     * 2. Runtime fallback when Babel plugin is not configured - decorator executes at runtime
     *
     * If this function is executed at runtime, it means Babel plugin did not process it.
     * We should warn the user and provide fallback functionality.
     */

    // Determine property name for warning message
    let propertyName: string;
    if (
        typeof targetOrContext === "object" &&
        targetOrContext !== null &&
        "kind" in targetOrContext &&
        "name" in targetOrContext
    ) {
        // Stage 3 decorator format
        const context = targetOrContext as DecoratorContext;
        propertyName = typeof context.name === "string" ? context.name : context.name.toString();
    } else {
        // Legacy decorator format
        if (typeof propertyKey === "string" || typeof propertyKey === "symbol") {
            propertyName = typeof propertyKey === "string" ? propertyKey : propertyKey.toString();
        } else {
            propertyName = String(propertyKey);
        }
    }

    // Show warning immediately when decorator is executed at runtime
    // This means Babel plugin did not process it
    console.warn(
        `[WSX] @state decorator is using runtime fallback. ` +
            `Property "${propertyName}" will work but with reduced performance. ` +
            `\n\n` +
            `To fix this and enable compile-time processing, please:` +
            `\n1. Install @wsxjs/wsx-vite-plugin: npm install @wsxjs/wsx-vite-plugin` +
            `\n2. Configure it in vite.config.ts:` +
            `\n   import { wsx } from '@wsxjs/wsx-vite-plugin';` +
            `\n   export default defineConfig({ plugins: [wsx()] });` +
            `\n3. Configure TypeScript (recommended: use @wsxjs/wsx-tsconfig):` +
            `\n   npm install --save-dev @wsxjs/wsx-tsconfig` +
            `\n   Then in tsconfig.json: { "extends": "@wsxjs/wsx-tsconfig/tsconfig.base.json" }` +
            `\n   Or manually: { "compilerOptions": { "experimentalDecorators": true, "useDefineForClassFields": false } }` +
            `\n\n` +
            `See: https://github.com/wsxjs/wsxjs#setup for more details.`
    );

    // Check if this is a Stage 3 decorator (context object)
    if (
        typeof targetOrContext === "object" &&
        targetOrContext !== null &&
        "kind" in targetOrContext &&
        "name" in targetOrContext
    ) {
        const context = targetOrContext as DecoratorContext;

        // Only support field decorators
        if (context.kind !== "field") {
            const nameStr =
                typeof context.name === "string" ? context.name : context.name.toString();
            throw new Error(
                `@state decorator can only be used on class fields, not ${context.kind}. Property: "${nameStr}"`
            );
        }

        // Runtime fallback: Use addInitializer to set up reactive state
        if (context.addInitializer) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            context.addInitializer(function (this: any) {
                // 'this' refers to the component instance
                if (
                    !this ||
                    typeof this.reactive !== "function" ||
                    typeof this.useState !== "function"
                ) {
                    throw new Error(
                        `@state decorator runtime fallback: Component does not extend WebComponent or LightComponent. ` +
                            `Property "${propertyName}" cannot be made reactive. ` +
                            `\n\n` +
                            `The @state decorator can only be used in classes that extend WebComponent or LightComponent. ` +
                            `Please ensure your component class extends one of these base classes.`
                    );
                }

                // Get initial value - try from access.get() first, then from property
                let initialValue: unknown = undefined;
                if (context.access?.get) {
                    try {
                        initialValue = context.access.get();
                    } catch {
                        // Access might not be available yet, try property directly
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        initialValue = (this as any)[propertyName];
                    }
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    initialValue = (this as any)[propertyName];
                }

                // Determine if it's an object/array
                const isObject =
                    initialValue !== null &&
                    initialValue !== undefined &&
                    (typeof initialValue === "object" || Array.isArray(initialValue));

                if (isObject) {
                    // For objects/arrays: use reactive()
                    let reactiveValue = this.reactive(initialValue);
                    Object.defineProperty(this, propertyName, {
                        get: () => reactiveValue,
                        set: (newValue: unknown) => {
                            // Auto-wrap new values in reactive if they're objects/arrays
                            if (
                                newValue !== null &&
                                newValue !== undefined &&
                                (typeof newValue === "object" || Array.isArray(newValue))
                            ) {
                                // Create new reactive value
                                reactiveValue = this.reactive(newValue);
                                this.scheduleRerender();
                            } else {
                                // For primitives, just assign (but this shouldn't happen for object properties)
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                reactiveValue = newValue as any;
                                this.scheduleRerender();
                            }
                        },
                        enumerable: true,
                        configurable: true,
                    });
                } else {
                    // For primitives: use useState
                    const [getState, setState] = this.useState(propertyName, initialValue);
                    Object.defineProperty(this, propertyName, {
                        get: getState,
                        set: setState,
                        enumerable: true,
                        configurable: true,
                    });
                }
            });
        }

        // Return context for Stage 3 decorators
        return context;
    }

    // Legacy decorator format (experimentalDecorators: true)
    // This should ideally be removed by Babel plugin
    const target = targetOrContext;
    let normalizedPropertyKey: string | symbol;
    if (typeof propertyKey === "string" || typeof propertyKey === "symbol") {
        normalizedPropertyKey = propertyKey;
    } else {
        const propertyKeyStr = String(propertyKey);
        if (propertyKeyStr === "[object Object]") {
            // Invalid propertyKey - Babel plugin was not configured
            throw new Error(
                `@state decorator: Invalid propertyKey detected. ` +
                    `\n\n` +
                    `The @state decorator MUST be processed by Babel plugin at compile time. ` +
                    `It appears the Babel plugin is not configured in your build setup.` +
                    `\n\n` +
                    `To fix this, please:` +
                    `\n1. Install @wsxjs/wsx-vite-plugin: npm install @wsxjs/wsx-vite-plugin` +
                    `\n2. Configure it in vite.config.ts:` +
                    `\n   import { wsx } from '@wsxjs/wsx-vite-plugin';` +
                    `\n   export default defineConfig({ plugins: [wsx()] });` +
                    `\n3. Configure TypeScript (recommended: use @wsxjs/wsx-tsconfig):` +
                    `\n   npm install --save-dev @wsxjs/wsx-tsconfig` +
                    `\n   Then in tsconfig.json: { "extends": "@wsxjs/wsx-tsconfig/tsconfig.base.json" }` +
                    `\n   Or manually: { "compilerOptions": { "experimentalDecorators": true, "useDefineForClassFields": false } }` +
                    `\n\n` +
                    `See: https://github.com/wsxjs/wsxjs#setup for more details.`
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
                `Target is ${target === null ? "null" : "undefined"}.` +
                `\n\n` +
                `The @state decorator MUST be processed by Babel plugin at compile time. ` +
                `It appears the Babel plugin is not configured in your build setup.` +
                `\n\n` +
                `To fix this, please:` +
                `\n1. Install @wsxjs/wsx-vite-plugin: npm install @wsxjs/wsx-vite-plugin` +
                `\n2. Configure it in vite.config.ts:` +
                `\n   import { wsx } from '@wsxjs/wsx-vite-plugin';` +
                `\n   export default defineConfig({ plugins: [wsx()] });` +
                `\n3. Configure TypeScript (recommended: use @wsxjs/wsx-tsconfig):` +
                `\n   npm install --save-dev @wsxjs/wsx-tsconfig` +
                `\n   Then in tsconfig.json: { "extends": "@wsxjs/wsx-tsconfig/tsconfig.base.json" }` +
                `\n   Or manually: { "compilerOptions": { "experimentalDecorators": true, "useDefineForClassFields": false } }` +
                `\n\n` +
                `See: https://github.com/wsxjs/wsxjs#setup for more details.`
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
