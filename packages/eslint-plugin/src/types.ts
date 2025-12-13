/**
 * TypeScript 类型定义 - WSX ESLint 插件
 */

import { Rule } from "eslint";

export interface WSXRuleContext extends Rule.RuleContext {
    // WSX 特定的上下文扩展
    report: (descriptor: Rule.ReportDescriptor) => void;
}

export interface WSXRuleModule extends Rule.RuleModule {
    // WSX 特定的规则模块扩展
    create: (context: WSXRuleContext) => Rule.RuleListener;
}

export interface WSXConfig {
    parser?: string;
    parserOptions?: {
        ecmaVersion?: string | number;
        sourceType?: "script" | "module";
        ecmaFeatures?: {
            jsx?: boolean;
        };
        jsxPragma?: string;
        jsxFragmentName?: string;
        experimentalDecorators?: boolean; // Required for @state decorator support
    };
    plugins?: string[];
    rules?: Record<string, unknown>;
    globals?: Record<string, "readonly" | "writable">;
    settings?: Record<string, unknown>;
}

export interface WSXPluginMeta {
    name: string;
    version: string;
}

export interface WSXPlugin {
    meta: WSXPluginMeta;
    rules: Record<string, WSXRuleModule>;
    configs: Record<string, WSXConfig>;
    [key: string]: unknown;
}
