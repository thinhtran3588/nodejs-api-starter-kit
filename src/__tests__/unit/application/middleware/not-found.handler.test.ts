import type { FastifyReply, FastifyRequest } from 'fastify';
import { describe, expect, it, vi } from 'vitest';
import { notFoundHandler } from '@app/application/middleware/not-found.handler';

describe('notFoundHandler', () => {
  describe('happy path', () => {
    it('should return 404 status with error message', () => {
      const mockRequest = {
        method: 'GET',
        url: '/api/users',
      } as FastifyRequest;

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
      } as unknown as FastifyReply;

      notFoundHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Route GET:/api/users not found',
        error: 'Not Found',
      });
    });

    it('should include method and URL in error message', () => {
      const mockRequest = {
        method: 'POST',
        url: '/api/auth/login',
      } as FastifyRequest;

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
      } as unknown as FastifyReply;

      notFoundHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Route POST:/api/auth/login not found',
        error: 'Not Found',
      });
    });

    it('should handle different HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      methods.forEach((method) => {
        const mockRequest = {
          method,
          url: '/test',
        } as FastifyRequest;

        const mockReply = {
          status: vi.fn().mockReturnThis(),
          send: vi.fn().mockReturnThis(),
        } as unknown as FastifyReply;

        notFoundHandler(mockRequest, mockReply);

        expect(mockReply.send).toHaveBeenCalledWith({
          message: `Route ${method}:/test not found`,
          error: 'Not Found',
        });
      });
    });
  });

  describe('edge cases', () => {
    it('should handle root path', () => {
      const mockRequest = {
        method: 'GET',
        url: '/',
      } as FastifyRequest;

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
      } as unknown as FastifyReply;

      notFoundHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Route GET:/ not found',
        error: 'Not Found',
      });
    });

    it('should handle URL with query parameters', () => {
      const mockRequest = {
        method: 'GET',
        url: '/api/users?page=1&limit=10',
      } as FastifyRequest;

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
      } as unknown as FastifyReply;

      notFoundHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'Route GET:/api/users?page=1&limit=10 not found',
        error: 'Not Found',
      });
    });
  });
});
