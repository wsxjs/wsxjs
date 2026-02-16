import { defineConfig } from "vite";
import { wsx } from "@wsxjs/wsx-vite-plugin";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    build: {
        lib: {
            entry: "src/index.ts",
            name: "WSXTheme",
            formats: ["es", "cjs"],
            fileName: (format) => `index.${format === "es" ? "mjs" : "cjs"}`,
        },
        rollupOptions: {
            external: ["@wsxjs/wsx-core"],
            output: {
                globals: { "@wsxjs/wsx-core": "WSXCore" },
            },
        },
        cssCodeSplit: false,
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
                ? { "@wsxjs/wsx-core": path.resolve(__dirname, "../core/src/index.ts") }
                : undefined,
    },
});
