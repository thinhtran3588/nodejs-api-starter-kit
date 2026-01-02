import type { FastifyReply, FastifyRequest } from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  attachAppContext,
  extractBearerToken,
  extractUserContext,
} from '@app/application/middleware/attach-app-context';
import type { JwtService } from '@app/common/infrastructure/services/jwt.service';
import type { AppContext } from '@app/common/interfaces/context';

describe('extractBearerToken', () => {
  describe('happy path', () => {
    it('should extract token from Bearer authorization header', () => {
      const token = extractBearerToken('Bearer test-token-123');

      expect(token).toBe('test-token-123');
    });

    it('should extract token with case-insensitive Bearer prefix', () => {
      const token = extractBearerToken('bearer test-token-123');

      expect(token).toBe('test-token-123');
    });

    it('should trim whitespace from token', () => {
      const token = extractBearerToken('Bearer  test-token-123  ');

      expect(token).toBe('test-token-123');
    });
  });

  describe('edge cases', () => {
    it('should return undefined when authorization header is undefined', () => {
      const token = extractBearerToken(undefined);

      expect(token).toBeUndefined();
    });

    it('should return undefined when authorization header is empty string', () => {
      const token = extractBearerToken('');

      expect(token).toBeUndefined();
    });

    it('should return undefined when authorization header does not start with Bearer', () => {
      const token = extractBearerToken('Basic dGVzdA==');

      expect(token).toBeUndefined();
    });

    it('should return undefined when authorization header is only "Bearer"', () => {
      const token = extractBearerToken('Bearer');

      expect(token).toBeUndefined();
    });

    it('should return undefined when authorization header is only "Bearer "', () => {
      const token = extractBearerToken('Bearer ');

      expect(token).toBeUndefined();
    });

    it('should handle extra spaces in Bearer prefix', () => {
      const token = extractBearerToken('Bearer  token-with-spaces');

      expect(token).toBe('token-with-spaces');
    });
  });
});

describe('extractUserContext', () => {
  let mockJwtService: JwtService;
  let mockRequest: FastifyRequest;

  beforeEach(() => {
    mockJwtService = {
      verifyToken: vi.fn(),
    } as unknown as JwtService;

    mockRequest = {
      headers: {},
      server: {
        diContainer: {
          resolve: vi.fn(() => mockJwtService),
        },
      },
    } as unknown as FastifyRequest;
  });

  describe('happy path', () => {
    it('should extract user context from valid JWT token', () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };
      vi.mocked(mockJwtService.verifyToken).mockReturnValue({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        roles: ['USER'],
      });

      const userContext = extractUserContext(mockRequest);

      expect(userContext).toBeDefined();
      expect(userContext?.userId.getValue()).toBe(
        '550e8400-e29b-41d4-a716-446655440000'
      );
      expect(userContext?.roles).toEqual(['USER']);
      expect(mockJwtService.verifyToken).toHaveBeenCalled();
    });

    it('should extract user context with empty roles array', () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };
      vi.mocked(mockJwtService.verifyToken).mockReturnValue({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        roles: [],
      });

      const userContext = extractUserContext(mockRequest);

      expect(userContext).toBeDefined();
      expect(userContext?.userId.getValue()).toBe(
        '550e8400-e29b-41d4-a716-446655440000'
      );
      expect(userContext?.roles).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should return undefined when authorization header is missing', () => {
      mockRequest.headers = {};

      const userContext = extractUserContext(mockRequest);

      expect(userContext).toBeUndefined();
      expect(mockJwtService.verifyToken).not.toHaveBeenCalled();
    });

    it('should return undefined when Bearer token is invalid', () => {
      mockRequest.headers = {
        authorization: 'Invalid token',
      };

      const userContext = extractUserContext(mockRequest);

      expect(userContext).toBeUndefined();
      expect(mockJwtService.verifyToken).not.toHaveBeenCalled();
    });

    it('should return undefined when JWT verification fails', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };
      vi.mocked(mockJwtService.verifyToken).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const userContext = extractUserContext(mockRequest);

      expect(userContext).toBeUndefined();
    });

    it('should return undefined when userId is missing from token', () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };
      vi.mocked(mockJwtService.verifyToken).mockReturnValue({
        userId: undefined,
        roles: ['USER'],
      } as unknown as { userId: string; roles: string[] });

      const userContext = extractUserContext(mockRequest);

      expect(userContext).toBeUndefined();
    });

    it('should return undefined when userId is empty string', () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };
      vi.mocked(mockJwtService.verifyToken).mockReturnValue({
        userId: '',
        roles: ['USER'],
      });

      const userContext = extractUserContext(mockRequest);

      expect(userContext).toBeUndefined();
    });

    it('should return undefined when userId is invalid UUID', () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };
      vi.mocked(mockJwtService.verifyToken).mockReturnValue({
        userId: 'invalid-uuid',
        roles: ['USER'],
      });

      const userContext = extractUserContext(mockRequest);

      expect(userContext).toBeUndefined();
    });

    it('should return undefined when JWT service throws error', () => {
      mockRequest.headers = {
        authorization: 'Bearer test-token',
      };
      vi.mocked(mockRequest.server.diContainer.resolve).mockImplementation(
        () => {
          throw new Error('Service not found');
        }
      );

      const userContext = extractUserContext(mockRequest);

      expect(userContext).toBeUndefined();
    });
  });
});

describe('attachAppContext', () => {
  let mockRequest: FastifyRequest & { appContext?: AppContext };
  let mockReply: FastifyReply;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      server: {
        diContainer: {
          resolve: vi.fn(),
        },
      },
    } as unknown as FastifyRequest & { appContext?: AppContext };

    mockReply = {} as FastifyReply;
  });

  describe('happy path', () => {
    it('should attach app context with user when token is valid', async () => {
      const mockJwtService = {
        verifyToken: vi.fn().mockReturnValue({
          userId: '550e8400-e29b-41d4-a716-446655440000',
          roles: ['USER'],
        }),
      };

      vi.mocked(mockRequest.server.diContainer.resolve).mockReturnValue(
        mockJwtService
      );

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      await attachAppContext(mockRequest, mockReply);

      expect(mockRequest.appContext).toBeDefined();
      expect(mockRequest.appContext?.user).toBeDefined();
      expect(mockRequest.appContext?.user?.userId.getValue()).toBe(
        '550e8400-e29b-41d4-a716-446655440000'
      );
      expect(mockRequest.appContext?.user?.roles).toEqual(['USER']);
    });

    it('should attach app context without user when token is invalid', async () => {
      mockRequest.headers = {};

      await attachAppContext(mockRequest, mockReply);

      expect(mockRequest.appContext).toBeDefined();
      expect(mockRequest.appContext?.user).toBeUndefined();
    });
  });
});
