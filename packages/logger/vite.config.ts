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
            // No external dependencies - pure native browser implementation
            output: {
                // 禁用压缩，保持代码可读性，便于调试和 tree-shaking
                minifyInternalExports: false,
            },
        },
        // 禁用压缩，库代码应该保持可读性
        // 最终用户的项目构建工具会处理压缩
        minify: false,
        sourcemap: true,
    },
});
