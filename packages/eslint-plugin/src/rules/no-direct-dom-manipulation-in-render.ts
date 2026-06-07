/**
 * ESLint 规则：no-direct-dom-manipulation-in-render
 *
 * 禁止在 render() 方法中直接操作 DOM (如 appendChild, innerHTML 等)，以保护协调引擎
 */

import { Rule } from "eslint";
import { WSXRuleModule } from "../types";

export const noDirectDOMManipulationInRender: WSXRuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "disallow direct DOM manipulation in render method",
            category: "Possible Errors",
            recommended: true,
        },
        messages: {
            noDirectDOMManipulation: "Do not manipulate DOM directly in render(). Return JSX elements instead.",
        },
        schema: [],
    },
    create(context: Rule.RuleContext) {
        const domModifyingMethods = ["appendChild", "removeChild", "insertBefore", "replaceChild"];
        const domModifyingProperties = ["innerHTML", "outerHTML", "textContent", "innerText"];

        return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            MethodDefinition(node: any) {
                // Ensure it is a method named "render" inside a class
                if (node.key.type !== "Identifier" || node.key.name !== "render") {
                    return;
                }

                // Traverse the render method body
                const methodBody = node.value.body;

                function traverse(astNode: any) {
                    if (!astNode) return;

                    // Check CallExpression: e.g., this.appendChild(...)
                    if (astNode.type === "CallExpression") {
                        const callee = astNode.callee;
                        if (
                            callee.type === "MemberExpression" &&
                            callee.property.type === "Identifier" &&
                            domModifyingMethods.includes(callee.property.name)
                        ) {
                            context.report({
                                node: astNode,
                                messageId: "noDirectDOMManipulation",
                            });
                        }
                    }

                    // Check AssignmentExpression: e.g., this.innerHTML = ...
                    if (astNode.type === "AssignmentExpression") {
                        const left = astNode.left;
                        if (
                            left.type === "MemberExpression" &&
                            left.property.type === "Identifier" &&
                            domModifyingProperties.includes(left.property.name)
                        ) {
                            context.report({
                                node: astNode,
                                messageId: "noDirectDOMManipulation",
                            });
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
            },
        };
    },
};
