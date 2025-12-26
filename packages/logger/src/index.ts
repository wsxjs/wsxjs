/**
 * @wsxjs/wsx-logger
 * Browser-optimized logging utility for WSXJS
 */

import log from "loglevel";

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "silent";

/**
 * Logger interface compatible with WSXJS core logger
 */
export interface Logger {
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
    fatal?(message: string, ...args: unknown[]): void;
    trace?(message: string, ...args: unknown[]): void;
}

/**
 * Logger configuration options
 */
export interface LoggerConfig {
    /** Logger name/prefix */
    name?: string;
    /** Minimum log level */
    level?: LogLevel;
    /** Enable pretty printing (for development) - kept for API compatibility */
    pretty?: boolean;
}

/**
 * Map WSXJS log levels to loglevel string levels
 */
const LOG_LEVEL_MAP: Record<LogLevel, log.LogLevelDesc> = {
    trace: "trace",
    debug: "debug",
    info: "info",
    warn: "warn",
    error: "error",
    silent: "silent",
};

/**
 * Map loglevel numeric levels to WSXJS log levels
 */
const NUMERIC_TO_LEVEL: Record<number, LogLevel> = {
    0: "trace",
    1: "debug",
    2: "info",
    3: "warn",
    4: "error",
    5: "silent",
};

/**
 * Check if we're in production environment
 */
function isProduction(): boolean {
    if (typeof process !== "undefined") {
        return process.env.NODE_ENV === "production" || process.env.MODE === "production";
    }
    // Check Vite's import.meta.env in browser (if available)
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const meta = globalThis as any;
        if (meta.import?.meta?.env) {
            const viteEnv = meta.import.meta.env;
            return viteEnv.MODE === "production" || viteEnv.PROD === true;
        }
    } catch {
        // Ignore errors
    }
    return false;
}

/**
 * Default logger configuration
 * - Production: info level
 * - Development: debug level
 */
const DEFAULT_CONFIG: LoggerConfig = {
    name: "WSX",
    level: isProduction() ? "info" : "debug",
    pretty: !isProduction(),
};

/**
 * Create a loglevel logger instance with prefix support
 */
function createLoglevelLogger(config: LoggerConfig = {}): log.Logger {
    const { name, level } = { ...DEFAULT_CONFIG, ...config };

    // Create a new logger instance for this component
    const loggerName = name || DEFAULT_CONFIG.name || "WSX";
    const loggerInstance = log.getLogger(loggerName);

    // Set the log level
    const targetLevel = level || DEFAULT_CONFIG.level || "info";
    loggerInstance.setLevel(LOG_LEVEL_MAP[targetLevel]);

    return loggerInstance;
}

/**
 * Format log message with prefix
 */
function formatMessage(name: string, message: string): string {
    return name ? `[${name}] ${message}` : message;
}

/**
 * WSX Logger wrapper that implements the Logger interface
 * and uses loglevel under the hood
 */
export class WSXLogger implements Logger {
    private logInstance: log.Logger;
    private name: string;
    private isProd: boolean;
    private currentLevel: LogLevel;

    constructor(config: LoggerConfig = {}) {
        this.isProd = isProduction();
        this.name = config.name || DEFAULT_CONFIG.name || "WSX";
        this.currentLevel =
            config.level || DEFAULT_CONFIG.level || (this.isProd ? "info" : "debug");
        this.logInstance = createLoglevelLogger(config);
    }

    debug(message: string, ...args: unknown[]): void {
        // Always show debug logs in non-production environments
        if (!this.isProd || this.shouldLog("debug")) {
            const formattedMessage = formatMessage(this.name, message);
            if (args.length > 0) {
                this.logInstance.debug(formattedMessage, ...args);
            } else {
                this.logInstance.debug(formattedMessage);
            }
        }
    }

    info(message: string, ...args: unknown[]): void {
        if (this.shouldLog("info")) {
            const formattedMessage = formatMessage(this.name, message);
            if (args.length > 0) {
                this.logInstance.info(formattedMessage, ...args);
            } else {
                this.logInstance.info(formattedMessage);
            }
        }
    }

    warn(message: string, ...args: unknown[]): void {
        // Always show warnings (in both production and development)
        const formattedMessage = formatMessage(this.name, message);
        if (args.length > 0) {
            this.logInstance.warn(formattedMessage, ...args);
        } else {
            this.logInstance.warn(formattedMessage);
        }
    }

    error(message: string, ...args: unknown[]): void {
        // Always show errors (in both production and development)
        const formattedMessage = formatMessage(this.name, message);
        if (args.length > 0) {
            this.logInstance.error(formattedMessage, ...args);
        } else {
            this.logInstance.error(formattedMessage);
        }
    }

    fatal(message: string, ...args: unknown[]): void {
        // Fatal is treated as error in loglevel
        const formattedMessage = formatMessage(this.name, message);
        if (args.length > 0) {
            this.logInstance.error(`[FATAL] ${formattedMessage}`, ...args);
        } else {
            this.logInstance.error(`[FATAL] ${formattedMessage}`);
        }
    }

    trace(message: string, ...args: unknown[]): void {
        // Always show trace logs in non-production environments
        if (!this.isProd || this.shouldLog("trace")) {
            const formattedMessage = formatMessage(this.name, message);
            if (args.length > 0) {
                this.logInstance.trace(formattedMessage, ...args);
            } else {
                this.logInstance.trace(formattedMessage);
            }
        }
    }

    /**
     * Check if a log level should be logged based on current level
     */
    private shouldLog(level: LogLevel): boolean {
        const levels: LogLevel[] = ["trace", "debug", "info", "warn", "error", "silent"];
        const currentLevelIndex = levels.indexOf(this.currentLevel);
        const messageLevelIndex = levels.indexOf(level);

        return messageLevelIndex >= currentLevelIndex;
    }

    /**
     * Get the underlying loglevel logger instance
     */
    getLoglevelLogger(): log.Logger {
        return this.logInstance;
    }

    /**
     * Set the log level dynamically
     */
    setLevel(level: LogLevel): void {
        this.currentLevel = level;
        this.logInstance.setLevel(LOG_LEVEL_MAP[level] as log.LogLevelDesc);
    }

    /**
     * Get the current log level
     */
    getLevel(): LogLevel {
        const numericLevel = this.logInstance.getLevel();
        return NUMERIC_TO_LEVEL[numericLevel] || this.currentLevel;
    }
}

/**
 * Default logger instance
 */
export const logger = new WSXLogger();

/**
 * Create a component-specific logger
 *
 * @param componentName - Name of the component/module
 * @param config - Optional logger configuration
 * @returns Logger instance
 */
export function createLogger(componentName: string, config: LoggerConfig = {}): Logger {
    return new WSXLogger({
        ...config,
        name: config.name || `WSX:${componentName}`,
    });
}

/**
 * Create a logger with custom configuration
 *
 * @param config - Logger configuration
 * @returns Logger instance
 */
export function createLoggerWithConfig(config: LoggerConfig): Logger {
    return new WSXLogger(config);
}

// Export loglevel types for advanced usage
export type { Logger as LoglevelLogger } from "loglevel";
export { log as loglevel } from "loglevel";
