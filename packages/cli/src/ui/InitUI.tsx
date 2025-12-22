import React, { useState, useEffect, useRef } from "react";
import { Box, Text, Newline } from "ink";
import Spinner from "ink-spinner";
import type { InitOptions } from "../commands/init.js";

export interface InitUIProps {
    onComplete: () => void;
    options: InitOptions;
    configSteps: Array<{
        name: string;
        skip: boolean;
        execute: () => Promise<{ success: boolean; message: string; created: boolean }>;
    }>;
}

interface StepStatus {
    name: string;
    status: "pending" | "running" | "completed" | "skipped" | "error";
    message?: string;
}

export const InitUI: React.FC<InitUIProps> = ({ onComplete, configSteps }) => {
    const [steps, setSteps] = useState<StepStatus[]>(
        configSteps.map((step) => ({
            name: step.name,
            status: step.skip ? ("skipped" as const) : ("pending" as const),
            message: step.skip ? "已跳过" : undefined,
        }))
    );
    const [allComplete, setAllComplete] = useState(false);
    const executingRef = useRef(false);

    useEffect(() => {
        // 检查是否所有步骤都被跳过
        const allSkipped = steps.every((s) => s.status === "skipped");
        if (allSkipped) {
            setAllComplete(true);
            setTimeout(() => onComplete(), 1000);
            return;
        }

        // 如果已经在执行，不要重复执行
        if (executingRef.current) {
            return;
        }

        executingRef.current = true;

        // 执行配置步骤
        const runSteps = async () => {
            const stepsToExecute = configSteps.filter((step) => !step.skip);

            for (let i = 0; i < stepsToExecute.length; i++) {
                const step = stepsToExecute[i];

                // 标记为运行中
                setSteps((prev) => {
                    const newSteps = [...prev];
                    const index = newSteps.findIndex((s) => s.name === step.name);
                    if (index !== -1) {
                        newSteps[index] = {
                            ...newSteps[index],
                            status: "running",
                        };
                    }
                    return newSteps;
                });

                try {
                    // 执行步骤
                    const result = await step.execute();

                    // 更新步骤状态
                    setSteps((prev) => {
                        const newSteps = [...prev];
                        const index = newSteps.findIndex((s) => s.name === step.name);
                        if (index !== -1) {
                            newSteps[index] = {
                                ...newSteps[index],
                                status: result.success
                                    ? ("completed" as const)
                                    : ("error" as const),
                                message: result.message,
                            };
                        }
                        return newSteps;
                    });
                } catch (error) {
                    // 处理错误
                    setSteps((prev) => {
                        const newSteps = [...prev];
                        const index = newSteps.findIndex((s) => s.name === step.name);
                        if (index !== -1) {
                            newSteps[index] = {
                                ...newSteps[index],
                                status: "error",
                                message: `错误: ${error instanceof Error ? error.message : String(error)}`,
                            };
                        }
                        return newSteps;
                    });
                }

                // 短暂延迟，让用户看到进度
                await new Promise((resolve) => setTimeout(resolve, 200));
            }

            // 所有步骤完成
            setAllComplete(true);
            setTimeout(() => onComplete(), 1500);
        };

        // 延迟一点开始执行，让 UI 先渲染
        const timer = setTimeout(() => {
            runSteps().catch((error) => {
                // 处理未捕获的错误
                setSteps((prev) => {
                    const newSteps = [...prev];
                    const errorStep = newSteps.find((s) => s.status === "running");
                    if (errorStep) {
                        const index = newSteps.findIndex((s) => s.name === errorStep.name);
                        if (index !== -1) {
                            newSteps[index] = {
                                ...newSteps[index],
                                status: "error",
                                message: `错误: ${error instanceof Error ? error.message : String(error)}`,
                            };
                        }
                    }
                    return newSteps;
                });
                setAllComplete(true);
                setTimeout(() => onComplete(), 1500);
            });
        }, 300);

        return () => {
            clearTimeout(timer);
            executingRef.current = false;
        };
    }, []);

    return (
        <Box flexDirection="column" padding={1}>
            <Text bold color="blue">
                🚀 正在初始化 WSXJS...
            </Text>

            <Newline />

            {steps.map((step) => (
                <Box key={step.name} flexDirection="column" marginBottom={1}>
                    {step.status === "pending" && (
                        <Text color="gray">⏳ {step.name}: 等待中...</Text>
                    )}
                    {step.status === "running" && (
                        <Text color="cyan">
                            <Spinner type="dots" /> {step.name}: 配置中...
                        </Text>
                    )}
                    {step.status === "completed" && (
                        <Text color="green">
                            ✓ {step.name}: {step.message || "完成"}
                        </Text>
                    )}
                    {step.status === "skipped" && (
                        <Text color="yellow">
                            ⊘ {step.name}: {step.message || "已跳过"}
                        </Text>
                    )}
                    {step.status === "error" && (
                        <Text color="red">
                            ✗ {step.name}: {step.message || "失败"}
                        </Text>
                    )}
                </Box>
            ))}

            {allComplete && (
                <Box flexDirection="column" marginTop={1}>
                    <Newline />
                    <Text bold color="green">
                        ✅ WSXJS 初始化完成！
                    </Text>
                    <Newline />
                    <Text color="gray">下一步：</Text>
                    <Text color="gray">1. 安装依赖: npm install</Text>
                    <Text color="gray">2. 开始开发: npm run dev</Text>
                </Box>
            )}
        </Box>
    );
};
