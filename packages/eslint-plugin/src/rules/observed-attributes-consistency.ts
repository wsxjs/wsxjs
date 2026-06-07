/**
 * ESLint 规则：observed-attributes-consistency
 *
 * 确保 static get observedAttributes() 中声明的所有属性，都在 onAttributeChanged() 方法中得到了处理
 */

import { Rule } from "eslint";
import { WSXRuleModule } from "../types";

export const observedAttributesConsistency: WSXRuleModule = {
    meta: {
        type: "suggestion",
        docs: {
            description: "ensure observedAttributes are handled in onAttributeChanged",
            category: "Best Practices",
            recommended: true,
        },
        messages: {
            missingHandlerMethod: "observedAttributes are defined but 'onAttributeChanged' method is missing.",
            unhandledAttribute: "Attribute '{{attribute}}' is observed but not handled in onAttributeChanged.",
        },
        schema: [],
    },
    create(context: Rule.RuleContext) {
        return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ClassDeclaration(node: any) {
                // Check if class inherits from WebComponent or LightComponent
                const isWSXComponent =
                    node.superClass &&
                    node.superClass.type === "Identifier" &&
                    (node.superClass.name === "WebComponent" ||
                        node.superClass.name === "LightComponent");

                if (!isWSXComponent) return;

                // Find observedAttributes getter
                let observedAttributesNode: any = null;
                const observedAttributes: string[] = [];

                node.body.body.forEach((member: any) => {
                    if (
                        member.type === "MethodDefinition" &&
                        member.static === true &&
                        member.kind === "get" &&
                        member.key.type === "Identifier" &&
                        member.key.name === "observedAttributes"
                    ) {
                        observedAttributesNode = member;
                        // Attempt to parse returned array
                        const returnStatement = member.value.body.body.find(
                            (stmt: any) => stmt.type === "ReturnStatement"
                        );
                        if (
                            returnStatement &&
                            returnStatement.argument &&
                            returnStatement.argument.type === "ArrayExpression"
                        ) {
                            returnStatement.argument.elements.forEach((el: any) => {
                                if (el && el.type === "Literal" && typeof el.value === "string") {
                                    observedAttributes.push(el.value);
                                }
                            });
                        }
                    }
                });

                if (observedAttributes.length === 0) return;

                // Find onAttributeChanged method
                let onAttributeChangedNode: any = null;
                node.body.body.forEach((member: any) => {
                    if (
                        member.type === "MethodDefinition" &&
                        member.static === false &&
                        member.key.type === "Identifier" &&
                        member.key.name === "onAttributeChanged"
                    ) {
                        onAttributeChangedNode = member;
                    }
                });

                if (!onAttributeChangedNode) {
                    context.report({
                        node: observedAttributesNode.key,
                        messageId: "missingHandlerMethod",
                    });
                    return;
                }

                // Scan onAttributeChanged method body for references to the observed attributes as string literals
                const methodBody = onAttributeChangedNode.value.body;
                const foundAttributes = new Set<string>();

                function traverse(astNode: any) {
                    if (!astNode) return;

                    if (astNode.type === "Literal" && typeof astNode.value === "string") {
                        if (observedAttributes.includes(astNode.value)) {
                            foundAttributes.add(astNode.value);
                        }
                    }

                    // Traverse children
                    for (const key in astNode) {
                        if (key === "parent") continue;
                        if (astNode.hasOwnProperty(key)) {
                            const child = astNode[key];
                            if (Array.isArray(child)) {
                                child.forEach(traverse);
                            } else if (child && typeof child === "object" && typeof child.type === "string") {
                                traverse(child);
                            }
                        }
                    }
                }

                traverse(methodBody);

                // Report any unhandled observed attributes
                observedAttributes.forEach((attr) => {
                    if (!foundAttributes.has(attr)) {
                        context.report({
                            node: onAttributeChangedNode.key,
                            messageId: "unhandledAttribute",
                            data: { attribute: attr },
                        });
                    }
                });
            },
        };
    },
};
