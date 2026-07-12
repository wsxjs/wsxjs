import {
    PRESS_ASSET_DIR,
    extractPressAssetFileName,
    normalizeSiteBase,
    pressAssetMountPath,
} from "../shared/site-base";

/** 应用内文档路由前缀（不含站点 base） */
export const DOCS_ROUTE_PREFIX = "/docs";

/** 显式配置的站点 base；null 表示默认 `/` */
let configuredBase: string | null = null;

export { PRESS_ASSET_DIR, extractPressAssetFileName, normalizeSiteBase, pressAssetMountPath };

/**
 * 配置 wsx-press 使用的站点 base（如 `/` 或 `/productivity/`）。
 * 应在应用入口尽早调用，通常传入 `import.meta.env.BASE_URL`。
 */
export function configurePressBase(base: string): void {
    configuredBase = normalizeSiteBase(base);
}

/** 测试或热切换时重置为默认根路径 */
export function resetPressBase(): void {
    configuredBase = null;
}

/** 当前生效的站点 base，默认 `/` */
export function getPressBase(): string {
    if (configuredBase !== null) {
        return configuredBase;
    }
    return "/";
}

/** 非根 base 的无尾 slash 前缀（如 `/productivity`）；根 base 为 `""` */
function getPressBasePrefix(): string {
    const base = getPressBase();
    return base === "/" ? "" : base.slice(0, -1);
}

/**
 * 将应用内路由转为带 base 的 History API 路径。
 * @example pressSitePath("/docs/guide") → "/productivity/docs/guide"
 */
export function pressSitePath(route: string): string {
    const prefix = getPressBasePrefix();

    if (route === "/" || route === "") {
        return prefix ? `${prefix}/` : "/";
    }

    const segment = route.startsWith("/") ? route : `/${route}`;
    return `${prefix}${segment}`;
}

/** wsx-press 生成的 JSON 等静态资源 URL */
export function pressAsset(relativePath: string): string {
    const trimmed = relativePath.replace(/^\//, "");
    const assetPath = trimmed.startsWith(`${PRESS_ASSET_DIR}/`)
        ? trimmed
        : `${PRESS_ASSET_DIR}/${trimmed}`;
    return pressSitePath(`/${assetPath}`);
}

/** 文档 markdown 文件 URL */
export function pressDocMarkdownUrl(docPath: string): string {
    return pressSitePath(`${DOCS_ROUTE_PREFIX}/${docPath}.md`);
}

/**
 * 从浏览器 pathname 剥离 base，得到应用内路由。
 */
export function stripPressBase(pathname: string): string {
    const prefix = getPressBasePrefix();

    if (!prefix) {
        return pathname || "/";
    }

    if (pathname === prefix || pathname === `${prefix}/`) {
        return "/";
    }

    if (pathname.startsWith(`${prefix}/`)) {
        return pathname.slice(prefix.length);
    }

    return pathname;
}

/** 从 pathname 提取文档相对路径；非文档页返回 null */
export function getDocsRelativePath(pathname: string): string | null {
    const normalized = stripPressBase(pathname);
    const prefix = `${DOCS_ROUTE_PREFIX}/`;

    if (!normalized.startsWith(prefix)) {
        return null;
    }

    const docPath = normalized.slice(prefix.length);
    return docPath || null;
}
