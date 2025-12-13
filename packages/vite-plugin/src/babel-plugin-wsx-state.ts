/**
 * Babel plugin to transform @state decorator to compile-time Proxy creation
 *
 * Transforms:
 *   @state private state = { count: 0 };
 *
 * To:
 *   private state;
 *   constructor() {
 *     super();
 *     this.state = this.reactive({ count: 0 });
 *   }
 */

import type { PluginObj, PluginPass } from "@babel/core";
import type * as t from "@babel/types";
import * as tModule from "@babel/types";

interface WSXStatePluginPass extends PluginPass {
    stateProperties: Array<{
        key: string;
        initialValue: t.Expression;
        isObject: boolean;
        isArray?: boolean; // Add isArray flag
    }>;
    reactiveMethodName: string;
}

export default function babelPluginWSXState(): PluginObj<WSXStatePluginPass> {
    const t = tModule;
    return {
        name: "babel-plugin-wsx-state",
        visitor: {
            Program: {
                enter(_path, state) {
                    // CRITICAL: Debug log to check state.opts
                    console.info(
                        `[Babel Plugin WSX State] DEBUG: state.opts keys = ${Object.keys(state.opts || {}).join(", ")}`
                    );
                    console.info(
                        `[Babel Plugin WSX State] DEBUG: state.opts = ${JSON.stringify(state.opts).substring(0, 200)}`
                    );

                    // Store original source code for later checking
                    // First try to get from plugin options (passed from vite plugin)
                    const opts = state.opts as Record<string, unknown> | undefined;
                    if (opts?.originalSource) {
                        (state as Record<string, unknown>).originalSource = opts.originalSource;
                        console.info(
                            `[Babel Plugin WSX State] ✅ Stored original source from options (length: ${String(opts.originalSource).length})`
                        );
                    } else {
                        console.warn(
                            `[Babel Plugin WSX State] ⚠️ state.opts.originalSource not found, trying fallback...`
                        );
                        // Fallback: try to get from file
                        const file = state.file;
                        if (file) {
                            const sourceCode = (file as unknown as Record<string, unknown>).code as
                                | string
                                | undefined;
                            if (sourceCode) {
                                (state as Record<string, unknown>).originalSource = sourceCode;
                                console.info(
                                    `[Babel Plugin WSX State] ✅ Stored original source from file (length: ${sourceCode.length})`
                                );
                            } else {
                                console.error(
                                    `[Babel Plugin WSX State] ❌ ERROR: Could not get original source code from state.opts or state.file!`
                                );
                            }
                        } else {
                            console.error(
                                `[Babel Plugin WSX State] ❌ ERROR: state.file is undefined!`
                            );
                        }
                    }
                },
            },
            ClassDeclaration(path) {
                const classBody = path.node.body;
                const stateProperties: Array<{
                    key: string;
                    initialValue: t.Expression;
                    isObject: boolean;
                    isArray?: boolean;
                }> = [];

                // Find all @state decorated properties
                // Debug: log all class members
                console.info(
                    `[Babel Plugin WSX State] Processing class ${path.node.id?.name || "anonymous"}, members: ${classBody.body.length}`
                );

                // CRITICAL: Log all decorators at class level to debug
                if (path.node.decorators && path.node.decorators.length > 0) {
                    console.info(
                        `[Babel Plugin WSX State] Class-level decorators: ${path.node.decorators.length}`
                    );
                }

                for (const member of classBody.body) {
                    // Debug: log member type

                    console.info(
                        `  - Member type: ${member.type}, key: ${member.type === "ClassProperty" || member.type === "ClassPrivateProperty" ? (member.key as any)?.name : "N/A"}`
                    );

                    // Check both ClassProperty and ClassPrivateProperty
                    // @babel/plugin-proposal-class-properties might convert them
                    if (
                        (member.type === "ClassProperty" ||
                            member.type === "ClassPrivateProperty") &&
                        member.key.type === "Identifier"
                    ) {
                        // Debug: log all class properties
                        const propertyName = member.key.name;
                        const decoratorCount = member.decorators?.length || 0;
                        // CRITICAL: undefined value means no initial value
                        // TypeScript optional properties (count?) are converted to count: undefined
                        // We should treat undefined as no initial value
                        const hasValue =
                            !!member.value &&
                            !(
                                member.value.type === "Identifier" &&
                                (member.value as t.Identifier).name === "undefined"
                            ) &&
                            !(
                                member.value.type === "UnaryExpression" &&
                                member.value.operator === "void"
                            );
                        // Check if value is explicitly undefined
                        const isUndefined = !!(
                            member.value &&
                            ((member.value.type === "Identifier" &&
                                (member.value as t.Identifier).name === "undefined") ||
                                (member.value.type === "UnaryExpression" &&
                                    member.value.operator === "void"))
                        );
                        const valueType = member.value ? member.value.type : "none";
                        const valueName =
                            member.value && member.value.type === "Identifier"
                                ? (member.value as t.Identifier).name
                                : "none";

                        console.info(
                            `  - Property: ${propertyName}, decorators: ${decoratorCount}, hasValue: ${hasValue}, isUndefined: ${isUndefined}, value type: ${valueType}, value name: ${valueName}`
                        );

                        // Wrap the entire detection logic in try-catch to pinpoint crash location
                        try {
                            // CRITICAL: If property has undefined value, check source code for @state decorator
                            // This handles the case where decorator was removed but property has undefined from optional syntax
                            if (isUndefined) {
                                const originalSource = (path.state as Record<string, unknown>)
                                    ?.originalSource as string | undefined;
                                if (originalSource) {
                                    const propertyPattern = new RegExp(
                                        `@state\\s+(?:private|protected|public)?\\s+${propertyName}\\s*[?;]`,
                                        "m"
                                    );
                                    if (propertyPattern.test(originalSource)) {
                                        console.error(
                                            `[Babel Plugin WSX State] ERROR: Found @state decorator in source for property '${propertyName}' but value is undefined (from optional property syntax)!`
                                        );
                                        const error = path.buildCodeFrameError(
                                            `@state decorator on property '${propertyName}' requires an initial value.\n` +
                                                `\n` +
                                                `The property has undefined value (from optional property syntax '${propertyName}?'), ` +
                                                `but @state decorator needs a real value to decide whether to use useState (primitive) or reactive (object/array).\n` +
                                                `\n` +
                                                `Examples:\n` +
                                                `  @state private ${propertyName} = "";  // for string\n` +
                                                `  @state private ${propertyName} = 0;  // for number\n` +
                                                `  @state private ${propertyName} = {};  // for object\n` +
                                                `  @state private ${propertyName} = [];  // for array\n` +
                                                `  @state private ${propertyName} = undefined;  // explicitly undefined\n` +
                                                `\n` +
                                                `Current code: @state private ${propertyName}?;\n` +
                                                `\n` +
                                                `Fix: Change to '@state private ${propertyName} = undefined;' or provide a real initial value.`
                                        );
                                        console.error(
                                            `[Babel Plugin WSX State] ERROR: ${error.message}`
                                        );
                                        throw error;
                                    }
                                }
                            }

                            // CRITICAL: Check ALL properties for @state decorator in source code
                            // Even if decorators array is empty (decorators: 0), the decorator might exist in source
                            // This is the main way to detect @state when decorators are removed before our plugin runs

                            // DEBUG: Check path.state structure
                            if (propertyName === "count") {
                                console.info(
                                    `[Babel Plugin WSX State] DEBUG path.state keys for '${propertyName}': ${path.state ? Object.keys(path.state).join(", ") : "null"}`
                                );
                                console.info(
                                    `[Babel Plugin WSX State] DEBUG path.state.originalSource type: ${path.state ? typeof (path.state as any).originalSource : "path.state is null"}`
                                );
                            }

                            const originalSource = (path.state as Record<string, unknown>)
                                ?.originalSource as string | undefined;

                            if (originalSource) {
                                // Check if there's a pattern like "@state private count?" or "@state private count;" in source
                                // Look for @state followed by private/protected/public, then property name, then optional ? or ;
                                const propertyPattern = new RegExp(
                                    `@state\\s+(?:private|protected|public)?\\s+${propertyName}\\s*[?;]`,
                                    "m"
                                );

                                const hasStateInSource = propertyPattern.test(originalSource);
                                if (hasStateInSource) {
                                    console.info(
                                        `[Babel Plugin WSX State] Found @state in source for property '${propertyName}' (decorators array was empty: ${decoratorCount})`
                                    );
                                    // Found @state in source but decorators array is empty
                                    // Check if it has an initial value in source (not just undefined from TypeScript)
                                    const hasInitialValueInSource = new RegExp(
                                        `@state\\s+(?:private|protected|public)?\\s+${propertyName}\\s*=\\s*[^;]+`,
                                        "m"
                                    ).test(originalSource);

                                    if (!hasInitialValueInSource) {
                                        console.error(
                                            `[Babel Plugin WSX State] ERROR: Found @state decorator in source for property '${propertyName}' but no initial value!`
                                        );

                                        const error = path.buildCodeFrameError(
                                            `@state decorator on property '${propertyName}' requires an initial value.\n` +
                                                `\n` +
                                                `The @state decorator needs a real value to decide whether to use useState (primitive) or reactive (object/array).\n` +
                                                `\n` +
                                                `Examples:\n` +
                                                `  @state private ${propertyName} = "";  // for string\n` +
                                                `  @state private ${propertyName} = 0;  // for number\n` +
                                                `  @state private ${propertyName} = {};  // for object\n` +
                                                `  @state private ${propertyName} = [];  // for array\n` +
                                                `  @state private ${propertyName} = undefined;  // explicitly undefined\n` +
                                                `\n` +
                                                `Current code: @state private ${propertyName}?;\n` +
                                                `\n` +
                                                `Fix: Change to '@state private ${propertyName} = undefined;' or provide a real initial value.`
                                        );
                                        console.error(
                                            `[Babel Plugin WSX State] ERROR: ${error.message}`
                                        );
                                        throw error;
                                    }
                                }
                            } else {
                                // Log when originalSource is not available for debugging
                                if (propertyName === "count") {
                                    console.warn(
                                        `[Babel Plugin WSX State] WARNING: originalSource not available for property '${propertyName}'`
                                    );
                                }
                            }

                            if (member.decorators && member.decorators.length > 0) {
                                // Debug: log decorator names
                                member.decorators.forEach((decorator) => {
                                    if (decorator.expression.type === "Identifier") {
                                        console.info(`    Decorator: ${decorator.expression.name}`);
                                    } else if (
                                        decorator.expression.type === "CallExpression" &&
                                        decorator.expression.callee.type === "Identifier"
                                    ) {
                                        console.info(
                                            `    Decorator: ${decorator.expression.callee.name}()`
                                        );
                                    } else {
                                        console.info(`    Decorator: ${decorator.expression.type}`);
                                    }
                                });
                            } else {
                                // Check if this property might have had @state decorator but it was removed
                                // This can happen if TypeScript preset or another plugin processed it first
                                // For now, we can't detect this case, but we log it for debugging
                                // In the future, we might need to check the original source or use a different approach
                            }

                            // Check if has @state decorator
                            let hasStateDecorator = false;
                            try {
                                hasStateDecorator =
                                    member.decorators?.some((decorator: t.Decorator) => {
                                        if (
                                            decorator.expression.type === "Identifier" &&
                                            decorator.expression.name === "state"
                                        ) {
                                            return true;
                                        }
                                        if (
                                            decorator.expression.type === "CallExpression" &&
                                            decorator.expression.callee.type === "Identifier" &&
                                            decorator.expression.callee.name === "state"
                                        ) {
                                            return true;
                                        }
                                        return false;
                                    }) || false;
                            } catch (error) {
                                console.error(
                                    `[Babel Plugin WSX State] ERROR in hasStateDecorator check for ${propertyName}: ${error}`
                                );
                                throw error;
                            }

                            if (hasStateDecorator) {
                                const key = member.key.name;

                                // @state decorator requires an initial value
                                // This is opinionated: we need the value to determine if it's primitive or object/array
                                // CRITICAL: undefined value means no initial value
                                // TypeScript optional properties (count?) are converted to count: undefined
                                // We should treat undefined as no initial value
                                const hasInitialValue = !!(
                                    member.value &&
                                    !(
                                        member.value.type === "Identifier" &&
                                        (member.value as t.Identifier).name === "undefined"
                                    ) &&
                                    !(
                                        member.value.type === "UnaryExpression" &&
                                        member.value.operator === "void"
                                    )
                                );

                                // DEBUG: Log hasInitialValue for count
                                if (key === "count") {
                                    console.error(
                                        `[Babel Plugin WSX State] DEBUG: hasInitialValue for 'count' = ${hasInitialValue}, type = ${typeof hasInitialValue}`
                                    );
                                    console.error(
                                        `[Babel Plugin WSX State] DEBUG: member.value = ${member.value}, !hasInitialValue = ${!hasInitialValue}`
                                    );
                                }

                                if (!hasInitialValue) {
                                    // CRITICAL: This error should be thrown during build time
                                    // If this error is not thrown, it means the plugin didn't detect the decorator
                                    // or the file wasn't processed by Babel
                                    const error = path.buildCodeFrameError(
                                        `@state decorator on property '${key}' requires an initial value.\n` +
                                            `\n` +
                                            `Examples:\n` +
                                            `  @state private ${key} = "";  // for string\n` +
                                            `  @state private ${key} = 0;  // for number\n` +
                                            `  @state private ${key} = {};  // for object\n` +
                                            `  @state private ${key} = [];  // for array\n` +
                                            `  @state private ${key} = undefined;  // for optional\n` +
                                            `\n` +
                                            `Current code: @state private ${key};\n` +
                                            `\n` +
                                            `This error should be caught during build time. ` +
                                            `If you see this at runtime, it means the Babel plugin did not process this file.`
                                    );
                                    console.error(
                                        `[Babel Plugin WSX State] ERROR: ${error.message}`
                                    );
                                    throw error;
                                }

                                const initialValue = member.value as t.Expression;

                                // Determine if it's an object/array
                                const isObject =
                                    initialValue.type === "ObjectExpression" ||
                                    initialValue.type === "ArrayExpression";

                                // Check if it's specifically an array
                                const isArray = initialValue.type === "ArrayExpression";

                                stateProperties.push({
                                    key,
                                    initialValue,
                                    isObject,
                                    isArray, // Add isArray flag
                                });

                                // Remove @state decorator - but keep other decorators
                                if (member.decorators) {
                                    member.decorators = member.decorators.filter(
                                        (decorator: t.Decorator) => {
                                            if (
                                                decorator.expression.type === "Identifier" &&
                                                decorator.expression.name === "state"
                                            ) {
                                                return false; // Remove @state decorator
                                            }
                                            if (
                                                decorator.expression.type === "CallExpression" &&
                                                decorator.expression.callee.type === "Identifier" &&
                                                decorator.expression.callee.name === "state"
                                            ) {
                                                return false; // Remove @state() decorator
                                            }
                                            return true; // Keep other decorators
                                        }
                                    );
                                }

                                // Remove initial value - it will be set in constructor via this.reactive()
                                // Keep the property declaration but without initial value
                                member.value = undefined;
                            }
                        } catch (error) {
                            console.error(
                                `[Babel Plugin WSX State] CRASH in member processing for '${propertyName}':`,
                                error
                            );
                            console.error(`Stack trace:`, (error as Error).stack);
                            throw error;
                        }
                    }
                }

                if (stateProperties.length === 0) {
                    return; // No @state properties found
                }

                // Find or create constructor
                let constructor = classBody.body.find(
                    (member: t.ClassBody["body"][number]): member is t.ClassMethod =>
                        member.type === "ClassMethod" && member.kind === "constructor"
                ) as t.ClassMethod | undefined;

                if (!constructor) {
                    // Create constructor if it doesn't exist
                    constructor = t.classMethod(
                        "constructor",
                        t.identifier("constructor"),
                        [],
                        t.blockStatement([])
                    );
                    classBody.body.unshift(constructor);
                }

                // Add initialization code to constructor
                const statements: t.Statement[] = [];

                // Add super() call if not present
                const hasSuper = constructor.body.body.some(
                    (stmt: t.Statement) =>
                        stmt.type === "ExpressionStatement" &&
                        stmt.expression.type === "CallExpression" &&
                        stmt.expression.callee.type === "Super"
                );

                if (!hasSuper) {
                    statements.push(t.expressionStatement(t.callExpression(t.super(), [])));
                }

                // CRITICAL: Add state property initialization AFTER all existing constructor code
                // WebComponent already has reactive() and useState() methods
                // We'll insert these statements at the END of constructor, not right after super()
                for (const { key, initialValue, isObject } of stateProperties) {
                    if (isObject) {
                        // For objects/arrays: this.state = this.reactive({ count: 0 });
                        // Store the initial reactive value in a private variable
                        const reactiveVarId = t.identifier(`_${key}Reactive`);

                        // Create variable to store reactive value
                        statements.push(
                            t.variableDeclaration("let", [
                                t.variableDeclarator(
                                    reactiveVarId,
                                    t.callExpression(
                                        t.memberExpression(
                                            t.thisExpression(),
                                            t.identifier("reactive")
                                        ),
                                        [initialValue]
                                    )
                                ),
                            ])
                        );

                        // For both arrays and objects, create a getter/setter that automatically wraps new values in reactive()
                        // This ensures that when you do `this.state = { ... }` or `this.todos = [...]`,
                        // the new value is automatically wrapped in reactive()
                        // Create getter/setter using Object.defineProperty
                        statements.push(
                            t.expressionStatement(
                                t.callExpression(
                                    t.memberExpression(
                                        t.identifier("Object"),
                                        t.identifier("defineProperty")
                                    ),
                                    [
                                        t.thisExpression(),
                                        t.stringLiteral(key),
                                        t.objectExpression([
                                            t.objectProperty(
                                                t.identifier("get"),
                                                t.arrowFunctionExpression([], reactiveVarId)
                                            ),
                                            t.objectProperty(
                                                t.identifier("set"),
                                                t.arrowFunctionExpression(
                                                    [t.identifier("newValue")],
                                                    t.blockStatement([
                                                        t.expressionStatement(
                                                            t.assignmentExpression(
                                                                "=",
                                                                reactiveVarId,
                                                                t.conditionalExpression(
                                                                    // Check if newValue is an object or array
                                                                    t.logicalExpression(
                                                                        "&&",
                                                                        t.binaryExpression(
                                                                            "!==",
                                                                            t.identifier(
                                                                                "newValue"
                                                                            ),
                                                                            t.nullLiteral()
                                                                        ),
                                                                        t.logicalExpression(
                                                                            "&&",
                                                                            t.binaryExpression(
                                                                                "!==",
                                                                                t.unaryExpression(
                                                                                    "typeof",
                                                                                    t.identifier(
                                                                                        "newValue"
                                                                                    )
                                                                                ),
                                                                                t.stringLiteral(
                                                                                    "undefined"
                                                                                )
                                                                            ),
                                                                            t.logicalExpression(
                                                                                "||",
                                                                                t.callExpression(
                                                                                    t.memberExpression(
                                                                                        t.identifier(
                                                                                            "Array"
                                                                                        ),
                                                                                        t.identifier(
                                                                                            "isArray"
                                                                                        )
                                                                                    ),
                                                                                    [
                                                                                        t.identifier(
                                                                                            "newValue"
                                                                                        ),
                                                                                    ]
                                                                                ),
                                                                                t.binaryExpression(
                                                                                    "===",
                                                                                    t.unaryExpression(
                                                                                        "typeof",
                                                                                        t.identifier(
                                                                                            "newValue"
                                                                                        )
                                                                                    ),
                                                                                    t.stringLiteral(
                                                                                        "object"
                                                                                    )
                                                                                )
                                                                            )
                                                                        )
                                                                    ),
                                                                    // If object/array, wrap in reactive
                                                                    t.callExpression(
                                                                        t.memberExpression(
                                                                            t.thisExpression(),
                                                                            t.identifier("reactive")
                                                                        ),
                                                                        [t.identifier("newValue")]
                                                                    ),
                                                                    // Otherwise, just assign (for primitives)
                                                                    t.identifier("newValue")
                                                                )
                                                            )
                                                        ),
                                                        // Trigger rerender when value is replaced
                                                        t.expressionStatement(
                                                            t.callExpression(
                                                                t.memberExpression(
                                                                    t.thisExpression(),
                                                                    t.identifier("scheduleRerender")
                                                                ),
                                                                []
                                                            )
                                                        ),
                                                    ])
                                                )
                                            ),
                                            t.objectProperty(
                                                t.identifier("enumerable"),
                                                t.booleanLiteral(true)
                                            ),
                                            t.objectProperty(
                                                t.identifier("configurable"),
                                                t.booleanLiteral(true)
                                            ),
                                        ]),
                                    ]
                                )
                            )
                        );
                    } else {
                        // For primitives: use useState
                        // const [getState, setState] = this.useState("state", initialValue);
                        // Object.defineProperty(this, "state", { get: getState, set: setState });
                        const getterId = t.identifier(`_get${key}`);
                        const setterId = t.identifier(`_set${key}`);

                        statements.push(
                            t.variableDeclaration("const", [
                                t.variableDeclarator(
                                    t.arrayPattern([getterId, setterId]),
                                    t.callExpression(
                                        t.memberExpression(
                                            t.thisExpression(),
                                            t.identifier("useState")
                                        ),
                                        [t.stringLiteral(key), initialValue]
                                    )
                                ),
                            ])
                        );

                        statements.push(
                            t.expressionStatement(
                                t.callExpression(
                                    t.memberExpression(
                                        t.identifier("Object"),
                                        t.identifier("defineProperty")
                                    ),
                                    [
                                        t.thisExpression(),
                                        t.stringLiteral(key),
                                        t.objectExpression([
                                            t.objectProperty(t.identifier("get"), getterId),
                                            t.objectProperty(t.identifier("set"), setterId),
                                            t.objectProperty(
                                                t.identifier("enumerable"),
                                                t.booleanLiteral(true)
                                            ),
                                            t.objectProperty(
                                                t.identifier("configurable"),
                                                t.booleanLiteral(true)
                                            ),
                                        ]),
                                    ]
                                )
                            )
                        );
                    }
                }

                // CRITICAL: Insert statements at the END of constructor
                // WebComponent already has reactive() and useState() methods
                // Inserting at the end ensures all constructor code has run
                constructor.body.body.push(...statements);
            },
        },
    };
}
