/** wsx-press 静态资源目录名（相对站点 base） */
export const PRESS_ASSET_DIR = ".wsx-press";

/**
 * 规范化 Vite base：保证以 `/` 开头、以 `/` 结尾（根路径为 `/`）。
 */
export function normalizeSiteBase(base: string): string {
    if (!base || base === "/") {
        return "/";
    }

    const withLeading = base.startsWith("/") ? base : `/${base}`;
    return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

/** dev middleware / 静态资源挂载路径，如 `/.wsx-press` 或 `/productivity/.wsx-press` */
export function pressAssetMountPath(base: string): string {
    const siteBase = normalizeSiteBase(base);

    if (siteBase === "/") {
        return `/${PRESS_ASSET_DIR}`;
    }

    return `${siteBase.slice(0, -1)}/${PRESS_ASSET_DIR}`;
}

/** 从请求 pathname 提取 `.wsx-press/` 下的文件名；无法识别时返回 null */
export function extractPressAssetFileName(pathname: string): string | null {
    const marker = `/${PRESS_ASSET_DIR}/`;
    const markerIndex = pathname.indexOf(marker);

    if (markerIndex >= 0) {
        const fileName = pathname.slice(markerIndex + marker.length).replace(/^\//, "");
        return fileName || null;
    }

    const legacyMatch = pathname.match(/^\/\.wsx-press\/?(.*)$/);
    if (legacyMatch) {
        const fileName = legacyMatch[1].replace(/^\//, "");
        return fileName || null;
    }

    return null;
}
