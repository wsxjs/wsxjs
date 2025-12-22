/**
 * ESLint 规则：require-jsx-import-source
 *
 * 要求 .wsx 文件包含 @jsxImportSource pragma 注释
 * 自动修复：如果缺失，自动在文件开头添加
 *
 * 为什么需要这个规则：
 * - IDE 的 TypeScript 语言服务器读取源文件，需要 pragma 来正确进行类型检查
 * - Vite 插件在构建时注入 pragma 对 IDE 无效（IDE 看不到构建后的代码）
 * - ESLint 自动修复直接修改源文件，IDE 可以立即看到 pragma
 * - 这是唯一能让 IDE 和构建工具都正常工作的方案
 */

import { Rule } from "eslint";
import { WSXRuleModule } from "../types";

const JSX_IMPORT_SOURCE_PRAGMA = "/** @jsxImportSource @wsxjs/wsx-core */";

export const requireJsxImportSource: WSXRuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "require @jsxImportSource pragma in .wsx files",
            category: "Best Practices",
            recommended: true,
        },
        fixable: "code",
        messages: {
            missingPragma:
                "WSX files must include '@jsxImportSource @wsxjs/wsx-core' pragma comment at the top for IDE TypeScript language server support",
        },
        schema: [], // 无配置选项
    },
    defaultOptions: [], // 无默认配置选项
    create(context: Rule.RuleContext) {
        const filename = context.getFilename();
        // 只检查 .wsx 文件
        if (!filename.endsWith(".wsx")) {
            return {};
        }

        const sourceCode = context.getSourceCode();
        const text = sourceCode.getText();

        // 检查是否已包含 pragma
        const hasPragma = text.includes("@jsxImportSource");

        if (!hasPragma) {
            // 获取第一个节点（通常是文件开头的注释或 import）
            const firstNode = sourceCode.ast.body[0] || sourceCode.ast;

            context.report({
                node: firstNode,
                messageId: "missingPragma",
                fix(fixer) {
                    // 在文件开头插入 pragma 注释
                    return fixer.insertTextBeforeRange([0, 0], `${JSX_IMPORT_SOURCE_PRAGMA}\n`);
                },
            });
        }

        return {};
    },
};
