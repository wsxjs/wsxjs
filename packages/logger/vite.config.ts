import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    build: {
        lib: {
            entry: path.resolve(__dirname, "src/index.ts"),
            name: "WSXLogger",
            formats: ["es", "cjs"],
            fileName: (format) => `index.${format === "es" ? "js" : "cjs"}`,
        },
        rollupOptions: {
            external: ["pino", "pino-pretty"],
            output: {
                globals: {
                    pino: "pino",
                    "pino-pretty": "pinoPretty",
                },
            },
        },
        sourcemap: true,
    },
});
