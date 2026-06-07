/**
 * ESLint 规则：lifecycle-hook-naming
 *
 * 检查组件生命周期钩子命名是否正确，避免 React 风格的命名或拼写错误
 */

import { Rule } from "eslint";
import { WSXRuleModule } from "../types";

export const lifecycleHookNaming: WSXRuleModule = {
    meta: {
        type: "suggestion",
        docs: {
            description: "ensure correct naming for component lifecycle hooks",
            category: "Best Practices",
            recommended: true,
        },
        messages: {
            useOnConnected: "Did you mean 'onConnected' instead of '{{invalidName}}'?",
            useOnDisconnected: "Did you mean 'onDisconnected' instead of '{{invalidName}}'?",
            useOnRendered: "Did you mean 'onRendered' instead of '{{invalidName}}'?",
            useOnAttributeChanged: "Did you mean 'onAttributeChanged' instead of '{{invalidName}}'?",
        },
        schema: [],
    },
    create(context: Rule.RuleContext) {
        const invalidMappings: Record<string, { messageId: string; suggestion: string }> = {
            componentDidMount: { messageId: "useOnConnected", suggestion: "onConnected" },
            onConnectedCallback: { messageId: "useOnConnected", suggestion: "onConnected" },

            componentWillUnmount: { messageId: "useOnDisconnected", suggestion: "onDisconnected" },
            onDisconnectedCallback: { messageId: "useOnDisconnected", suggestion: "onDisconnected" },

            componentDidUpdate: { messageId: "useOnRendered", suggestion: "onRendered" },

            onAttributeChange: { messageId: "useOnAttributeChanged", suggestion: "onAttributeChanged" },
            onAttributechanged: { messageId: "useOnAttributeChanged", suggestion: "onAttributeChanged" },
        };

        return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ClassDeclaration(node: any) {
                const isWSXComponent =
                    node.superClass &&
                    node.superClass.type === "Identifier" &&
                    (node.superClass.name === "WebComponent" ||
                        node.superClass.name === "LightComponent");

                if (!isWSXComponent) return;

                node.body.body.forEach((member: any) => {
                    if (
                        member.type === "MethodDefinition" &&
                        member.key.type === "Identifier"
                    ) {
                        const methodName = member.key.name;
                        if (invalidMappings[methodName]) {
                            const { messageId } = invalidMappings[methodName];
                            context.report({
                                node: member.key,
                                messageId,
                                data: { invalidName: methodName },
                            });
                        }
                    }
                });
            },
        };
    },
};
