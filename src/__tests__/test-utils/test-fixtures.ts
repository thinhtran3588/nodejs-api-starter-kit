import { expect } from 'vitest';

/**
 * Test fixtures and sample data for testing
 * Use these to maintain consistency across tests
 */

export const testFixtures = {
  healthCheck: {
    expectedResponse: {
      status: 'ok',
    },
  },

  rootEndpoint: {
    expectedResponse: 'Server is running',
  },

  errorResponses: {
    notFound: {
      statusCode: 404,
    },
    badRequest: {
      statusCode: 400,
    },
    internalServerError: {
      statusCode: 500,
    },
  },

  users: {
    validUser: {
      email: 'test@example.com',
      name: 'Test User',
    },
    validUser2: {
      email: 'test2@example.com',
      name: 'Test User 2',
    },
    invalidEmail: {
      email: 'invalid-email',
      name: 'Test User',
    },
    missingEmail: {
      name: 'Test User',
    },
    missingName: {
      email: 'test@example.com',
    },
    emptyName: {
      email: 'test@example.com',
      name: '',
    },
    whitespaceName: {
      email: 'test@example.com',
      name: '   ',
    },
    specialCharacters: {
      email: 'user+tag@example.com',
      name: "O'Brien-Smith & Co.",
    },
    unicode: {
      email: 'unicode@example.com',
      name: 'José García 中文',
    },
    nonExistentId: '00000000-0000-0000-0000-000000000000',
    invalidId: 'not-a-valid-uuid',
  },

  uuids: {
    user123: '550e8400-e29b-41d4-a716-446655440000',
    user456: '550e8400-e29b-41d4-a716-446655440001',
    admin123: '550e8400-e29b-41d4-a716-446655440002',
    viewer123: '550e8400-e29b-41d4-a716-446655440003',
    group123: '660e8400-e29b-41d4-a716-446655440000',
    group456: '660e8400-e29b-41d4-a716-446655440001',
    role123: '770e8400-e29b-41d4-a716-446655440000',
    role456: '770e8400-e29b-41d4-a716-446655440001',
    nonexistent123: '880e8400-e29b-41d4-a716-446655440000',
  },
};

/**
 * Helper to create test request options
 */
export function createTestRequestOptions(
  overrides: Record<string, unknown> = {}
) {
  return {
    method: 'GET',
    url: '/',
    headers: {
      'content-type': 'application/json',
    },
    ...overrides,
  };
}

/**
 * Helper to create test response expectations
 */
export function expectSuccessResponse(response: {
  statusCode: number;
  json: () => unknown;
  headers: Record<string, string | string[] | undefined>;
}) {
  expect(response.statusCode).toBe(200);
  expect(response.headers['content-type']).toContain('application/json');
  return response.json();
}
