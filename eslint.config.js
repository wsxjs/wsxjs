import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

export default [
    // Ignore patterns - must be first
    {
        ignores: ["**/dist/", "**/node_modules/", "**/coverage/", "*.config.js", "./scripts/"],
    },

    // Base configuration for all files
    js.configs.recommended,

    // TypeScript configuration
    {
        files: ["**/*.{ts,tsx,js,jsx,wsx}"],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021,
                // Web Components globals
                HTMLElement: "readonly",
                customElements: "readonly",
                CustomEvent: "readonly",
                ShadowRoot: "readonly",
                HTMLSlotElement: "readonly",
                CSSStyleSheet: "readonly",
                CustomElementConstructor: "readonly",
                // DOM globals
                Event: "readonly",
                MouseEvent: "readonly",
                KeyboardEvent: "readonly",
                HTMLDivElement: "readonly",
                HTMLSpanElement: "readonly",
                HTMLInputElement: "readonly",
                HTMLButtonElement: "readonly",
                HTMLAnchorElement: "readonly",
                DocumentFragment: "readonly",
                Document: "readonly",
                Element: "readonly",
                Node: "readonly",
                NodeListOf: "readonly",
                URL: "readonly",
                // WSX globals
                h: "readonly",
                Fragment: "readonly",
            },
        },
        plugins: {
            "@typescript-eslint": typescript,
            prettier,
        },
        rules: {
            ...typescript.configs.recommended.rules,
            ...prettierConfig.rules,
            "prettier/prettier": "error",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-non-null-assertion": "off",
            "@typescript-eslint/no-require-imports": "off",
            "@typescript-eslint/no-unused-expressions": "off",
            "no-console": ["warn", { allow: ["warn", "error", "info", "debug"] }],
            "no-undef": "off", // TypeScript handles this
        },
    },

    // WSX files specific configuration
    {
        files: ["**/*.wsx"],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        rules: {
            "@typescript-eslint/no-unused-vars": "warn",
            "prettier/prettier": "off",
        },
    },

    // Test files configuration
    {
        files: ["**/__tests__/**/*", "**/*.test.*", "**/test/**/*"],
        languageOptions: {
            globals: {
                ...globals.jest,
                jest: "readonly",
                describe: "readonly",
                test: "readonly",
                it: "readonly",
                expect: "readonly",
                beforeEach: "readonly",
                afterEach: "readonly",
                beforeAll: "readonly",
                afterAll: "readonly",
            },
        },
    },
];
