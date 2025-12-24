/**
 * @wsxjs/wsx-press/node/plugin
 * Vite plugin for WSX-Press documentation system
 */

import type { Plugin } from "vite";
import path from "path";
import fs from "fs-extra";
import { createLogger } from "@wsxjs/wsx-logger";
import { scanDocsMetadata } from "./metadata";
import { generateSearchIndex } from "./search";
import { generateTOCCollection } from "./toc";
import { generateApiDocs, type TypeDocConfig } from "./typedoc";

const logger = createLogger("WSXPress");

/**
 * WSX-Press 插件配置
 */
export interface WSXPressOptions {
    /** 文档根目录 */
    docsRoot: string;
    /** API 文档配置（可选） */
    api?: TypeDocConfig;
    /** 输出目录（默认：.wsx-press） */
    outputDir?: string;
}

/**
 * WSX-Press Vite 插件
 *
 * @param options - 插件配置选项
 * @returns Vite 插件实例
 */
export function wsxPress(options: WSXPressOptions): Plugin {
    const { docsRoot, api, outputDir = ".wsx-press" } = options;

    let absoluteOutputDir: string;
    let absoluteDocsRoot: string;

    return {
        name: "vite-plugin-wsx-press",
        enforce: "pre",

        /**
         * Vite 配置解析后，解析绝对路径
         */
        configResolved(config) {
            // 在配置解析后解析绝对路径
            // 使用简单的字符串检查，避免构建时 path 模块的问题
            const isAbsolutePath = (p: string) => {
                // Unix/Linux/Mac 绝对路径以 / 开头
                // Windows 绝对路径以盘符开头（如 C:）或 \\ 开头
                return p.startsWith("/") || /^[A-Za-z]:/.test(p) || p.startsWith("\\\\");
            };

            absoluteOutputDir = isAbsolutePath(outputDir)
                ? outputDir
                : path.resolve(config.root, outputDir);

            absoluteDocsRoot = isAbsolutePath(docsRoot)
                ? docsRoot
                : path.resolve(config.root, docsRoot);
        },

        /**
         * 构建开始时生成元数据和搜索索引
         */
        async buildStart() {
            try {
                // 如果路径还未解析（configResolved 未调用），使用默认值
                if (!absoluteOutputDir || !absoluteDocsRoot) {
                    const isAbsolutePath = (p: string) => {
                        return p.startsWith("/") || /^[A-Za-z]:/.test(p) || p.startsWith("\\\\");
                    };

                    absoluteOutputDir = isAbsolutePath(outputDir)
                        ? outputDir
                        : path.resolve(process.cwd(), outputDir);

                    absoluteDocsRoot = isAbsolutePath(docsRoot)
                        ? docsRoot
                        : path.resolve(process.cwd(), docsRoot);
                }

                // 确保输出目录存在
                await fs.ensureDir(absoluteOutputDir);

                logger.info("Starting documentation generation...");
                logger.info(`Docs root: ${absoluteDocsRoot}`);
                logger.info(`Output dir: ${absoluteOutputDir}`);

                // 扫描文档元数据
                const metadata = await scanDocsMetadata(absoluteDocsRoot);
                const metadataPath = path.join(absoluteOutputDir, "docs-meta.json");
                await fs.writeJSON(metadataPath, metadata, { spaces: 2 });
                logger.info(
                    `✅ Generated docs-meta.json with ${Object.keys(metadata).length} documents`
                );

                // 生成搜索索引
                const searchIndex = await generateSearchIndex(metadata, absoluteDocsRoot);
                const searchIndexPath = path.join(absoluteOutputDir, "search-index.json");
                await fs.writeJSON(searchIndexPath, searchIndex, { spaces: 2 });
                logger.info("✅ Generated search-index.json");

                // 生成 TOC 数据
                logger.info("Generating TOC collection...");
                try {
                    const tocCollection = await generateTOCCollection(metadata, absoluteDocsRoot);
                    const tocPath = path.join(absoluteOutputDir, "docs-toc.json");
                    await fs.writeJSON(tocPath, tocCollection, { spaces: 2 });
                    logger.info(
                        `✅ Generated docs-toc.json with ${Object.keys(tocCollection).length} documents`
                    );
                } catch (tocError) {
                    logger.error("❌ Failed to generate TOC collection:", tocError);
                    // 不抛出错误，继续构建流程
                }

                // 如果配置了 API 文档，生成 API 文档
                if (api) {
                    const apiOutputDir = api.outputDir || path.join(absoluteDocsRoot, "api");
                    await generateApiDocs({
                        ...api,
                        outputDir: path.isAbsolute(apiOutputDir)
                            ? apiOutputDir
                            : path.resolve(process.cwd(), apiOutputDir),
                    });
                }
            } catch (error) {
                logger.error("Failed to generate documentation:", error);
                throw error;
            }
        },

        /**
         * 配置开发服务器
         * 在开发模式下通过 /.wsx-press 路径提供元数据和搜索索引
         */
        configureServer(server) {
            // 添加中间件，在开发模式下提供元数据和搜索索引
            server.middlewares.use("/.wsx-press", async (req, res, next) => {
                try {
                    const url = new URL(req.url || "/", `http://${req.headers.host}`);
                    // 当中间件挂载在 /.wsx-press 下时，url.pathname 会是 /.wsx-press/docs-meta.json
                    // 需要提取文件名部分（移除 /.wsx-press 前缀）
                    const fullPath = url.pathname;
                    // 移除 /.wsx-press 前缀，处理有/无尾部斜杠的情况
                    const fileName = fullPath.replace(/^\/\.wsx-press\/?/, "").replace(/^\//, "");

                    // 检查是否是支持的文件
                    if (
                        fileName === "docs-meta.json" ||
                        fileName === "search-index.json" ||
                        fileName === "docs-toc.json"
                    ) {
                        const file = path.join(absoluteOutputDir, fileName);
                        if (await fs.pathExists(file)) {
                            const content = await fs.readFile(file, "utf-8");
                            res.setHeader("Content-Type", "application/json");
                            res.end(content);
                            return;
                        }
                    }

                    // 如果文件不存在，尝试重新生成
                    if (fileName === "docs-meta.json") {
                        const metadata = await scanDocsMetadata(absoluteDocsRoot);
                        await fs.ensureDir(absoluteOutputDir);
                        await fs.writeJSON(
                            path.join(absoluteOutputDir, "docs-meta.json"),
                            metadata,
                            {
                                spaces: 2,
                            }
                        );
                        res.setHeader("Content-Type", "application/json");
                        res.end(JSON.stringify(metadata, null, 2));
                        return;
                    }

                    if (fileName === "search-index.json") {
                        const metadata = await scanDocsMetadata(absoluteDocsRoot);
                        const searchIndex = await generateSearchIndex(metadata, absoluteDocsRoot);
                        await fs.ensureDir(absoluteOutputDir);
                        await fs.writeJSON(
                            path.join(absoluteOutputDir, "search-index.json"),
                            searchIndex,
                            { spaces: 2 }
                        );
                        res.setHeader("Content-Type", "application/json");
                        res.end(JSON.stringify(searchIndex, null, 2));
                        return;
                    }

                    if (fileName === "docs-toc.json") {
                        const metadata = await scanDocsMetadata(absoluteDocsRoot);
                        const tocCollection = await generateTOCCollection(
                            metadata,
                            absoluteDocsRoot
                        );
                        await fs.ensureDir(absoluteOutputDir);
                        await fs.writeJSON(
                            path.join(absoluteOutputDir, "docs-toc.json"),
                            tocCollection,
                            { spaces: 2 }
                        );
                        res.setHeader("Content-Type", "application/json");
                        res.end(JSON.stringify(tocCollection, null, 2));
                        return;
                    }

                    next();
                } catch (error) {
                    logger.error("Middleware error:", error);
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: String(error) }));
                }
            });
        },
    };
}
