/**
 * @wsxjs/wsx-logger
 * Browser-optimized logging utility for WSXJS
 *
 * Pure native browser implementation - zero dependencies
 * Uses native console API for maximum compatibility and minimal bundle size
 */

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
 * Log level hierarchy (numeric values for comparison)
 */
const LOG_LEVEL_VALUES: Record<LogLevel, number> = {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
    silent: 5,
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
 * Format log message with prefix
 */
function formatMessage(name: string, message: string): string {
    return name ? `[${name}] ${message}` : message;
}

/**
 * Native browser logger implementation using console API
 * Zero dependencies, perfect browser compatibility
 */
class NativeLogger {
    private name: string;
    private level: LogLevel;
    private levelValue: number;
    private isProd: boolean;

    constructor(name: string, level: LogLevel) {
        this.name = name;
        this.level = level;
        this.levelValue = LOG_LEVEL_VALUES[level];
        this.isProd = isProduction();
    }

    /**
     * Check if a log level should be logged
     */
    private shouldLog(level: LogLevel): boolean {
        if (this.level === "silent") {
            return false;
        }
        return LOG_LEVEL_VALUES[level] >= this.levelValue;
    }

    trace(message: string, ...args: unknown[]): void {
        // Trace is only shown in non-production or if explicitly enabled
        if (!this.isProd || this.shouldLog("trace")) {
            const formattedMessage = formatMessage(this.name, message);
            // Use console.debug for trace (browsers don't have console.trace as a log method)
            if (args.length > 0) {
                console.debug(formattedMessage, ...args);
            } else {
                console.debug(formattedMessage);
            }
        }
    }

    debug(message: string, ...args: unknown[]): void {
        // Always show debug logs in non-production environments
        if (!this.isProd || this.shouldLog("debug")) {
            const formattedMessage = formatMessage(this.name, message);
            if (args.length > 0) {
                console.debug(formattedMessage, ...args);
            } else {
                console.debug(formattedMessage);
            }
        }
    }

    info(message: string, ...args: unknown[]): void {
        if (this.shouldLog("info")) {
            const formattedMessage = formatMessage(this.name, message);
            if (args.length > 0) {
                console.info(formattedMessage, ...args);
            } else {
                console.info(formattedMessage);
            }
        }
    }

    warn(message: string, ...args: unknown[]): void {
        // Always show warnings (in both production and development)
        if (this.shouldLog("warn")) {
            const formattedMessage = formatMessage(this.name, message);
            if (args.length > 0) {
                console.warn(formattedMessage, ...args);
            } else {
                console.warn(formattedMessage);
            }
        }
    }

    error(message: string, ...args: unknown[]): void {
        // Always show errors (in both production and development)
        if (this.shouldLog("error")) {
            const formattedMessage = formatMessage(this.name, message);
            if (args.length > 0) {
                console.error(formattedMessage, ...args);
            } else {
                console.error(formattedMessage);
            }
        }
    }

    /**
     * Set the log level dynamically
     */
    setLevel(level: LogLevel): void {
        this.level = level;
        this.levelValue = LOG_LEVEL_VALUES[level];
    }

    /**
     * Get the current log level
     */
    getLevel(): LogLevel {
        return this.level;
    }
}

/**
 * WSX Logger wrapper that implements the Logger interface
 * Uses native browser console API - zero dependencies
 */
export class WSXLogger implements Logger {
    private nativeLogger: NativeLogger;
    private name: string;
    private currentLevel: LogLevel;

    constructor(config: LoggerConfig = {}) {
        this.name = config.name || DEFAULT_CONFIG.name || "WSX";
        this.currentLevel =
            config.level || DEFAULT_CONFIG.level || (isProduction() ? "info" : "debug");
        this.nativeLogger = new NativeLogger(this.name, this.currentLevel);
    }

    debug(message: string, ...args: unknown[]): void {
        this.nativeLogger.debug(message, ...args);
    }

    info(message: string, ...args: unknown[]): void {
        this.nativeLogger.info(message, ...args);
    }

    warn(message: string, ...args: unknown[]): void {
        this.nativeLogger.warn(message, ...args);
    }

    error(message: string, ...args: unknown[]): void {
        this.nativeLogger.error(message, ...args);
    }

    fatal(message: string, ...args: unknown[]): void {
        // Fatal is treated as error with [FATAL] prefix
        const formattedMessage = formatMessage(this.name, `[FATAL] ${message}`);
        if (args.length > 0) {
            console.error(formattedMessage, ...args);
        } else {
            console.error(formattedMessage);
        }
    }

    trace(message: string, ...args: unknown[]): void {
        this.nativeLogger.trace(message, ...args);
    }

    /**
     * Set the log level dynamically
     */
    setLevel(level: LogLevel): void {
        this.currentLevel = level;
        this.nativeLogger.setLevel(level);
    }

    /**
     * Get the current log level
     */
    getLevel(): LogLevel {
        return this.nativeLogger.getLevel();
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
