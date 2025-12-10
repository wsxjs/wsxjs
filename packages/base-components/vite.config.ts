import { defineConfig } from "vite";
import { wsx } from "@wsxjs/wsx-vite-plugin";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    build: {
        lib: {
            entry: "src/index.ts",
            name: "WSXBaseComponents",
            formats: ["es", "cjs"],
            fileName: (format) => `index.${format === "es" ? "js" : "cjs"}`,
        },
        rollupOptions: {
            external: ["@wsxjs/wsx-core"],
            output: {
                globals: {
                    "@wsxjs/wsx-core": "WSXCore",
                },
            },
        },
        cssCodeSplit: false, // 禁用CSS代码分割，确保CSS内联到JS中
        sourcemap: process.env.NODE_ENV === "development", // 只在开发环境生成 source maps
    },
    plugins: [
        wsx({
            debug: false,
            jsxFactory: "jsx",
            jsxFragment: "Fragment",
        }),
    ],
    // Resolve workspace packages to source files in development mode
    // In production, Vite will use package.json exports (dist files)
    resolve: {
        alias:
            process.env.NODE_ENV === "development"
                ? {
                      "@wsxjs/wsx-core": path.resolve(__dirname, "../core/src/index.ts"),
                  }
                : undefined,
    },
});
