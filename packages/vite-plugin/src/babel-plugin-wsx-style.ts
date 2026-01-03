/**
 * Babel plugin to automatically inject CSS styles for WSX components
 *
 * Transforms:
 *   // Button.wsx (if Button.css exists)
 *   export default class Button extends WebComponent { ... }
 *
 * To:
 *   import styles from "./Button.css?inline";
 *   export default class Button extends WebComponent {
 *       private _autoStyles = styles;
 *       ...
 *   }
 */

import type { PluginObj, PluginPass } from "@babel/core";
import type * as t from "@babel/types";
import * as tModule from "@babel/types";

interface WSXStylePluginPass extends PluginPass {
    cssFileExists: boolean;
    cssFilePath: string;
    componentName: string;
    debug?: boolean;
}

/**
 * Check if styles are already imported in the file
 */
function hasStylesImport(program: t.Program): boolean {
    for (const node of program.body) {
        if (node.type === "ImportDeclaration") {
            const source = node.source.value;
            // Check if it's a CSS import with ?inline
            if (
                typeof source === "string" &&
                (source.endsWith(".css?inline") || source.endsWith(".css"))
            ) {
                // Check if it's imported as "styles"
                const defaultSpecifier = node.specifiers.find(
                    (spec) => spec.type === "ImportDefaultSpecifier"
                );
                if (defaultSpecifier) {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * Check if _autoStyles property already exists in the class
 */
function hasAutoStylesProperty(classBody: t.ClassBody): boolean {
    for (const member of classBody.body) {
        if (
            (member.type === "ClassProperty" || member.type === "ClassPrivateProperty") &&
            member.key.type === "Identifier" &&
            member.key.name === "_autoStyles"
        ) {
            return true;
        }
    }
    return false;
}

export default function babelPluginWSXStyle(): PluginObj<WSXStylePluginPass> {
    const t = tModule;
    return {
        name: "babel-plugin-wsx-style",
        visitor: {
            Program(path, state) {
                const { cssFileExists, cssFilePath, componentName, debug } =
                    state.opts as WSXStylePluginPass;

                // Skip if CSS file doesn't exist
                if (!cssFileExists) {
                    return;
                }

                // Check if styles are already manually imported
                if (hasStylesImport(path.node)) {
                    if (debug) {
                        console.info(
                            `[Babel Plugin WSX Style] Skipping ${componentName}: styles already manually imported`
                        );
                    }
                    return; // Skip auto-injection if manual import exists
                }

                if (debug) {
                    console.info(
                        `[Babel Plugin WSX Style] Injecting CSS import for ${componentName}: ${cssFilePath}`
                    );
                }

                // Add CSS import at the top of the file
                const importStatement = t.importDeclaration(
                    [t.importDefaultSpecifier(t.identifier("styles"))],
                    t.stringLiteral(cssFilePath)
                );

                // Insert after existing imports (if any)
                let insertIndex = 0;
                for (let i = 0; i < path.node.body.length; i++) {
                    const node = path.node.body[i];
                    if (node.type === "ImportDeclaration") {
                        insertIndex = i + 1;
                    } else {
                        break;
                    }
                }

                path.node.body.splice(insertIndex, 0, importStatement);
            },
            ClassDeclaration(path, state) {
                const { cssFileExists } = state.opts as WSXStylePluginPass;

                // Skip if CSS file doesn't exist
                if (!cssFileExists) {
                    return;
                }

                const classBody = path.node.body;

                // Check if _autoStyles property already exists
                if (hasAutoStylesProperty(classBody)) {
                    return; // Skip if already exists
                }

                // Note: We don't check for manual imports here because:
                // 1. Program visitor already handled that and skipped if manual import exists
                // 2. If we reach here, it means Program visitor added the import (or it was already there)
                // 3. We should add the class property regardless

                // Add class property: private _autoStyles = styles;
                // Use classProperty (not classPrivateProperty) to create TypeScript private property
                // TypeScript private is compile-time only and becomes a regular property at runtime
                const autoStylesProperty = t.classProperty(
                    t.identifier("_autoStyles"),
                    t.identifier("styles"),
                    null, // typeAnnotation
                    [], // decorators
                    false, // computed
                    false // static
                );

                // Insert at the beginning of class body (before methods and other properties)
                classBody.body.unshift(autoStylesProperty);
            },
        },
    };
}
