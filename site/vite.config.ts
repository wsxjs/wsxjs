import { defineConfig } from "vite";
import { wsx } from "@wsxjs/wsx-vite-plugin";
import UnoCSS from "unocss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
