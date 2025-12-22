/**
 * TypeScript 配置生成和合并工具
 * 根据 RFC-0019 实现零配置初始化
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export interface TypeScriptConfigOptions {
    useTsConfigPackage?: boolean; // 是否使用 @wsxjs/wsx-tsconfig
    useDecorators?: boolean; // 是否使用装饰器（@state）
}

/**
 * 配置 TypeScript
 * @param projectRoot 项目根目录
 * @param options 配置选项
 * @returns 配置结果
 */
export async function configureTypeScript(
    projectRoot: string,
    options: TypeScriptConfigOptions = {}
): Promise<{ success: boolean; message: string; created: boolean }> {
    const tsconfigPath = join(projectRoot, "tsconfig.json");
    const { useTsConfigPackage = false, useDecorators = true } = options;

    // 如果使用 @wsxjs/wsx-tsconfig，生成简化配置
    if (useTsConfigPackage) {
        const config = {
            extends: "@wsxjs/wsx-tsconfig/tsconfig.base.json",
            compilerOptions: {
                outDir: "./dist",
            },
            include: ["src/**/*"],
        };

        if (existsSync(tsconfigPath)) {
            // 合并现有配置
            try {
                const existing = JSON.parse(readFileSync(tsconfigPath, "utf-8"));
                const merged = mergeTsConfig(existing, config);
                writeFileSync(tsconfigPath, JSON.stringify(merged, null, 2) + "\n", "utf-8");
                return {
                    success: true,
                    message: "已更新 tsconfig.json（使用 @wsxjs/wsx-tsconfig）",
                    created: false,
                };
            } catch (error) {
                return {
                    success: false,
                    message: `无法解析现有 tsconfig.json: ${error}`,
                    created: false,
                };
            }
        } else {
            // 创建新配置
            writeFileSync(tsconfigPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
            return {
                success: true,
                message: "已创建 tsconfig.json（使用 @wsxjs/wsx-tsconfig）",
                created: true,
            };
        }
    } else {
        // 不使用 tsconfig package，生成完整配置
        const compilerOptions: Record<string, unknown> = {
            jsx: "react-jsx",
            jsxImportSource: "@wsxjs/wsx-core",
            types: ["@wsxjs/wsx-core"],
        };

        // 如果使用装饰器，添加相关配置
        if (useDecorators) {
            compilerOptions.experimentalDecorators = true;
            compilerOptions.useDefineForClassFields = false;
        }

        const config = {
            compilerOptions,
            include: ["src/**/*"],
        };

        if (existsSync(tsconfigPath)) {
            // 合并现有配置
            try {
                const existing = JSON.parse(readFileSync(tsconfigPath, "utf-8"));
                const merged = mergeTsConfig(existing, config);
                writeFileSync(tsconfigPath, JSON.stringify(merged, null, 2) + "\n", "utf-8");
                return {
                    success: true,
                    message: "已更新 tsconfig.json",
                    created: false,
                };
            } catch (error) {
                return {
                    success: false,
                    message: `无法解析现有 tsconfig.json: ${error}`,
                    created: false,
                };
            }
        } else {
            // 创建新配置
            writeFileSync(tsconfigPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
            return {
                success: true,
                message: "已创建 tsconfig.json",
                created: true,
            };
        }
    }
}

/**
 * 合并 TypeScript 配置
 * 智能合并，不覆盖用户已有配置
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mergeTsConfig(existing: any, newConfig: any): any {
    const merged = { ...existing };

    // 合并 compilerOptions
    if (newConfig.compilerOptions) {
        merged.compilerOptions = {
            ...existing.compilerOptions,
            ...newConfig.compilerOptions,
        };
    }

    // 合并 include（去重）
    if (newConfig.include) {
        const existingInclude = existing.include || [];
        const newInclude = newConfig.include || [];
        merged.include = [...new Set([...existingInclude, ...newInclude])];
    }

    // 保留其他现有配置
    if (existing.extends && !newConfig.extends) {
        // 保留现有的 extends
    } else if (newConfig.extends) {
        merged.extends = newConfig.extends;
    }

    return merged;
}
