/**
 * Common logging library for Node.js applications.
 * Provides standardized logging patterns and output channels for easy integration.
 */

// Export the core types
export * from './types';

// Export the formatters
export * from './formatters';

// Export the transports
export * from './transports';

// Export the logger
export * from './logger';

// Export convenient default functions
import { createLogger, getLogger, resetLogger } from './logger';
export { createLogger, getLogger, resetLogger };
export default getLogger();
