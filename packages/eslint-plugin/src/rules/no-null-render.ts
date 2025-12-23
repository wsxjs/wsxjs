/**
 * ESLint 规则：no-null-render
 *
 * 禁止 render() 方法返回 null
 * WebComponent 和 LightComponent 的 connectedCallback 需要有效的 DOM 节点
 */

import { Rule } from "eslint";
import { WSXRuleModule } from "../types";

export const noNullRender: WSXRuleModule = {
    meta: {
        type: "problem",
        docs: {
            description: "disallow returning null from render() method",
            category: "Possible Errors",
            recommended: true,
        },
        fixable: "code",
        messages: {
            nullReturn:
                "render() method must not return null. WebComponent and LightComponent require a valid DOM node. Use an empty div as placeholder instead.",
        },
        schema: [], // 无配置选项
    },
    defaultOptions: [],
    create(context: Rule.RuleContext) {
        /**
         * 递归检查语句块中的所有 return null
         */
        function checkStatements(statements: import("estree").Statement[]) {
            statements.forEach((statement) => {
                // 检查 return null
                if (statement.type === "ReturnStatement" && statement.argument) {
                    const arg = statement.argument;
                    // 检查是否为 null 字面量
                    if (arg.type === "Literal" && (arg.value === null || arg.raw === "null")) {
                        context.report({
                            node: statement,
                            messageId: "nullReturn",
                            fix(fixer) {
                                // 将 return null; 替换为 return <div></div>;
                                const sourceCode = context.getSourceCode();
                                const returnToken = sourceCode.getFirstToken(statement);
                                const nullToken = sourceCode.getTokenAfter(returnToken!);
                                const semicolonToken = sourceCode.getTokenAfter(nullToken!);

                                if (!returnToken || !nullToken) return null;

                                // 计算替换范围：从 return 到 null（或分号）
                                const start = returnToken.range[0];
                                const end = semicolonToken
                                    ? semicolonToken.range[1]
                                    : nullToken.range[1];

                                // 替换为 return <div></div>;
                                return fixer.replaceTextRange([start, end], "return <div></div>;");
                            },
                        });
                    }
                }

                // 递归检查嵌套的语句块
                if (statement.type === "IfStatement") {
                    // 检查 then 分支
                    if (statement.consequent.type === "BlockStatement") {
                        checkStatements(statement.consequent.body);
                    }
                    // 检查 else 分支
                    if (statement.alternate) {
                        if (statement.alternate.type === "BlockStatement") {
                            checkStatements(statement.alternate.body);
                        } else if (statement.alternate.type === "IfStatement") {
                            // else if 的情况
                            checkStatements([statement.alternate]);
                        }
                    }
                } else if (statement.type === "SwitchStatement") {
                    // 检查 switch 的每个 case
                    statement.cases.forEach((caseClause) => {
                        checkStatements(caseClause.consequent);
                    });
                } else if (
                    statement.type === "ForStatement" ||
                    statement.type === "WhileStatement" ||
                    statement.type === "DoWhileStatement"
                ) {
                    // 检查循环体
                    if (statement.body.type === "BlockStatement") {
                        checkStatements(statement.body.body);
                    }
                } else if (
                    statement.type === "ForInStatement" ||
                    statement.type === "ForOfStatement"
                ) {
                    // 检查 for...in 和 for...of 循环体
                    if (statement.body.type === "BlockStatement") {
                        checkStatements(statement.body.body);
                    }
                } else if (statement.type === "TryStatement") {
                    // 检查 try 块
                    if (statement.block.type === "BlockStatement") {
                        checkStatements(statement.block.body);
                    }
                    // 检查 catch 块
                    if (statement.handler && statement.handler.body.type === "BlockStatement") {
                        checkStatements(statement.handler.body.body);
                    }
                    // 检查 finally 块
                    if (statement.finalizer && statement.finalizer.type === "BlockStatement") {
                        checkStatements(statement.finalizer.body);
                    }
                }
            });
        }

        /**
         * 检查方法体中是否有 return null
         */
        function checkReturnNull(
            node: import("estree").MethodDefinition | import("estree").Property
        ) {
            // 只检查 render 方法
            const isRenderMethod =
                (node.key.type === "Identifier" && node.key.name === "render") ||
                (node.key.type === "Literal" && node.key.value === "render");

            if (!isRenderMethod) return;

            // 获取方法体
            const methodValue = node.type === "MethodDefinition" ? node.value : node.value;
            if (!methodValue || methodValue.type !== "FunctionExpression") return;

            const body = methodValue.body;
            if (!body || body.type !== "BlockStatement") return;

            // 递归检查所有语句（包括嵌套的）
            checkStatements(body.body);
        }

        return {
            // 检查类方法定义
            MethodDefinition(node: import("estree").MethodDefinition) {
                // 检查是否继承自 WebComponent 或 LightComponent
                // 使用 getAncestors 获取父节点链
                const ancestors = context.getAncestors();
                const nodeIndex = ancestors.indexOf(node);

                // 查找最近的 ClassDeclaration 父节点
                let classDeclaration: import("estree").ClassDeclaration | null = null;
                for (let i = nodeIndex - 1; i >= 0; i--) {
                    const ancestor = ancestors[i];
                    if (ancestor && ancestor.type === "ClassDeclaration") {
                        classDeclaration = ancestor as import("estree").ClassDeclaration;
                        break;
                    }
                }

                if (classDeclaration && classDeclaration.superClass) {
                    const isWSXComponent =
                        classDeclaration.superClass.type === "Identifier" &&
                        (classDeclaration.superClass.name === "WebComponent" ||
                            classDeclaration.superClass.name === "LightComponent");

                    if (isWSXComponent) {
                        checkReturnNull(node);
                    }
                }
            },
        };
    },
};
