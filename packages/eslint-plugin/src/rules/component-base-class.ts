/**
 * ESLint 规则：component-base-class
 *
 * 确保被 @autoRegister 装饰的类正确继承了 WebComponent 或 LightComponent 基类
 */

import { Rule } from "eslint";
import { WSXRuleModule } from "../types";

export const componentBaseClass: WSXRuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "require @autoRegister components to extend WebComponent or LightComponent",
            category: "Possible Errors",
            recommended: true,
        },
        messages: {
            invalidBaseClass:
                "WSX Component '{{componentName}}' decorated with @autoRegister must extend 'WebComponent' or 'LightComponent'.",
        },
        schema: [],
    },
    create(context: Rule.RuleContext) {
        const autoRegisterImports = new Set<string>();

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
                    });
                }
            },

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ClassDeclaration(node: any) {
                // Check if class has @autoRegister decorator
                const hasAutoRegister = node.decorators?.some((decorator: any) => {
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
                });

                if (!hasAutoRegister) return;

                // Validate base class
                const extendsCorrectBase =
                    node.superClass &&
                    node.superClass.type === "Identifier" &&
                    (node.superClass.name === "WebComponent" ||
                        node.superClass.name === "LightComponent");

                if (!extendsCorrectBase) {
                    const componentName = node.id?.name || "Unknown";
                    context.report({
                        node: node.superClass || node.id || node,
                        messageId: "invalidBaseClass",
                        data: { componentName },
                    });
                }
            },
        };
    },
};
