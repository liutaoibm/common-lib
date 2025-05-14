import { LogEntry, LogLevel } from '../types';
import { LogFormatter, TextFormatter } from '../formatters';
import { LogTransport, TransportConfig } from './transport.interface';

/**
 * Abstract base class for log transports that implements common functionality.
 */
export abstract class BaseTransport implements LogTransport {
  /** The minimum log level to output */
  protected level: LogLevel;
  
  /** Whether to buffer logs before output */
  protected buffering: boolean;
  
  /** The formatter to use for log entries */
  protected formatter: LogFormatter;
  
  /** The buffer of log entries, if buffering is enabled */
  protected buffer: LogEntry[] = [];
  
  /** The maximum number of logs to buffer before flushing */
  protected bufferSize: number;
  
  /** The interval ID for the buffer flush timer */
  protected flushIntervalId?: NodeJS.Timeout;
  
  /** The maximum time (in ms) to wait before flushing the buffer */
  protected flushInterval: number;
  
  /** Whether the transport has been initialized */
  protected initialized = false;
  
  /**
   * Creates a new BaseTransport instance.
   * 
   * @param config - Configuration for the transport
   */
  constructor(config: TransportConfig = {}) {
    this.level = config.level ?? LogLevel.INFO;
    this.buffering = config.buffering ?? false;
    this.bufferSize = config.bufferSize ?? 100;
    this.flushInterval = config.flushInterval ?? 5000;
    
    // Set the formatter
    if (typeof config.formatter === 'function') {
      this.formatter = { format: config.formatter };
    } else if (config.formatter === 'json') {
      // If we're using 'json', import the JsonFormatter dynamically
      // to avoid circular dependencies
      const { JsonFormatter } = require('../formatters/json.formatter');
      this.formatter = new JsonFormatter();
    } else {
      // Default to text formatter
      this.formatter = new TextFormatter();
    }
  }
  
  /**
   * Initialize the transport.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    if (this.buffering) {
      this.startBufferFlushTimer();
    }
    
    this.initialized = true;
  }
  
  /**
   * Transport a log entry to the destination.
   * 
   * @param entry - The log entry to transport
   */
  async transport(entry: LogEntry): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    if (!this.isLevelEnabled(entry.level)) {
      return;
    }
    
    if (this.buffering) {
      this.buffer.push(entry);
      
      if (this.buffer.length >= this.bufferSize) {
        await this.flushBuffer();
      }
    } else {
      await this.write(entry);
    }
  }
  
  /**
   * Check if a log level should be transported.
   * 
   * @param level - The log level to check
   */
  isLevelEnabled(level: LogLevel): boolean {
    const levels: LogLevel[] = [
      LogLevel.ERROR,
      LogLevel.WARN,
      LogLevel.INFO,
      LogLevel.DEBUG,
      LogLevel.TRACE,
    ];
    
    const minLevelIndex = levels.indexOf(this.level);
    const currentLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex <= minLevelIndex;
  }
  
  /**
   * Close the transport and release any resources.
   */
  async close(): Promise<void> {
    if (this.flushIntervalId) {
      clearInterval(this.flushIntervalId);
      this.flushIntervalId = undefined;
    }
    
    if (this.buffering && this.buffer.length > 0) {
      await this.flushBuffer();
    }
  }
  
  /**
   * Start the buffer flush timer.
   */
  protected startBufferFlushTimer(): void {
    if (this.flushIntervalId) {
      clearInterval(this.flushIntervalId);
    }
    
    this.flushIntervalId = setInterval(async () => {
      await this.flushBuffer();
    }, this.flushInterval);
    
    // Don't prevent Node.js from exiting
    if (this.flushIntervalId.unref) {
      this.flushIntervalId.unref();
    }
  }
  
  /**
   * Flush the buffer to the destination.
   */
  protected async flushBuffer(): Promise<void> {
    if (!this.buffer.length) {
      return;
    }
    
    const entries = [...this.buffer];
    this.buffer = [];
    
    await this.writeMany(entries);
  }
  
  /**
   * Write a log entry to the destination.
   * 
   * @param entry - The log entry to write
   */
  protected abstract write(entry: LogEntry): Promise<void>;
  
  /**
   * Write multiple log entries to the destination.
   * The default implementation calls write() for each entry.
   * 
   * @param entries - The log entries to write
   */
  protected async writeMany(entries: LogEntry[]): Promise<void> {
    for (const entry of entries) {
      await this.write(entry);
    }
  }
}
