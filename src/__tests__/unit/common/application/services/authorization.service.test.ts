import { beforeEach, describe, expect, it } from 'vitest';
import { AuthorizationService } from '@app/common/application/services/authorization.service';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { AuthorizationExceptionCode } from '@app/common/enums/authorization-exception-code';
import type { AppContext } from '@app/common/interfaces/context';
import { BusinessException } from '@app/common/utils/exceptions';

describe('AuthorizationService', () => {
  let service: AuthorizationService;
  let context: AppContext;

  beforeEach(() => {
    service = new AuthorizationService();
    context = {
      user: undefined,
    };
  });

  describe('requireAuthenticated - happy path', () => {
    it('should not throw when user is authenticated', () => {
      context.user = {
        userId: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        roles: [],
      };

      expect(() => service.requireAuthenticated(context)).not.toThrow();
      expect(context.user).toBeDefined();
      expect(context.user.userId.getValue()).toBe(
        '550e8400-e29b-41d4-a716-446655440000'
      );
    });

    it('should narrow type when user is authenticated', () => {
      context.user = {
        userId: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        roles: [],
      };

      service.requireAuthenticated(context);

      expect(context.user.userId.getValue()).toBe(
        '550e8400-e29b-41d4-a716-446655440000'
      );
    });
  });

  describe('requireAuthenticated - validation errors', () => {
    it('should throw BusinessException when user is undefined', () => {
      context.user = undefined;

      expect(() => service.requireAuthenticated(context)).toThrow(
        BusinessException
      );
      expect(() => service.requireAuthenticated(context)).toThrow(
        'Authentication required'
      );
    });

    it('should throw BusinessException when user.userId is undefined', () => {
      context.user = {
        userId: undefined as unknown as Uuid,
        roles: [],
      };

      expect(() => service.requireAuthenticated(context)).toThrow(
        BusinessException
      );
    });

    it('should throw with UNAUTHORIZED error code', () => {
      context.user = undefined;

      try {
        service.requireAuthenticated(context);
        expect.fail('Should have thrown BusinessException');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).code).toBe(
          AuthorizationExceptionCode.UNAUTHORIZED
        );
      }
    });
  });

  describe('requireRole - happy path', () => {
    it('should not throw when user has required role', () => {
      context.user = {
        userId: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        roles: ['USER', 'EDITOR'],
      };

      expect(() => service.requireRole('EDITOR', context)).not.toThrow();
    });

    it('should not throw when user has admin role', () => {
      context.user = {
        userId: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        roles: ['ADMIN'],
      };

      expect(() => service.requireRole('EDITOR', context)).not.toThrow();
    });

    it('should not throw when user has admin role even without required role', () => {
      context.user = {
        userId: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        roles: ['ADMIN'],
      };

      expect(() => service.requireRole('SUPER_ADMIN', context)).not.toThrow();
    });
  });

  describe('requireRole - validation errors', () => {
    it('should throw BusinessException when user is not authenticated', () => {
      context.user = undefined;

      expect(() => service.requireRole('EDITOR', context)).toThrow(
        BusinessException
      );
    });

    it('should throw BusinessException when user does not have required role', () => {
      context.user = {
        userId: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        roles: ['USER'],
      };

      expect(() => service.requireRole('EDITOR', context)).toThrow(
        BusinessException
      );
    });

    it('should throw with FORBIDDEN error code', () => {
      context.user = {
        userId: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        roles: ['USER'],
      };

      try {
        service.requireRole('EDITOR', context);
        expect.fail('Should have thrown BusinessException');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).code).toBe(
          AuthorizationExceptionCode.FORBIDDEN
        );
        expect((error as BusinessException).data).toEqual({
          requiredRole: 'EDITOR',
        });
      }
    });

    it('should include required role in error message', () => {
      context.user = {
        userId: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        roles: ['USER'],
      };

      try {
        service.requireRole('EDITOR', context);
        expect.fail('Should have thrown BusinessException');
      } catch (error) {
        expect((error as BusinessException).message).toContain('EDITOR');
      }
    });

    it('should handle empty roles array', () => {
      context.user = {
        userId: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        roles: [],
      };

      expect(() => service.requireRole('EDITOR', context)).toThrow(
        BusinessException
      );
    });

    it('should handle undefined roles', () => {
      context.user = {
        userId: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        roles: undefined,
      };

      expect(() => service.requireRole('EDITOR', context)).toThrow(
        BusinessException
      );
    });
  });

  describe('requireOneOfRoles - happy path', () => {
    it('should not throw when user has one of the required roles', () => {
      context.user = {
        userId: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        roles: ['USER', 'EDITOR'],
      };

      expect(() =>
        service.requireOneOfRoles(['EDITOR', 'ADMIN'], context)
      ).not.toThrow();
    });

    it('should not throw when user has admin role', () => {
      context.user = {
        userId: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        roles: ['ADMIN'],
      };

      expect(() =>
        service.requireOneOfRoles(['EDITOR', 'VIEWER'], context)
      ).not.toThrow();
    });

    it('should not throw when user has multiple required roles', () => {
      context.user = {
        userId: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        roles: ['EDITOR', 'VIEWER'],
      };

      expect(() =>
        service.requireOneOfRoles(['EDITOR', 'VIEWER'], context)
      ).not.toThrow();
    });
  });

  describe('requireOneOfRoles - validation errors', () => {
    it('should throw BusinessException when user is not authenticated', () => {
      context.user = undefined;

      expect(() =>
        service.requireOneOfRoles(['EDITOR', 'VIEWER'], context)
      ).toThrow(BusinessException);
    });

    it('should throw BusinessException when user does not have any required role', () => {
      context.user = {
        userId: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        roles: ['USER'],
      };

      expect(() =>
        service.requireOneOfRoles(['EDITOR', 'VIEWER'], context)
      ).toThrow(BusinessException);
    });

    it('should throw with FORBIDDEN error code', () => {
      context.user = {
        userId: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        roles: ['USER'],
      };

      try {
        service.requireOneOfRoles(['EDITOR', 'VIEWER'], context);
        expect.fail('Should have thrown BusinessException');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).code).toBe(
          AuthorizationExceptionCode.FORBIDDEN
        );
        expect((error as BusinessException).data).toEqual({
          requiredRoles: ['EDITOR', 'VIEWER'],
        });
      }
    });

    it('should include required roles in error message', () => {
      context.user = {
        userId: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        roles: ['USER'],
      };

      try {
        service.requireOneOfRoles(['EDITOR', 'VIEWER'], context);
        expect.fail('Should have thrown BusinessException');
      } catch (error) {
        expect((error as BusinessException).message).toContain('EDITOR');
        expect((error as BusinessException).message).toContain('VIEWER');
      }
    });

    it('should handle empty roles array', () => {
      context.user = {
        userId: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        roles: [],
      };

      expect(() =>
        service.requireOneOfRoles(['EDITOR', 'VIEWER'], context)
      ).toThrow(BusinessException);
    });

    it('should handle undefined roles', () => {
      context.user = {
        userId: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        roles: undefined,
      };

      expect(() =>
        service.requireOneOfRoles(['EDITOR', 'VIEWER'], context)
      ).toThrow(BusinessException);
    });

    it('should handle empty required roles array', () => {
      context.user = {
        userId: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        roles: ['USER'],
      };

      expect(() => service.requireOneOfRoles([], context)).toThrow(
        BusinessException
      );
    });
  });

  describe('hasAdminRole - happy path', () => {
    it('should return true when user has admin role', () => {
      context.user = {
        userId: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        roles: ['ADMIN'],
      };

      expect(service.hasAdminRole(context)).toBe(true);
    });

    it('should return true when user has admin role among other roles', () => {
      context.user = {
        userId: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        roles: ['USER', 'ADMIN', 'EDITOR'],
      };

      expect(service.hasAdminRole(context)).toBe(true);
    });

    it('should return false when user does not have admin role', () => {
      context.user = {
        userId: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        roles: ['USER', 'EDITOR'],
      };

      expect(service.hasAdminRole(context)).toBe(false);
    });

    it('should return false when user has no roles', () => {
      context.user = {
        userId: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        roles: [],
      };

      expect(service.hasAdminRole(context)).toBe(false);
    });

    it('should return false when user is undefined', () => {
      context.user = undefined;

      expect(service.hasAdminRole(context)).toBe(false);
    });

    it('should return false when roles is undefined', () => {
      context.user = {
        userId: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        roles: undefined,
      };

      expect(service.hasAdminRole(context)).toBe(false);
    });
  });
});
