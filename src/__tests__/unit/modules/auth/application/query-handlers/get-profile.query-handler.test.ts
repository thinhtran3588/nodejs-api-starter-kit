import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthorizationService } from '@app/common/application/services/authorization.service';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { AuthorizationExceptionCode } from '@app/common/enums/authorization-exception-code';
import type { AppContext } from '@app/common/interfaces/context';
import {
  BusinessException,
  ValidationException,
} from '@app/common/utils/exceptions';
import type { GetProfileQuery } from '@app/modules/auth/application/interfaces/queries/get-profile.query';
import type { UserReadModel } from '@app/modules/auth/application/interfaces/queries/user.read-model';
import type { UserReadRepository } from '@app/modules/auth/application/interfaces/repositories/user.read-repository';
import { GetProfileQueryHandler } from '@app/modules/auth/application/query-handlers/get-profile.query-handler';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { SignInType } from '@app/modules/auth/domain/enums/sign-in-type';
import { UserStatus } from '@app/modules/auth/domain/enums/user-status';

describe('GetProfileQueryHandler', () => {
  let handler: GetProfileQueryHandler;
  let mockUserReadRepository: UserReadRepository;
  let mockAuthorizationService: AuthorizationService;

  const userId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
  const userIdString = userId.getValue();
  const externalId = 'firebase-user-123';

  beforeEach(() => {
    vi.clearAllMocks();

    mockUserReadRepository = {
      findById: vi.fn(),
    } as unknown as UserReadRepository;

    mockAuthorizationService = {
      requireAuthenticated: vi.fn(),
    } as unknown as AuthorizationService;

    handler = new GetProfileQueryHandler(
      mockUserReadRepository,
      mockAuthorizationService
    );
  });

  describe('execute - happy path', () => {
    it('should return user profile', async () => {
      const userReadModel: UserReadModel = {
        id: userIdString,
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
          userId,
          roles: [],
        },
      };

      const query: GetProfileQuery = {};

      vi.mocked(mockUserReadRepository.findById).mockResolvedValue(
        userReadModel
      );

      const result = await handler.execute(query, context);

      expect(
        mockAuthorizationService.requireAuthenticated
      ).toHaveBeenCalledWith(context);
      expect(mockUserReadRepository.findById).toHaveBeenCalledWith(
        userIdString
      );
      expect(result).toEqual({
        id: userReadModel.id,
        email: userReadModel.email,
        signInType: userReadModel.signInType,
        externalId: userReadModel.externalId,
        displayName: userReadModel.displayName,
        username: userReadModel.username,
        version: userReadModel.version,
        createdAt: userReadModel.createdAt,
      });
    });
  });

  describe('execute - validation errors', () => {
    it('should throw ValidationException when user is not found', async () => {
      const context: AppContext = {
        user: {
          userId,
          roles: [],
        },
      };

      const query: GetProfileQuery = {};

      vi.mocked(mockUserReadRepository.findById).mockResolvedValue(undefined);

      await expect(handler.execute(query, context)).rejects.toThrow(
        ValidationException
      );
      await expect(handler.execute(query, context)).rejects.toThrow(
        AuthExceptionCode.USER_NOT_FOUND
      );
    });

    it('should throw ValidationException when user is not active', async () => {
      const userReadModel: UserReadModel = {
        id: userIdString,
        email: 'test@example.com',
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.DISABLED,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      };

      const context: AppContext = {
        user: {
          userId,
          roles: [],
        },
      };

      const query: GetProfileQuery = {};

      vi.mocked(mockUserReadRepository.findById).mockResolvedValue(
        userReadModel
      );

      await expect(handler.execute(query, context)).rejects.toThrow(
        ValidationException
      );
      await expect(handler.execute(query, context)).rejects.toThrow(
        AuthExceptionCode.USER_MUST_BE_ACTIVE
      );
    });
  });

  describe('execute - authorization errors', () => {
    it('should throw error when user is not authenticated', async () => {
      const context: AppContext = {
        user: undefined,
      };

      const query: GetProfileQuery = {};

      vi.mocked(
        mockAuthorizationService.requireAuthenticated
      ).mockImplementation(() => {
        throw new BusinessException(AuthorizationExceptionCode.UNAUTHORIZED);
      });

      await expect(handler.execute(query, context)).rejects.toThrow(
        BusinessException
      );
    });
  });
});
