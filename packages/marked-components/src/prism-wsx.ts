/**
 * Prism.js WSX Language Definition
 *
 * WSX is a JSX-like syntax for Web Components.
 * This definition extends TSX with WSX-specific patterns.
 */

import Prism from "prismjs";

// Ensure JSX is loaded first (TSX depends on it)
import "prismjs/components/prism-jsx";
// Ensure TypeScript is loaded
import "prismjs/components/prism-typescript";
// Ensure TSX is loaded
import "prismjs/components/prism-tsx";

/**
 * Register WSX language with Prism
 * WSX is essentially TSX with Web Components conventions
 */
export function registerWsxLanguage(): void {
    // Check if already registered
    if (Prism.languages.wsx) {
        return;
    }

    // Clone TSX as base for WSX
    Prism.languages.wsx = Prism.languages.extend("tsx", {
        // WSX-specific decorators (e.g., @autoRegister, @state)
        decorator: {
            pattern: /@[\w]+(?:\([^)]*\))?/,
            inside: {
                "decorator-name": {
                    pattern: /@[\w]+/,
                    alias: "function",
                },
                punctuation: /[(),]/,
            },
        },
        // Web Component tag names (custom elements with hyphens)
        "web-component": {
            pattern: /<\/?[a-z][\w-]*(?:-[\w-]+)+(?:\s|\/?>)/i,
            inside: {
                punctuation: /^<\/?|\/?>$/,
                "tag-name": {
                    pattern: /[a-z][\w-]*(?:-[\w-]+)+/i,
                    alias: "class-name",
                },
            },
        },
        // WSX specific imports
        "wsx-import": {
            pattern: /(?:from\s+)["']@wsxjs\/[\w-]+["']/,
            inside: {
                string: /["']@wsxjs\/[\w-]+["']/,
            },
        },
    });

    // Also register as alias
    Prism.languages.WSX = Prism.languages.wsx;
}

// Auto-register when this module is imported
registerWsxLanguage();
