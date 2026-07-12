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

vi.mock("../toc", () => ({
    generateTOCCollection: vi.fn().mockResolvedValue({
        "guide/intro": [],
    }),
}));

type MiddlewareHandler = (
    req: { url?: string; headers: { host?: string } },
    res: {
        setHeader: ReturnType<typeof vi.fn>;
        end: ReturnType<typeof vi.fn>;
        statusCode?: number;
    },
    next: ReturnType<typeof vi.fn>
) => Promise<void>;

function createPluginWithPaths(options: WSXPressOptions, base = "/") {
    const plugin = wsxPress(options);
    plugin.configResolved?.({
        base,
        root: "/test",
    } as Parameters<NonNullable<Plugin["configResolved"]>>[0]);
    return plugin;
}

function getMiddlewareHandler(plugin: ReturnType<typeof wsxPress>): MiddlewareHandler {
    const mockServer = {
        middlewares: {
            use: vi.fn(),
        },
    } as unknown as Parameters<NonNullable<Plugin["configureServer"]>>[0];

    plugin.configureServer?.(mockServer);
    return mockServer.middlewares.use.mock.calls[0][1] as MiddlewareHandler;
}

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

        plugin.configResolved?.({
            base: "/",
            root: "/test",
        } as Parameters<NonNullable<Plugin["configResolved"]>>[0]);

        plugin.configureServer?.(mockServer);

        expect(mockServer.middlewares.use).toHaveBeenCalledWith(
            "/.wsx-press",
            expect.any(Function)
        );
    });

    it("子路径 base 时仍挂载 /.wsx-press（Vite 已剥离 base）", () => {
        const plugin = wsxPress({ docsRoot: "./docs" });
        const mockServer = {
            middlewares: {
                use: vi.fn(),
            },
        } as unknown as Parameters<NonNullable<Plugin["configureServer"]>>[0];

        plugin.configResolved?.({
            base: "/productivity/",
            root: "/test",
        } as Parameters<NonNullable<Plugin["configResolved"]>>[0]);

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

    it("buildStart 在未 configResolved 时使用相对路径回退", async () => {
        const plugin = wsxPress({
            docsRoot: "./docs",
            outputDir: "./.wsx-press",
        });

        await plugin.buildStart?.call(
            {} as Parameters<NonNullable<Plugin["buildStart"]>>[0],
            {} as Parameters<NonNullable<Plugin["buildStart"]>>[1]
        );

        const { scanDocsMetadata } = await import("../metadata");
        expect(scanDocsMetadata).toHaveBeenCalled();
    });

    it("buildStart 在 TOC 生成失败时不中断构建", async () => {
        const { generateTOCCollection } = await import("../toc");
        vi.mocked(generateTOCCollection).mockRejectedValueOnce(new Error("toc failed"));

        const plugin = createPluginWithPaths({
            docsRoot: "/test/docs",
            outputDir: "/test/.wsx-press",
        });

        await expect(
            plugin.buildStart?.call(
                {} as Parameters<NonNullable<Plugin["buildStart"]>>[0],
                {} as Parameters<NonNullable<Plugin["buildStart"]>>[1]
            )
        ).resolves.toBeUndefined();
    });

    it("buildStart 在 metadata 扫描失败时应抛出", async () => {
        const { scanDocsMetadata } = await import("../metadata");
        vi.mocked(scanDocsMetadata).mockRejectedValueOnce(new Error("scan failed"));

        const plugin = createPluginWithPaths({
            docsRoot: "/test/docs",
            outputDir: "/test/.wsx-press",
        });

        await expect(
            plugin.buildStart?.call(
                {} as Parameters<NonNullable<Plugin["buildStart"]>>[0],
                {} as Parameters<NonNullable<Plugin["buildStart"]>>[1]
            )
        ).rejects.toThrow("scan failed");
    });

    it("API 相对 outputDir 应解析为绝对路径", async () => {
        const plugin = createPluginWithPaths({
            docsRoot: "/test/docs",
            outputDir: "/test/.wsx-press",
            api: {
                entryPoints: ["/test/packages/core/src/index.ts"],
                tsconfig: "/test/tsconfig.json",
                outputDir: "docs/api",
            },
        });

        await plugin.buildStart?.call(
            {} as Parameters<NonNullable<Plugin["buildStart"]>>[0],
            {} as Parameters<NonNullable<Plugin["buildStart"]>>[1]
        );

        const { generateApiDocs } = await import("../typedoc");
        expect(generateApiDocs).toHaveBeenCalledWith(
            expect.objectContaining({
                outputDir: expect.stringContaining("docs/api"),
            })
        );
    });

    it("中间件应从磁盘提供 search-index.json", async () => {
        vol.fromJSON({
            "/test/.wsx-press/search-index.json": JSON.stringify({ documents: [] }),
        });

        const plugin = createPluginWithPaths({
            docsRoot: "/test/docs",
            outputDir: "/test/.wsx-press",
        });
        const handler = getMiddlewareHandler(plugin);
        const end = vi.fn();

        await handler(
            { url: "/search-index.json", headers: { host: "localhost" } },
            { setHeader: vi.fn(), end },
            vi.fn()
        );

        expect(end).toHaveBeenCalledWith(JSON.stringify({ documents: [] }));
    });

    it("API 未指定 outputDir 时应默认 docs/api", async () => {
        const plugin = createPluginWithPaths({
            docsRoot: "/test/docs",
            outputDir: "/test/.wsx-press",
            api: {
                entryPoints: ["/test/packages/core/src/index.ts"],
                tsconfig: "/test/tsconfig.json",
            },
        });

        await plugin.buildStart?.call(
            {} as Parameters<NonNullable<Plugin["buildStart"]>>[0],
            {} as Parameters<NonNullable<Plugin["buildStart"]>>[1]
        );

        const { generateApiDocs } = await import("../typedoc");
        expect(generateApiDocs).toHaveBeenCalledWith(
            expect.objectContaining({
                outputDir: "/test/docs/api",
            })
        );
    });

    it("中间件在缺少 req.url 时使用 /", async () => {
        const plugin = createPluginWithPaths({
            docsRoot: "/test/docs",
            outputDir: "/test/.wsx-press",
        });
        const handler = getMiddlewareHandler(plugin);
        const next = vi.fn();

        await handler(
            { headers: { host: "localhost" } },
            { setHeader: vi.fn(), end: vi.fn() },
            next
        );

        expect(next).toHaveBeenCalled();
    });

    it("中间件应从磁盘提供 docs-meta.json", async () => {
        vol.fromJSON({
            "/test/.wsx-press/docs-meta.json": JSON.stringify({ ok: true }),
        });

        const plugin = createPluginWithPaths({
            docsRoot: "/test/docs",
            outputDir: "/test/.wsx-press",
        });
        const handler = getMiddlewareHandler(plugin);

        const setHeader = vi.fn();
        const end = vi.fn();
        const next = vi.fn();

        await handler(
            { url: "/docs-meta.json", headers: { host: "localhost" } },
            { setHeader, end },
            next
        );

        expect(setHeader).toHaveBeenCalledWith("Content-Type", "application/json");
        expect(end).toHaveBeenCalledWith(JSON.stringify({ ok: true }));
        expect(next).not.toHaveBeenCalled();
    });

    it("中间件在子路径 base 下应解析 pathname 并再生 docs-meta", async () => {
        const plugin = createPluginWithPaths(
            {
                docsRoot: "/test/docs",
                outputDir: "/test/.wsx-press",
            },
            "/productivity/"
        );
        const handler = getMiddlewareHandler(plugin);

        const setHeader = vi.fn();
        const end = vi.fn();
        const next = vi.fn();

        await handler(
            {
                url: "/docs-meta.json",
                headers: { host: "localhost" },
            },
            { setHeader, end },
            next
        );

        expect(setHeader).toHaveBeenCalledWith("Content-Type", "application/json");
        expect(end).toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    it("中间件应再生 search-index.json 与 docs-toc.json", async () => {
        const plugin = createPluginWithPaths({
            docsRoot: "/test/docs",
            outputDir: "/test/.wsx-press",
        });
        const handler = getMiddlewareHandler(plugin);

        const searchEnd = vi.fn();
        await handler(
            { url: "/search-index.json", headers: { host: "localhost" } },
            { setHeader: vi.fn(), end: searchEnd },
            vi.fn()
        );
        expect(searchEnd).toHaveBeenCalled();

        const tocEnd = vi.fn();
        await handler(
            { url: "/docs-toc.json", headers: { host: "localhost" } },
            { setHeader: vi.fn(), end: tocEnd },
            vi.fn()
        );
        expect(tocEnd).toHaveBeenCalled();
    });

    it("中间件对未知文件应调用 next", async () => {
        const plugin = createPluginWithPaths({
            docsRoot: "/test/docs",
            outputDir: "/test/.wsx-press",
        });
        const handler = getMiddlewareHandler(plugin);
        const next = vi.fn();

        await handler(
            { url: "/unknown.json", headers: { host: "localhost" } },
            { setHeader: vi.fn(), end: vi.fn() },
            next
        );

        expect(next).toHaveBeenCalled();
    });

    it("中间件出错时应返回 500", async () => {
        const plugin = createPluginWithPaths({
            docsRoot: "/test/docs",
            outputDir: "/test/.wsx-press",
        });
        const handler = getMiddlewareHandler(plugin);

        const { scanDocsMetadata } = await import("../metadata");
        vi.mocked(scanDocsMetadata).mockRejectedValueOnce(new Error("boom"));

        const end = vi.fn();
        const res = { setHeader: vi.fn(), end, statusCode: 200 };

        await handler({ url: "/docs-meta.json", headers: { host: "localhost" } }, res, vi.fn());

        expect(res.statusCode).toBe(500);
        expect(end).toHaveBeenCalledWith(JSON.stringify({ error: "Error: boom" }));
    });
});
