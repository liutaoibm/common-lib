import { LogEntry, LogLevel } from '../types';
import { LogFormatter } from './formatter.interface';

/**
 * A formatter that outputs log entries as human-readable text strings.
 */
export class TextFormatter implements LogFormatter {
  /**
   * Creates a new TextFormatter instance.
   * 
   * @param options - Optional configuration for the formatter
   */
  constructor(private options: {
    /** Whether to include the timestamp in the output */
    includeTimestamp?: boolean;
    /** Whether to colorize the output (only works in terminals) */
    colorize?: boolean;
    /** Whether to pretty-print context and metadata objects */
    prettyPrint?: boolean;
  } = {}) {
    this.options = {
      includeTimestamp: true,
      colorize: false,
      prettyPrint: false,
      ...options,
    };
  }

  /**
   * Format a log entry as a human-readable text string.
   * 
   * @param entry - The log entry to format
   * @returns Formatted text string
   */
  format(entry: LogEntry): string {
    const { timestamp, level, message, context, meta, namespace } = entry;
    const { includeTimestamp, colorize, prettyPrint } = this.options;
    
    // Build the log parts
    const parts: string[] = [];
    
    // Add timestamp if enabled
    if (includeTimestamp) {
      parts.push(`[${timestamp.toISOString()}]`);
    }
    
    // Add log level (with color if enabled)
    const levelString = this.formatLevel(level, colorize || false);
    parts.push(levelString);
    
    // Add namespace if present
    if (namespace) {
      parts.push(`[${namespace}]`);
    }
    
    // Add the message
    parts.push(message);
    
    // Add context and metadata if present
    const contextString = this.formatObject(context, prettyPrint);
    if (contextString) {
      parts.push(contextString);
    }
    
    const metaString = this.formatObject(meta, prettyPrint);
    if (metaString) {
      parts.push(metaString);
    }
    
    return parts.join(' ');
  }
  
  /**
   * Format a log level with optional colorization.
   */
  private formatLevel(level: LogLevel, colorize: boolean): string {
    const upperLevel = level.toUpperCase();
    
    if (!colorize) {
      return `[${upperLevel}]`;
    }
    
    // Apply color codes based on level
    const colorCodes = {
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.INFO]: '\x1b[36m',  // Cyan
      [LogLevel.DEBUG]: '\x1b[34m', // Blue
      [LogLevel.TRACE]: '\x1b[90m', // Gray
    };
    
    const reset = '\x1b[0m';
    return `${colorCodes[level]}[${upperLevel}]${reset}`;
  }
  
  /**
   * Format an object for text output.
   */
  private formatObject(obj?: Record<string, unknown>, pretty = false): string {
    if (!obj || Object.keys(obj).length === 0) {
      return '';
    }
    
    try {
      if (pretty) {
        return JSON.stringify(obj, null, 2);
      }
      return JSON.stringify(obj);
    } catch (error) {
      return '[Unserializable data]';
    }
  }
}
