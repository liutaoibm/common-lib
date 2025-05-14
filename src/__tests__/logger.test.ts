import { createLogger, LogLevel, LogEntry } from '../';
import { TextFormatter, JsonFormatter } from '../formatters';
import { ConsoleTransport, FileTransport } from '../transports';
import { CommonLogger } from '../logger';

// Mock the console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
let consoleLogMock: jest.Mock;
let consoleErrorMock: jest.Mock;

// Mock the fs functions
jest.mock('fs', () => ({
  mkdir: jest.fn((path, options, callback) => callback(null)),
  appendFile: jest.fn((path, data, callback) => callback(null)),
  stat: jest.fn((path, callback) => callback(null, { size: 100, mtime: new Date() })),
  readdir: jest.fn((path, callback) => callback(null, [])),
  rename: jest.fn((oldPath, newPath, callback) => callback(null)),
  unlink: jest.fn((path, callback) => callback(null)),
  writeFile: jest.fn((path, data, callback) => callback(null)),
}));

describe('Logger', () => {
  beforeEach(() => {
    // Mock console methods
    consoleLogMock = jest.fn();
    consoleErrorMock = jest.fn();
    console.log = consoleLogMock;
    console.error = consoleErrorMock;
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  describe('TextFormatter', () => {
    it('should format a log entry as text', () => {
      const formatter = new TextFormatter();
      const entry: LogEntry = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: LogLevel.INFO,
        message: 'Test message',
        context: { key: 'value' },
      };
      
      const result = formatter.format(entry);
      
      expect(result).toContain('[2023-01-01T12:00:00.000Z]');
      expect(result).toContain('[INFO]');
      expect(result).toContain('Test message');
      expect(result).toContain('{"key":"value"}');
    });
    
    it('should support colorized output', () => {
      const formatter = new TextFormatter({ colorize: true });
      const entry: LogEntry = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: LogLevel.ERROR,
        message: 'Error message',
      };
      
      const result = formatter.format(entry);
      
      expect(result).toContain('\x1b[31m[ERROR]\x1b[0m'); // Red color for ERROR
    });
  });
  
  describe('JsonFormatter', () => {
    it('should format a log entry as JSON', () => {
      const formatter = new JsonFormatter();
      const entry: LogEntry = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: LogLevel.INFO,
        message: 'Test message',
        context: { key: 'value' },
      };
      
      const result = formatter.format(entry);
      const parsed = JSON.parse(result);
      
      expect(parsed).toEqual({
        timestamp: '2023-01-01T12:00:00.000Z',
        level: 'info',
        message: 'Test message',
        context: { key: 'value' },
      });
    });
  });
  
  describe('ConsoleTransport', () => {
    it('should log to console', async () => {
      const transport = new ConsoleTransport();
      const entry: LogEntry = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: LogLevel.INFO,
        message: 'Test message',
      };
      
      await transport.transport(entry);
      
      expect(consoleLogMock).toHaveBeenCalledTimes(1);
      const loggedMessage = consoleLogMock.mock.calls[0][0];
      expect(loggedMessage).toContain('Test message');
    });
    
    it('should use console.error for error logs', async () => {
      const transport = new ConsoleTransport({ useErrorConsole: true });
      const entry: LogEntry = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: LogLevel.ERROR,
        message: 'Error message',
      };
      
      await transport.transport(entry);
      
      expect(consoleErrorMock).toHaveBeenCalledTimes(1);
      const loggedMessage = consoleErrorMock.mock.calls[0][0];
      expect(loggedMessage).toContain('Error message');
    });
  });
  
  describe('Logger', () => {
    it('should create a logger with default settings', async () => {
      // Create a transport directly instead of using createLogger
      const transport = new ConsoleTransport();
      const logger = new CommonLogger({}, [transport]);
      
      // Make the transport.transport method synchronous for testing
      jest.spyOn(transport, 'transport').mockImplementation(async (entry) => {
        transport['formatter'].format(entry);
        consoleLogMock(transport['formatter'].format(entry));
        return Promise.resolve();
      });
      
      await logger.info('Test message');
      
      expect(consoleLogMock).toHaveBeenCalledTimes(1);
      const loggedMessage = consoleLogMock.mock.calls[0][0];
      expect(loggedMessage).toContain('Test message');
    });
    
    it('should respect minimum log level', async () => {
      const transport = new ConsoleTransport();
      const logger = new CommonLogger({ minLevel: LogLevel.WARN }, [transport]);
      
      // Make the transport.transport method synchronous for testing
      jest.spyOn(transport, 'transport').mockImplementation(async (entry) => {
        consoleLogMock(transport['formatter'].format(entry));
        return Promise.resolve();
      });
      
      await logger.info('Info message'); // Should be filtered out
      await logger.warn('Warning message'); // Should be logged
      
      expect(consoleLogMock).toHaveBeenCalledTimes(1);
      const loggedMessage = consoleLogMock.mock.calls[0][0];
      expect(loggedMessage).toContain('Warning message');
    });
    
    it('should create child loggers with namespaces', async () => {
      const transport = new ConsoleTransport();
      const logger = new CommonLogger({}, [transport]);
      
      // Make the transport.transport method synchronous for testing
      jest.spyOn(transport, 'transport').mockImplementation(async (entry) => {
        consoleLogMock(transport['formatter'].format(entry));
        return Promise.resolve();
      });
      
      const childLogger = logger.withNamespace('child');
      await childLogger.info('Child message');
      
      expect(consoleLogMock).toHaveBeenCalledTimes(1);
      const loggedMessage = consoleLogMock.mock.calls[0][0];
      expect(loggedMessage).toContain('[child]');
      expect(loggedMessage).toContain('Child message');
    });
    
    it('should create child loggers with context', async () => {
      const transport = new ConsoleTransport();
      const logger = new CommonLogger({}, [transport]);
      
      // Make the transport.transport method synchronous for testing
      jest.spyOn(transport, 'transport').mockImplementation(async (entry) => {
        consoleLogMock(transport['formatter'].format(entry));
        return Promise.resolve();
      });
      
      const childLogger = logger.withContext({ requestId: '123' });
      await childLogger.info('Context message');
      
      expect(consoleLogMock).toHaveBeenCalledTimes(1);
      const loggedMessage = consoleLogMock.mock.calls[0][0];
      expect(loggedMessage).toContain('Context message');
      expect(loggedMessage).toContain('"requestId":"123"');
    });
    
    it('should apply transforms to log entries', async () => {
      const transport = new ConsoleTransport();
      const logger = new CommonLogger({
        transforms: [
          (entry) => ({
            ...entry,
            message: `Transformed: ${entry.message}`,
          }),
        ],
      }, [transport]);
      
      // Make the transport.transport method synchronous for testing
      jest.spyOn(transport, 'transport').mockImplementation(async (entry) => {
        consoleLogMock(transport['formatter'].format(entry));
        return Promise.resolve();
      });
      
      await logger.info('Original message');
      
      expect(consoleLogMock).toHaveBeenCalledTimes(1);
      const loggedMessage = consoleLogMock.mock.calls[0][0];
      expect(loggedMessage).toContain('Transformed: Original message');
    });
  });
});
