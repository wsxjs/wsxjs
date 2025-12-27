/**
 * ESLint Plugin WSX - 推荐配置
 *
 * 为 WSX 文件提供推荐的 ESLint 配置
 */

import { WSXConfig } from "../types";

export const recommendedConfig: WSXConfig = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
            jsx: true,
        },
        jsxPragma: "h",
        jsxFragmentName: "Fragment",
        experimentalDecorators: true, // Required to parse @state decorators
    },
    plugins: ["wsx"],
    rules: {
        // WSX 特定规则（移除 valid-jsx-pragma，由 Vite 处理）
        "wsx/render-method-required": "error",
        "wsx/no-react-imports": "error",
        "wsx/web-component-naming": "warn",
        "wsx/state-requires-initial-value": "error",
        "wsx/require-jsx-import-source": "error",
        "wsx/no-null-render": "error",
        "wsx/no-inner-html": "error",
        "wsx/i18n-after-autoregister": "error",
        "wsx/no-duplicate-keys": "error",

        // TypeScript 规则（推荐）
        "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-non-null-assertion": "warn",

        // 通用规则
        "no-console": ["warn", { allow: ["warn", "error"] }],
        "no-debugger": "error",
        "no-unused-vars": "off", // 使用 TypeScript 版本
        "no-undef": "off", // TypeScript 处理
        "prefer-const": "error",
        "no-var": "error",
        "no-duplicate-imports": "error",
        "no-trailing-spaces": "error",
        "eol-last": "error",
        "comma-dangle": ["error", "always-multiline"],
        semi: ["error", "always"],
        quotes: ["error", "double", { avoidEscape: true, allowTemplateLiterals: true }],

        // 禁用 React 相关规则
        "react/react-in-jsx-scope": "off",
        "react/prop-types": "off",
        "react/jsx-uses-react": "off",
        "react/jsx-uses-vars": "off",
        "react/jsx-key": "off",
        "react/jsx-no-duplicate-props": "off",
        "react/jsx-no-undef": "off",
        "react/no-array-index-key": "off",
        "react/no-unescaped-entities": "off",
    },
    globals: {
        // 浏览器环境
        window: "readonly",
        document: "readonly",
        console: "readonly",

        // Node.js 环境
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",

        // Web Components API
        HTMLElement: "readonly",
        customElements: "readonly",
        CustomEvent: "readonly",
        ShadowRoot: "readonly",
        HTMLSlotElement: "readonly",
        CSSStyleSheet: "readonly",

        // WSX 特定
        h: "readonly",
        Fragment: "readonly",
    },
    settings: {
        // 不需要 React 设置
    },
};
