/**
 * ESLint 配置生成和合并工具
 * 根据 RFC-0019 实现零配置初始化
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export interface ESLintConfigOptions {
    useFlatConfig?: boolean; // 是否使用 Flat Config（默认检测）
}

/**
 * 配置 ESLint
 * @param projectRoot 项目根目录
 * @param options 配置选项
 * @returns 配置结果
 */
export async function configureESLint(
    projectRoot: string,
    options: ESLintConfigOptions = {}
): Promise<{ success: boolean; message: string; created: boolean }> {
    // 检测是否使用 Flat Config
    const flatConfigPath = join(projectRoot, "eslint.config.js");
    const flatConfigMjsPath = join(projectRoot, "eslint.config.mjs");
    const legacyConfigPath = join(projectRoot, ".eslintrc.js");
    const legacyConfigJsonPath = join(projectRoot, ".eslintrc.json");

    const hasFlatConfig = existsSync(flatConfigPath) || existsSync(flatConfigMjsPath);
    const hasLegacyConfig = existsSync(legacyConfigPath) || existsSync(legacyConfigJsonPath);

    const useFlatConfig = options.useFlatConfig ?? (hasFlatConfig || !hasLegacyConfig);

    if (useFlatConfig) {
        return await configureFlatESLint(projectRoot);
    } else {
        return await configureLegacyESLint(projectRoot);
    }
}

/**
 * 配置 Flat Config 格式的 ESLint
 */
async function configureFlatESLint(
    projectRoot: string
): Promise<{ success: boolean; message: string; created: boolean }> {
    const configPath = existsSync(join(projectRoot, "eslint.config.js"))
        ? join(projectRoot, "eslint.config.js")
        : join(projectRoot, "eslint.config.mjs");

    if (existsSync(configPath)) {
        // 更新现有配置
        try {
            const content = readFileSync(configPath, "utf-8");

            // 检查是否已包含 wsx 插件
            const hasWsxImport = content.includes("@wsxjs/eslint-plugin-wsx");
            const hasWsxPlugin = content.includes("wsx:") || content.includes("wsxPlugin");

            if (hasWsxImport && hasWsxPlugin) {
                return {
                    success: true,
                    message: "eslint.config 已包含 WSX 插件",
                    created: false,
                };
            }

            // 添加 wsx 插件配置
            const updated = addWsxPluginToFlatConfig(content);
            writeFileSync(configPath, updated, "utf-8");

            return {
                success: true,
                message: `已更新 ${configPath}`,
                created: false,
            };
        } catch (error) {
            return {
                success: false,
                message: `无法读取/更新 eslint.config: ${error}`,
                created: false,
            };
        }
    } else {
        // 创建新的 Flat Config
        const configContent = `import wsxPlugin from "@wsxjs/eslint-plugin-wsx";

export default [
    {
        files: ["**/*.{ts,tsx,js,jsx,wsx}"],
        plugins: { wsx: wsxPlugin },
        rules: {
            "wsx/no-react-imports": "error",
            "wsx/render-method-required": "error",
            "wsx/state-requires-initial-value": "error",
            "wsx/require-jsx-import-source": "error",
        },
    },
];
`;

        writeFileSync(configPath, configContent, "utf-8");

        return {
            success: true,
            message: `已创建 ${configPath}`,
            created: true,
        };
    }
}

/**
 * 配置 Legacy 格式的 ESLint
 */
async function configureLegacyESLint(
    projectRoot: string
): Promise<{ success: boolean; message: string; created: boolean }> {
    const configPath = existsSync(join(projectRoot, ".eslintrc.js"))
        ? join(projectRoot, ".eslintrc.js")
        : join(projectRoot, ".eslintrc.json");

    if (existsSync(configPath)) {
        // 更新现有配置
        try {
            const content = readFileSync(configPath, "utf-8");

            // 检查是否已包含 wsx 插件
            const hasWsxPlugin =
                content.includes("@wsxjs/eslint-plugin-wsx") || content.includes("@wsxjs/wsx");

            if (hasWsxPlugin) {
                return {
                    success: true,
                    message: ".eslintrc 已包含 WSX 插件",
                    created: false,
                };
            }

            // 添加 wsx 插件配置（需要根据文件格式处理）
            // 这里简化处理，建议用户使用 Flat Config
            return {
                success: false,
                message: "检测到 Legacy ESLint 配置，建议迁移到 Flat Config 格式",
                created: false,
            };
        } catch (error) {
            return {
                success: false,
                message: `无法读取/更新 .eslintrc: ${error}`,
                created: false,
            };
        }
    } else {
        // 创建新的 Legacy Config（不推荐，但提供支持）
        const configContent = `module.exports = {
    plugins: ["@wsxjs/wsx"],
    rules: {
        "@wsxjs/wsx/no-react-imports": "error",
        "@wsxjs/wsx/render-method-required": "error",
        "@wsxjs/wsx/state-requires-initial-value": "error",
    },
};
`;

        writeFileSync(join(projectRoot, ".eslintrc.js"), configContent, "utf-8");

        return {
            success: true,
            message: "已创建 .eslintrc.js（建议使用 Flat Config）",
            created: true,
        };
    }
}

