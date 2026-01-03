/**
 * Vite Plugin for WSX with Babel decorator support
 *
 * Uses Babel to preprocess decorators before esbuild transformation
 * This ensures decorators work correctly even with esbuild's limitations
 */

import type { Plugin } from "vite";
import { transform } from "esbuild";
import { transformSync } from "@babel/core";
import { existsSync } from "fs";
import { dirname, join, basename } from "path";
import babelPluginWSXState from "./babel-plugin-wsx-state";
import babelPluginWSXStyle from "./babel-plugin-wsx-style";
import babelPluginWSXFocus from "./babel-plugin-wsx-focus";

export interface WSXPluginOptions {
    jsxFactory?: string;
    jsxFragment?: string;
    debug?: boolean;
    extensions?: string[];
    autoStyleInjection?: boolean; // Default: true
}

function getJSXFactoryImportPath(_options: WSXPluginOptions): string {
    return "@wsxjs/wsx-core";
}

export function vitePluginWSXWithBabel(options: WSXPluginOptions = {}): Plugin {
    const {
        jsxFactory = "h",
        jsxFragment = "Fragment",
        extensions = [".wsx"],
        autoStyleInjection = true,
    } = options;

    return {
        name: "vite-plugin-wsx-babel",
        enforce: "pre",

        async transform(code: string, id: string) {
            const isWSXFile = extensions.some((ext) => id.endsWith(ext));

            if (!isWSXFile) {
                return null;
            }

            // Check if corresponding CSS file exists (for auto style injection)
            let cssFileExists = false;
            let cssFilePath = "";
            let componentName = "";

            if (autoStyleInjection) {
                const fileDir = dirname(id);
                const fileName = basename(id, extensions.find((ext) => id.endsWith(ext)) || "");
                const cssFilePathWithoutQuery = join(fileDir, `${fileName}.css`);
                cssFileExists = existsSync(cssFilePathWithoutQuery);
                componentName = fileName;

                // Generate relative path for import (e.g., "./Button.css?inline")
                // Use relative path from the file's directory
                if (cssFileExists) {
                    // For import statement, use relative path with ?inline query
                    cssFilePath = `./${fileName}.css?inline`;
                }
            }

            let transformedCode = code;

            // 1. Add JSX imports if needed
            // Check for actual import statement
            const hasWSXCoreImport = code.includes('from "@wsxjs/wsx-core"');
            // Check if JSX factory functions are already imported
            const hasJSXInImport =
                hasWSXCoreImport &&
                (new RegExp(`[{,]\\s*${jsxFactory}\\s*[},]`).test(code) ||
                    new RegExp(`[{,]\\s*${jsxFragment}\\s*[},]`).test(code));

            // If file has JSX syntax but no import, add it
            // Note: @jsxImportSource pragma is just a hint, we need actual import for esbuild
            if ((code.includes("<") || code.includes("Fragment")) && !hasJSXInImport) {
                const importPath = getJSXFactoryImportPath(options);
                const importStatement = `import { ${jsxFactory}, ${jsxFragment} } from "${importPath}";\n`;
                transformedCode = importStatement + transformedCode;
            }

            // 2. Use Babel to preprocess decorators
            const babelResult = transformSync(transformedCode, {
                filename: id, // Pass the actual filename so Babel knows it's .wsx
                // CRITICAL: Configure parser to preserve decorators
                // @babel/preset-typescript should preserve decorators by default,
                // but we explicitly enable decorator parsing to be sure
                parserOpts: {
                    plugins: [
                        ["decorators", { decoratorsBeforeExport: true }], // Stage 3 decorators
                        "typescript",
                        "jsx",
                    ],
                },
                presets: [
                    [
                        "@babel/preset-typescript",
                        {
                            isTSX: true, // Enable JSX syntax
                            allExtensions: true, // Process all extensions, including .wsx
                            // CRITICAL: onlyRemoveTypeImports only affects import statements
                            // Decorators are preserved by default in @babel/preset-typescript
                            // They are only removed if we explicitly configure it
                            onlyRemoveTypeImports: false, // Remove all type-only imports
                        },
                    ],
                ],
                plugins: [
                    // CRITICAL: Decorator plugin must run FIRST to parse decorators correctly
                    // This ensures decorators are properly parsed before our custom plugins try to process them
                    // However, we need to use a custom visitor that doesn't transform decorators yet
                    // Actually, we should NOT run decorator plugin first because it transforms decorators
                    // Instead, we rely on TypeScript preset to parse but not transform decorators
                    // CRITICAL: Style injection plugin must run FIRST
                    // This ensures _autoStyles property exists before state transformations
                    ...(autoStyleInjection && cssFileExists
                        ? [
                              [
                                  babelPluginWSXStyle,
                                  {
                                      cssFileExists,
                                      cssFilePath,
                                      componentName,
                                      debug: options.debug, // Pass debug flag
                                  },
                              ],
                          ]
                        : []),
                    // Focus key generation plugin runs early to add data-wsx-key attributes
                    // This must run before JSX is transformed to h() calls
                    babelPluginWSXFocus,
                    // CRITICAL: State decorator transformation must run BEFORE @babel/plugin-proposal-decorators
                    // This allows the plugin to detect @state decorators in their original form and throw errors if needed
                    // The plugin removes @state decorators after processing, so the decorator plugin won't see them
                    [
                        babelPluginWSXState,
                        {
                            // Pass ORIGINAL source code (before JSX import injection) to plugin
                            // This ensures we can detect @state decorators even if they're removed by TypeScript preset
                            originalSource: code, // Use original code, not transformedCode
                            debug: options.debug, // Pass debug flag
                        },
                    ],
                    // Decorator plugin runs after our custom plugins
                    // This transforms remaining decorators (like @autoRegister) to runtime calls
                    [
                        "@babel/plugin-proposal-decorators",
                        {
                            version: "2023-05",
                            decoratorsBeforeExport: true,
                        },
                    ],
                    [
                        "@babel/plugin-proposal-class-properties",
                        {
                            loose: false,
                        },
                    ],
                    "@babel/plugin-transform-class-static-block", // Support static class blocks
                ],
                // parserOpts not needed - @babel/preset-typescript and plugins handle it
            });

            if (babelResult && babelResult.code) {
                transformedCode = babelResult.code;
            } else {
                // Babel returned no code - critical error
                throw new Error(
                    `[WSX Plugin] Babel transform returned no code for ${id}. ` +
                        `@state decorators will NOT be processed and will cause runtime errors. ` +
                        `Please check Babel configuration and plugin setup.`
                );
            }

            // 2.5. Ensure JSX imports still exist after Babel transformation
            // Babel might have removed or modified imports, so we check again
            const hasJSXAfterBabel =
                transformedCode.includes('from "@wsxjs/wsx-core"') &&
                (new RegExp(`[{,]\\s*${jsxFactory}\\s*[},]`).test(transformedCode) ||
                    new RegExp(`[{,]\\s*${jsxFragment}\\s*[},]`).test(transformedCode));

            if (
                (transformedCode.includes("<") || transformedCode.includes("Fragment")) &&
                !hasJSXAfterBabel
            ) {
                const importPath = getJSXFactoryImportPath(options);
                const importStatement = `import { ${jsxFactory}, ${jsxFragment} } from "${importPath}";\n`;
                transformedCode = importStatement + transformedCode;
            }

            // 3. Use esbuild for JSX transformation
            try {
                const result = await transform(transformedCode, {
                    loader: "jsx", // Already TypeScript-transformed by Babel
                    jsx: "transform",
                    jsxFactory: jsxFactory,
                    jsxFragment: jsxFragment,
                    target: "es2020",
                    format: "esm",
                });

                return {
                    code: result.code,
                    map: null,
                };
            } catch (error) {
                console.error(`[WSX Plugin Babel] Transform error for ${id}:`, error);
                throw error;
            }
        },
    };
}
