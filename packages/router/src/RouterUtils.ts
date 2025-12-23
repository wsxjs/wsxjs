import { createLogger } from "@wsxjs/wsx-core";

const logger = createLogger("RouterUtils");

/**
 * 路由信息接口
 */
export interface RouteInfo {
    path: string;
    params: Record<string, string>;
    query: Record<string, string>;
    hash: string;
    meta?: Record<string, string | number | boolean>;
}

/**
 * 路由匹配结果
 */
export interface RouteMatch {
    route: string;
    params: Record<string, string>;
    exact: boolean;
}

/**
 * 路由工具类 - 提供路由相关的辅助函数
 */
export class RouterUtils {
    /**
     * 编程式导航
     */
    static navigate(path: string, replace = false): void {
        if (replace) {
            window.history.replaceState(null, "", path);
        } else {
            window.history.pushState(null, "", path);
        }

        // 触发路由变化事件
        window.dispatchEvent(new PopStateEvent("popstate"));
        logger.debug(`Navigated to: ${path} (replace: ${replace})`);
    }

    /**
     * 获取当前路由信息
     */
    static getCurrentRoute(): RouteInfo {
        const url = new URL(window.location.href);
        return {
            path: url.pathname,
            params: {}, // 需要路由匹配后才能确定
            query: Object.fromEntries(url.searchParams.entries()),
            hash: url.hash.slice(1), // 移除 # 号
        };
    }

    /**
     * 解析路由路径，提取参数
     */
    static parseRoute(route: string, path: string): RouteMatch | null {
        // 精确匹配
        if (route === path) {
            return {
                route,
                params: {},
                exact: true,
            };
        }

        // 通配符匹配
        if (route === "*") {
            return {
                route,
                params: {},
                exact: false,
            };
        }

        // 参数匹配
        if (route.includes(":")) {
            const paramNames = route.match(/:([^/]+)/g)?.map((p) => p.slice(1)) || [];
            const pattern = route.replace(/:[^/]+/g, "([^/]+)");
            const regex = new RegExp(`^${pattern}$`);
            const matches = path.match(regex);

            if (matches && paramNames.length > 0) {
                const params: Record<string, string> = {};
                paramNames.forEach((name, index) => {
                    params[name] = matches[index + 1];
                });

                return {
                    route,
                    params,
                    exact: true,
                };
            }
        }

        // 前缀匹配（用于嵌套路由）
        if (route.endsWith("/*")) {
            const prefix = route.slice(0, -2);
            if (path.startsWith(prefix)) {
                return {
                    route,
                    params: {},
                    exact: false,
                };
            }
        }

        return null;
    }

    /**
     * 构建路由路径，替换参数
     */
    static buildPath(route: string, params: Record<string, string> = {}): string {
        let path = route;

        // 替换路径参数
        Object.entries(params).forEach(([key, value]) => {
            path = path.replace(`:${key}`, encodeURIComponent(value));
        });

        return path;
    }

    /**
     * 检查路由是否匹配当前路径
     */
    static isRouteActive(route: string, exact = false): boolean {
        const currentPath = window.location.pathname;

        if (exact) {
            return currentPath === route;
        }

        // 对于根路径，需要精确匹配
        if (route === "/") {
            return currentPath === "/";
        }

        return currentPath.startsWith(route);
    }

    /**
     * 获取路由层级
     */
    static getRouteDepth(path: string): number {
        return path.split("/").filter((segment) => segment.length > 0).length;
    }

    /**
     * 获取父级路由
     */
    static getParentRoute(path: string): string {
        const segments = path.split("/").filter((segment) => segment.length > 0);
        if (segments.length <= 1) {
            return "/";
        }
        segments.pop();
        return "/" + segments.join("/");
    }

    /**
     * 合并路由路径
     */
    static joinPaths(...paths: string[]): string {
        return paths
            .map((path) => path.replace(/^\/+|\/+$/g, "")) // 移除首尾斜杠
            .filter((path) => path.length > 0)
            .join("/")
            .replace(/^/, "/"); // 添加开头斜杠
    }

    /**
     * 检查是否为外部链接
     */
    static isExternalUrl(url: string): boolean {
        return /^https?:\/\//.test(url) || /^mailto:/.test(url) || /^tel:/.test(url);
    }

    /**
     * 获取查询参数
     */
    static getQueryParam(key: string): string | null {
        const url = new URL(window.location.href);
        return url.searchParams.get(key);
    }

    /**
     * 设置查询参数
     */
    static setQueryParam(key: string, value: string, replace = false): void {
        const url = new URL(window.location.href);
        url.searchParams.set(key, value);

        const newUrl = url.pathname + url.search + url.hash;
        this.navigate(newUrl, replace);
    }

    /**
     * 删除查询参数
     */
    static removeQueryParam(key: string, replace = false): void {
        const url = new URL(window.location.href);
        url.searchParams.delete(key);

        const newUrl = url.pathname + url.search + url.hash;
        this.navigate(newUrl, replace);
    }

    /**
     * 返回上一页
     */
    static goBack(): void {
        window.history.back();
    }

    /**
     * 前进一页
     */
    static goForward(): void {
        window.history.forward();
    }

    /**
     * 替换当前页面
     */
    static replace(path: string): void {
        this.navigate(path, true);
    }

    /**
     * 获取历史记录长度
     */
    static getHistoryLength(): number {
        return window.history.length;
    }

    /**
     * 监听路由变化
     */
    static onRouteChange(callback: (route: RouteInfo) => void): () => void {
        const handler = () => {
            const route = this.getCurrentRoute();
            callback(route);
        };

        window.addEventListener("popstate", handler);
        document.addEventListener("route-changed", handler);

        // 返回清理函数
        return () => {
            window.removeEventListener("popstate", handler);
            document.removeEventListener("route-changed", handler);
        };
    }
}
