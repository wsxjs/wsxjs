import { defineConfig } from "vite";
import { wsx } from "@wsxjs/wsx-vite-plugin";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    build: {
        lib: {
            entry: {
                index: "src/index.ts",
                client: "src/client/index.ts",
                node: "src/node/index.ts",
            },
            formats: ["es", "cjs"],
            fileName: (format, entryName) => `${entryName}.${format === "es" ? "js" : "cjs"}`,
        },
        rollupOptions: {
            external: [
                "@wsxjs/wsx-core",
                "@wsxjs/wsx-marked-components",
                "@wsxjs/wsx-router",
                "fuse.js",
                "fs-extra",
                "glob",
                "typedoc",
                "typedoc-plugin-markdown",
                // Node.js built-in modules
                "path",
                "fs",
                "url",
            ],
            output: {
                globals: {
                    "@wsxjs/wsx-core": "WSXCore",
                    "@wsxjs/wsx-marked-components": "WSXMarkedComponents",
                    "@wsxjs/wsx-router": "WSXRouter",
                    "fuse.js": "Fuse",
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
                      "@wsxjs/wsx-marked-components": path.resolve(
                          __dirname,
                          "../marked-components/src/index.ts"
                      ),
                      "@wsxjs/wsx-router": path.resolve(__dirname, "../router/src/index.ts"),
                  }
                : undefined,
    },
});
