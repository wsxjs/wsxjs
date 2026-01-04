# @wsxjs/wsx-logger

Browser-optimized logging utility for WSXJS. Pure native browser implementation with zero dependencies.

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

### Advanced Usage

```typescript
import { createLogger } from "@wsxjs/wsx-logger";

const logger = createLogger("MyComponent");

// Dynamic log level control
logger.setLevel("warn");
const currentLevel = logger.getLevel();
logger.setLevel("debug");
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

- ✅ **Zero dependencies** - Pure native browser implementation
- ✅ **Lightweight** - Minimal bundle size (~500 bytes gzipped)
- ✅ **Browser-optimized** - Uses native `console` API
- ✅ **Compatible** - WSXJS core logger interface
- ✅ **TypeScript** - Full type support
- ✅ **Environment-aware** - Auto-configures based on production/development
- ✅ **Component-specific** - Create loggers with custom prefixes
- ✅ **Dynamic control** - Change log levels at runtime
- ✅ **Production-ready** - Automatically reduces verbosity in production

## Why Native Implementation?

- **Zero dependencies**: No external packages, perfect for WSXJS's zero-dependency philosophy
- **Native browser API**: Uses standard `console` methods (debug, info, warn, error)
- **Maximum compatibility**: Works in all modern browsers without polyfills
- **Minimal overhead**: Direct console calls, no abstraction layer
- **Full control**: Complete control over logging behavior
- **Bundle size**: Smaller than any external logging library

## License

MIT
