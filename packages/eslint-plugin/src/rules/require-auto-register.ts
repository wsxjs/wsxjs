/**
 * ESLint 规则：require-auto-register
 *
 * 确保所有 WSX 组件（继承自 WebComponent 或 LightComponent）都声明了 @autoRegister 装饰器
 */

import { Rule } from "eslint";
import { WSXRuleModule } from "../types";

export const requireAutoRegister: WSXRuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "require @autoRegister decorator for WSX components",
            category: "Possible Errors",
            recommended: true,
        },
        messages: {
            missingAutoRegister: "WSX Component '{{componentName}}' must use @autoRegister decorator",
        },
        schema: [],
    },
    create(context: Rule.RuleContext) {
        // Track imported autoRegister identifier locally
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
                // Check if class inherits from WebComponent or LightComponent
                const isWSXComponent =
                    node.superClass &&
                    node.superClass.type === "Identifier" &&
                    (node.superClass.name === "WebComponent" ||
                        node.superClass.name === "LightComponent");

                if (!isWSXComponent) return;

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

                if (!hasAutoRegister) {
                    const componentName = node.id?.name || "Unknown";
                    context.report({
                        node: node.id || node,
                        messageId: "missingAutoRegister",
                        data: { componentName },
                    });
                }
            },
        };
    },
};
