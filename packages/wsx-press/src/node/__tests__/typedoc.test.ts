import { describe, it, expect, beforeEach, vi } from "vitest";
import { vol } from "memfs";
import { generateApiDocs, type TypeDocConfig } from "../typedoc";

// Mock fs-extra
vi.mock("fs-extra", () => {
    const { vol } = require("memfs");
    return {
        default: {
            pathExists: async (filePath: string): Promise<boolean> => {
                try {
                    vol.statSync(filePath);
                    return true;
                } catch {
                    return false;
                }
            },
            ensureDir: async (dir: string): Promise<void> => {
                try {
                    vol.mkdirSync(dir, { recursive: true });
                } catch {
                    // 目录可能已存在
                }
            },
        },
        pathExists: async (filePath: string): Promise<boolean> => {
            try {
                vol.statSync(filePath);
                return true;
            } catch {
                return false;
            }
        },
        ensureDir: async (dir: string): Promise<void> => {
            try {
                vol.mkdirSync(dir, { recursive: true });
            } catch {
                // 目录可能已存在
            }
        },
    };
});

// Mock typedoc
vi.mock("typedoc", async () => {
    const mockProject = {
        name: "test-project",
    };

    const mockApp = {
        options: {
            addReader: vi.fn(),
        },
        convert: vi.fn().mockResolvedValue(mockProject),
        generateDocs: vi.fn().mockResolvedValue(undefined),
    };

    return {
        Application: {
            bootstrapWithPlugins: vi.fn().mockResolvedValue(mockApp),
        },
        TSConfigReader: vi.fn(),
        TypeDocReader: vi.fn(),
    };
});

describe("TypeDoc 集成", () => {
    beforeEach(() => {
        vol.reset();
    });

    it("应该成功生成 API 文档", async () => {
        vol.fromJSON({
            "/test/sample.ts": "export function test() {}",
            "/test/tsconfig.json": '{"compilerOptions": {}}',
        });

        const config: TypeDocConfig = {
            entryPoints: ["/test/sample.ts"],
            tsconfig: "/test/tsconfig.json",
            outputDir: "/tmp/api-docs",
        };

        await expect(generateApiDocs(config)).resolves.not.toThrow();
    });

    it("应该处理多个入口点", async () => {
        vol.fromJSON({
            "/test/file1.ts": "export const a = 1;",
            "/test/file2.ts": "export const b = 2;",
            "/test/tsconfig.json": '{"compilerOptions": {}}',
        });

        const config: TypeDocConfig = {
            entryPoints: ["/test/file1.ts", "/test/file2.ts"],
            tsconfig: "/test/tsconfig.json",
            outputDir: "/tmp/api-docs",
        };

        await expect(generateApiDocs(config)).resolves.not.toThrow();
    });

    it("应该处理无效入口点", async () => {
        vol.fromJSON({
            "/test/tsconfig.json": '{"compilerOptions": {}}',
        });

        const config: TypeDocConfig = {
            entryPoints: ["/test/nonexistent.ts"],
            tsconfig: "/test/tsconfig.json",
            outputDir: "/tmp/api-docs",
        };

        await expect(generateApiDocs(config)).rejects.toThrow("Entry point not found");
    });

    it("应该处理无效 tsconfig", async () => {
        vol.fromJSON({
            "/test/sample.ts": "export function test() {}",
        });

        const config: TypeDocConfig = {
            entryPoints: ["/test/sample.ts"],
            tsconfig: "/test/nonexistent.json",
            outputDir: "/tmp/api-docs",
        };

        await expect(generateApiDocs(config)).rejects.toThrow("TypeScript config not found");
    });

    it("应该使用自定义配置选项", async () => {
        vol.fromJSON({
            "/test/sample.ts": "export function test() {}",
            "/test/tsconfig.json": '{"compilerOptions": {}}',
        });

        const config: TypeDocConfig = {
            entryPoints: ["/test/sample.ts"],
            tsconfig: "/test/tsconfig.json",
            outputDir: "/tmp/api-docs",
            excludePrivate: false,
            excludeProtected: true,
            excludeInternal: false,
            publicPath: "/custom-api/",
        };

        await expect(generateApiDocs(config)).resolves.not.toThrow();
    });

    it("应该使用默认配置选项", async () => {
        vol.fromJSON({
            "/test/sample.ts": "export function test() {}",
            "/test/tsconfig.json": '{"compilerOptions": {}}',
        });

        const config: TypeDocConfig = {
            entryPoints: ["/test/sample.ts"],
            tsconfig: "/test/tsconfig.json",
            outputDir: "/tmp/api-docs",
        };

        await expect(generateApiDocs(config)).resolves.not.toThrow();
    });

    it("应该自动创建输出目录", async () => {
        vol.fromJSON({
            "/test/sample.ts": "export function test() {}",
            "/test/tsconfig.json": '{"compilerOptions": {}}',
        });

        const config: TypeDocConfig = {
            entryPoints: ["/test/sample.ts"],
            tsconfig: "/test/tsconfig.json",
            outputDir: "/tmp/new-api-docs",
        };

        await expect(generateApiDocs(config)).resolves.not.toThrow();
    });
});
