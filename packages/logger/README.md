# @wsxjs/wsx-logger

Browser-optimized logging utility for WSXJS, powered by [loglevel](https://github.com/pimterry/loglevel).

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
});
```

### Advanced Usage with Loglevel

```typescript
import { createLogger, type LoglevelLogger } from "@wsxjs/wsx-logger";

const wsxLogger = createLogger("MyComponent");
const loglevelLogger = wsxLogger.getLoglevelLogger(); // Access underlying loglevel logger

// Use loglevel's advanced features
loglevelLogger.setLevel("warn");
const currentLevel = wsxLogger.getLevel();
wsxLogger.setLevel("debug");
```

## Configuration

### Environment Variables

- `NODE_ENV=production` or `MODE=production`: Automatically sets log level to `info`
- `NODE_ENV=development` or `MODE=development`: Automatically sets log level to `debug`

### Log Levels

- `trace` - Most verbose
- `debug` - Debug information
- `info` - General information (default in production)
- `warn` - Warnings
- `error` - Errors
- `silent` - Disable all logging

## Features

- ✅ Browser-optimized with loglevel (~1KB)
- ✅ Zero dependencies (loglevel is the only dependency)
- ✅ Compatible with WSXJS core logger interface
- ✅ TypeScript support
- ✅ Environment-aware configuration
- ✅ Component-specific loggers
- ✅ Dynamic log level control
- ✅ Production-ready (automatically reduces verbosity in production)

## Why Loglevel?

- **Lightweight**: Only ~1KB minified
- **Browser-first**: Designed specifically for browser environments
- **No Node.js dependencies**: Pure browser implementation
- **Performance**: Minimal overhead, uses native console methods
- **Flexible**: Easy to configure and extend

## License

MIT
