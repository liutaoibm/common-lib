# Common Logging Library for Node.js

A standardized logging library for Node.js applications that provides consistent logging patterns and output channels.

## Features

- 📝 Standardized logging with multiple log levels (`ERROR`, `WARN`, `INFO`, `DEBUG`, `TRACE`)
- 🧩 Modular design with pluggable transports and formatters
- 📊 Structured logging with JSON support
- 📂 File transport with log rotation
- 🌈 Console output with color support
- 🏷️ Context and namespace support for better categorization
- 🔄 Log transformation pipelines
- 📦 Easy integration with existing Node.js applications

## Installation

```bash
npm install common-logging-lib
```

## Quick Start

```typescript
import { createLogger } from 'common-logging-lib';

// Create a logger with default configuration (console output)
const logger = createLogger();

// Basic logging (all methods return promises)
await logger.info('Hello world!');
await logger.warn('This is a warning message');
await logger.error('This is an error message', { code: 'ERR_EXAMPLE' });
await logger.debug('Debug message with context', { userId: '123' });

// Using with Promise.all for multiple logs
await Promise.all([
  logger.info('First log'),
  logger.info('Second log'),
  logger.info('Third log')
]);
```

## Configuration

### Creating a Logger

```typescript
import { createLogger, LogLevel } from 'common-logging-lib';

const logger = createLogger({
  // Set minimum log level
  minLevel: LogLevel.DEBUG,
  
  // Add default context to all log entries
  defaultContext: {
    app: 'my-service',
    version: '1.0.0',
  },
  
  // Enable console output with custom config
  console: {
    colorize: true,
    format: 'text', // or 'json'
  },
  
  // Enable file output
  file: {
    filename: 'logs/app.log',
    format: 'json',
    rotation: {
      maxSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      maxDays: 14, // keep logs for 14 days
    },
  },
});
```

### Creating Child Loggers

```typescript
// Create a logger with namespace
const userLogger = logger.withNamespace('user');
await userLogger.info('User logged in', { userId: '123' });

// Create a logger with additional context
const requestLogger = logger.withContext({ requestId: 'req-456' });
await requestLogger.info('Request received');
```

### Adding Custom Transports

```typescript
import { createLogger, LogLevel, ConsoleTransport, FileTransport } from 'common-logging-lib';

const logger = createLogger({
  transports: [
    new ConsoleTransport({
      level: LogLevel.INFO,
      colorize: true,
    }),
    new FileTransport({
      level: LogLevel.DEBUG,
      filename: 'logs/debug.log',
      buffering: true,
    }),
  ],
});
```

### Adding Transforms

```typescript
import { createLogger } from 'common-logging-lib';

const logger = createLogger({
  transforms: [
    (entry) => {
      // Add custom fields to each log entry
      return {
        ...entry,
        meta: {
          ...entry.meta,
          hostname: require('os').hostname(),
          pid: process.pid,
        },
      };
    },
  ],
});
```

## API Reference

### Log Levels

- `ERROR`: Error conditions that might need immediate attention
- `WARN`: Warning conditions that should be addressed
- `INFO`: Informational messages that highlight progress
- `DEBUG`: Detailed information for debugging purposes
- `TRACE`: Very detailed debugging information

### Logger Methods

- `logger.error(message, meta?)`: Log at ERROR level (returns Promise)
- `logger.warn(message, meta?)`: Log at WARN level (returns Promise) 
- `logger.info(message, meta?)`: Log at INFO level (returns Promise)
- `logger.debug(message, meta?)`: Log at DEBUG level (returns Promise)
- `logger.trace(message, meta?)`: Log at TRACE level (returns Promise)
- `logger.log(level, message, meta?)`: Log at any level (returns Promise)
- `logger.withContext(context)`: Create a child logger with additional context
- `logger.withNamespace(namespace)`: Create a child logger with a namespace
- `logger.close()`: Close the logger and release resources (returns Promise)

### Factory Methods

- `createLogger(config)`: Create a new logger with custom configuration
- `getLogger()`: Get the default logger instance
- `resetLogger()`: Reset the default logger instance

## Examples

See the [examples](./examples) directory for more usage examples.

## License

ISC
