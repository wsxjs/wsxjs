/**
 * Error Handler - 全局错误处理工具
 *
 * 功能：
 * - 捕获全局错误
 * - 捕获未处理的 Promise 拒绝
 * - 记录错误信息
 * - 显示用户友好的错误消息
 */

interface ErrorInfo {
    message: string;
    stack?: string;
    url?: string;
    line?: number;
    column?: number;
    timestamp: number;
    userAgent: string;
}

export class ErrorHandler {
    private static errorCount = 0;
    private static readonly MAX_ERRORS = 10; // 防止错误日志过多

    /**
     * 初始化错误处理
     */
    static init(): void {
        // 捕获全局 JavaScript 错误
        window.addEventListener("error", this.handleError.bind(this));

        // 捕获未处理的 Promise 拒绝
        window.addEventListener("unhandledrejection", this.handleUnhandledRejection.bind(this));
    }

    /**
     * 处理 JavaScript 错误
     */
    private static handleError(event: ErrorEvent): void {
        this.errorCount++;

        if (this.errorCount > this.MAX_ERRORS) {
            console.warn("Too many errors, stopping error logging");
            return;
        }

        const errorInfo: ErrorInfo = {
            message: event.message || "Unknown error",
            stack: event.error?.stack,
            url: event.filename,
            line: event.lineno,
            column: event.colno,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
        };

        // 记录错误（开发环境）
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((import.meta as any).env?.DEV) {
            console.error("Global error:", errorInfo);
        }

        // 在生产环境中，可以发送错误到错误追踪服务
        // this.reportError(errorInfo);

        // 显示用户友好的错误消息（可选）
        // this.showUserFriendlyError(event.error);
    }

    /**
     * 处理未处理的 Promise 拒绝
     */
    private static handleUnhandledRejection(event: PromiseRejectionEvent): void {
        this.errorCount++;

        if (this.errorCount > this.MAX_ERRORS) {
            console.warn("Too many errors, stopping error logging");
            return;
        }

        const error = event.reason;
        const errorInfo: ErrorInfo = {
            message: error?.message || "Unhandled promise rejection",
            stack: error?.stack,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
        };

        // 记录错误（开发环境）
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((import.meta as any).env?.DEV) {
            console.error("Unhandled promise rejection:", errorInfo);
        }

        // 在生产环境中，可以发送错误到错误追踪服务
        // this.reportError(errorInfo);
    }

    /**
     * 报告错误到错误追踪服务（如 Sentry、LogRocket 等）
     * 这是一个示例实现，实际使用时需要集成具体的错误追踪服务
     * @internal 预留方法，将来可能使用
     */
    // @ts-expect-error - 预留方法，将来可能使用
    private static reportError(_errorInfo: ErrorInfo): void {
        // 示例：发送到错误追踪服务
        // if ((import.meta as any).env?.PROD) {
        //     fetch("/api/errors", {
        //         method: "POST",
        //         headers: { "Content-Type": "application/json" },
        //         body: JSON.stringify(_errorInfo),
        //     }).catch(() => {
        //         // 静默失败，避免错误追踪本身导致错误
        //     });
        // }
    }

    /**
     * 显示用户友好的错误消息（可选）
     * @internal 预留方法，将来可能使用
     */
    // @ts-expect-error - 预留方法，将来可能使用
    private static showUserFriendlyError(_error: Error): void {
        // 只在严重错误时显示
        // 可以创建一个错误提示组件
        // 这里只是示例，实际实现可以根据需要调整
    }
}
