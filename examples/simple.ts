/**
 * Example of using the common logging library.
 */
import { createLogger, LogLevel, ConsoleTransport, FileTransport } from '../src';

/**
 * Run the example showing various logger configurations and usage.
 */
async function runExample() {
  // Create a logger with default configuration (console output)
  const defaultLogger = createLogger();

  // Basic logging
  await defaultLogger.info('Hello from the default logger!');
  await defaultLogger.warn('This is a warning message');
  await defaultLogger.error('This is an error message', { code: 'ERR_EXAMPLE' });
  await defaultLogger.debug('This debug message may not show in production');

  // Create a logger with namespace
  const userLogger = defaultLogger.withNamespace('user');
  await userLogger.info('User logged in', { userId: '123' });

  // Create a logger with context
  const requestLogger = defaultLogger.withContext({ requestId: 'req-456' });
  await requestLogger.info('Request received');

  // Create a custom configured logger
  const customLogger = createLogger({
    // Set minimum log level
    minLevel: LogLevel.DEBUG,
    
    // Add default context to all log entries
    defaultContext: {
      app: 'example-service',
      version: '1.0.0',
    },
    
    // Enable console output with custom config
    console: {
      colorize: true,
      format: 'text', 
    },
    
    // Enable file output
    file: {
      filename: 'logs/example.log',
      format: 'json',
      rotation: {
        maxSize: 5 * 1024 * 1024, // 5MB
        maxFiles: 5,
      },
    },
  });

  // Log with the custom logger
  await customLogger.info('Hello from the custom logger!');
  await customLogger.error('Something went wrong', { 
    error: new Error('Example error').message,
    code: 'CUSTOM_ERROR' 
  });

  // Add a transform to modify log entries
  const loggerWithTransform = createLogger({
    transforms: [
      (entry) => {
        // Add a timestamp field in a different format
        return {
          ...entry,
          meta: {
            ...entry.meta,
            timestamp: entry.timestamp.toISOString(),
            timeMs: entry.timestamp.getTime(),
          },
        };
      },
    ],
  });

  await loggerWithTransform.info('This entry has transformed metadata');

  // Manually create and configure transports
  const manualLogger = createLogger({
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

  await manualLogger.info('Using manually configured transports');
  
  // Close all loggers to ensure all buffered logs are written
  await Promise.all([
    defaultLogger.close(),
    customLogger.close(),
    loggerWithTransform.close(),
    manualLogger.close()
  ]);
}

// Run the example
runExample().catch(console.error);
