/**
 * ESLint 规则：prefer-class-over-classname
 *
 * 强制在 WSX/JSX 中使用原生的 'class' 属性而不是 React 风格的 'className'
 */

import { Rule } from "eslint";
import { WSXRuleModule } from "../types";

export const preferClassOverClassName: WSXRuleModule = {
    meta: {
        type: "suggestion",
        docs: {
            description: "prefer native 'class' attribute over 'className'",
            category: "Stylistic Issues",
            recommended: true,
        },
        fixable: "code",
        messages: {
            preferClass: "Use native 'class' attribute instead of 'className'",
        },
        schema: [],
    },
    create(context: Rule.RuleContext) {
        return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            JSXAttribute(node: any) {
                if (node.name && node.name.name === "className") {
                    context.report({
                        node: node.name,
                        messageId: "preferClass",
                        fix(fixer) {
                            return fixer.replaceText(node.name, "class");
                        },
                    });
                }
            },
        };
    },
};
