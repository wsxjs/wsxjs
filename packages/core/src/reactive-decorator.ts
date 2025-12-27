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

/**
 * Helper function to create error message for missing Babel plugin
 */
function createBabelPluginError(propertyName: string): string {
    return (
        `@state decorator on property "${propertyName}" MUST be processed by Babel plugin at compile time. ` +
        `It appears the Babel plugin is not configured in your build setup. ` +
        `\n\n` +
        `The @state decorator cannot work without the Babel plugin. ` +
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

export function state(
    targetOrContext: unknown | DecoratorContext,
    propertyKey?: string | symbol | unknown
    // Compatibility with Babel plugin which is required for this decorator to work properly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
    // RFC 0037 Phase 0: Test Infrastructure Support
    // Allow runtime decorator in tests to bypass Babel plugin requirement
    // Use globalThis to safely access process in all environments

    const globalProcess =
        typeof globalThis !== "undefined" ? (globalThis as any).process : undefined;
    if (globalProcess?.env?.NODE_ENV === "test") {
        return;
    }
    /**
     * @state decorator MUST be processed by Babel plugin at compile time.
     * If this function is executed at runtime, it means Babel plugin did not process it.
     * We MUST throw an error - no fallback is allowed.
     */

    // Determine property name for error message
    let propertyName: string = "unknown";

    // Check if this is a Stage 3 decorator (context object)
    const propertyKeyIsObject = typeof propertyKey === "object" && propertyKey !== null;
    const targetIsObject = typeof targetOrContext === "object" && targetOrContext !== null;

    const hasStage3Indicators =
        targetIsObject &&
        ("kind" in targetOrContext ||
            "addInitializer" in targetOrContext ||
            "access" in targetOrContext);

    const hasName = hasStage3Indicators && "name" in targetOrContext;

    const isStage3Decorator =
        propertyKeyIsObject ||
        hasName ||
        (hasStage3Indicators && (propertyKey === undefined || propertyKey === null)) ||
        (targetIsObject && "addInitializer" in targetOrContext);

    if (isStage3Decorator) {
        // Stage 3 decorator format - determine property name safely
        if (hasStage3Indicators && targetOrContext && typeof targetOrContext === "object") {
            const context = targetOrContext as DecoratorContext;
            if (context.name) {
                propertyName =
                    typeof context.name === "string" ? context.name : context.name.toString();
            }
        } else if (propertyKeyIsObject) {
            // If propertyKey is an object, try to extract name from it
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
                const keyStr = String(propertyKey);
                if (keyStr !== "[object Object]") {
                    propertyName = keyStr;
                }
            }
        }

        // Only support field decorators (if kind is specified)
        if (targetIsObject && "kind" in targetOrContext) {
            const context = targetOrContext as DecoratorContext;
            if (context.kind && context.kind !== "field") {
                const nameStr =
                    typeof context.name === "string" ? context.name : context.name.toString();
                throw new Error(
                    `@state decorator can only be used on class fields, not ${context.kind}. Property: "${nameStr}"`
                );
            }
        }

        // If we reach here, the decorator is being executed at runtime
        // This means Babel plugin did not process it - throw error immediately
        throw new Error(createBabelPluginError(propertyName));
    }

    // Legacy decorator format (experimentalDecorators: true)
    // This should ideally be removed by Babel plugin
    if (typeof propertyKey === "string" || typeof propertyKey === "symbol") {
        propertyName = typeof propertyKey === "string" ? propertyKey : propertyKey.toString();
    } else if (propertyKey != null) {
        const propertyKeyStr = String(propertyKey);
        if (propertyKeyStr === "[object Object]") {
            // Invalid propertyKey - this might happen if decorator is called in unexpected format
            // Check if targetOrContext might actually be a Stage 3 context that we missed
            if (
                typeof targetOrContext === "object" &&
                targetOrContext !== null &&
                ("kind" in targetOrContext || "addInitializer" in targetOrContext)
            ) {
                // This looks like it might be a Stage 3 decorator that we didn't detect properly
                const context = targetOrContext as Partial<DecoratorContext>;
                if (context.name) {
                    propertyName =
                        typeof context.name === "string" ? context.name : context.name.toString();
                }
            }
        } else {
            propertyName = propertyKeyStr;
        }
    }

    // If we reach here, the decorator is being executed at runtime
    // This means Babel plugin did not process it - throw error immediately
    throw new Error(createBabelPluginError(propertyName));
}
