/**
 * Jest setup file
 * Runs before each test suite
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/pwgaming_test';
process.env.REDIS_URL =
  process.env.TEST_REDIS_URL || 'redis://localhost:6379/1';
process.env.JWT_SECRET = 'test-secret-key-do-not-use-in-production';

// Set test timeouts
jest.setTimeout(10000); // 10 seconds for tests

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log during tests (keep error and warn)
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};
