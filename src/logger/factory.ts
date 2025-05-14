import { LogLevel, LoggerConfig } from '../types';
import { CommonLogger } from './logger';
import { LoggerManager } from './logger.interface';
import { ConsoleTransport, FileTransport, LogTransport } from '../transports';

/**
 * Configuration options for creating a logger.
 */
export interface LoggerFactoryConfig extends LoggerConfig {
  /** Whether to output logs to the console */
  console?: boolean | {
    /** Whether to colorize console output */
    colorize?: boolean;
    /** Whether to use pretty-printing for JSON logs */
    prettyPrint?: boolean;
    /** The formatter to use ('text' or 'json') */
    format?: 'text' | 'json';
  };
  
  /** Whether to output logs to a file */
  file?: boolean | {
    /** The file path to write logs to */
    filename: string;
    /** Options for log rotation */
    rotation?: {
      /** Maximum size in bytes before rotating the log */
      maxSize?: number;
      /** Maximum number of days to keep logs */
      maxDays?: number;
      /** Maximum number of files to keep */
      maxFiles?: number;
    };
    /** The formatter to use ('text' or 'json') */
    format?: 'text' | 'json';
  };
  
  /** Custom transports to add */
  transports?: LogTransport[];
  
  /** Environment to configure logging for */
  env?: 'development' | 'production' | 'test';
  
  /** Application name for log context */
  appName?: string;
}

/**
 * Create a logger with common configurations.
 * 
 * @param config - Configuration options
 * @returns A configured logger
 */
export function createLogger(config: LoggerFactoryConfig = {}): LoggerManager {
  // Default configuration based on environment
  const env = config.env ?? (process.env.NODE_ENV || 'development');
  const isDevelopment = env === 'development';
  
  // Create transports
  const transports: LogTransport[] = [];
  
  // Add console transport
  if (config.console !== false) {
    const consoleConfig = typeof config.console === 'object' ? config.console : {};
    
    transports.push(new ConsoleTransport({
      level: isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
      colorize: consoleConfig.colorize ?? isDevelopment,
      formatter: consoleConfig.format === 'json' ? 'json' : 'text',
    }));
  }
  
  // Add file transport
  if (config.file) {
    const fileConfig = typeof config.file === 'object' ? config.file : { filename: 'logs/app.log' };
    
    transports.push(new FileTransport({
      level: LogLevel.INFO,
      buffering: true,
      filename: fileConfig.filename,
      rotation: fileConfig.rotation,
      formatter: fileConfig.format === 'text' ? 'text' : 'json',
    }));
  }
  
  // Add custom transports
  if (config.transports) {
    transports.push(...config.transports);
  }
  
  // Create default context
  const defaultContext: Record<string, unknown> = {
    env,
    ...(config.appName ? { app: config.appName } : {}),
    ...config.defaultContext,
  };
  
  // Create the logger
  return new CommonLogger({
    minLevel: isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
    defaultContext,
    transforms: config.transforms,
  }, transports);
}

/**
 * Get the default logger instance.
 * This creates a singleton logger with default configuration.
 */
let defaultLogger: LoggerManager | undefined;

export function getLogger(): LoggerManager {
  if (!defaultLogger) {
    defaultLogger = createLogger();
  }
  return defaultLogger;
}

/**
 * Reset the default logger instance.
 * This is useful for testing.
 */
export function resetLogger(): void {
  if (defaultLogger) {
    void defaultLogger.close();
    defaultLogger = undefined;
  }
}
