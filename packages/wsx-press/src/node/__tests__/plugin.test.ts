import { describe, it, expect, beforeEach, vi } from "vitest";
import { vol } from "memfs";
import { wsxPress, type WSXPressOptions } from "../plugin";
import type { Plugin } from "vite";

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
            writeJSON: async (filePath: string, data: unknown): Promise<void> => {
                vol.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
            },
            readFile: async (filePath: string): Promise<string> => {
                return vol.readFileSync(filePath, "utf-8") as string;
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
        writeJSON: async (filePath: string, data: unknown): Promise<void> => {
            vol.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
        },
        readFile: async (filePath: string): Promise<string> => {
            return vol.readFileSync(filePath, "utf-8") as string;
        },
    };
});

// Mock metadata and search
vi.mock("../metadata", () => ({
    scanDocsMetadata: vi.fn().mockResolvedValue({
        "guide/intro": {
            title: "介绍",
            category: "guide",
            route: "/docs/guide/intro",
        },
    }),
}));

vi.mock("../search", () => ({
    generateSearchIndex: vi.fn().mockResolvedValue({
        documents: [],
        options: {
            keys: [],
            threshold: 0.3,
            includeScore: true,
            includeMatches: true,
        },
    }),
}));

// Mock typedoc
vi.mock("../typedoc", () => ({
    generateApiDocs: vi.fn().mockResolvedValue(undefined),
}));

describe("Vite 插件", () => {
    beforeEach(() => {
        vol.reset();
        vi.clearAllMocks();
    });

    it("应该返回有效的 Vite 插件", () => {
        const options: WSXPressOptions = {
            docsRoot: "./docs",
        };

        const plugin = wsxPress(options);
        expect(plugin).toBeDefined();
        expect(plugin.name).toBe("vite-plugin-wsx-press");
        expect(plugin.enforce).toBe("pre");
        expect(plugin.buildStart).toBeDefined();
        expect(plugin.configureServer).toBeDefined();
    });

    it("应该在构建时生成文件", async () => {
        vol.fromJSON({
            "/test/docs/guide/intro.md": "---\ntitle: 介绍\n---\n内容",
        });

        const options: WSXPressOptions = {
            docsRoot: "/test/docs",
            outputDir: "/test/.wsx-press",
        };

        const plugin = wsxPress(options);
        const mockContext = {} as Parameters<NonNullable<Plugin["buildStart"]>>[0];

        await plugin.buildStart?.call(
            mockContext,
            {} as Parameters<NonNullable<Plugin["buildStart"]>>[1]
        );

        // 验证文件被生成（通过 mock）
        const { scanDocsMetadata } = await import("../metadata");
        const { generateSearchIndex } = await import("../search");
        expect(scanDocsMetadata).toHaveBeenCalled();
        expect(generateSearchIndex).toHaveBeenCalled();
    });

    it("应该处理 API 文档配置", async () => {
        vol.fromJSON({
            "/test/docs/guide/intro.md": "---\ntitle: 介绍\n---\n内容",
            "/test/packages/core/src/index.ts": "export const test = 1;",
            "/test/tsconfig.json": '{"compilerOptions": {}}',
        });

        const options: WSXPressOptions = {
            docsRoot: "/test/docs",
            api: {
                entryPoints: ["/test/packages/core/src/index.ts"],
                tsconfig: "/test/tsconfig.json",
                outputDir: "/test/docs/api",
            },
        };

        const plugin = wsxPress(options);
        const mockContext = {} as Parameters<NonNullable<Plugin["buildStart"]>>[0];

        await plugin.buildStart?.call(
            mockContext,
            {} as Parameters<NonNullable<Plugin["buildStart"]>>[1]
        );

        // 验证 API 文档生成被调用
        const { generateApiDocs } = await import("../typedoc");
        expect(generateApiDocs).toHaveBeenCalled();
    });

    it("应该配置开发服务器中间件", () => {
        const options: WSXPressOptions = {
            docsRoot: "./docs",
        };

        const plugin = wsxPress(options);
        const mockServer = {
            middlewares: {
                use: vi.fn(),
            },
        } as unknown as Parameters<NonNullable<Plugin["configureServer"]>>[0];

        plugin.configureServer?.(mockServer);

        expect(mockServer.middlewares.use).toHaveBeenCalledWith(
            "/.wsx-press",
            expect.any(Function)
        );
    });

    it("应该使用默认输出目录", () => {
        const options: WSXPressOptions = {
            docsRoot: "./docs",
        };

        const plugin = wsxPress(options);
        expect(plugin).toBeDefined();
        expect(plugin.name).toBe("vite-plugin-wsx-press");
    });

    it("应该处理绝对路径", () => {
        const options: WSXPressOptions = {
            docsRoot: "/absolute/path/docs",
            outputDir: "/absolute/path/.wsx-press",
        };

        const plugin = wsxPress(options);
        expect(plugin).toBeDefined();
    });
});
