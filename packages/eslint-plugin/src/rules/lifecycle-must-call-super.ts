/**
 * ESLint 规则：lifecycle-must-call-super
 *
 * 确保生命周期方法（onConnected, onDisconnected, onRendered）调用 super
 * 这些方法在 BaseComponent 中是可选的，但如果被重写，应该调用 super
 * 以确保正确的初始化和清理
 */

import { Rule } from "eslint";
import { WSXRuleModule } from "../types";

export const lifecycleMustCallSuper: WSXRuleModule = {
    meta: {
        type: "problem",
        docs: {
            description:
                "Enforce that lifecycle methods (onConnected, onDisconnected, onRendered) call super",
            category: "Possible Errors",
            recommended: true,
        },
        messages: {
            mustCallSuper:
                "Lifecycle method '{{methodName}}' must call 'super.{{methodName}}()' to ensure proper initialization.",
        },
        schema: [],
    },
    defaultOptions: [],
    create(context: Rule.RuleContext) {
        const lifecycleMethods = new Set(["onConnected", "onDisconnected", "onRendered"]);

        /**
         * 递归检查节点中是否有 super.methodName() 调用
         * 使用 visited 集合避免重复检查同一个节点（防止循环引用导致的无限递归）
         */
        function checkForSuperCall(
            node: import("estree").Node,
            methodName: string,
            visited = new WeakSet<import("estree").Node>()
        ): boolean {
            // 避免重复检查同一个节点
            if (visited.has(node)) {
                return false;
            }
            visited.add(node);

            if (node.type === "CallExpression") {
                const callee = node.callee;
                if (
                    callee.type === "MemberExpression" &&
                    callee.object.type === "Super" &&
                    callee.property.type === "Identifier" &&
                    callee.property.name === methodName
                ) {
                    return true;
                }
            }

            // 递归检查子节点（只检查常见的子节点类型，避免遍历所有属性）
            const nodeAny = node as unknown as Record<string, unknown>;
            const keysToCheck = [
                "body",
                "consequent",
                "alternate",
                "block",
                "handler",
                "finalizer",
                "argument",
                "callee",
                "expression",
                "declarations",
                "init",
                "test",
                "update",
                "cases",
                "discriminant",
                "object",
                "property",
                "elements",
                "properties",
                "value",
                "key",
            ];

            for (const key of keysToCheck) {
                const child = nodeAny[key];
                if (Array.isArray(child)) {
                    for (const item of child) {
                        if (item && typeof item === "object" && "type" in item) {
                            if (
                                checkForSuperCall(
                                    item as import("estree").Node,
                                    methodName,
                                    visited
                                )
                            ) {
                                return true;
                            }
                        }
                    }
                } else if (child && typeof child === "object" && "type" in child) {
                    if (checkForSuperCall(child as import("estree").Node, methodName, visited)) {
                        return true;
                    }
                }
            }

            return false;
        }

        return {
            MethodDefinition(node: import("estree").MethodDefinition) {
                // 只检查 protected 方法
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((node as any).accessibility !== "protected") {
                    return;
                }

                const methodName = node.key.type === "Identifier" ? node.key.name : null;
                if (!methodName || !lifecycleMethods.has(methodName)) {
                    return;
                }

                // 检查方法体中是否调用了 super
                const methodValue = node.value;
                if (!methodValue || methodValue.type !== "FunctionExpression") {
                    return;
                }

                const body = methodValue.body;
                if (!body || body.type !== "BlockStatement") {
                    return;
                }

                // 检查是否有 super 调用
                let hasSuperCall = false;
                for (const statement of body.body) {
                    if (checkForSuperCall(statement, methodName)) {
                        hasSuperCall = true;
                        break;
                    }
                }

                if (!hasSuperCall) {
                    context.report({
                        node: node.key,
                        messageId: "mustCallSuper",
                        data: {
                            methodName,
                        },
                    });
                }
            },
        };
    },
};
