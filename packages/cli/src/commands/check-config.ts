import { existsSync, readFileSync } from "fs";
import { join } from "path";
import chalk from "chalk";

export interface ConfigCheckResult {
    hasWsxTypes: boolean;
    hasTsConfig: boolean;
    hasViteConfig: boolean;
    tsConfigValid: boolean;
    viteConfigValid: boolean;
    issues: string[];
    suggestions: string[];
}

export async function checkConfig(projectRoot: string = process.cwd()): Promise<ConfigCheckResult> {
    const result: ConfigCheckResult = {
        hasWsxTypes: false,
        hasTsConfig: false,
        hasViteConfig: false,
        tsConfigValid: false,
        viteConfigValid: false,
        issues: [],
        suggestions: [],
    };

    // Check wsx.d.ts
    const wsxDtsPath = join(projectRoot, "src", "types", "wsx.d.ts");
    result.hasWsxTypes = existsSync(wsxDtsPath);

    if (!result.hasWsxTypes) {
        result.issues.push("Missing src/types/wsx.d.ts");
        result.suggestions.push("Run: npx wsx init");
    }

    // Check tsconfig.json
    const tsconfigPath = join(projectRoot, "tsconfig.json");
    result.hasTsConfig = existsSync(tsconfigPath);

    if (result.hasTsConfig) {
        try {
            const tsconfigContent = readFileSync(tsconfigPath, "utf-8");
            const tsconfig = JSON.parse(tsconfigContent);

            // Check required settings
            const compilerOptions = tsconfig.compilerOptions || {};

            result.tsConfigValid = true;

            if (compilerOptions.jsx !== "react-jsx") {
                result.issues.push('tsconfig.json: jsx should be "react-jsx"');
                result.suggestions.push(
                    'Add to tsconfig.json: "compilerOptions": { "jsx": "react-jsx" }'
                );
                result.tsConfigValid = false;
            }

            if (compilerOptions.jsxImportSource !== "@wsxjs/wsx-core") {
                result.issues.push('tsconfig.json: jsxImportSource should be "@wsxjs/wsx-core"');
                result.suggestions.push(
                    'Add to tsconfig.json: "compilerOptions": { "jsxImportSource": "@wsxjs/wsx-core" }'
                );
                result.tsConfigValid = false;
            }

            // Optional but recommended
            if (compilerOptions.experimentalDecorators !== true) {
                result.suggestions.push(
                    "Recommended: Enable experimentalDecorators for @state decorator support"
                );
            }

            if (compilerOptions.useDefineForClassFields !== false) {
                result.suggestions.push(
                    "Recommended: Set useDefineForClassFields to false for @state decorator support"
                );
            }
        } catch {
            result.issues.push("tsconfig.json: Invalid JSON format");
            result.tsConfigValid = false;
        }
    } else {
        result.issues.push("Missing tsconfig.json");
        result.suggestions.push("Create a tsconfig.json with WSX-compatible settings");
    }

    // Check vite.config
    const viteConfigPaths = [
        join(projectRoot, "vite.config.ts"),
        join(projectRoot, "vite.config.js"),
        join(projectRoot, "vite.config.mts"),
        join(projectRoot, "vite.config.mjs"),
    ];

    for (const viteConfigPath of viteConfigPaths) {
        if (existsSync(viteConfigPath)) {
            result.hasViteConfig = true;

            try {
                const viteConfigContent = readFileSync(viteConfigPath, "utf-8");

                // Check if wsx plugin is imported and used
                const hasWsxImport = viteConfigContent.includes("@wsxjs/wsx-vite-plugin");
                const hasWsxPlugin = viteConfigContent.includes("wsx()");

                if (!hasWsxImport || !hasWsxPlugin) {
                    result.issues.push("vite.config: Missing @wsxjs/wsx-vite-plugin");
                    result.suggestions.push(
                        'Add to vite.config: import { wsx } from "@wsxjs/wsx-vite-plugin" and use wsx() in plugins array'
                    );
                    result.viteConfigValid = false;
                } else {
                    result.viteConfigValid = true;
                }
            } catch {
                result.issues.push("vite.config: Unable to read file");
            }

            break;
        }
    }

    if (!result.hasViteConfig) {
        result.suggestions.push("Recommended: Create vite.config.ts with @wsxjs/wsx-vite-plugin");
    }

    return result;
}

export async function displayCheckResults(result: ConfigCheckResult) {
    console.log(chalk.blue.bold("\n🔍 WSX Configuration Check\n"));

    // Display status
    console.log(chalk.bold("Status:"));
    console.log(
        `  wsx.d.ts: ${result.hasWsxTypes ? chalk.green("✓ Found") : chalk.red("✗ Missing")}`
    );
    console.log(
        `  tsconfig.json: ${result.hasTsConfig ? (result.tsConfigValid ? chalk.green("✓ Valid") : chalk.yellow("⚠ Needs update")) : chalk.red("✗ Missing")}`
    );
    console.log(
        `  vite.config: ${result.hasViteConfig ? (result.viteConfigValid ? chalk.green("✓ Valid") : chalk.yellow("⚠ Needs update")) : chalk.gray("- Not found")}`
    );

    // Display issues
    if (result.issues.length > 0) {
        console.log(chalk.red.bold("\n❌ Issues:"));
        result.issues.forEach((issue) => {
            console.log(chalk.red(`  • ${issue}`));
        });
    }

    // Display suggestions
    if (result.suggestions.length > 0) {
        console.log(chalk.yellow.bold("\n💡 Suggestions:"));
        result.suggestions.forEach((suggestion) => {
            console.log(chalk.yellow(`  • ${suggestion}`));
        });
    }

    // Summary
    if (result.issues.length === 0) {
        console.log(
            chalk.green.bold("\n✅ All checks passed! Your WSX configuration looks good.\n")
        );
    } else {
        console.log(chalk.yellow.bold("\n⚠️  Some issues need attention.\n"));
    }
}
