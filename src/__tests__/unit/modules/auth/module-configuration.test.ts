import { asValue, createContainer } from 'awilix';
import { describe, expect, it } from 'vitest';
import { createMockLogger } from '@app/__tests__/test-utils/test-helpers';
import type { EventDispatcher } from '@app/common/domain/interfaces/event-dispatcher';
import { EventDispatcher as EventDispatcherImpl } from '@app/common/infrastructure/event-dispatcher';
import { ErrorCodeRegistry } from '@app/common/utils/error-code-registry';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import type { UserRepository } from '@app/modules/auth/domain/interfaces/repositories/user.repository';
import { moduleConfiguration } from '@app/modules/auth/module-configuration';

describe('module-configuration', () => {
  describe('moduleConfiguration', () => {
    it('should have registerDependencies function', () => {
      expect(typeof moduleConfiguration.registerDependencies).toBe('function');
    });

    it('should have registerErrorCodes function', () => {
      expect(typeof moduleConfiguration.registerErrorCodes).toBe('function');
    });
  });

  describe('registerDependencies', () => {
    const setupContainer = () => {
      const container = createContainer();
      const logger = createMockLogger();
      const eventDispatcher = new EventDispatcherImpl(logger);
      container.register({
        logger: asValue(logger),
        eventDispatcher: asValue<EventDispatcher>(eventDispatcher),
      });
      return container;
    };

    it('should register all repositories', () => {
      const container = setupContainer();

      moduleConfiguration.registerDependencies(container);

      expect(() => container.resolve('userRepository')).not.toThrow();
      expect(() => container.resolve('roleRepository')).not.toThrow();
      expect(() => container.resolve('userGroupRepository')).not.toThrow();
    });

    it('should register all infrastructure services', () => {
      const container = setupContainer();

      moduleConfiguration.registerDependencies(container);

      expect(() =>
        container.resolve('externalAuthenticationService')
      ).not.toThrow();
      expect(() =>
        container.resolve('userGroupValidatorService')
      ).not.toThrow();
      expect(() => container.resolve('userIdGeneratorService')).not.toThrow();
      expect(() => container.resolve('userValidatorService')).not.toThrow();
    });

    it('should register all command handlers', () => {
      const container = setupContainer();

      moduleConfiguration.registerDependencies(container);

      expect(() => container.resolve('registerCommandHandler')).not.toThrow();
      expect(() => container.resolve('signInCommandHandler')).not.toThrow();
      expect(() =>
        container.resolve('updateProfileCommandHandler')
      ).not.toThrow();
      expect(() =>
        container.resolve('deleteAccountCommandHandler')
      ).not.toThrow();
      expect(() =>
        container.resolve('requestAccessTokenCommandHandler')
      ).not.toThrow();
      expect(() => container.resolve('updateUserCommandHandler')).not.toThrow();
      expect(() => container.resolve('deleteUserCommandHandler')).not.toThrow();
      expect(() =>
        container.resolve('toggleUserStatusCommandHandler')
      ).not.toThrow();
      expect(() =>
        container.resolve('createUserGroupCommandHandler')
      ).not.toThrow();
      expect(() =>
        container.resolve('updateUserGroupCommandHandler')
      ).not.toThrow();
      expect(() =>
        container.resolve('deleteUserGroupCommandHandler')
      ).not.toThrow();
      expect(() =>
        container.resolve('addUserToUserGroupCommandHandler')
      ).not.toThrow();
      expect(() =>
        container.resolve('removeUserFromUserGroupCommandHandler')
      ).not.toThrow();
      expect(() =>
        container.resolve('addRoleToUserGroupCommandHandler')
      ).not.toThrow();
      expect(() =>
        container.resolve('removeRoleFromUserGroupCommandHandler')
      ).not.toThrow();
    });

    it('should register all query handlers', () => {
      const container = setupContainer();

      moduleConfiguration.registerDependencies(container);

      expect(() => container.resolve('getProfileQueryHandler')).not.toThrow();
      expect(() => container.resolve('getUserQueryHandler')).not.toThrow();
      expect(() => container.resolve('findUsersQueryHandler')).not.toThrow();
      expect(() => container.resolve('findRolesQueryHandler')).not.toThrow();
      expect(() => container.resolve('getUserGroupQueryHandler')).not.toThrow();
      expect(() =>
        container.resolve('findUserGroupsQueryHandler')
      ).not.toThrow();
    });

    it('should register repositories as singletons', () => {
      const container = setupContainer();

      moduleConfiguration.registerDependencies(container);

      const userRepo1 = container.resolve<UserRepository>('userRepository');
      const userRepo2 = container.resolve<UserRepository>('userRepository');
      expect(userRepo1).toBe(userRepo2);
    });
  });

  describe('registerErrorCodes', () => {
    it('should register all auth error codes', () => {
      const registry = new ErrorCodeRegistry();

      moduleConfiguration.registerErrorCodes(registry);

      expect(registry.getStatusCode(AuthExceptionCode.USER_NOT_FOUND)).toBe(
        404
      );
      expect(
        registry.getStatusCode(AuthExceptionCode.EMAIL_ALREADY_TAKEN)
      ).toBe(400);
      expect(
        registry.getStatusCode(AuthExceptionCode.USERNAME_ALREADY_TAKEN)
      ).toBe(400);
      expect(
        registry.getStatusCode(AuthExceptionCode.INVALID_CREDENTIALS)
      ).toBe(401);
      expect(registry.getStatusCode(AuthExceptionCode.USER_DELETED)).toBe(404);
      expect(
        registry.getStatusCode(AuthExceptionCode.USER_ALREADY_DELETED)
      ).toBe(400);
      expect(
        registry.getStatusCode(AuthExceptionCode.USER_MUST_BE_ACTIVE)
      ).toBe(403);
      expect(
        registry.getStatusCode(AuthExceptionCode.USER_MUST_BE_DISABLED)
      ).toBe(400);
      expect(
        registry.getStatusCode(AuthExceptionCode.INVALID_USER_STATUS)
      ).toBe(400);
      expect(
        registry.getStatusCode(AuthExceptionCode.USER_GROUP_NOT_FOUND)
      ).toBe(404);
      expect(registry.getStatusCode(AuthExceptionCode.ROLE_NOT_FOUND)).toBe(
        404
      );
      expect(
        registry.getStatusCode(AuthExceptionCode.USER_ALREADY_IN_GROUP)
      ).toBe(400);
      expect(registry.getStatusCode(AuthExceptionCode.USER_NOT_IN_GROUP)).toBe(
        400
      );
      expect(
        registry.getStatusCode(AuthExceptionCode.ROLE_ALREADY_IN_GROUP)
      ).toBe(400);
      expect(registry.getStatusCode(AuthExceptionCode.ROLE_NOT_IN_GROUP)).toBe(
        400
      );
      expect(
        registry.getStatusCode(AuthExceptionCode.EXTERNAL_AUTHENTICATION_ERROR)
      ).toBe(500);
    });
  });
});
