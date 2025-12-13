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
            try {
                const babelResult = transformSync(transformedCode, {
                    filename: id, // Pass the actual filename so Babel knows it's .wsx
                    presets: [
                        [
                            "@babel/preset-typescript",
                            {
                                isTSX: true, // Enable JSX syntax
                                allExtensions: true, // Process all extensions, including .wsx
                            },
                        ],
                    ],
                    plugins: [
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
                                      },
                                  ],
                              ]
                            : []),
                        // Focus key generation plugin runs early to add data-wsx-key attributes
                        // This must run before JSX is transformed to h() calls
                        babelPluginWSXFocus,
                        // State decorator transformation runs after style injection
                        babelPluginWSXState,
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
                }
            } catch {
                // Babel transform failed, fallback to esbuild only
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
