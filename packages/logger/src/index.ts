/**
 * @wsxjs/wsx-logger
 * Pino-based logging utility for WSXJS
 */

import pino, { type LoggerOptions } from "pino";
import type { Logger as PinoLoggerType } from "pino";

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal" | "trace";

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
    /** Enable pretty printing (for development) */
    pretty?: boolean;
    /** Additional pino options */
    pinoOptions?: LoggerOptions;
}

/**
 * Check if we're in production environment
 */
function isProduction(): boolean {
    return typeof process !== "undefined" && process.env.NODE_ENV === "production";
}

/**
 * Check if we're in a Node.js environment
 */
function isNodeEnvironment(): boolean {
    return typeof process !== "undefined" && process.versions?.node !== undefined;
}

/**
 * Default logger configuration
 * - Production: info level, no pretty printing
 * - Development: debug level, pretty printing enabled
 */
const DEFAULT_CONFIG: LoggerConfig = {
    name: "WSX",
    level: isProduction() ? "info" : "debug",
    pretty: !isProduction(),
};

/**
 * Create a pino logger instance
 */
function createPinoLogger(config: LoggerConfig = {}): PinoLoggerType {
    const { name, level, pretty, pinoOptions } = { ...DEFAULT_CONFIG, ...config };

    const options: LoggerOptions = {
        name: name || DEFAULT_CONFIG.name,
        level: level || DEFAULT_CONFIG.level,
        ...pinoOptions,
    };

    // In development and Node.js environment, use pino-pretty for better readability
    if (pretty && isNodeEnvironment() && !isProduction()) {
        try {
            return pino(
                options,
                pino.transport({
                    target: "pino-pretty",
                    options: {
                        colorize: true,
                        translateTime: "HH:MM:ss.l",
                        ignore: "pid,hostname",
                        singleLine: false,
                    },
                })
            );
        } catch {
            // Fallback to regular pino if pino-pretty is not available
            console.warn("[wsx-logger] pino-pretty not available, using default formatter");
            return pino(options);
        }
    }

    return pino(options);
}

/**
 * WSX Logger wrapper that implements the Logger interface
 * and uses pino under the hood
 */
export class WSXLogger implements Logger {
    private pinoLogger: PinoLoggerType;
    private isProd: boolean;

    constructor(config: LoggerConfig = {}) {
        this.isProd = isProduction();
        this.pinoLogger = createPinoLogger(config);
    }

    debug(message: string, ...args: unknown[]): void {
        // Always show debug logs in non-production environments
        if (!this.isProd) {
            if (args.length > 0) {
                this.pinoLogger.debug({ args }, message);
            } else {
                this.pinoLogger.debug(message);
            }
        }
    }

    info(message: string, ...args: unknown[]): void {
        // Always show info logs in non-production environments
        if (!this.isProd) {
            if (args.length > 0) {
                this.pinoLogger.info({ args }, message);
            } else {
                this.pinoLogger.info(message);
            }
        } else {
            // In production, respect pino's level configuration
            if (args.length > 0) {
                this.pinoLogger.info({ args }, message);
            } else {
                this.pinoLogger.info(message);
            }
        }
    }

    warn(message: string, ...args: unknown[]): void {
        // Always show warnings (in both production and development)
        if (args.length > 0) {
            this.pinoLogger.warn({ args }, message);
        } else {
            this.pinoLogger.warn(message);
        }
    }

    error(message: string, ...args: unknown[]): void {
        // Always show errors (in both production and development)
        if (args.length > 0) {
            this.pinoLogger.error({ args }, message);
        } else {
            this.pinoLogger.error(message);
        }
    }

    fatal(message: string, ...args: unknown[]): void {
        if (args.length > 0) {
            this.pinoLogger.fatal({ args }, message);
        } else {
            this.pinoLogger.fatal(message);
        }
    }

    trace(message: string, ...args: unknown[]): void {
        // Always show trace logs in non-production environments
        if (!this.isProd) {
            if (args.length > 0) {
                this.pinoLogger.trace({ args }, message);
            } else {
                this.pinoLogger.trace(message);
            }
        }
    }

    /**
     * Get the underlying pino logger instance
     */
    getPinoLogger(): PinoLoggerType {
        return this.pinoLogger;
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

// Export pino types for advanced usage
export type { Logger as PinoLogger, LoggerOptions } from "pino";
export { pino } from "pino";
