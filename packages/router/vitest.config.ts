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
            reporter: ["text", "json", "html"],
            include: ["src/**/*.{ts,wsx}"],
            exclude: ["src/**/*.{test,spec}.{ts,wsx}", "src/__tests__/**/*"],
        },
    },
    resolve: {
        alias: {
            "@wsxjs/wsx-core": new URL("../core/src", import.meta.url).pathname,
        },
    },
});
