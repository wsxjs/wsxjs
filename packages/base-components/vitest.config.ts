import { defineConfig } from "vitest/config";
import { wsx } from "@wsxjs/wsx-vite-plugin";

export default defineConfig({
    plugins: [
        wsx({
            debug: false,
            jsxFactory: "h",
            jsxFragment: "Fragment",
        }),
    ],
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: [],
        include: ["src/**/*.{test,spec}.{js,ts,wsx}", "src/__tests__/**/*.{js,ts,wsx}"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html", "lcov"],
            include: ["src/**/*.{ts,wsx}"],
            exclude: [
                "src/**/*.{test,spec}.{ts,wsx}",
                "src/__tests__/**/*",
                "src/index.ts",
                "src/jsx-inject.ts",
                "src/types/**/*",
                "src/**/*.types.ts",
            ],
            thresholds: {
                lines: 100,
                functions: 100,
                branches: 100,
                statements: 100,
            },
        },
    },
    resolve: {
        alias: {
            "@wsxjs/wsx-core": new URL("../core/src", import.meta.url).pathname,
        },
    },
});
