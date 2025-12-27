/**
 * ESLint 规则：no-duplicate-keys
 *
 * 检测同一个 key 在不同父容器中使用的情况
 * 这会导致 DOM 缓存冲突，元素被错误地移动到错误的容器中
 */

import { Rule } from "eslint";
import { WSXRuleModule } from "../types";

interface KeyUsage {
    key: string;
    parentName: string;
    node: unknown;
}

export const noDuplicateKeys: WSXRuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "disallow using the same key in different parent containers",
            category: "Possible Errors",
            recommended: true,
        },
        messages: {
            duplicateKey:
                'Duplicate key "{{key}}" found in different parent containers ({{parent1}} and {{parent2}}). ' +
                "This will cause DOM cache conflicts. " +
                'Use unique key prefixes like key="{{parent1}}-{{key}}" and key="{{parent2}}-{{key}}".',
        },
        schema: [], // 无配置选项
    },
    create(context: Rule.RuleContext) {
        // Map<FunctionNode, Map<KeyValue, KeyUsage>>
        const functionKeyMap = new Map<unknown, Map<string, KeyUsage>>();
        const functionStack: unknown[] = [];

        /**
         * Gets the parent JSX element name
         */
        function getParentJSXName(node: unknown): string {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let parent = (node as any).parent;

            // Traverse up to find the parent JSX element
            while (parent) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((parent as any).type === "JSXElement") {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const openingElement = (parent as any).openingElement;
                    if (openingElement) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const name = (openingElement as any).name;
                        if (name) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const nameValue = (name as any).name || name;
                            if (typeof nameValue === "string") {
                                return nameValue;
                            }
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            if ((nameValue as any).name) {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                return (nameValue as any).name;
                            }
                        }
                    }
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                parent = (parent as any).parent;
            }

            return "unknown";
        }

        /**
         * Extracts the key value from JSX attribute
         */
        function getKeyValue(attr: unknown): string | null {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const value = (attr as any).value;

            if (!value) {
                return null;
            }

            // String literal: key="value"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((value as any).type === "Literal") {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return String((value as any).value);
            }

            // Template literal: key={`prefix-${id}`}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((value as any).type === "JSXExpressionContainer") {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const expression = (value as any).expression;

                // Simple identifier: key={itemId}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((expression as any).type === "Identifier") {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return (expression as any).name;
                }

                // Template literal: key={`prefix-${id}`}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((expression as any).type === "TemplateLiteral") {
                    // Extract the static parts
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const quasis = (expression as any).quasis || [];
                    if (quasis.length > 0 && quasis[0].value) {
                        return quasis[0].value.raw || quasis[0].value.cooked;
                    }
                }
            }

            return null;
        }

        return {
            // Track function/method entry
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ":function"(node: any) {
                functionStack.push(node);
                functionKeyMap.set(node, new Map());
            },

            // Track function/method exit
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ":function:exit"(_node: any) {
                functionStack.pop();
            },

            // Check JSX elements for key attributes
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            JSXOpeningElement(node: any) {
                if (functionStack.length === 0) {
                    return;
                }

                const currentFunction = functionStack[functionStack.length - 1];
                const keyMap = functionKeyMap.get(currentFunction);

                if (!keyMap) {
                    return;
                }

                // Find the key attribute
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const keyAttr = (node.attributes || []).find((attr: any) => {
                    return attr.type === "JSXAttribute" && attr.name && attr.name.name === "key";
                });

                if (!keyAttr) {
                    return;
                }

                const keyValue = getKeyValue(keyAttr);

                if (!keyValue) {
                    return;
                }

                const parentName = getParentJSXName(node);

                // Check if this key was already used in a different parent
                const existing = keyMap.get(keyValue);

                if (existing && existing.parentName !== parentName) {
                    // Found duplicate key in different parent!
                    context.report({
                        node: keyAttr,
                        messageId: "duplicateKey",
                        data: {
                            key: keyValue,
                            parent1: existing.parentName,
                            parent2: parentName,
                        },
                    });
                } else if (!existing) {
                    // First time seeing this key, record it
                    keyMap.set(keyValue, {
                        key: keyValue,
                        parentName,
                        node: keyAttr,
                    });
                }
            },
        };
    },
};
