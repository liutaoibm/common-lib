import { LogEntry } from '../types';
import { LogFormatter } from './formatter.interface';

/**
 * A formatter that outputs log entries as JSON strings.
 * This is ideal for log aggregation and analysis tools.
 */
export class JsonFormatter implements LogFormatter {
  /**
   * Creates a new JsonFormatter instance.
   * 
   * @param options - Optional configuration for the formatter
   */
  constructor(private options: {
    /** Whether to pretty-print the JSON output */
    prettyPrint?: boolean;
    /** Custom fields to add to every log entry */
    additionalFields?: Record<string, unknown>;
  } = {}) {
    this.options = {
      prettyPrint: false,
      additionalFields: {},
      ...options,
    };
  }

  /**
   * Format a log entry as a JSON string.
   * 
   * @param entry - The log entry to format
   * @returns Formatted JSON string
   */
  format(entry: LogEntry): string {
    const { timestamp, level, message, context, meta, namespace } = entry;
    const { additionalFields, prettyPrint } = this.options;
    
    // Create the log object with all properties
    const logObject = {
      timestamp: timestamp.toISOString(),
      level,
      message,
      ...(namespace ? { namespace } : {}),
      ...(context && Object.keys(context).length > 0 ? { context } : {}),
      ...(meta && Object.keys(meta).length > 0 ? { meta } : {}),
      ...additionalFields,
    };
    
    // Format as JSON string
    try {
      if (prettyPrint) {
        return JSON.stringify(logObject, null, 2);
      }
      return JSON.stringify(logObject);
    } catch (error) {
      // In case of circular references or other JSON stringification errors
      const fallbackObject = {
        timestamp: timestamp.toISOString(),
        level,
        message,
        error: 'Failed to serialize log entry',
      };
      return JSON.stringify(fallbackObject);
    }
  }
}
