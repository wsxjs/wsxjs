import { defineConfig } from "vitest/config";
import { wsx } from "@wsxjs/wsx-vite-plugin";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [
        wsx({
            jsxFactory: "h",
            jsxFragment: "Fragment",
        }),
        // Custom plugin to resolve @wsxjs/* packages before wsx plugin processes .wsx files
        {
            name: "resolve-wsx-packages",
            enforce: "pre",
            resolveId(id) {
                if (id.startsWith("@wsxjs/")) {
                    const packageName = id.replace("@wsxjs/", "");
                    // Check if it's a subpath export
                    if (id.includes("/") && !id.endsWith("/")) {
                        const [pkg, ...subpath] = id.replace("@wsxjs/", "").split("/");
                        const subpathPath = path.resolve(
                            __dirname,
                            `../packages/${pkg.replace(/^wsx-/, "")}/src/${subpath.join("/")}`
                        );
                        if (existsSync(subpathPath + ".ts")) {
                            return subpathPath + ".ts";
                        }
                        if (existsSync(subpathPath + "/index.ts")) {
                            return subpathPath + "/index.ts";
                        }
                    }
                    // Default to index.ts
                    const packagePath = path.resolve(
                        __dirname,
                        `../packages/${packageName.replace(/^wsx-/, "")}/src`
                    );
                    const indexPath = path.join(packagePath, "index.ts");
                    if (existsSync(indexPath)) {
                        return indexPath;
                    }
                    // Fallback to package root
                    return packagePath;
                }
                return null;
            },
        },
    ],
    test: {
        globals: true,
        environment: "happy-dom",
        setupFiles: ["./test/setup.ts"],
        include: ["src/**/*.test.ts", "src/**/*.test.tsx", "test/**/*.test.ts"],
        typecheck: {
            include: ["src/**/*.{ts,tsx,wsx}", "src/types.d.ts"],
        },
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            reportsDirectory: "./coverage",
            include: ["src/**/*.{ts,tsx,wsx}"],
            exclude: ["src/**/*.d.ts", "src/**/*.test.{ts,tsx}", "src/main.ts"],
        },
    },
    resolve: {
        alias: [
            { find: "@", replacement: path.resolve(__dirname, "./src") },
            // Only use source aliases in development/test environment
            // In production, use the built packages from node_modules
            ...(process.env.NODE_ENV !== "production"
                ? [
                      {
                          find: "@wsxjs/wsx-press/client",
                          replacement: path.resolve(
                              __dirname,
                              "../packages/wsx-press/src/client/index.ts"
                          ),
                      },
                      {
                          find: "@wsxjs/wsx-press/node",
                          replacement: path.resolve(
                              __dirname,
                              "../packages/wsx-press/src/node/index.ts"
                          ),
                      },
                      {
                          find: "@wsxjs/wsx-core",
                          replacement: path.resolve(__dirname, "../packages/core/src/index.ts"),
                      },
                      {
                          find: "@wsxjs/wsx-base-components",
                          replacement: path.resolve(
                              __dirname,
                              "../packages/base-components/src/index.ts"
                          ),
                      },
                      {
                          find: "@wsxjs/wsx-logger",
                          replacement: path.resolve(__dirname, "../packages/logger/src/index.ts"),
                      },
                      {
                          find: "@wsxjs/wsx-press",
                          replacement: path.resolve(
                              __dirname,
                              "../packages/wsx-press/src/index.ts"
                          ),
                      },
                      {
                          find: "@wsxjs/wsx-marked-components",
                          replacement: path.resolve(
                              __dirname,
                              "../packages/marked-components/src/index.ts"
                          ),
                      },
                      {
                          find: "@wsxjs/wsx-i18next",
                          replacement: path.resolve(__dirname, "../packages/i18next/src/index.ts"),
                      },
                      {
                          find: "@wsxjs/wsx-router",
                          replacement: path.resolve(__dirname, "../packages/router/src/index.ts"),
                      },
                  ]
                : []),
        ],
    },
    esbuild: {
        jsx: "transform",
        jsxFactory: "h",
        jsxFragment: "Fragment",
        jsxInject: `import { h, Fragment } from '@wsxjs/wsx-core'`,
        target: "es2020",
    },
});
