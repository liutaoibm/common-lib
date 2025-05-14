import { LogEntry, LogLevel, LoggerConfig } from '../types';
import { LogTransport } from '../transports';
import { Logger, LoggerManager } from './logger.interface';

/**
 * Implementation of the Logger interface that outputs logs to configured transports.
 */
export class CommonLogger implements LoggerManager {
  /** The minimum log level to output */
  private minLevel: LogLevel;
  
  /** Default context values to include with all log entries */
  private defaultContext: Record<string, unknown>;
  
  /** Transports to output logs to */
  private transports: LogTransport[];
  
  /** Transformations to apply to log entries before output */
  private transforms: Array<(entry: LogEntry) => LogEntry>;
  
  /** The namespace of the logger */
  private namespace?: string;
  
  /** Map of child loggers created with namespaces */
  private childLoggers = new Map<string, Logger>();
  
  /**
   * Creates a new Logger instance.
   * 
   * @param config - Configuration for the logger
   * @param transports - Transports to output logs to
   */
  constructor(
    config: LoggerConfig = {},
    transports: LogTransport[] = []
  ) {
    this.minLevel = config.minLevel ?? LogLevel.INFO;
    this.defaultContext = config.defaultContext ?? {};
    this.transports = transports;
    this.transforms = config.transforms ?? [];
    this.namespace = undefined;
  }
  
  /**
   * Log a message at the ERROR level.
   * 
   * @param message - The message to log
   * @param meta - Optional metadata to include with the log entry
   */
  async error(message: string, meta?: Record<string, unknown>): Promise<void> {
    return this.log(LogLevel.ERROR, message, meta);
  }
  
  /**
   * Log a message at the WARN level.
   * 
   * @param message - The message to log
   * @param meta - Optional metadata to include with the log entry
   */
  async warn(message: string, meta?: Record<string, unknown>): Promise<void> {
    return this.log(LogLevel.WARN, message, meta);
  }
  
  /**
   * Log a message at the INFO level.
   * 
   * @param message - The message to log
   * @param meta - Optional metadata to include with the log entry
   */
  async info(message: string, meta?: Record<string, unknown>): Promise<void> {
    return this.log(LogLevel.INFO, message, meta);
  }
  
  /**
   * Log a message at the DEBUG level.
   * 
   * @param message - The message to log
   * @param meta - Optional metadata to include with the log entry
   */
  async debug(message: string, meta?: Record<string, unknown>): Promise<void> {
    return this.log(LogLevel.DEBUG, message, meta);
  }
  
  /**
   * Log a message at the TRACE level.
   * 
   * @param message - The message to log
   * @param meta - Optional metadata to include with the log entry
   */
  async trace(message: string, meta?: Record<string, unknown>): Promise<void> {
    return this.log(LogLevel.TRACE, message, meta);
  }
  
  /**
   * Log a message at the specified level.
   * 
   * @param level - The log level
   * @param message - The message to log
   * @param meta - Optional metadata to include with the log entry
   */
  async log(level: LogLevel, message: string, meta?: Record<string, unknown>): Promise<void> {
    // Check if the level is enabled
    if (!this.isLevelEnabled(level)) {
      return;
    }
    
    // Create the log entry
    let entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      meta,
      context: { ...this.defaultContext },
      namespace: this.namespace,
    };
    
    // Apply transforms
    for (const transform of this.transforms) {
      entry = transform(entry);
    }
    
    // Output to transports
    for (const transport of this.transports) {
      if (transport.isLevelEnabled(level)) {
        // Use void to ignore the promise - we don't want to block
        void transport.transport(entry);
      }
    }
  }
  
  /**
   * Create a new logger with a specific context.
   * The new logger inherits all configuration from the parent logger.
   * 
   * @param context - Context values to include with all log entries
   */
  withContext(context: Record<string, unknown>): Logger {
    const childLogger = new CommonLogger({
      minLevel: this.minLevel,
      defaultContext: { ...this.defaultContext, ...context },
      transforms: this.transforms,
    }, this.transports);
    
    // Copy the namespace if it exists
    if (this.namespace) {
      childLogger.namespace = this.namespace;
    }
    
    return childLogger;
  }
  
  /**
   * Create a new logger with a specific namespace.
   * The new logger inherits all configuration from the parent logger.
   * 
   * @param namespace - Namespace for the logger
   */
  withNamespace(namespace: string): Logger {
    const childNamespace = this.namespace
      ? `${this.namespace}:${namespace}`
      : namespace;
    
    return this.getLogger(childNamespace);
  }
  
  /**
   * Get or create a child logger with a specific namespace.
   * 
   * @param namespace - Namespace for the logger
   */
  getLogger(namespace: string): Logger {
    // Check if we already have a logger with this namespace
    const existingLogger = this.childLoggers.get(namespace);
    if (existingLogger) {
      return existingLogger;
    }
    
    // Create a new logger with this namespace
    const childLogger = new CommonLogger({
      minLevel: this.minLevel,
      defaultContext: this.defaultContext,
      transforms: this.transforms,
    }, this.transports);
    
    childLogger.namespace = namespace;
    
    // Store the logger for future use
    this.childLoggers.set(namespace, childLogger);
    
    return childLogger;
  }
  
  /**
   * Close the logger and release any resources.
   */
  async close(): Promise<void> {
    // Close all transports
    await Promise.all(this.transports.map(transport => transport.close()));
    
    // Clear the child loggers
    this.childLoggers.clear();
  }
  
  /**
   * Check if a log level should be logged.
   * 
   * @param level - The log level to check
   */
  private isLevelEnabled(level: LogLevel): boolean {
    const levels: LogLevel[] = [
      LogLevel.ERROR,
      LogLevel.WARN,
      LogLevel.INFO,
      LogLevel.DEBUG,
      LogLevel.TRACE,
    ];
    
    const minLevelIndex = levels.indexOf(this.minLevel);
    const currentLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex <= minLevelIndex;
  }
}
