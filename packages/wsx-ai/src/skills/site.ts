/**
 * Apply WSX Site skill: 使用 wsx-router 搭建带路由的站点（History API）
 */
import type { ApplyResult } from "../types.js";

const ROUTER_SNIPPET = `// 入口或根组件中
import "@wsxjs/wsx-router";
import { RouterUtils } from "@wsxjs/wsx-router";

// 根组件 render() 内用 <wsx-router> + <wsx-view> 声明路由
<wsx-router>
  <wsx-view route="/" component="home-section"></wsx-view>
  <wsx-view route="/about" component="about-section"></wsx-view>
  <wsx-view route="/docs/*" component="doc-section"></wsx-view>
  <wsx-view route="*" component="not-found-section"></wsx-view>
</wsx-router>

// 导航：RouterUtils.navigate(href) 或 <a href="/path" onclick={(e)=>{ e.preventDefault(); RouterUtils.navigate((e.target as HTMLAnchorElement).href); }}>`;

const VITE_SNIPPET = `// resolve.alias 开发时指向 router 源码（可选，monorepo）
{ find: "@wsxjs/wsx-router", replacement: path.resolve(__dirname, "path/to/wsx-router/src/index.ts") }

// optimizeDeps.exclude 避免预打包（可选）
"@wsxjs/wsx-router"`;

export function applySite(): ApplyResult {
    return {
        packageJsonAdditions: { "@wsxjs/wsx-router": "workspace:*" },
        viteConfigSnippet: VITE_SNIPPET,
        codeSnippets: { router: ROUTER_SNIPPET },
        instructions: [
            "添加依赖 @wsxjs/wsx-router 并执行 pnpm install",
            '在入口或根组件中 import "@wsxjs/wsx-router"，按需使用 RouterUtils',
            '在根组件 render() 内用 <wsx-router> 包裹，子节点用 <wsx-view route="..." component="..."> 声明路由',
            '通配符路由（如 404）放在最后：<wsx-view route="*" component="not-found-section">',
            "导航用 RouterUtils.navigate(href) 或带 onclick 的 <a>，避免整页刷新",
        ],
    };
}
