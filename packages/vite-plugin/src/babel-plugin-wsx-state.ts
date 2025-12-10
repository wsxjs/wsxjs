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
    }>;
    reactiveMethodName: string;
}

export default function babelPluginWSXState(): PluginObj<WSXStatePluginPass> {
    const t = tModule;
    return {
        name: "babel-plugin-wsx-state",
        visitor: {
            ClassDeclaration(path) {
                const classBody = path.node.body;
                const stateProperties: Array<{
                    key: string;
                    initialValue: t.Expression;
                    isObject: boolean;
                }> = [];

                // Find all @state decorated properties
                // Debug: log all class members
                console.info(
                    `[Babel Plugin WSX State] Processing class ${path.node.id?.name || "anonymous"}, members: ${classBody.body.length}`
                );

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
                        console.info(
                            `  - Property: ${member.key.name}, decorators: ${member.decorators?.length || 0}, hasValue: ${!!member.value}`
                        );

                        if (member.decorators && member.decorators.length > 0) {
                            // Debug: log decorator names
                            member.decorators.forEach((decorator) => {
                                if (decorator.expression.type === "Identifier") {
                                    console.info(`    Decorator: ${decorator.expression.name}`);
                                } else if (
                                    decorator.expression.type === "CallExpression" &&
                                    decorator.expression.callee.type === "Identifier"
                                ) {
                                    console.debug(
                                        `    Decorator: ${decorator.expression.callee.name}()`
                                    );
                                }
                            });
                        }

                        // Check if has @state decorator
                        const hasStateDecorator = member.decorators?.some(
                            (decorator: t.Decorator) => {
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
                            }
                        );

                        if (hasStateDecorator && member.value) {
                            const key = member.key.name;
                            const initialValue = member.value as t.Expression;

                            // Determine if it's an object/array
                            const isObject =
                                initialValue.type === "ObjectExpression" ||
                                initialValue.type === "ArrayExpression";

                            stateProperties.push({
                                key,
                                initialValue,
                                isObject,
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
                        statements.push(
                            t.expressionStatement(
                                t.assignmentExpression(
                                    "=",
                                    t.memberExpression(t.thisExpression(), t.identifier(key)),
                                    t.callExpression(
                                        t.memberExpression(
                                            t.thisExpression(),
                                            t.identifier("reactive")
                                        ),
                                        [initialValue]
                                    )
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
