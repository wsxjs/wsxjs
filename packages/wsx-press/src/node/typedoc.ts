/**
 * @wsxjs/wsx-press/node/typedoc
 * TypeDoc API documentation generation
 */

import { Application, TSConfigReader, TypeDocReader } from "typedoc";
import fs from "fs-extra";

/**
 * TypeDoc 配置选项
 */
export interface TypeDocConfig {
    /** 入口点文件路径数组 */
    entryPoints: string[];
    /** TypeScript 配置文件路径 */
    tsconfig: string;
    /** 输出目录 */
    outputDir: string;
    /** 是否排除私有成员 */
    excludePrivate?: boolean;
    /** 是否排除受保护成员 */
    excludeProtected?: boolean;
    /** 是否排除内部成员 */
    excludeInternal?: boolean;
    /** 公共路径前缀 */
    publicPath?: string;
}

/**
 * 生成 API 文档
 *
 * @param config - TypeDoc 配置
 * @throws {Error} 如果生成失败
 */
export async function generateApiDocs(config: TypeDocConfig): Promise<void> {
    const {
        entryPoints,
        tsconfig,
        outputDir,
        excludePrivate = true,
        excludeProtected = false,
        excludeInternal = true,
        publicPath = "/api/",
    } = config;

    // 验证入口点存在
    for (const entryPoint of entryPoints) {
        if (!(await fs.pathExists(entryPoint))) {
            throw new Error(`Entry point not found: ${entryPoint}`);
        }
    }

    // 验证 tsconfig 存在
    if (!(await fs.pathExists(tsconfig))) {
        throw new Error(`TypeScript config not found: ${tsconfig}`);
    }

    // 确保输出目录存在
    await fs.ensureDir(outputDir);

    try {
        // 创建 TypeDoc 应用实例
        // 注意：publicPath 是 typedoc-plugin-markdown 的选项，不是 TypeDoc 核心选项
        const app = await Application.bootstrapWithPlugins({
            entryPoints,
            tsconfig,
            plugin: ["typedoc-plugin-markdown"],
            theme: "markdown",
            // 输出配置
            readme: "none",
            excludePrivate,
            excludeProtected,
            excludeInternal,
            // Markdown 插件配置（使用类型断言，因为这些是插件选项）
            ...({ publicPath } as Record<string, unknown>),
        });

        // 添加配置读取器
        app.options.addReader(new TSConfigReader());
        app.options.addReader(new TypeDocReader());

        // 转换项目
        const project = await app.convert();

        if (!project) {
            throw new Error("Failed to convert TypeScript project");
        }

        // 生成文档
        await app.generateDocs(project, outputDir);
    } catch (error) {
        throw new Error(
            `Failed to generate API documentation: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}
