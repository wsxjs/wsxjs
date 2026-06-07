/**
 * ESLint 规则：no-inline-styles-in-jsx
 *
 * 建议使用同名 CSS 样式文件进行自动注入，避免在 JSX 中使用内联样式（可选规则）
 */

import { Rule } from "eslint";
import { WSXRuleModule } from "../types";

export const noInlineStylesInJSX: WSXRuleModule = {
    meta: {
        type: "suggestion",
        docs: {
            description: "disallow inline style attributes in JSX",
            category: "Best Practices",
            recommended: false,
        },
        messages: {
            noInlineStyle: "Do not use inline styles in JSX. Use styles configuration and auto style injection instead.",
        },
        schema: [],
    },
    create(context: Rule.RuleContext) {
        return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            JSXAttribute(node: any) {
                if (node.name && node.name.name === "style") {
                    context.report({
                        node: node.name,
                        messageId: "noInlineStyle",
                    });
                }
            },
        };
    },
};
