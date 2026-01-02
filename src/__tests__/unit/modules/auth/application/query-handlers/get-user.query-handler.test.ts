import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthorizationService } from '@app/common/application/services/authorization.service';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { AuthorizationExceptionCode } from '@app/common/enums/authorization-exception-code';
import type { AppContext } from '@app/common/interfaces/context';
import {
  BusinessException,
  ValidationException,
} from '@app/common/utils/exceptions';
import type { GetUserQuery } from '@app/modules/auth/application/interfaces/queries/get-user.query';
import type { UserReadModel } from '@app/modules/auth/application/interfaces/queries/user.read-model';
import type { UserReadRepository } from '@app/modules/auth/application/interfaces/repositories/user.read-repository';
import { GetUserQueryHandler } from '@app/modules/auth/application/query-handlers/get-user.query-handler';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';
import { SignInType } from '@app/modules/auth/domain/enums/sign-in-type';
import { UserStatus } from '@app/modules/auth/domain/enums/user-status';

describe('GetUserQueryHandler', () => {
  let handler: GetUserQueryHandler;
  let mockUserReadRepository: UserReadRepository;
  let mockAuthorizationService: AuthorizationService;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const externalId = 'firebase-user-123';

  beforeEach(() => {
    vi.clearAllMocks();

    mockUserReadRepository = {
      findById: vi.fn(),
    } as unknown as UserReadRepository;

    mockAuthorizationService = {
      requireOneOfRoles: vi.fn(),
    } as unknown as AuthorizationService;

    handler = new GetUserQueryHandler(
      mockUserReadRepository,
      mockAuthorizationService
    );
  });

  describe('execute - happy path', () => {
    it('should return user for AUTH_MANAGER role', async () => {
      const userReadModel: UserReadModel = {
        id: userId,
        email: 'test@example.com',
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.ACTIVE,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      };

      const context: AppContext = {
        user: {
          userId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const query: GetUserQuery = {
        id: userId,
      };

      vi.mocked(mockUserReadRepository.findById).mockResolvedValue(
        userReadModel
      );

      const result = await handler.execute(query, context);

      expect(mockAuthorizationService.requireOneOfRoles).toHaveBeenCalledWith(
        [AuthRole.AUTH_MANAGER, AuthRole.AUTH_VIEWER],
        context
      );
      expect(mockUserReadRepository.findById).toHaveBeenCalledWith(userId);
      expect(result).toBe(userReadModel);
    });

    it('should return user for AUTH_VIEWER role', async () => {
      const userReadModel: UserReadModel = {
        id: userId,
        email: 'test@example.com',
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.ACTIVE,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      };

      const context: AppContext = {
        user: {
          userId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
          roles: [AuthRole.AUTH_VIEWER],
        },
      };

      const query: GetUserQuery = {
        id: userId,
      };

      vi.mocked(mockUserReadRepository.findById).mockResolvedValue(
        userReadModel
      );

      const result = await handler.execute(query, context);

      expect(result).toBe(userReadModel);
    });
  });

  describe('execute - authorization errors', () => {
    it('should throw AuthorizationException when user does not have required role', async () => {
      const context: AppContext = {
        user: {
          userId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
          roles: [],
        },
      };

      const query: GetUserQuery = {
        id: userId,
      };

      vi.mocked(mockAuthorizationService.requireOneOfRoles).mockImplementation(
        () => {
          throw new BusinessException(AuthorizationExceptionCode.FORBIDDEN);
        }
      );

      await expect(handler.execute(query, context)).rejects.toThrow(
        BusinessException
      );
    });
  });

  describe('execute - validation errors', () => {
    it('should throw ValidationException when id is invalid UUID', async () => {
      const context: AppContext = {
        user: {
          userId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const query: GetUserQuery = {
        id: 'invalid-uuid',
      };

      await expect(handler.execute(query, context)).rejects.toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException when id is malformed UUID', async () => {
      const context: AppContext = {
        user: {
          userId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const query: GetUserQuery = {
        id: '550e8400-e29b-41d4-a716',
      };

      await expect(handler.execute(query, context)).rejects.toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException when user is not found', async () => {
      const context: AppContext = {
        user: {
          userId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const query: GetUserQuery = {
        id: userId,
      };

      vi.mocked(mockUserReadRepository.findById).mockResolvedValue(undefined);

      await expect(handler.execute(query, context)).rejects.toThrow(
        ValidationException
      );
      await expect(handler.execute(query, context)).rejects.toThrow(
        AuthExceptionCode.USER_NOT_FOUND
      );
    });

    it('should throw ValidationException when user is deleted', async () => {
      const userReadModel: UserReadModel = {
        id: userId,
        email: 'test@example.com',
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.DELETED,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      };

      const context: AppContext = {
        user: {
          userId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const query: GetUserQuery = {
        id: userId,
      };

      vi.mocked(mockUserReadRepository.findById).mockResolvedValue(
        userReadModel
      );

      await expect(handler.execute(query, context)).rejects.toThrow(
        ValidationException
      );
      await expect(handler.execute(query, context)).rejects.toThrow(
        AuthExceptionCode.USER_DELETED
      );
    });
  });
});
