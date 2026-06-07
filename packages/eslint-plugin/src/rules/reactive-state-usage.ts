/**
 * ESLint 规则：reactive-state-usage
 *
 * 警告直接修改非 @state 声明的组件实例属性，因为这不会触发视图重新渲染
 */

import { Rule } from "eslint";
import { WSXRuleModule } from "../types";

export const reactiveStateUsage: WSXRuleModule = {
    meta: {
        type: "suggestion",
        docs: {
            description: "ensure reactive state is used correctly",
            category: "Best Practices",
            recommended: true,
        },
        messages: {
            directPropertyAssignment:
                "Direct assignment to non-state property '{{propertyName}}' will not trigger rerender. Use @state decorator.",
        },
        schema: [],
    },
    create(context: Rule.RuleContext) {
        // Track imported state decorator identifiers
        const stateImports = new Set<string>();

        // Stack to support nested classes
        interface ClassContext {
            stateFields: Set<string>;
            nonStateFields: Set<string>;
        }
        const classStack: ClassContext[] = [];

        return {
            ImportDeclaration(node) {
                if (
                    node.source.type === "Literal" &&
                    typeof node.source.value === "string" &&
                    node.source.value === "@wsxjs/wsx-core"
                ) {
                    node.specifiers.forEach((specifier) => {
                        if (
                            specifier.type === "ImportSpecifier" &&
                            specifier.imported.type === "Identifier" &&
                            specifier.imported.name === "state"
                        ) {
                            const localName =
                                specifier.local.type === "Identifier"
                                    ? specifier.local.name
                                    : null;
                            if (localName) {
                                stateImports.add(localName);
                            }
                        }
                    });
                }
            },

            ClassDeclaration(node) {
                const stateFields = new Set<string>();
                const nonStateFields = new Set<string>();

                // Inspect class body
                node.body.body.forEach((member: any) => {
                    const isProperty =
                        member.type === "PropertyDefinition" ||
                        member.type === "ClassProperty" ||
                        member.type === "ClassPrivateProperty";

                    if (!isProperty) return;

                    const propertyName =
                        member.key.type === "Identifier"
                            ? member.key.name
                            : member.key.type === "PrivateIdentifier"
                              ? member.key.name
                              : null;

                    if (!propertyName) return;

                    // Check for @state decorator
                    const hasStateDecorator = member.decorators?.some((decorator: any) => {
                        if (decorator.expression.type === "Identifier") {
                            return (
                                decorator.expression.name === "state" ||
                                stateImports.has(decorator.expression.name)
                            );
                        } else if (decorator.expression.type === "CallExpression") {
                            if (decorator.expression.callee.type === "Identifier") {
                                return (
                                    decorator.expression.callee.name === "state" ||
                                    stateImports.has(decorator.expression.callee.name)
                                );
                            }
                        } else if (decorator.expression.type === "MemberExpression") {
                            if (
                                decorator.expression.property.type === "Identifier" &&
                                decorator.expression.property.name === "state"
                            ) {
                                return true;
                            }
                        }
                        return false;
                    });

                    if (hasStateDecorator) {
                        stateFields.add(propertyName);
                    } else {
                        nonStateFields.add(propertyName);
                    }
                });

                classStack.push({ stateFields, nonStateFields });
            },

            "ClassDeclaration:exit"() {
                classStack.pop();
            },

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            AssignmentExpression(node: any) {
                if (classStack.length === 0) return;

                // Ensure assignment is inside a class method other than constructor
                let current: any = node.parent;
                let inConstructor = false;
                let inMethod = false;

                while (current) {
                    if (current.type === "MethodDefinition") {
                        inMethod = true;
                        if (current.key.type === "Identifier" && current.key.name === "constructor") {
                            inConstructor = true;
                        }
                        break;
                    }
                    current = current.parent;
                }

                if (!inMethod || inConstructor) return;

                // Check if target is this.propertyName
                const left = node.left;
                if (left.type === "MemberExpression" && left.object.type === "ThisExpression") {
                    const propertyName =
                        left.property.type === "Identifier"
                            ? left.property.name
                            : left.property.type === "PrivateIdentifier"
                              ? left.property.name
                              : null;

                    if (propertyName) {
                        const currentClass = classStack[classStack.length - 1];
                        if (currentClass.nonStateFields.has(propertyName)) {
                            context.report({
                                node: left.property,
                                messageId: "directPropertyAssignment",
                                data: { propertyName },
                            });
                        }
                    }
                }
            },

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            UpdateExpression(node: any) {
                if (classStack.length === 0) return;

                // Ensure update is inside a class method other than constructor
                let current: any = node.parent;
                let inConstructor = false;
                let inMethod = false;

                while (current) {
                    if (current.type === "MethodDefinition") {
                        inMethod = true;
                        if (current.key.type === "Identifier" && current.key.name === "constructor") {
                            inConstructor = true;
                        }
                        break;
                    }
                    current = current.parent;
                }

                if (!inMethod || inConstructor) return;

                // Check if target is this.propertyName
                const argument = node.argument;
                if (argument.type === "MemberExpression" && argument.object.type === "ThisExpression") {
                    const propertyName =
                        argument.property.type === "Identifier"
                            ? argument.property.name
                            : argument.property.type === "PrivateIdentifier"
                              ? argument.property.name
                              : null;

                    if (propertyName) {
                        const currentClass = classStack[classStack.length - 1];
                        if (currentClass.nonStateFields.has(propertyName)) {
                            context.report({
                                node: argument.property,
                                messageId: "directPropertyAssignment",
                                data: { propertyName },
                            });
                        }
                    }
                }
            },
        };
    },
};
