import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    build: {
        target: "node18",
        rollupOptions: {
            external: ["fs", "path", "process", "events", "child_process"],
            output: {
                globals: {},
            },
        },
        lib: {
            entry: {
                index: "src/index.ts",
                cli: "src/cli.ts",
            },
            name: "WSXAI",
            formats: ["es", "cjs"],
            fileName: (format, entryName) => `${entryName}.${format === "es" ? "mjs" : "cjs"}`,
        },
    },
});
