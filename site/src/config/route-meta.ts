/**
 * 路由 Meta 配置
 * 定义每个路由的 SEO meta 信息
 */

import type { RouteMeta } from "../utils/meta-manager";

export const routeMeta: Record<string, RouteMeta> = {
    "/": {
        title: "WSXJS - JSX for Native Web Components",
        description:
            "Modern JSX syntax for native Web Components. Zero dependencies, TypeScript-first, production-ready. Not a framework, just better developer experience.",
        keywords: "WSXJS, Web Components, JSX, TypeScript, Web Standards, Framework",
        image: "/og-image.png",
        type: "website",
    },
    "/features": {
        title: "Features - WSXJS",
        description:
            "Discover the powerful features of WSXJS: JSX syntax, TypeScript support, zero runtime overhead, and native Web Components.",
        keywords: "WSXJS features, Web Components features, JSX features",
        image: "/og-image.png",
    },
    "/quick-start": {
        title: "Quick Start - WSXJS",
        description:
            "Get started with WSXJS in minutes. Learn how to create your first Web Component with JSX syntax.",
        keywords: "WSXJS quick start, WSXJS tutorial, get started with WSXJS",
        image: "/og-image.png",
    },
    "/examples": {
        title: "Examples - WSXJS",
        description:
            "Explore interactive examples showcasing WSXJS capabilities: Web Components, Light Components, Slots, and more.",
        keywords: "WSXJS examples, Web Components examples, JSX examples",
        image: "/og-image.png",
    },
    "/use-cases": {
        title: "Use Cases - WSXJS",
        description:
            "See how WSXJS can be used in real-world scenarios: component libraries, applications, and integrations.",
        keywords: "WSXJS use cases, Web Components use cases",
        image: "/og-image.png",
    },
    "/webcomponent-examples": {
        title: "WebComponent Examples - WSXJS",
        description: "Learn how to use WebComponent base class with Shadow DOM in WSXJS.",
        keywords: "WSXJS WebComponent, Shadow DOM, Web Components",
        image: "/og-image.png",
    },
    "/lightcomponent-examples": {
        title: "LightComponent Examples - WSXJS",
        description: "Learn how to use LightComponent base class with Light DOM in WSXJS.",
        keywords: "WSXJS LightComponent, Light DOM, Web Components",
        image: "/og-image.png",
    },
    "/slot-examples": {
        title: "Slot Examples - WSXJS",
        description: "Learn how to use slots for component composition in WSXJS.",
        keywords: "WSXJS slots, component composition, Web Components slots",
        image: "/og-image.png",
    },
    "/marked": {
        title: "Markdown Renderer - WSXJS",
        description:
            "See how to render Markdown with WSX custom elements using the marked library.",
        keywords: "WSXJS markdown, marked library, custom renderer",
        image: "/og-image.png",
    },
    "/ecosystem": {
        title: "Ecosystem - WSXJS",
        description: "Explore the WSXJS ecosystem: packages, tools, and community resources.",
        keywords: "WSXJS ecosystem, WSXJS packages, WSXJS tools",
        image: "/og-image.png",
    },
    "/docs": {
        title: "Documentation - WSXJS",
        description: "Complete documentation for WSXJS framework, including guides, API reference, and examples.",
        keywords: "WSXJS documentation, WSXJS guide, WSXJS API",
        image: "/og-image.png",
    },
    "/privacy": {
        title: "Privacy Policy - WSXJS",
        description: "WSXJS Privacy Policy - How we collect, use, and protect your data.",
        keywords: "WSXJS privacy policy",
        image: "/og-image.png",
    },
    "/terms": {
        title: "Terms of Service - WSXJS",
        description: "WSXJS Terms of Service - Legal terms and conditions for using WSXJS.",
        keywords: "WSXJS terms of service",
        image: "/og-image.png",
    },
    // 404 页面（通配符路由）
    "*": {
        title: "404 - Page Not Found | WSXJS",
        description: "The page you're looking for doesn't exist or has been moved.",
        keywords: "404, page not found, WSXJS",
        image: "/og-image.png",
    },
};

/**
 * 获取路由的 meta 信息
 * 优先检查精确匹配，然后检查参数化路由（如 /docs/:category/:page），最后是通配符 "*"，最后回退到首页
 */
export function getRouteMeta(path: string): RouteMeta {
    // 1. 优先返回精确匹配的路由 meta
    if (routeMeta[path]) {
        return routeMeta[path];
    }
    // 2. 检查参数化路由：/docs/:category/:page
    if (path.startsWith("/docs/")) {
        const docsPathMatch = path.match(/^\/docs\/([^/]+)\/([^/]+)$/);
        if (docsPathMatch) {
            // 使用文档路由的 meta，但可以根据需要动态生成标题
            const baseMeta = routeMeta["/docs"] || routeMeta["/"];
            return {
                ...baseMeta,
                title: `${docsPathMatch[2]} - Documentation | WSXJS`,
                description: baseMeta.description || "WSXJS Documentation",
            };
        }
    }
    // 3. 如果没有精确匹配，检查通配符 "*"（用于 404 页面）
    if (routeMeta["*"]) {
        return routeMeta["*"];
    }
    // 4. 最后回退到首页 meta
    return routeMeta["/"];
}
