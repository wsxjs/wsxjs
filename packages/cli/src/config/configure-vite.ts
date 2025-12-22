/**
 * Vite 配置生成和合并工具
 * 根据 RFC-0019 实现零配置初始化
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

/**
 * 配置 Vite
 * @param projectRoot 项目根目录
 * @returns 配置结果
 */
export async function configureVite(
    projectRoot: string
): Promise<{ success: boolean; message: string; created: boolean }> {
    // 查找现有的 vite 配置文件
    const viteConfigPaths = [
        { path: join(projectRoot, "vite.config.ts"), ext: "ts" },
        { path: join(projectRoot, "vite.config.js"), ext: "js" },
        { path: join(projectRoot, "vite.config.mts"), ext: "mts" },
        { path: join(projectRoot, "vite.config.mjs"), ext: "mjs" },
    ];

    let existingConfig: { path: string; ext: string } | null = null;
    for (const configPath of viteConfigPaths) {
        if (existsSync(configPath.path)) {
            existingConfig = configPath;
            break;
        }
    }

    if (existingConfig) {
        // 更新现有配置
        try {
            const content = readFileSync(existingConfig.path, "utf-8");

            // 检查是否已包含 wsx 插件
            const hasWsxImport = content.includes("@wsxjs/wsx-vite-plugin");
            const hasWsxPlugin = content.includes("wsx()") || content.includes("wsx(");

            if (hasWsxImport && hasWsxPlugin) {
                return {
                    success: true,
                    message: "vite.config 已包含 WSX 插件",
                    created: false,
                };
            }

            // 添加 wsx 插件
            const updated = addWsxPluginToViteConfig(content, existingConfig.ext);
            writeFileSync(existingConfig.path, updated, "utf-8");

            return {
                success: true,
                message: `已更新 ${existingConfig.path}`,
                created: false,
            };
        } catch (error) {
            return {
                success: false,
                message: `无法读取/更新 vite.config: ${error}`,
                created: false,
            };
        }
    } else {
        // 创建新的 vite.config.ts
        const configContent = `import { defineConfig } from "vite";
import { wsx } from "@wsxjs/wsx-vite-plugin";

export default defineConfig({
    plugins: [wsx()],
});
`;

        const newConfigPath = join(projectRoot, "vite.config.ts");
        writeFileSync(newConfigPath, configContent, "utf-8");

        return {
            success: true,
            message: "已创建 vite.config.ts",
            created: true,
        };
    }
}

/**
 * 向现有的 Vite 配置添加 wsx 插件
 * 使用简单的字符串操作，避免复杂的 AST 解析
 */
function addWsxPluginToViteConfig(content: string, _ext: string): string {
    // 检查是否已有 import
    const hasWsxImport = content.includes("@wsxjs/wsx-vite-plugin");
    const hasDefineConfigImport = content.includes("defineConfig");

    let updated = content;

    // 添加 import（如果缺失）
    if (!hasWsxImport) {
        // 查找最后一个 import 语句的位置
        const importRegex = /^import\s+.*?from\s+['"].*?['"];?$/gm;
        const imports = content.match(importRegex);
        if (imports && imports.length > 0) {
            const lastImport = imports[imports.length - 1];
            const lastImportIndex = content.lastIndexOf(lastImport);
            const insertIndex = lastImportIndex + lastImport.length;

            // 在最后一个 import 后添加 wsx import
            const wsxImport = hasDefineConfigImport
                ? `import { wsx } from "@wsxjs/wsx-vite-plugin";\n`
                : `import { defineConfig } from "vite";\nimport { wsx } from "@wsxjs/wsx-vite-plugin";\n`;

            updated = content.slice(0, insertIndex) + "\n" + wsxImport + content.slice(insertIndex);
        } else {
            // 没有 import，在文件开头添加
            const wsxImport = hasDefineConfigImport
                ? `import { wsx } from "@wsxjs/wsx-vite-plugin";\n\n`
                : `import { defineConfig } from "vite";\nimport { wsx } from "@wsxjs/wsx-vite-plugin";\n\n`;
            updated = wsxImport + content;
        }
    }

    // 添加插件到 plugins 数组
    if (!updated.includes("wsx()") && !updated.includes("wsx(")) {
        // 查找 plugins 数组
        const pluginsArrayRegex = /plugins:\s*\[([^\]]*)\]/s;
        const match = updated.match(pluginsArrayRegex);

        if (match) {
            // 在 plugins 数组中添加 wsx()
            const pluginsContent = match[1].trim();
            const newPluginsContent = pluginsContent
                ? `${pluginsContent}\n        wsx(),`
                : `wsx(),`;
            updated = updated.replace(
                pluginsArrayRegex,
                `plugins: [\n        ${newPluginsContent}\n    ]`
            );
        } else {
            // 没有 plugins 数组，查找 defineConfig 调用
            const defineConfigRegex = /defineConfig\s*\(\s*\{([^}]*)\}\s*\)/s;
            const defineMatch = updated.match(defineConfigRegex);

            if (defineMatch) {
                // 在配置对象中添加 plugins
                const configContent = defineMatch[1].trim();
                const newConfigContent = configContent
                    ? `${configContent}\n    plugins: [wsx()],`
                    : `plugins: [wsx()],`;
                updated = updated.replace(
                    defineConfigRegex,
                    `defineConfig({\n    ${newConfigContent}\n})`
                );
            }
        }
    }

    return updated;
}
