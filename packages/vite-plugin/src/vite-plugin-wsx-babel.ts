/* eslint-disable no-console */
/**
 * Vite Plugin for WSX with Babel decorator support
 *
 * Uses Babel to preprocess decorators before esbuild transformation
 * This ensures decorators work correctly even with esbuild's limitations
 */

import type { Plugin } from "vite";
import { transform } from "esbuild";
import { transformSync } from "@babel/core";
import babelPluginWSXState from "./babel-plugin-wsx-state";

export interface WSXPluginOptions {
    jsxFactory?: string;
    jsxFragment?: string;
    debug?: boolean;
    extensions?: string[];
}

function getJSXFactoryImportPath(_options: WSXPluginOptions): string {
    return "@wsxjs/wsx-core";
}

export function vitePluginWSXWithBabel(options: WSXPluginOptions = {}): Plugin {
    const {
        jsxFactory = "h",
        jsxFragment = "Fragment",
        debug = false,
        extensions = [".wsx"],
    } = options;

    return {
        name: "vite-plugin-wsx-babel",
        enforce: "pre",

        async transform(code: string, id: string) {
            const isWSXFile = extensions.some((ext) => id.endsWith(ext));

            if (!isWSXFile) {
                return null;
            }

            if (debug) {
                console.log(`[WSX Plugin Babel] Processing: ${id}`);
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
                        // CRITICAL: Custom plugin must run FIRST, before decorators are processed
                        // This allows it to see @state decorators in their original form
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
                    if (debug) {
                        console.log(`[WSX Plugin Babel] Decorators preprocessed: ${id}`);
                        // Log generated code for debugging
                        if (
                            transformedCode.includes("this.reactive") ||
                            transformedCode.includes("this.useState")
                        ) {
                            console.log(
                                `[WSX Plugin Babel] Generated reactive code found in: ${id}\n` +
                                    transformedCode
                                        .split("\n")
                                        .filter(
                                            (line) =>
                                                line.includes("this.reactive") ||
                                                line.includes("this.useState")
                                        )
                                        .join("\n")
                            );
                        }
                    }
                }
            } catch (error) {
                console.warn(
                    `[WSX Plugin Babel] Babel transform failed for ${id}, falling back to esbuild only:`,
                    error
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
                if (debug) {
                    console.log(
                        `[WSX Plugin Babel] Re-added JSX imports after Babel transform: ${id}`
                    );
                }
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
