import { LogEntry } from '../types';

/**
 * Interface for log formatters that transform log entries into string output.
 */
export interface LogFormatter {
  /**
   * Format a log entry into a string representation.
   * 
   * @param entry - The log entry to format
   * @returns Formatted string representation of the log entry
   */
  format(entry: LogEntry): string;
}
