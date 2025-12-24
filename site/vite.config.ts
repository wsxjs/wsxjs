import { defineConfig } from "vite";
import { wsx } from "@wsxjs/wsx-vite-plugin";
import UnoCSS from "unocss/vite";
import path from "path";
import { fileURLToPath } from "url";
import { copyFileSync, cpSync } from "fs";
import { wsxPress } from "@wsxjs/wsx-press/node";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Vite 插件：在构建后复制 index.html 为 404.html（用于 GitHub Pages SPA 路由）
// GitHub Pages 使用 404.html 作为找不到页面时的回退，这对于 SPA 路由至关重要
const copy404Plugin = () => {
    return {
        name: "copy-404-for-github-pages",
        apply: "build", // 只在构建时应用
        closeBundle() {
            // closeBundle 在所有 bundle 写入完成后调用，确保 index.html 已被处理
            const distPath = path.resolve(__dirname, "dist");
            const indexPath = path.join(distPath, "index.html");
            const notFoundPath = path.join(distPath, "404.html");
            try {
                copyFileSync(indexPath, notFoundPath);
                console.log("✅ Generated 404.html from index.html for GitHub Pages SPA routing");
            } catch (error) {
                console.error("❌ Failed to generate 404.html:", error);
                // 不抛出错误，避免中断构建流程
            }
        },
    };
};

// Vite 插件：在构建后复制 .wsx-press 目录到 dist
const copyWsxPressPlugin = () => {
    return {
        name: "copy-wsx-press",
        apply: "build",
        closeBundle() {
            const wsxPressPath = path.resolve(__dirname, ".wsx-press");
            const distWsxPressPath = path.resolve(__dirname, "dist/.wsx-press");
            try {
                cpSync(wsxPressPath, distWsxPressPath, { recursive: true });
                console.log("✅ Copied .wsx-press directory to dist");
            } catch (error) {
                console.error("❌ Failed to copy .wsx-press directory:", error);
                // 不抛出错误，避免中断构建流程
            }
        },
    };
};

export default defineConfig({
    // Set base path for GitHub Pages deployment
    base:
        process.env.NODE_ENV === "production" && process.env.GITHUB_PAGES === "true"
            ? process.env.CUSTOM_DOMAIN === "true"
                ? "/"
                : "/wsxjs/"
            : "/",
    plugins: [
        UnoCSS(),
        wsx({
            debug: false, // Enable debug to see generated code
            jsxFactory: "h",
            jsxFragment: "Fragment",
        }),
        // WSX-Press 文档系统插件
        wsxPress({
            docsRoot: path.resolve(__dirname, "public/docs"),
            outputDir: path.resolve(__dirname, ".wsx-press"),
            // API 文档生成暂时禁用，因为 TypeDoc 版本不兼容
            // api: {
            //     entryPoints: [
            //         path.resolve(__dirname, "../packages/core/src/index.ts"),
            //         path.resolve(__dirname, "../packages/router/src/index.ts"),
            //         path.resolve(__dirname, "../packages/base-components/src/index.ts"),
            //     ],
            //     tsconfig: path.resolve(__dirname, "../tsconfig.json"),
            //     outputDir: path.resolve(__dirname, "public/docs/api"),
            //     excludePrivate: true,
            //     excludeProtected: false,
            //     excludeInternal: true,
            //     publicPath: "/docs/api/",
            // },
        }),
        // 构建后自动复制 index.html 为 404.html（用于 GitHub Pages SPA 路由）
        copy404Plugin(),
        // 构建后复制 .wsx-press 目录到 dist
        copyWsxPressPlugin(),
    ],
    build: {
        outDir: "dist",
        sourcemap: process.env.NODE_ENV !== "production", // No source maps in production
    },
    // Source maps are enabled by default in dev mode
    // Resolve workspace packages to source files in development mode
    // This allows hot reload without needing to build dependencies first
    // In production, Vite will use package.json exports (dist files)
    resolve: {
        alias:
            process.env.NODE_ENV === "development"
                ? {
                      // In development, use source files directly for better HMR
                      "@wsxjs/wsx-core": path.resolve(__dirname, "../packages/core/src/index.ts"),
                      "@wsxjs/wsx-base-components": path.resolve(
                          __dirname,
                          "../packages/base-components/src/index.ts"
                      ),
                      // Use built files for i18next to avoid module resolution issues
                      "@wsxjs/wsx-i18next": path.resolve(
                          __dirname,
                          "../packages/i18next/dist/index.mjs"
                      ),
                      "@wsxjs/wsx-router": path.resolve(
                          __dirname,
                          "../packages/router/src/index.ts"
                      ),
                      "@wsxjs/wsx-press/client": path.resolve(
                          __dirname,
                          "../packages/wsx-press/src/client/index.ts"
                      ),
                  }
                : undefined,
    },
    // 开发环境代理配置，解决 CORS 问题
    server: {
        proxy: {
            "/api/github": {
                target: "https://api.github.com",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/github/, ""),
                configure: (proxy, _options) => {
                    proxy.on("error", (err, _req, _res) => {
                        console.error("GitHub API proxy error", err);
                    });
                },
            },
            "/api/npm": {
                target: "https://api.npmjs.org",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/npm/, ""),
            },
        },
    },
});
