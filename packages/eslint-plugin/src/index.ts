/**
 * ESLint Plugin for WSX (Web Components JSX) - TypeScript 版本
 *
 * 提供针对 WSX 框架的专用 ESLint 规则和配置
 * 注意：不包含 valid-jsx-pragma 规则，因为 Vite 插件已处理 JSX pragma
 */

import { renderMethodRequired } from "./rules/render-method-required";
import { noReactImports } from "./rules/no-react-imports";
import { webComponentNaming } from "./rules/web-component-naming";
import { stateRequiresInitialValue } from "./rules/state-requires-initial-value";
import { requireJsxImportSource } from "./rules/require-jsx-import-source";
import { recommendedConfig } from "./configs/recommended";
import { createFlatConfig } from "./configs/flat";
import { WSXPlugin } from "./types";

const plugin: WSXPlugin = {
    // 插件元信息
    meta: {
        name: "@wsxjs/eslint-plugin-wsx",
        version: "0.0.2",
    },

    // 核心规则（移除 valid-jsx-pragma）
    rules: {
        "render-method-required": renderMethodRequired,
        "no-react-imports": noReactImports,
        "web-component-naming": webComponentNaming,
        "state-requires-initial-value": stateRequiresInitialValue,
        "require-jsx-import-source": requireJsxImportSource,
    },

    // 配置预设
    configs: {
        recommended: recommendedConfig,
    },
};

// Export for ESLint 9 flat config
export const flat = {
    recommended: createFlatConfig(plugin),
};

// Export individual rules for manual configuration
export const rules = plugin.rules;

// Export configs
export const configs = plugin.configs;

export default plugin;
