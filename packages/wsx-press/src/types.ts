/**
 * Type definitions for @wsxjs/wsx-press
 * Zero any types - all types are explicitly defined
 */

/**
 * 文档元数据
 */
export interface DocMetadata {
    /** 文档标题 */
    title: string;
    /** 文档类别 */
    category: string;
    /** 文档路由 */
    route: string;
    /** 上一篇文档路由 */
    prev?: string | null;
    /** 下一篇文档路由 */
    next?: string | null;
    /** 文档描述 */
    description?: string;
    /** 标签 */
    tags?: string[];
    /** 扩展字段 */
    [key: string]: unknown;
}

/**
 * 文档元数据集合
 */
export type DocsMetaCollection = Record<string, DocMetadata>;

/**
 * 搜索文档
 */
export interface SearchDocument {
    /** 文档唯一ID */
    id: string;
    /** 文档标题 */
    title: string;
    /** 文档类别 */
    category: string;
    /** 文档路由 */
    route: string;
    /** 文档内容片段（用于搜索） */
    content: string;
}

/**
 * 搜索结果
 */
export interface SearchResult {
    /** 匹配的文档 */
    item: SearchDocument;
    /** 匹配分数 */
    score?: number;
    /** 匹配位置 */
    matches?: Array<{
        indices: [number, number][];
        value: string;
        key: string;
    }>;
}

/**
 * 搜索索引配置
 */
export interface SearchIndexOptions {
    /** 搜索字段配置 */
    keys: Array<{ name: string; weight: number }>;
    /** 匹配阈值 */
    threshold: number;
    /** 是否包含分数 */
    includeScore: boolean;
    /** 是否包含匹配位置 */
    includeMatches?: boolean;
}

/**
 * 搜索索引
 */
export interface SearchIndex {
    /** 所有文档 */
    documents: SearchDocument[];
    /** Fuse.js 配置 */
    options: SearchIndexOptions;
}

/**
 * 路由参数
 */
export interface RouteParams {
    /** 文档类别 */
    category: string;
    /** 文档页面 */
    page: string;
}

/**
 * API 路由参数
 */
export interface ApiRouteParams {
    /** API 模块 */
    module: string;
    /** API 项目 */
    item: string;
}

/**
 * 加载状态
 */
export type LoadingState = "idle" | "loading" | "success" | "error";

/**
 * 文档加载错误代码
 */
export type DocumentLoadErrorCode = "NOT_FOUND" | "NETWORK_ERROR" | "PARSE_ERROR" | "INVALID_PARAMS";

/**
 * 文档加载错误
 */
export class DocumentLoadError extends Error {
    public readonly code: DocumentLoadErrorCode;
    public readonly details?: unknown;

    constructor(message: string, code: DocumentLoadErrorCode, details?: unknown) {
        super(message);
        this.name = "DocumentLoadError";
        this.code = code;
        this.details = details;
    }
}

/**
 * TOC 项接口（从 node/toc.ts 导出，供客户端使用）
 */
export interface TOCItem {
    /** 标题级别 (1-6) */
    level: number;
    /** 标题文本 */
    text: string;
    /** 锚点 ID */
    id: string;
    /** 子项 */
    children: TOCItem[];
}
