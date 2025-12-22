import React, { useState, useEffect } from "react";
import { Box, Text, Newline } from "ink";
import Spinner from "ink-spinner";
import type { InitOptions } from "../commands/init.js";

export interface InitUIProps {
    onComplete: () => void;
    options: InitOptions;
    configSteps: string[];
    onStepComplete: (
        stepName: string,
        result: { success: boolean; message: string; created: boolean }
    ) => void;
}

interface StepStatus {
    name: string;
    status: "pending" | "running" | "completed" | "skipped";
    message?: string;
}

export const InitUI: React.FC<InitUIProps> = ({
    onComplete,
    options,
    configSteps,
    onStepComplete,
}) => {
    const [steps, setSteps] = useState<StepStatus[]>(
        configSteps.map((name) => ({
            name,
            status: "pending",
        }))
    );
    const [allComplete, setAllComplete] = useState(false);

    useEffect(() => {
        // 标记跳过的步骤
        const updatedSteps = steps.map((step) => {
            if (step.name === "TypeScript" && options.skipTsconfig) {
                return { ...step, status: "skipped" as const, message: "已跳过" };
            }
            if (step.name === "Vite" && options.skipVite) {
                return { ...step, status: "skipped" as const, message: "已跳过" };
            }
            if (step.name === "wsx.d.ts" && options.skipTypes) {
                return { ...step, status: "skipped" as const, message: "已跳过" };
            }
            if (step.name === "ESLint" && options.skipEslint) {
                return { ...step, status: "skipped" as const, message: "已跳过" };
            }
            return step;
        });
        setSteps(updatedSteps);

        // 开始执行第一个未跳过的步骤
        const firstPendingIndex = updatedSteps.findIndex((s) => s.status === "pending");
        if (firstPendingIndex !== -1) {
            const timer = setTimeout(() => {
                setSteps((prev) => {
                    const newSteps = [...prev];
                    newSteps[firstPendingIndex] = {
                        ...newSteps[firstPendingIndex],
                        status: "running",
                    };
                    return newSteps;
                });
            }, 500);
            return () => clearTimeout(timer);
        } else {
            // 所有步骤都被跳过
            const timer = setTimeout(() => {
                setAllComplete(true);
                setTimeout(() => onComplete(), 1000);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, []);

    // 模拟步骤完成（实际应该由父组件通过回调触发）
    useEffect(() => {
        if (steps.some((s) => s.status === "running")) {
            // 模拟每个步骤的执行时间
            const runningStep = steps.find((s) => s.status === "running");
            if (runningStep) {
                const timer = setTimeout(() => {
                    setSteps((prev) => {
                        const newSteps = [...prev];
                        const index = newSteps.findIndex((s) => s.name === runningStep.name);
                        if (index !== -1) {
                            newSteps[index] = {
                                ...newSteps[index],
                                status: "completed",
                                message: "完成",
                            };
                            // 通知父组件
                            onStepComplete(runningStep.name, {
                                success: true,
                                message: "完成",
                                created: false,
                            });
                        }

                        // 检查是否还有待执行的步骤
                        const nextPendingIndex = newSteps.findIndex((s) => s.status === "pending");
                        if (nextPendingIndex !== -1) {
                            // 开始下一个步骤
                            setTimeout(() => {
                                setSteps((prev) => {
                                    const newPrev = [...prev];
                                    newPrev[nextPendingIndex] = {
                                        ...newPrev[nextPendingIndex],
                                        status: "running",
                                    };
                                    return newPrev;
                                });
                            }, 300);
                        } else {
                            // 所有步骤完成
                            setAllComplete(true);
                            setTimeout(() => onComplete(), 1500);
                        }

                        return newSteps;
                    });
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [steps, onStepComplete, onComplete]);

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
