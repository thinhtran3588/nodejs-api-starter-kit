import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';

/**
 * Global test setup and teardown
 * This file runs before all tests
 *
 * IMPORTANT: Environment variables are loaded at the top level (before any hooks)
 * to ensure they are available when test files are imported, especially for
 * integration tests that check database availability at module load time.
 */

// Set test environment variables first (before loading .env files)
process.env['NODE_ENV'] = 'test';
process.env['PORT'] = '0'; // Use random port for tests
process.env['HOST'] = '127.0.0.1';

beforeAll(() => {
  // Additional setup if needed
});

afterAll(() => {
  // Cleanup after all tests
  delete process.env['NODE_ENV'];
});

beforeEach(() => {
  // Setup before each test
});

afterEach(() => {
  // Cleanup after each test
});
