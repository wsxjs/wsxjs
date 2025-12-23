/**
 * WSXJS Logger
 *
 * A lightweight logging utility for the WSXJS.
 * Can be extended or replaced by consuming applications.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
}

export class WSXLogger implements Logger {
    private prefix: string;
    private enabled: boolean;
    private level: LogLevel;

    constructor(prefix: string = "[WSX]", enabled: boolean = true, level: LogLevel = "info") {
        this.prefix = prefix;
        this.enabled = enabled;
        this.level = level;
    }

    private shouldLog(level: LogLevel): boolean {
        if (!this.enabled) return false;

        const levels: LogLevel[] = ["debug", "info", "warn", "error"];
        const currentLevelIndex = levels.indexOf(this.level);
        const messageLevelIndex = levels.indexOf(level);

        return messageLevelIndex >= currentLevelIndex;
    }

    debug(message: string, ...args: unknown[]): void {
        if (this.shouldLog("debug")) {
            console.debug(`${this.prefix} ${message}`, ...args);
        }
    }

    info(message: string, ...args: unknown[]): void {
        if (this.shouldLog("info")) {
            console.info(`${this.prefix} ${message}`, ...args);
        }
    }

    warn(message: string, ...args: unknown[]): void {
        if (this.shouldLog("warn")) {
            console.warn(`${this.prefix} ${message}`, ...args);
        }
    }

    error(message: string, ...args: unknown[]): void {
        if (this.shouldLog("error")) {
            console.error(`${this.prefix} ${message}`, ...args);
        }
    }
}

// Default logger instance
export const logger = new WSXLogger();

// Factory function for creating component-specific loggers
export function createLogger(componentName: string): Logger {
    return new WSXLogger(`[WSX:${componentName}]`);
}
