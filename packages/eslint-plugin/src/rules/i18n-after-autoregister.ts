/**
 * ESLint 规则：i18n-after-autoregister
 *
 * 确保 @i18n 装饰器必须在 @autoRegister 装饰器之后
 * 这是因为装饰器的执行顺序是从下到上，@i18n 需要先应用，然后 @autoRegister 才能注册正确的类
 */

import { Rule } from "eslint";
import { WSXRuleModule } from "../types";

export const i18nAfterAutoRegister: WSXRuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "require @i18n decorator to be after @autoRegister decorator",
            category: "Possible Errors",
            recommended: true,
        },
        messages: {
            wrongOrder:
                "@i18n decorator must be placed after @autoRegister decorator.\n" +
                "\n" +
                "Correct order:\n" +
                "  @autoRegister({ tagName: 'my-component' })\n" +
                "  @i18n('common')\n" +
                "  export class MyComponent extends WebComponent {}\n" +
                "\n" +
                "This is required because decorators execute from bottom to top.",
        },
        schema: [],
    },
    create(context: Rule.RuleContext) {
        // Track imported decorator identifiers
        const autoRegisterImports = new Set<string>();
        const i18nImports = new Set<string>();

        return {
            // Track imports to identify decorators
            ImportDeclaration(node) {
                // Track @autoRegister from @wsxjs/wsx-core
                if (
                    node.source.type === "Literal" &&
                    typeof node.source.value === "string" &&
                    node.source.value === "@wsxjs/wsx-core"
                ) {
                    node.specifiers.forEach((specifier) => {
                        if (specifier.type === "ImportSpecifier") {
                            if (
                                specifier.imported.type === "Identifier" &&
                                specifier.imported.name === "autoRegister"
                            ) {
                                const localName =
                                    specifier.local.type === "Identifier"
                                        ? specifier.local.name
                                        : null;
                                if (localName) {
                                    autoRegisterImports.add(localName);
                                }
                            }
                        }
                    });
                }

                // Track @i18n from @wsxjs/wsx-i18next
                if (
                    node.source.type === "Literal" &&
                    typeof node.source.value === "string" &&
                    node.source.value === "@wsxjs/wsx-i18next"
                ) {
                    node.specifiers.forEach((specifier) => {
                        if (specifier.type === "ImportSpecifier") {
                            if (
                                specifier.imported.type === "Identifier" &&
                                specifier.imported.name === "i18n"
                            ) {
                                const localName =
                                    specifier.local.type === "Identifier"
                                        ? specifier.local.name
                                        : null;
                                if (localName) {
                                    i18nImports.add(localName);
                                }
                            }
                        } else if (specifier.type === "ImportDefaultSpecifier") {
                            // Handle default import: import i18n from '@wsxjs/wsx-i18next'
                            const localName =
                                specifier.local.type === "Identifier" ? specifier.local.name : null;
                            if (localName) {
                                i18nImports.add(localName);
                            }
                        }
                    });
                }
            },

            // Check class decorators for correct order
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            "ClassDeclaration, ClassExpression"(node: any) {
                if (!node.decorators || node.decorators.length < 2) {
                    return;
                }

                // Find positions of @autoRegister and @i18n decorators
                let autoRegisterIndex = -1;
                let i18nIndex = -1;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                node.decorators.forEach((decorator: any, index: number) => {
                    const isAutoRegister = (() => {
                        if (decorator.expression.type === "Identifier") {
                            return (
                                decorator.expression.name === "autoRegister" ||
                                autoRegisterImports.has(decorator.expression.name)
                            );
                        } else if (decorator.expression.type === "CallExpression") {
                            if (decorator.expression.callee.type === "Identifier") {
                                return (
                                    decorator.expression.callee.name === "autoRegister" ||
                                    autoRegisterImports.has(decorator.expression.callee.name)
                                );
                            }
                        }
                        return false;
                    })();

                    const isI18n = (() => {
                        if (decorator.expression.type === "Identifier") {
                            return (
                                decorator.expression.name === "i18n" ||
                                i18nImports.has(decorator.expression.name)
                            );
                        } else if (decorator.expression.type === "CallExpression") {
                            if (decorator.expression.callee.type === "Identifier") {
                                return (
                                    decorator.expression.callee.name === "i18n" ||
                                    i18nImports.has(decorator.expression.callee.name)
                                );
                            }
                        }
                        return false;
                    })();

                    if (isAutoRegister && autoRegisterIndex === -1) {
                        autoRegisterIndex = index;
                    }
                    if (isI18n && i18nIndex === -1) {
                        i18nIndex = index;
                    }
                });

                // If both decorators are present, check order
                // Decorators execute from bottom to top, so @i18n should be after @autoRegister (higher index)
                if (autoRegisterIndex !== -1 && i18nIndex !== -1) {
                    if (i18nIndex < autoRegisterIndex) {
                        // Find the @i18n decorator node to report the error
                        const i18nDecorator = node.decorators[i18nIndex];
                        context.report({
                            node: i18nDecorator,
                            messageId: "wrongOrder",
                        });
                    }
                }
            },
        };
    },
};
