import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import React from "react";
import { render } from "ink";
import inquirer from "inquirer";
import { InitUI } from "../ui/InitUI.js";
import { configureTypeScript, TypeScriptConfigOptions } from "../config/configure-typescript.js";
import { configureVite } from "../config/configure-vite.js";
import { configureESLint, ESLintConfigOptions } from "../config/configure-eslint.js";

export interface InitOptions {
    skipTsconfig?: boolean;
    skipVite?: boolean;
    skipEslint?: boolean;
    skipTypes?: boolean;
    useTsconfigPackage?: boolean;
    useDecorators?: boolean;
    interactive?: boolean;
}

export async function initWSX(options: InitOptions = {}) {
    const projectRoot = process.cwd();

    // 交互式询问（如果启用且未通过选项指定）
    let finalOptions = { ...options };
    if (options.interactive !== false) {
        finalOptions = await promptUserOptions(options);
    }

    // 创建结果跟踪
    const results: Array<{
        name: string;
        success: boolean;
        message: string;
        created: boolean;
    }> = [];

    // Create a promise to track when UI completes
    let resolveComplete: () => void;
    const completePromise = new Promise<void>((resolve) => {
        resolveComplete = resolve;
    });

    // 定义配置步骤
    const configSteps = [
        {
            name: "TypeScript",
            skip: finalOptions.skipTsconfig ?? false,
            execute: async () => {
                const tsOptions: TypeScriptConfigOptions = {
                    useTsConfigPackage: finalOptions.useTsconfigPackage,
                    useDecorators: finalOptions.useDecorators ?? true,
                };
                const result = await configureTypeScript(projectRoot, tsOptions);
                results.push({ name: "TypeScript", ...result });
                return result;
            },
        },
        {
            name: "Vite",
            skip: finalOptions.skipVite ?? false,
            execute: async () => {
                const result = await configureVite(projectRoot);
                results.push({ name: "Vite", ...result });
                return result;
            },
        },
        {
            name: "wsx.d.ts",
            skip: finalOptions.skipTypes ?? false,
            execute: async () => {
                const result = await generateWsxTypes(projectRoot);
                const stepResult = {
                    success: result.success,
                    message: result.message,
                    created: result.created,
                };
                results.push({ name: "wsx.d.ts", ...stepResult });
                return stepResult;
            },
        },
        {
            name: "ESLint",
            skip: finalOptions.skipEslint ?? false,
            execute: async () => {
                const eslintOptions: ESLintConfigOptions = {
                    useFlatConfig: undefined, // 自动检测
                };
                const result = await configureESLint(projectRoot, eslintOptions);
                results.push({ name: "ESLint", ...result });
                return result;
            },
        },
    ];

    // Render Ink UI
    const { unmount } = render(
        React.createElement(InitUI, {
            onComplete: () => {
                resolveComplete();
            },
            options: finalOptions, // Keep for potential future use
            configSteps,
        })
    );

    // 等待 UI 完成
    await completePromise;

    // Unmount the UI
    unmount();

    // 输出结果摘要
    console.log("\n配置完成摘要:");
    results.forEach((result) => {
        const status = result.success ? "✓" : "✗";
        console.log(`  ${status} ${result.name}: ${result.message}`);
    });
}

/**
 * 交互式询问用户选项
 */
async function promptUserOptions(existingOptions: InitOptions): Promise<InitOptions> {
    const answers = await inquirer.prompt([
        {
            type: "confirm",
            name: "useDecorators",
            message: "是否使用装饰器（@state）？",
            default: existingOptions.useDecorators ?? true,
            when: existingOptions.useDecorators === undefined,
        },
        {
            type: "confirm",
            name: "useTsconfigPackage",
            message: "是否使用 @wsxjs/wsx-tsconfig 包？",
            default: existingOptions.useTsconfigPackage ?? false,
            when: existingOptions.useTsconfigPackage === undefined,
        },
        {
            type: "confirm",
            name: "configureTsconfig",
            message: "是否配置 TypeScript？",
            default: !existingOptions.skipTsconfig,
            when: existingOptions.skipTsconfig === undefined,
        },
        {
            type: "confirm",
            name: "configureVite",
            message: "是否配置 Vite？",
            default: !existingOptions.skipVite,
            when: existingOptions.skipVite === undefined,
        },
        {
            type: "confirm",
            name: "configureEslint",
            message: "是否配置 ESLint？",
            default: !existingOptions.skipEslint,
            when: existingOptions.skipEslint === undefined,
        },
        {
            type: "confirm",
            name: "generateTypes",
            message: "是否生成 wsx.d.ts？",
            default: !existingOptions.skipTypes,
            when: existingOptions.skipTypes === undefined,
        },
    ]);

    return {
        ...existingOptions,
        useDecorators: answers.useDecorators ?? existingOptions.useDecorators,
        useTsconfigPackage: answers.useTsconfigPackage ?? existingOptions.useTsconfigPackage,
        skipTsconfig: !answers.configureTsconfig,
        skipVite: !answers.configureVite,
        skipEslint: !answers.configureEslint,
        skipTypes: !answers.generateTypes,
    };
}

/**
 * 生成 wsx.d.ts 类型声明文件
 */
async function generateWsxTypes(projectRoot: string): Promise<{
    success: boolean;
    message: string;
    created: boolean;
}> {
    const typesDir = join(projectRoot, "src", "types");
    const wsxDtsPath = join(typesDir, "wsx.d.ts");

    // Check if wsx.d.ts already exists
    if (existsSync(wsxDtsPath)) {
        return {
            success: true,
            message: "wsx.d.ts 已存在",
            created: false,
        };
    }

    // Create types directory if it doesn't exist
    if (!existsSync(typesDir)) {
        mkdirSync(typesDir, { recursive: true });
    }

    // Generate wsx.d.ts content
    const wsxDtsContent = `// Type declaration for .wsx files
// Auto-generated by @wsxjs/cli
// You can modify this file if needed

declare module "*.wsx" {
    import { WebComponent, LightComponent } from "@wsxjs/wsx-core";
    const Component: new (...args: unknown[]) => WebComponent | LightComponent;
    export default Component;
}
`;

    // Write wsx.d.ts file
    writeFileSync(wsxDtsPath, wsxDtsContent, "utf-8");

    return {
        success: true,
        message: "已生成 wsx.d.ts",
        created: true,
    };
}