/**
 * 向 Flat Config 添加 wsx 插件
 */
function addWsxPluginToFlatConfig(content: string): string {
    // 检查是否已有 import
    const hasWsxImport = content.includes("@wsxjs/eslint-plugin-wsx");

    let updated = content;

    // 添加 import（如果缺失）
    if (!hasWsxImport) {
        // 查找最后一个 import 语句
        const importRegex = /^import\s+.*?from\s+['"].*?['"];?$/gm;
        const imports = content.match(importRegex);
        if (imports && imports.length > 0) {
            const lastImport = imports[imports.length - 1];
            const lastImportIndex = content.lastIndexOf(lastImport);
            const insertIndex = lastImportIndex + lastImport.length;

            const wsxImport = `import wsxPlugin from "@wsxjs/eslint-plugin-wsx";\n`;

            updated = content.slice(0, insertIndex) + "\n" + wsxImport + content.slice(insertIndex);
        } else {
            // 在文件开头添加
            updated = `import wsxPlugin from "@wsxjs/eslint-plugin-wsx";\n\n` + content;
        }
    }

    // 添加插件配置到第一个配置对象
    if (!updated.includes("wsx:") && !updated.includes("wsxPlugin")) {
        // 查找第一个配置对象
        const configObjectRegex = /\{\s*files:\s*\[([^\]]+)\],([^}]*)\}/s;
        const match = updated.match(configObjectRegex);

        if (match) {
            // 在现有配置对象中添加
            const configContent = match[2].trim();
            let newConfigContent = configContent;

            // 添加 plugins
            if (!configContent.includes("plugins:")) {
                newConfigContent = `plugins: { wsx: wsxPlugin },\n        ${newConfigContent}`;
            } else {
                // 更新现有 plugins
                const pluginsRegex = /plugins:\s*\{([^}]*)\}/s;
                const pluginsMatch = newConfigContent.match(pluginsRegex);
                if (pluginsMatch) {
                    const pluginsContent = pluginsMatch[1].trim();
                    newConfigContent = newConfigContent.replace(
                        pluginsRegex,
                        `plugins: { ${pluginsContent}\n            wsx: wsxPlugin,\n        }`
                    );
                }
            }

            // 添加 rules
            if (!configContent.includes("rules:")) {
                newConfigContent = `${newConfigContent}\n        rules: {\n            "wsx/no-react-imports": "error",\n            "wsx/render-method-required": "error",\n            "wsx/state-requires-initial-value": "error",\n            "wsx/require-jsx-import-source": "error",\n        },`;
            } else {
                // 更新现有 rules
                const rulesRegex = /rules:\s*\{([^}]*)\}/s;
                const rulesMatch = newConfigContent.match(rulesRegex);
                if (rulesMatch) {
                    const rulesContent = rulesMatch[1].trim();
                    const newRules = `"wsx/no-react-imports": "error",\n            "wsx/render-method-required": "error",\n            "wsx/state-requires-initial-value": "error",\n            "wsx/require-jsx-import-source": "error",`;
                    newConfigContent = newConfigContent.replace(
                        rulesRegex,
                        `rules: {\n            ${newRules}\n            ${rulesContent}\n        }`
                    );
                }
            }

            updated = updated.replace(
                configObjectRegex,
                `{\n        files: [${match[1]}],\n        ${newConfigContent}\n    }`
            );
        } else {
            // 没有找到配置对象，在 export default 数组中添加新配置
            const exportDefaultRegex = /export\s+default\s*\[([^\]]*)\]/s;
            const exportMatch = updated.match(exportDefaultRegex);
            if (exportMatch) {
                const existingConfigs = exportMatch[1].trim();
                const newConfig = `    {\n        files: ["**/*.{ts,tsx,js,jsx,wsx}"],\n        plugins: { wsx: wsxPlugin },\n        rules: {\n            "wsx/no-react-imports": "error",\n            "wsx/render-method-required": "error",\n            "wsx/state-requires-initial-value": "error",\n            "wsx/require-jsx-import-source": "error",\n        },\n    },`;
                updated = updated.replace(
                    exportDefaultRegex,
                    `export default [\n    ${existingConfigs ? existingConfigs + ",\n    " : ""}${newConfig}\n]`
                );
            }
        }
    }

    return updated;
}
