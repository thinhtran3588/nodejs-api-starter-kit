import type { FastifyReply, FastifyRequest } from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createGraphQLContext } from '@app/application/graphql/context';

describe('createGraphQLContext', () => {
  let mockRequest: FastifyRequest;
  let mockReply: FastifyReply;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      appContext: {
        user: undefined,
      },
      server: {
        diContainer: {
          resolve: vi.fn(),
        },
      },
    } as unknown as FastifyRequest;

    mockReply = {} as FastifyReply;
  });

  describe('happy path', () => {
    it('should create GraphQL context with appContext, request, and reply', () => {
      const context = createGraphQLContext(mockRequest, mockReply);

      expect(context).toHaveProperty('appContext');
      expect(context).toHaveProperty('request');
      expect(context).toHaveProperty('reply');
      expect(context.appContext).toHaveProperty('user');
      expect(context.request).toBe(mockRequest);
      expect(context.reply).toBe(mockReply);
    });

    it('should create GraphQL context with user when token is valid', async () => {
      const { Uuid } = await import('@app/common/domain/value-objects/uuid');
      const userId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');

      (mockRequest as any).appContext = {
        user: {
          userId,
          roles: ['USER'],
        },
      };

      const context = createGraphQLContext(mockRequest, mockReply);

      expect(context.appContext.user).toBeDefined();
      expect(context.appContext.user?.userId.getValue()).toBe(
        '550e8400-e29b-41d4-a716-446655440000'
      );
    });

    it('should create GraphQL context without user when token is invalid', () => {
      const context = createGraphQLContext(mockRequest, mockReply);

      expect(context.appContext.user).toBeUndefined();
    });
  });
});
