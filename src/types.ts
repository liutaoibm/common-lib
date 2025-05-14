/**
 * Standard log levels supported by the logging library.
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace',
}

/**
 * The structure of a log entry.
 */
export interface LogEntry {
  /** The timestamp when the log entry was created */
  timestamp: Date;
  
  /** The log level of the entry */
  level: LogLevel;
  
  /** The main message to be logged */
  message: string;
  
  /** Optional contextual information for the log entry */
  context?: Record<string, unknown>;
  
  /** Optional metadata to be included with the log entry */
  meta?: Record<string, unknown>;
  
  /** An optional namespace or category for the log entry */
  namespace?: string;
}

/**
 * Configuration options for the logger.
 */
export interface LoggerConfig {
  /** The minimum log level to output */
  minLevel?: LogLevel;
  
  /** Default context values to include with all log entries */
  defaultContext?: Record<string, unknown>;
  
  /** Whether to include a timestamp in log entries */
  timestamp?: boolean;
  
  /** Transformations to apply to log entries before output */
  transforms?: Array<(entry: LogEntry) => LogEntry>;
  
  /** Whether to buffer logs before output */
  buffering?: boolean;
  
  /** Options for log rotation */
  rotation?: {
    /** Maximum size in bytes before rotating the log */
    maxSize?: number;
    
    /** Maximum number of days to keep logs */
    maxDays?: number;
    
    /** Maximum number of files to keep */
    maxFiles?: number;
    
    /** Whether to compress rotated logs */
    compress?: boolean;
  };
}
