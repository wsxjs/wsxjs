/**
 * Apply WSX base-components skill: 添加基础组件库并给出使用示例
 */
import type { ApplyResult } from "../types.js";

const USAGE_SNIPPET = `// 按需从 base-components 引入并注册
import "@wsxjs/wsx-base-components";

// 使用示例
// <wsx-button>按钮</wsx-button>
// <wsx-dropdown options={[...]} value={...} onChange={...} />
// <wsx-language-switcher />
// <wsx-card title="..." description="..." />`;

export function applyComponents(): ApplyResult {
    return {
        packageJsonAdditions: {
            "@wsxjs/wsx-base-components": "workspace:*",
        },
        codeSnippets: {
            usage: USAGE_SNIPPET,
        },
        instructions: [
            "添加依赖 @wsxjs/wsx-base-components 并执行 pnpm install",
            '在需要使用的入口或布局中 import "@wsxjs/wsx-base-components"',
            "使用 wsx-button、wsx-dropdown、wsx-language-switcher、wsx-card 等标签，通过 attributes/properties/events 配置",
        ],
    };
}
