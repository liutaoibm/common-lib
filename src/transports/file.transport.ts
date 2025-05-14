import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';
import { LogEntry } from '../types';
import { BaseTransport } from './base.transport';
import { TransportConfig } from './transport.interface';

// Safely promisify fs functions
const fsPromises = {
  mkdir: fs.mkdir ? promisify(fs.mkdir) : (path: string, options?: any) => Promise.resolve(),
  writeFile: fs.writeFile ? promisify(fs.writeFile) : (path: string, data: string) => Promise.resolve(),
  appendFile: fs.appendFile ? promisify(fs.appendFile) : (path: string, data: string) => Promise.resolve(),
  stat: fs.stat ? promisify(fs.stat) : (path: string) => Promise.resolve({ 
    size: 0,
    mtime: new Date() 
  }),
  rename: fs.rename ? promisify(fs.rename) : (oldPath: string, newPath: string) => Promise.resolve(),
  readdir: fs.readdir ? promisify(fs.readdir) : (path: string) => Promise.resolve([]),
  unlink: fs.unlink ? promisify(fs.unlink) : (path: string) => Promise.resolve(),
};

/**
 * Configuration options for the file transport.
 */
export interface FileTransportConfig extends TransportConfig {
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
    
    /** Whether to compress rotated logs */
    compress?: boolean;
  };
}

/**
 * Transport for outputting logs to a file.
 */
export class FileTransport extends BaseTransport {
  /** The file path to write logs to */
  private filename: string;
  
  /** Options for log rotation */
  private rotation: Required<NonNullable<FileTransportConfig['rotation']>>;
  
  /** Whether the transport is currently rotating logs */
  private rotating = false;
  
  /** The directory of the log file */
  private dirname: string;
  
  /** The basename of the log file */
  private basename: string;
  
  /** The extension of the log file */
  private extension: string;
  
  /**
   * Creates a new FileTransport instance.
   * 
   * @param config - Configuration for the transport
   */
  constructor(config: FileTransportConfig) {
    super(config);
    
    this.filename = config.filename;
    
    // Default rotation options
    this.rotation = {
      maxSize: 10 * 1024 * 1024, // 10MB
      maxDays: 14, // 2 weeks
      maxFiles: 10,
      compress: false,
      ...config.rotation,
    };
    
    // Parse the filename
    const parsed = path.parse(this.filename);
    this.dirname = parsed.dir || '.';
    this.basename = parsed.name;
    this.extension = parsed.ext;
  }
  
  /**
   * Initialize the transport.
   * This creates the log directory if it doesn't exist.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    // Create the directory if it doesn't exist
    try {
      await fsPromises.mkdir(this.dirname, { recursive: true });
    } catch (error) {
      // Ignore errors if directory already exists
      if ((error as any).code !== 'EEXIST') {
        throw error;
      }
    }
    
    await super.initialize();
  }
  
  /**
   * Write a log entry to the file.
   * 
   * @param entry - The log entry to write
   */
  protected async write(entry: LogEntry): Promise<void> {
    const formattedEntry = this.formatter.format(entry) + os.EOL;
    
    try {
      await this.ensureInitialized();
      await this.checkRotation();
      await fsPromises.appendFile(this.filename, formattedEntry);
    } catch (error) {
      console.error(`Failed to write to log file: ${error}`);
    }
  }
  
  /**
   * Write multiple log entries to the file.
   * This is more efficient than writing each entry individually.
   * 
   * @param entries - The log entries to write
   */
  protected async writeMany(entries: LogEntry[]): Promise<void> {
    if (entries.length === 0) {
      return;
    }
    
    const formattedEntries = entries
      .map(entry => this.formatter.format(entry))
      .join(os.EOL) + os.EOL;
    
    try {
      await this.ensureInitialized();
      await this.checkRotation();
      await fsPromises.appendFile(this.filename, formattedEntries);
    } catch (error) {
      console.error(`Failed to write to log file: ${error}`);
    }
  }
  
  /**
   * Ensure the transport is initialized.
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
  
  /**
   * Check if the log file needs to be rotated.
   */
  private async checkRotation(): Promise<void> {
    if (this.rotating) {
      return;
    }
    
    try {
      const stats = await fsPromises.stat(this.filename).catch(() => null);
      
      if (stats && stats.size >= this.rotation.maxSize) {
        await this.rotate();
      }
    } catch (error) {
      // Ignore errors
    }
  }
  
  /**
   * Rotate the log file.
   */
  private async rotate(): Promise<void> {
    if (this.rotating) {
      return;
    }
    
    this.rotating = true;
    
    try {
      // Ensure we have a file to rotate
      const stats = await fsPromises.stat(this.filename).catch(() => null);
      if (!stats) {
        this.rotating = false;
        return;
      }
      
      // Get a list of existing log files
      const files = await this.getExistingRotatedFiles();
      
      // Sort files by age (newest first)
      files.sort().reverse();
      
      // Rotate existing log files
      for (let i = files.length - 1; i >= 0; i--) {
        const file = files[i];
        const match = file.match(new RegExp(`${this.basename}\\.(\\d+)${this.extension}`));
        
        if (!match) continue;
        
        const index = parseInt(match[1], 10);
        const newIndex = index + 1;
        
        if (newIndex > this.rotation.maxFiles) {
          // Delete the file if it exceeds the max files
          await fsPromises.unlink(path.join(this.dirname, file));
        } else {
          // Rename the file to increment its index
          const oldPath = path.join(this.dirname, file);
          const newPath = path.join(this.dirname, `${this.basename}.${newIndex}${this.extension}`);
          await fsPromises.rename(oldPath, newPath);
        }
      }
      
      // Rename the current log file
      await fsPromises.rename(
        this.filename, 
        path.join(this.dirname, `${this.basename}.1${this.extension}`)
      );
      
      // Delete old log files
      if (this.rotation.maxDays > 0) {
        await this.deleteOldFiles();
      }
    } catch (error) {
      console.error(`Failed to rotate log file: ${error}`);
    } finally {
      this.rotating = false;
    }
  }
  
  /**
   * Get a list of existing rotated log files.
   */
  private async getExistingRotatedFiles(): Promise<string[]> {
    try {
      const files = await fsPromises.readdir(this.dirname);
      const pattern = new RegExp(`${this.basename}\\.(\\d+)${this.extension}`);
      
      return files.filter(file => pattern.test(file));
    } catch (error) {
      console.error(`Failed to read log directory: ${error}`);
      return [];
    }
  }
  
  /**
   * Delete log files that are older than the maximum days.
   */
  private async deleteOldFiles(): Promise<void> {
    try {
      const files = await this.getExistingRotatedFiles();
      const now = Date.now();
      const maxAgeMs = this.rotation.maxDays * 24 * 60 * 60 * 1000;
      
      for (const file of files) {
        const filePath = path.join(this.dirname, file);
        const stats = await fsPromises.stat(filePath).catch(() => null);
        
        if (stats && now - stats.mtime.getTime() > maxAgeMs) {
          await fsPromises.unlink(filePath);
        }
      }
    } catch (error) {
      console.error(`Failed to delete old log files: ${error}`);
    }
  }
}
