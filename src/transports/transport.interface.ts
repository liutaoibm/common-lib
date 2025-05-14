import { LogEntry, LogLevel } from '../types';

/**
 * Interface for log transports that output log entries to specific destinations.
 */
export interface LogTransport {
  /**
   * Output a log entry to the transport's destination.
   * 
   * @param entry - The log entry to transport
   * @returns A promise that resolves when the entry has been transported
   */
  transport(entry: LogEntry): Promise<void>;
  
  /**
   * Check if a log entry should be transported based on its level.
   * 
   * @param level - The log level to check
   * @returns Whether the log level should be transported
   */
  isLevelEnabled(level: LogLevel): boolean;
  
  /**
   * Initialize the transport.
   * This method is called when the transport is first used.
   * 
   * @returns A promise that resolves when the transport is initialized
   */
  initialize(): Promise<void>;
  
  /**
   * Close the transport and release any resources.
   * 
   * @returns A promise that resolves when the transport is closed
   */
  close(): Promise<void>;
}

/**
 * Configuration options for transports.
 */
export interface TransportConfig {
  /** The minimum log level to output */
  level?: LogLevel;
  
  /** Whether to buffer logs before output */
  buffering?: boolean;
  
  /** The maximum number of logs to buffer before flushing */
  bufferSize?: number;
  
  /** The maximum time (in ms) to wait before flushing the buffer */
  flushInterval?: number;
  
  /** A custom formatter for the transport */
  formatter?: string | ((entry: LogEntry) => string);
}
