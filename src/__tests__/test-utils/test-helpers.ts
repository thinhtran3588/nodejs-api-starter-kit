import Fastify, { type FastifyBaseLogger, type FastifyInstance } from 'fastify';
import { vi } from 'vitest';
import type { Logger } from '@app/common/domain/interfaces/logger';

/**
 * Test helper utilities for creating test instances and common test operations
 */

/**
 * Creates a test Fastify instance with minimal configuration
 */
export function createTestApp(): FastifyInstance {
  return Fastify({
    logger: false, // Disable logging in tests
  });
}

/**
 * Creates a mock FastifyBaseLogger for testing
 * This is used when creating the DI container which expects FastifyBaseLogger
 */
export function createMockFastifyLogger(): FastifyBaseLogger {
  return {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(),
    level: 'info',
    silent: vi.fn(),
  } as unknown as FastifyBaseLogger;
}

/**
 * Creates a mock Logger for testing
 * This is used when directly injecting Logger into services
 */
export function createMockLogger(): Logger {
  return {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  };
}

/**
 * Waits for a specified amount of time (useful for async testing)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a mock request object
 */
export function createMockRequest(overrides: Record<string, unknown> = {}) {
  return {
    method: 'GET',
    url: '/',
    headers: {},
    query: {},
    params: {},
    body: {},
    ...overrides,
  };
}

/**
 * Creates a mock reply object
 * Note: For Fastify testing, use app.inject() instead of mocking reply
 */
export function createMockReply() {
  // This is a placeholder - Fastify's inject method handles replies automatically
  return {};
}

/**
 * Helper to check if a value is a valid JSON
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper to extract error message from response
 */
export function extractErrorMessage(response: unknown): string {
  if (typeof response === 'string') {
    try {
      const parsed = JSON.parse(response) as Record<string, unknown>;
      return (
        (parsed['message'] as string) ??
        (parsed['error'] as string) ??
        'Unknown error'
      );
    } catch {
      return response;
    }
  }
  if (typeof response === 'object' && response !== null) {
    const obj = response as Record<string, unknown>;
    return (
      (obj['message'] as string) ?? (obj['error'] as string) ?? 'Unknown error'
    );
  }
  return 'Unknown error';
}
