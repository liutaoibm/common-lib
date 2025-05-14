import { LogEntry } from '../types';
import { BaseTransport } from './base.transport';
import { TransportConfig } from './transport.interface';

/**
 * Configuration options for the console transport.
 */
export interface ConsoleTransportConfig extends TransportConfig {
  /** Whether to colorize the output */
  colorize?: boolean;
  /** Whether to use the error console for error logs */
  useErrorConsole?: boolean;
}

/**
 * Transport for outputting logs to the console.
 */
export class ConsoleTransport extends BaseTransport {
  /** Whether to colorize the output */
  private colorize: boolean;
  
  /** Whether to use the error console for error logs */
  private useErrorConsole: boolean;
  
  /**
   * Creates a new ConsoleTransport instance.
   * 
   * @param config - Configuration for the transport
   */
  constructor(config: ConsoleTransportConfig = {}) {
    super(config);
    
    this.colorize = config.colorize ?? true;
    this.useErrorConsole = config.useErrorConsole ?? true;
    
    // If colorize is enabled, make sure the formatter is configured for color
    if (this.colorize && 'options' in this.formatter) {
      (this.formatter as any).options = {
        ...(this.formatter as any).options,
        colorize: true,
      };
    }
  }
  
  /**
   * Write a log entry to the console.
   * 
   * @param entry - The log entry to write
   */
  protected async write(entry: LogEntry): Promise<void> {
    const formattedEntry = this.formatter.format(entry);
    
    if (this.useErrorConsole && entry.level === 'error') {
      console.error(formattedEntry);
    } else {
      console.log(formattedEntry);
    }
  }
}
