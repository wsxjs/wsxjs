/**
 * Apply WSX-Theme skill: 添加主题包并在根组件用 wsx-branding 包裹
 */
import type { ApplyResult } from "../types.js";

const ROOT_WRAPPER = `import "@wsxjs/wsx-theme";
render() {
  return (
    <wsx-branding>
      <div class="app-container">{/* 原有根内容 */}</div>
    </wsx-branding>
  );
}`;

export function applyTheme(): ApplyResult {
    return {
        packageJsonAdditions: { "@wsxjs/wsx-theme": "workspace:*" },
        codeSnippets: { "root-wrapper": ROOT_WRAPPER },
        instructions: [
            "添加依赖 @wsxjs/wsx-theme 并执行 pnpm install",
            '在入口或根组件中 import "@wsxjs/wsx-theme"',
            "在根组件的 render() 里用 <wsx-branding> 包裹整站内容",
            "通过 data-theme 切换亮/暗",
        ],
    };
}
