import { defineConfig } from "vitest/config";
import { wsx } from "@wsxjs/wsx-vite-plugin";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [
        wsx({
            debug: false,
            jsxFactory: "h",
            jsxFragment: "Fragment",
        }),
    ],
    test: {
        globals: true,
        environment: "jsdom", // 客户端组件需要 DOM 环境
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            exclude: [
                "node_modules/",
                "dist/",
                "**/*.test.ts",
                "**/__tests__/**",
                "**/*.config.ts",
            ],
            lines: 100,
            functions: 100,
            branches: 100,
            statements: 100,
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@wsxjs/wsx-core": path.resolve(__dirname, "../core/src"),
            "@wsxjs/wsx-marked-components": path.resolve(__dirname, "../marked-components/src"),
        },
    },
});
