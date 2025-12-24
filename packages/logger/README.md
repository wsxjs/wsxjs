# @wsxjs/wsx-logger

Pino-based logging utility for WSXJS.

## Installation

```bash
pnpm add @wsxjs/wsx-logger
```

## Usage

### Basic Usage

```typescript
import { createLogger } from "@wsxjs/wsx-logger";

const logger = createLogger("MyComponent");

logger.info("Component initialized");
logger.debug("Debug information");
logger.warn("Warning message");
logger.error("Error occurred", error);
```

### Default Logger

```typescript
import { logger } from "@wsxjs/wsx-logger";

logger.info("Application started");
```

### Custom Configuration

```typescript
import { createLoggerWithConfig } from "@wsxjs/wsx-logger";

const logger = createLoggerWithConfig({
    name: "MyApp",
    level: "debug",
    pretty: true, // Enable pretty printing in development
});
```

### Advanced Usage with Pino

```typescript
import { createLogger, type PinoLogger } from "@wsxjs/wsx-logger";

const wsxLogger = createLogger("MyComponent");
const pinoLogger = wsxLogger.getPinoLogger(); // Access underlying pino logger

// Use pino's advanced features
pinoLogger.child({ component: "MyComponent" }).info("Child logger");
```

## Configuration

### Environment Variables

- `NODE_ENV=production`: Automatically sets log level to `info` and disables pretty printing
- `NODE_ENV=development`: Automatically sets log level to `debug` and enables pretty printing

### Log Levels

- `trace` - Most verbose
- `debug` - Debug information
- `info` - General information (default in production)
- `warn` - Warnings
- `error` - Errors
- `fatal` - Fatal errors

## Features

- ✅ Pino-based high-performance logging
- ✅ Pretty printing in development
- ✅ Compatible with WSXJS core logger interface
- ✅ TypeScript support
- ✅ Environment-aware configuration
- ✅ Component-specific loggers

## License

MIT

