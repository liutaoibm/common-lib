import { LogLevel, LogEntry } from '../types';

/**
 * Interface for a logger that provides methods for logging at different levels.
 */
export interface Logger {
  /**
   * Log a message at the ERROR level.
   * 
   * @param message - The message to log
   * @param meta - Optional metadata to include with the log entry
   */
  error(message: string, meta?: Record<string, unknown>): Promise<void>;
  
  /**
   * Log a message at the WARN level.
   * 
   * @param message - The message to log
   * @param meta - Optional metadata to include with the log entry
   */
  warn(message: string, meta?: Record<string, unknown>): Promise<void>;
  
  /**
   * Log a message at the INFO level.
   * 
   * @param message - The message to log
   * @param meta - Optional metadata to include with the log entry
   */
  info(message: string, meta?: Record<string, unknown>): Promise<void>;
  
  /**
   * Log a message at the DEBUG level.
   * 
   * @param message - The message to log
   * @param meta - Optional metadata to include with the log entry
   */
  debug(message: string, meta?: Record<string, unknown>): Promise<void>;
  
  /**
   * Log a message at the TRACE level.
   * 
   * @param message - The message to log
   * @param meta - Optional metadata to include with the log entry
   */
  trace(message: string, meta?: Record<string, unknown>): Promise<void>;
  
  /**
   * Log a message at the specified level.
   * 
   * @param level - The log level
   * @param message - The message to log
   * @param meta - Optional metadata to include with the log entry
   */
  log(level: LogLevel, message: string, meta?: Record<string, unknown>): Promise<void>;
  
  /**
   * Create a new logger with a specific context.
   * The new logger inherits all configuration from the parent logger.
   * 
   * @param context - Context values to include with all log entries
   */
  withContext(context: Record<string, unknown>): Logger;
  
  /**
   * Create a new logger with a specific namespace.
   * The new logger inherits all configuration from the parent logger.
   * 
   * @param namespace - Namespace for the logger
   */
  withNamespace(namespace: string): Logger;
  
  /**
   * Close the logger and release any resources.
   */
  close(): Promise<void>;
}

/**
 * Interface for a logger that has additional methods for managing child loggers.
 */
export interface LoggerManager extends Logger {
  /**
   * Get or create a child logger with a specific namespace.
   * 
   * @param namespace - Namespace for the logger
   */
  getLogger(namespace: string): Logger;
}
