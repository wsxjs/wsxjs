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
    // Compatibility with Babel plugin which is required for this decorator to work properly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
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
    // Check if this is a Stage 3 decorator (context object) first
    // Be more lenient in detection - check for key indicators of Stage 3 format
    // Also check if propertyKey is an object (which shouldn't happen in legacy format)
    const propertyKeyIsObject = typeof propertyKey === "object" && propertyKey !== null;
    const targetIsObject = typeof targetOrContext === "object" && targetOrContext !== null;

    const hasStage3Indicators =
        targetIsObject &&
        ("kind" in targetOrContext ||
            "addInitializer" in targetOrContext ||
            "access" in targetOrContext);

    const hasName = hasStage3Indicators && "name" in targetOrContext;

    // CRITICAL: If propertyKey is an object, it's definitely a Stage 3 decorator
    // Legacy format NEVER passes objects as propertyKey - it's always string or symbol
    // This is the most reliable indicator
    // Also check if targetOrContext has addInitializer (definitive Stage 3 indicator)
    const isStage3Decorator =
        propertyKeyIsObject ||
        hasName ||
        (hasStage3Indicators && (propertyKey === undefined || propertyKey === null)) ||
        (targetIsObject && "addInitializer" in targetOrContext);

    if (isStage3Decorator) {
        // Stage 3 decorator format - determine property name safely
        // First, try to get name from targetOrContext if it has Stage 3 indicators
        if (hasStage3Indicators && targetOrContext && typeof targetOrContext === "object") {
            const context = targetOrContext as DecoratorContext;
            if (context.name) {
                propertyName =
                    typeof context.name === "string" ? context.name : context.name.toString();
            } else {
                propertyName = "unknown";
            }
        } else if (propertyKeyIsObject) {
            // If propertyKey is an object, try to extract name from it
            // This can happen in some compilation scenarios
            const keyObj = propertyKey as Record<string, unknown>;
            const targetObj = targetOrContext as Record<string, unknown> | null;

            // Try to get name from multiple sources
            const nameValue =
                (targetObj?.name as string | symbol | undefined) ||
                (keyObj.name as string | symbol | undefined) ||
                (keyObj.key as string | symbol | undefined);

            if (nameValue) {
                propertyName = typeof nameValue === "string" ? nameValue : nameValue.toString();
            } else {
                // Last resort: try to stringify and extract useful info
                const keyStr = String(propertyKey);
                if (keyStr !== "[object Object]") {
                    propertyName = keyStr;
                } else {
                    propertyName = "unknown";
                }
            }
        } else {
            propertyName = "unknown";
        }
    } else {
        // Legacy decorator format
        if (typeof propertyKey === "string" || typeof propertyKey === "symbol") {
            propertyName = typeof propertyKey === "string" ? propertyKey : propertyKey.toString();
        } else if (propertyKey != null) {
            // Handle case where propertyKey might be an object (shouldn't happen, but be defensive)
            const propertyKeyStr = String(propertyKey);
            if (propertyKeyStr === "[object Object]") {
                // Try to extract name from object if possible, otherwise use a fallback
                propertyName = "unknown";
            } else {
                propertyName = propertyKeyStr;
            }
        } else {
            propertyName = "unknown";
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
    // Use the same check as above to ensure consistency
    if (isStage3Decorator) {
        // If propertyKey is an object but targetOrContext doesn't have Stage 3 indicators,
        // we need to construct a minimal context object
        let context: DecoratorContext;
        if (hasStage3Indicators) {
            context = targetOrContext as DecoratorContext;
        } else if (propertyKeyIsObject) {
            // propertyKey is an object, so this must be Stage 3 format
            // In some compilation scenarios, the context might be split between targetOrContext and propertyKey
            // Try to reconstruct the full context
            const keyObj = propertyKey as Record<string, unknown>;
            const targetObj =
                targetOrContext && typeof targetOrContext === "object"
                    ? (targetOrContext as Record<string, unknown>)
                    : null;

            // Try to get name from multiple sources
            const nameValue =
                (targetObj?.name as string | symbol | undefined) ||
                (keyObj.name as string | symbol | undefined) ||
                (keyObj.key as string | symbol | undefined) ||
                "unknown";

            context = {
                kind: ((targetObj?.kind as string) || "field") as DecoratorContext["kind"],
                name: nameValue as string | symbol,
                addInitializer:
                    (targetObj?.addInitializer as
                        | ((initializer: () => void) => void)
                        | undefined) ||
                    (keyObj.addInitializer as ((initializer: () => void) => void) | undefined),
                access: (targetObj?.access || keyObj.access) as DecoratorContext["access"],
            };
        } else {
            // This shouldn't happen if isStage3Decorator is true, but handle it defensively
            if (targetOrContext && typeof targetOrContext === "object") {
                context = targetOrContext as DecoratorContext;
            } else {
                // Fallback: create a minimal context
                context = {
                    kind: "field" as const,
                    name: propertyName || "unknown",
                    addInitializer: undefined,
                };
            }
        }

        // Only support field decorators (if kind is specified)
        if (context.kind && context.kind !== "field") {
            const nameStr =
                typeof context.name === "string" ? context.name : context.name.toString();
            throw new Error(
                `@state decorator can only be used on class fields, not ${context.kind}. Property: "${nameStr}"`
            );
        }

        // Runtime fallback: Use addInitializer to set up reactive state
        // If addInitializer doesn't exist, we can't set up reactive state at runtime
        // This should only happen if the decorator system is misconfigured
        if (!context.addInitializer) {
            // Log a warning but don't throw - allow the decorator to complete
            // The property will work but won't be reactive
            console.warn(
                `[WSX] @state decorator: addInitializer not available for property "${propertyName}". ` +
                    `The property will not be reactive. This usually means the decorator system is not properly configured.`
            );
        } else {
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

        // For Stage 3 field decorators, we must return a function or undefined
        // We use addInitializer to set up reactive state, so we return undefined
        // to let the decorator system use the original initial value
        // The addInitializer callback will handle the reactive setup
        return undefined;
    }

    // Legacy decorator format (experimentalDecorators: true)
    // This should ideally be removed by Babel plugin
    // Note: If we reach here, isStage3Decorator is false, so we're in legacy mode
    const target = targetOrContext;
    let normalizedPropertyKey: string | symbol;

    if (typeof propertyKey === "string" || typeof propertyKey === "symbol") {
        normalizedPropertyKey = propertyKey;
    } else if (propertyKey != null) {
        const propertyKeyStr = String(propertyKey);
        if (propertyKeyStr === "[object Object]") {
            // Invalid propertyKey - this might happen if decorator is called in unexpected format
            // Try to provide helpful error message
            // Check if targetOrContext might actually be a Stage 3 context that we missed
            if (
                typeof targetOrContext === "object" &&
                targetOrContext !== null &&
                ("kind" in targetOrContext || "addInitializer" in targetOrContext)
            ) {
                // This looks like it might be a Stage 3 decorator that we didn't detect properly
                // Try to handle it as Stage 3
                console.warn(
                    `[WSX] @state decorator: Detected potential Stage 3 decorator format but with unexpected propertyKey. ` +
                        `This might be a compatibility issue. The decorator will attempt to work in runtime fallback mode.`
                );
                // Try to extract name from context if possible
                const context = targetOrContext as Partial<DecoratorContext>;
                if (context.name) {
                    const name =
                        typeof context.name === "string" ? context.name : context.name.toString();
                    throw new Error(
                        `@state decorator: Detected Stage 3 decorator format but with invalid propertyKey. ` +
                            `Property name: "${name}". ` +
                            `\n\n` +
                            `This usually means the decorator is being called in an unexpected format. ` +
                            `Please ensure you have configured the Babel plugin correctly. ` +
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
            }
            // Invalid propertyKey - Babel plugin was not configured
            throw new Error(
                `@state decorator: Invalid propertyKey detected (received object instead of string/symbol). ` +
                    `\n\n` +
                    `The @state decorator MUST be processed by Babel plugin at compile time. ` +
                    `It appears the Babel plugin is not configured in your build setup. ` +
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
    } else {
        // propertyKey is null or undefined - this shouldn't happen
        throw new Error(
            `@state decorator: propertyKey is missing. ` +
                `This usually means the decorator is not being called correctly. ` +
                `Please ensure you're using @state on a class field, not a method or other construct.`
        );
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
