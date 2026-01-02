import type {
  FastifyBaseLogger,
  FastifyError,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '@app/application/middleware/error.handler';
import { ErrorCodeRegistry } from '@app/common/utils/error-code-registry';
import {
  BusinessException,
  ValidationException,
} from '@app/common/utils/exceptions';

describe('errorHandler', () => {
  let mockRequest: FastifyRequest;
  let mockReply: FastifyReply;
  let mockErrorCodeRegistry: ErrorCodeRegistry;
  let mockLog: FastifyBaseLogger;

  beforeEach(() => {
    mockRequest = {} as FastifyRequest;
    mockReply = {
      raw: {
        statusCode: 200,
        setHeader: vi.fn(),
        end: vi.fn(),
      },
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    } as unknown as FastifyReply;

    mockErrorCodeRegistry = {
      getStatusCode: vi.fn(),
    } as unknown as ErrorCodeRegistry;

    mockLog = {
      error: vi.fn(),
    } as unknown as FastifyBaseLogger;
  });

  describe('BusinessException handling', () => {
    it('should handle BusinessException with status code from registry', () => {
      const error = new BusinessException('TEST_ERROR', { field: 'test' });
      vi.mocked(mockErrorCodeRegistry.getStatusCode).mockReturnValue(400);

      errorHandler(
        error,
        mockRequest,
        mockReply,
        mockErrorCodeRegistry,
        mockLog
      );

      expect(mockErrorCodeRegistry.getStatusCode).toHaveBeenCalledWith(
        'TEST_ERROR'
      );
      expect(mockReply.raw.statusCode).toBe(400);
      expect(mockReply.raw.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/json'
      );
      expect(mockReply.raw.end).toHaveBeenCalledWith(
        JSON.stringify({
          error: 'TEST_ERROR',
          data: { field: 'test' },
        })
      );
    });

    it('should handle BusinessException with default status code 400 when registry returns undefined', () => {
      const error = new BusinessException('TEST_ERROR');
      vi.mocked(mockErrorCodeRegistry.getStatusCode).mockReturnValue(undefined);

      errorHandler(
        error,
        mockRequest,
        mockReply,
        mockErrorCodeRegistry,
        mockLog
      );

      expect(mockReply.raw.statusCode).toBe(400);
    });

    it('should handle BusinessException without data', () => {
      const error = new BusinessException('TEST_ERROR');
      vi.mocked(mockErrorCodeRegistry.getStatusCode).mockReturnValue(404);

      errorHandler(
        error,
        mockRequest,
        mockReply,
        mockErrorCodeRegistry,
        mockLog
      );

      expect(mockReply.raw.end).toHaveBeenCalledWith(
        JSON.stringify({
          error: 'TEST_ERROR',
          data: undefined,
        })
      );
    });

    it('should handle ValidationException (extends BusinessException)', () => {
      const error = new ValidationException('VALIDATION_ERROR', {
        field: 'email',
      });
      vi.mocked(mockErrorCodeRegistry.getStatusCode).mockReturnValue(422);

      errorHandler(
        error,
        mockRequest,
        mockReply,
        mockErrorCodeRegistry,
        mockLog
      );

      expect(mockReply.raw.statusCode).toBe(422);
      expect(mockReply.raw.end).toHaveBeenCalledWith(
        JSON.stringify({
          error: 'VALIDATION_ERROR',
          data: { field: 'email' },
        })
      );
    });
  });

  describe('Fastify validation error handling', () => {
    it('should handle Fastify validation error with validation property', () => {
      const error = {
        validation: [{ field: 'email', message: 'Invalid email' }],
        statusCode: 400,
        code: 'FST_ERR_VALIDATION',
        name: 'FastifyError',
        message: 'Validation error',
      } as unknown as FastifyError;

      errorHandler(
        error,
        mockRequest,
        mockReply,
        mockErrorCodeRegistry,
        mockLog
      );

      expect(mockReply.raw.statusCode).toBe(400);
      expect(mockReply.raw.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/json'
      );
      expect(mockReply.raw.end).toHaveBeenCalledWith(
        JSON.stringify({
          error: 'VALIDATION_ERROR',
          data: {
            validation: [{ field: 'email', message: 'Invalid email' }],
          },
        })
      );
    });

    it('should handle Fastify validation error with validationContext property', () => {
      const error = {
        validationContext: 'body',
        statusCode: 400,
      } as FastifyError;

      errorHandler(
        error,
        mockRequest,
        mockReply,
        mockErrorCodeRegistry,
        mockLog
      );

      expect(mockReply.raw.statusCode).toBe(400);
      expect(mockReply.raw.end).toHaveBeenCalledWith(
        JSON.stringify({
          error: 'VALIDATION_ERROR',
          data: {
            validation: 'body',
          },
        })
      );
    });

    it('should handle Fastify validation error with FST_ERR_VALIDATION code', () => {
      const error = {
        statusCode: 400,
        code: 'FST_ERR_VALIDATION',
      } as FastifyError;

      errorHandler(
        error,
        mockRequest,
        mockReply,
        mockErrorCodeRegistry,
        mockLog
      );

      expect(mockReply.raw.statusCode).toBe(400);
      expect(mockReply.raw.end).toHaveBeenCalledWith(
        JSON.stringify({
          error: 'VALIDATION_ERROR',
          data: {
            validation: undefined,
          },
        })
      );
    });

    it('should handle Fastify validation error with validation property and validationContext', () => {
      const error = {
        validation: [{ field: 'email' }],
        validationContext: 'body',
        statusCode: 400,
        code: 'FST_ERR_VALIDATION',
        name: 'FastifyError',
        message: 'Validation error',
      } as unknown as FastifyError;

      errorHandler(
        error,
        mockRequest,
        mockReply,
        mockErrorCodeRegistry,
        mockLog
      );

      expect(mockReply.raw.end).toHaveBeenCalledWith(
        JSON.stringify({
          error: 'VALIDATION_ERROR',
          data: {
            validation: [{ field: 'email' }],
          },
        })
      );
    });
  });

  describe('generic error handling', () => {
    it('should handle generic Error with 500 status code', () => {
      const error = new Error('Internal server error');

      errorHandler(
        error,
        mockRequest,
        mockReply,
        mockErrorCodeRegistry,
        mockLog
      );

      expect(mockLog.error).toHaveBeenCalledWith(error);
      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      });
    });

    it('should handle FastifyError that is not a validation error', () => {
      const error = {
        statusCode: 500,
        code: 'FST_ERR_SOMETHING',
        message: 'Something went wrong',
      } as FastifyError;

      errorHandler(
        error,
        mockRequest,
        mockReply,
        mockErrorCodeRegistry,
        mockLog
      );

      expect(mockLog.error).toHaveBeenCalledWith(error);
      expect(mockReply.code).toHaveBeenCalledWith(500);
    });
  });

  describe('edge cases', () => {
    it('should handle error with validation property set to false', () => {
      const error = {
        validation: false,
        statusCode: 400,
      } as unknown as FastifyError;

      errorHandler(
        error,
        mockRequest,
        mockReply,
        mockErrorCodeRegistry,
        mockLog
      );

      expect(mockLog.error).toHaveBeenCalledWith(error);
      expect(mockReply.code).toHaveBeenCalledWith(500);
    });

    it('should handle error with statusCode 400 but non-validation code', () => {
      const error = {
        statusCode: 400,
        code: 'FST_ERR_SOMETHING',
      } as FastifyError;

      errorHandler(
        error,
        mockRequest,
        mockReply,
        mockErrorCodeRegistry,
        mockLog
      );

      expect(mockLog.error).toHaveBeenCalledWith(error);
      expect(mockReply.code).toHaveBeenCalledWith(500);
    });
  });
});
