import { defineConfig } from "vite";
import { wsx } from "@wsxjs/wsx-vite-plugin";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    build: {
        lib: {
            entry: "src/index.ts",
            name: "WSXMarkedComponents",
            formats: ["es", "cjs"],
            fileName: (format) => `index.${format === "es" ? "js" : "cjs"}`,
        },
        rollupOptions: {
            external: ["@wsxjs/wsx-core", "marked"],
            output: {
                globals: {
                    "@wsxjs/wsx-core": "WSXCore",
                    marked: "marked",
                },
            },
        },
        cssCodeSplit: false,
        sourcemap: process.env.NODE_ENV === "development",
    },
    plugins: [
        wsx({
            debug: false,
            jsxFactory: "jsx",
            jsxFragment: "Fragment",
        }),
    ],
    resolve: {
        alias:
            process.env.NODE_ENV === "development"
                ? {
                      "@wsxjs/wsx-core": path.resolve(__dirname, "../core/src/index.ts"),
                  }
                : undefined,
    },
});
