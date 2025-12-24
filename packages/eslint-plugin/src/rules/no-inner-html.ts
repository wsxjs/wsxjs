/**
 * ESLint 规则：no-inner-html
 *
 * 禁止在 WSX 代码中使用 innerHTML
 * WSX 框架鼓励使用声明式 JSX 而不是手动 DOM 操作
 */

import { Rule } from "eslint";
import { WSXRuleModule } from "../types";

export const noInnerHTML: WSXRuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "disallow use of innerHTML in WSX code",
            category: "Best Practices",
            recommended: true,
        },
        messages: {
            noInnerHTML:
                "Do not use innerHTML. Use JSX and WSX's declarative rendering instead. If you need to parse HTML strings, use parseHTMLToNodes() utility function.",
        },
        schema: [], // 无配置选项
    },
    create(context: Rule.RuleContext) {
        return {
            // 检测 innerHTML 赋值：element.innerHTML = "..."
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            AssignmentExpression(node: any) {
                if (
                    node.left &&
                    node.left.type === "MemberExpression" &&
                    node.left.property &&
                    node.left.property.type === "Identifier" &&
                    node.left.property.name === "innerHTML"
                ) {
                    context.report({
                        node,
                        messageId: "noInnerHTML",
                    });
                }
            },
            // 检测 innerHTML 读取：const html = element.innerHTML
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            MemberExpression(node: any) {
                if (
                    node.property &&
                    node.property.type === "Identifier" &&
                    node.property.name === "innerHTML" &&
                    node.parent &&
                    node.parent.type !== "AssignmentExpression"
                ) {
                    // 只报告读取操作（赋值已在上面处理）
                    // 但允许在特定上下文中读取（如调试或工具函数）
                    // 这里我们仍然报告，但用户可以通过注释禁用
                    context.report({
                        node,
                        messageId: "noInnerHTML",
                    });
                }
            },
        };
    },
};
