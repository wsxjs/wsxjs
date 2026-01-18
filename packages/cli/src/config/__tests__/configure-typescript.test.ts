import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { mkdirSync, writeFileSync, unlinkSync, rmdirSync, existsSync } from "fs";
import { join } from "path";
import { configureTypeScript } from "../configure-typescript.js";
import { tmpdir } from "os";

describe("configureTypeScript", () => {
    let testDir: string;

    beforeEach(() => {
        // Create a temporary directory for each test
        testDir = join(
            tmpdir(),
            `wsx-cli-test-${Date.now()}-${Math.random().toString(36).substring(7)}`
        );
        mkdirSync(testDir, { recursive: true });
    });

    afterEach(() => {
        // Clean up
        if (existsSync(join(testDir, "tsconfig.json"))) {
            unlinkSync(join(testDir, "tsconfig.json"));
        }
        if (existsSync(testDir)) {
            rmdirSync(testDir);
        }
    });

    describe("when tsconfig.json does not exist", () => {
        it("should create a new tsconfig.json with WSX settings", async () => {
            const result = await configureTypeScript(testDir, {
                useDecorators: true,
            });

            expect(result.success).toBe(true);
            expect(result.created).toBe(true);
            expect(existsSync(join(testDir, "tsconfig.json"))).toBe(true);

            const config = JSON.parse(
                require("fs").readFileSync(join(testDir, "tsconfig.json"), "utf-8")
            );

            expect(config.compilerOptions.jsx).toBe("react-jsx");
            expect(config.compilerOptions.jsxImportSource).toBe("@wsxjs/wsx-core");
            expect(config.compilerOptions.experimentalDecorators).toBe(true);
            expect(config.compilerOptions.useDefineForClassFields).toBe(false);
        });

        it("should create config without decorators when useDecorators is false", async () => {
            const result = await configureTypeScript(testDir, {
                useDecorators: false,
            });

            expect(result.success).toBe(true);
            const config = JSON.parse(
                require("fs").readFileSync(join(testDir, "tsconfig.json"), "utf-8")
            );

            expect(config.compilerOptions.experimentalDecorators).toBeUndefined();
            expect(config.compilerOptions.useDefineForClassFields).toBeUndefined();
        });

        it("should use @wsxjs/wsx-tsconfig when useTsConfigPackage is true", async () => {
            const result = await configureTypeScript(testDir, {
                useTsConfigPackage: true,
            });

            expect(result.success).toBe(true);
            const config = JSON.parse(
                require("fs").readFileSync(join(testDir, "tsconfig.json"), "utf-8")
            );

            expect(config.extends).toBe("@wsxjs/wsx-tsconfig/tsconfig.base.json");
        });
    });

    describe("when tsconfig.json exists", () => {
        it("should merge with existing config without overwriting", async () => {
            // Create existing config
            const existingConfig = {
                compilerOptions: {
                    target: "ES2020",
                    module: "ESNext",
                },
                include: ["src/**/*"],
            };

            writeFileSync(join(testDir, "tsconfig.json"), JSON.stringify(existingConfig, null, 2));

            const result = await configureTypeScript(testDir, {
                useDecorators: true,
            });

            expect(result.success).toBe(true);
            expect(result.created).toBe(false);

            const config = JSON.parse(
                require("fs").readFileSync(join(testDir, "tsconfig.json"), "utf-8")
            );

            // Existing options should be preserved
            expect(config.compilerOptions.target).toBe("ES2020");
            expect(config.compilerOptions.module).toBe("ESNext");
            // New options should be added
            expect(config.compilerOptions.jsx).toBe("react-jsx");
            expect(config.compilerOptions.jsxImportSource).toBe("@wsxjs/wsx-core");
        });

        it("should handle invalid JSON gracefully", async () => {
            writeFileSync(join(testDir, "tsconfig.json"), "invalid json");

            const result = await configureTypeScript(testDir, {
                useDecorators: true,
            });

            expect(result.success).toBe(false);
            expect(result.message).toContain("无法解析");
        });
    });
});
