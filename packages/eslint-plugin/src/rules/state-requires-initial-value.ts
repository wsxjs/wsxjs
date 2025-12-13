/**
 * ESLint 规则：state-requires-initial-value
 *
 * 确保 @state 装饰器的属性必须有初始值
 * 这是强制性的，因为我们需要初始值来判断是 primitive 还是 object/array
 */

import { Rule } from "eslint";
import { WSXRuleModule } from "../types";

export const stateRequiresInitialValue: WSXRuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "require @state decorator properties to have initial values",
            category: "Possible Errors",
            recommended: true,
        },
        messages: {
            missingInitialValue:
                "@state decorator on property '{{propertyName}}' requires an initial value.\n" +
                "\n" +
                "Examples:\n" +
                "  @state private {{propertyName}} = '';  // for string\n" +
                "  @state private {{propertyName}} = 0;  // for number\n" +
                "  @state private {{propertyName}} = {};  // for object\n" +
                "  @state private {{propertyName}} = [];  // for array\n" +
                "  @state private {{propertyName}} = undefined;  // for optional",
        },
        schema: [],
    },
    create(context: Rule.RuleContext) {
        // Track imported 'state' identifiers from @wsxjs/wsx-core
        const stateImports = new Set<string>();

        return {
            // Track imports to identify @state decorator
            ImportDeclaration(node) {
                if (
                    node.source.type === "Literal" &&
                    typeof node.source.value === "string" &&
                    node.source.value === "@wsxjs/wsx-core"
                ) {
                    node.specifiers.forEach((specifier) => {
                        if (specifier.type === "ImportSpecifier") {
                            if (
                                specifier.imported.type === "Identifier" &&
                                specifier.imported.name === "state"
                            ) {
                                // Track both the imported name and any alias
                                const localName =
                                    specifier.local.type === "Identifier"
                                        ? specifier.local.name
                                        : null;
                                if (localName) {
                                    stateImports.add(localName);
                                }
                            }
                        } else if (specifier.type === "ImportDefaultSpecifier") {
                            // Handle default import (less common but possible)
                            const localName =
                                specifier.local.type === "Identifier" ? specifier.local.name : null;
                            if (localName) {
                                stateImports.add(localName);
                            }
                        } else if (specifier.type === "ImportNamespaceSpecifier") {
                            // Handle namespace import: import * as wsx from '@wsxjs/wsx-core'
                            // In this case, @state would be wsx.state, which is harder to detect
                            // We'll check for both 'state' and namespace.state patterns
                            const localName =
                                specifier.local.type === "Identifier" ? specifier.local.name : null;
                            if (localName) {
                                // For namespace imports, we'd need to check member expressions
                                // This is more complex, so we'll also check for plain 'state'
                                stateImports.add("state");
                            }
                        }
                    });
                }
            },

            // Check class properties for @state decorator
            // Support both ClassProperty (older) and PropertyDefinition (newer TypeScript ESLint)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            "ClassProperty, ClassPrivateProperty, PropertyDefinition"(node: any) {
                if (!node.decorators || node.decorators.length === 0) {
                    return;
                }

                // Check if any decorator is @state
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const hasStateDecorator = node.decorators.some((decorator: any) => {
                    if (decorator.expression.type === "Identifier") {
                        // Direct identifier: @state
                        return (
                            decorator.expression.name === "state" ||
                            stateImports.has(decorator.expression.name)
                        );
                    } else if (decorator.expression.type === "CallExpression") {
                        // Call expression: @state()
                        if (decorator.expression.callee.type === "Identifier") {
                            return (
                                decorator.expression.callee.name === "state" ||
                                stateImports.has(decorator.expression.callee.name)
                            );
                        }
                    } else if (decorator.expression.type === "MemberExpression") {
                        // Member expression: @namespace.state
                        if (
                            decorator.expression.property.type === "Identifier" &&
                            decorator.expression.property.name === "state"
                        ) {
                            return true;
                        }
                    }
                    return false;
                });

                if (hasStateDecorator && !node.value) {
                    const propertyName =
                        node.key.type === "Identifier"
                            ? node.key.name
                            : node.key.type === "PrivateIdentifier"
                              ? node.key.name
                              : "unknown";

                    context.report({
                        node,
                        messageId: "missingInitialValue",
                        data: { propertyName },
                    });
                }
            },
        };
    },
};
