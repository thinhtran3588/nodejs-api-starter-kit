import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthorizationService } from '@app/common/application/services/authorization.service';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { AuthorizationExceptionCode } from '@app/common/enums/authorization-exception-code';
import type { AppContext } from '@app/common/interfaces/context';
import type { PaginatedResult } from '@app/common/interfaces/query';
import {
  BusinessException,
  ValidationException,
} from '@app/common/utils/exceptions';
import type { FindUsersQuery } from '@app/modules/auth/application/interfaces/queries/find-users.query';
import type { UserReadModel } from '@app/modules/auth/application/interfaces/queries/user.read-model';
import type { UserReadRepository } from '@app/modules/auth/application/interfaces/repositories/user.read-repository';
import { FindUsersQueryHandler } from '@app/modules/auth/application/query-handlers/find-users.query-handler';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';
import { SignInType } from '@app/modules/auth/domain/enums/sign-in-type';
import { UserStatus } from '@app/modules/auth/domain/enums/user-status';
import { Email } from '@app/modules/auth/domain/value-objects/email';

describe('FindUsersQueryHandler', () => {
  let handler: FindUsersQueryHandler;
  let mockUserRepository: UserReadRepository;
  let mockAuthorizationService: AuthorizationService;

  const userId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
  const userEmail = Email.create('test@example.com');
  const externalId = 'firebase-user-123';

  beforeEach(() => {
    vi.clearAllMocks();

    mockUserRepository = {
      find: vi.fn(),
    } as unknown as UserReadRepository;

    mockAuthorizationService = {
      requireOneOfRoles: vi.fn(),
    } as unknown as AuthorizationService;

    handler = new FindUsersQueryHandler(
      mockUserRepository,
      mockAuthorizationService
    );
  });

  describe('execute - happy path', () => {
    it('should return paginated users for AUTH_MANAGER role', async () => {
      const userReadModel: UserReadModel = {
        id: userId.getValue(),
        email: userEmail.getValue(),
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

      const expectedResult: PaginatedResult<UserReadModel> = {
        data: [userReadModel],
        pagination: {
          count: 1,
          pageIndex: 0,
        },
      };

      const query: FindUsersQuery = {
        pageIndex: 0,
        itemsPerPage: 10,
      };

      vi.mocked(mockUserRepository.find).mockResolvedValue(expectedResult);

      const result = await handler.execute(query, context);

      expect(mockAuthorizationService.requireOneOfRoles).toHaveBeenCalledWith(
        [AuthRole.AUTH_MANAGER, AuthRole.AUTH_VIEWER],
        context
      );
      expect(mockUserRepository.find).toHaveBeenCalledWith({
        searchTerm: undefined,
        userGroupId: undefined,
        pageIndex: 0,
        itemsPerPage: 10,
      });
      expect(result).toBe(expectedResult);
    });

    it('should return paginated users for AUTH_VIEWER role', async () => {
      const userReadModel: UserReadModel = {
        id: userId.getValue(),
        email: userEmail.getValue(),
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

      const expectedResult: PaginatedResult<UserReadModel> = {
        data: [userReadModel],
        pagination: {
          count: 1,
          pageIndex: 0,
        },
      };

      const query: FindUsersQuery = {
        pageIndex: 0,
        itemsPerPage: 10,
      };

      vi.mocked(mockUserRepository.find).mockResolvedValue(expectedResult);

      const result = await handler.execute(query, context);

      expect(result).toBe(expectedResult);
    });

    it('should return paginated users with search term', async () => {
      const userReadModel: UserReadModel = {
        id: userId.getValue(),
        email: userEmail.getValue(),
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

      const expectedResult: PaginatedResult<UserReadModel> = {
        data: [userReadModel],
        pagination: {
          count: 1,
          pageIndex: 0,
        },
      };

      const query: FindUsersQuery = {
        searchTerm: 'test',
        pageIndex: 0,
        itemsPerPage: 10,
      };

      vi.mocked(mockUserRepository.find).mockResolvedValue(expectedResult);

      const result = await handler.execute(query, context);

      expect(mockUserRepository.find).toHaveBeenCalledWith({
        searchTerm: 'test',
        userGroupId: undefined,
        pageIndex: 0,
        itemsPerPage: 10,
      });
      expect(result).toBe(expectedResult);
    });

    it('should handle pagination correctly', async () => {
      const context: AppContext = {
        user: {
          userId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const expectedResult: PaginatedResult<UserReadModel> = {
        data: [],
        pagination: {
          count: 0,
          pageIndex: 2,
        },
      };

      const query: FindUsersQuery = {
        pageIndex: 2,
        itemsPerPage: 10,
      };

      vi.mocked(mockUserRepository.find).mockResolvedValue(expectedResult);

      const result = await handler.execute(query, context);

      expect(result.pagination.pageIndex).toBe(2);
    });

    it('should handle field selection', async () => {
      const context: AppContext = {
        user: {
          userId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const expectedResult: PaginatedResult<UserReadModel> = {
        data: [],
        pagination: {
          count: 0,
          pageIndex: 0,
        },
      };

      const query: FindUsersQuery = {
        pageIndex: 0,

        itemsPerPage: 10,

        fields: ['id', 'email'],
      };

      vi.mocked(mockUserRepository.find).mockResolvedValue(expectedResult);

      const result = await handler.execute(query, context);

      expect(mockUserRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          fields: ['id', 'email'],
          userGroupId: undefined,
        })
      );
      expect(result).toBe(expectedResult);
    });

    it('should pass userGroupId to repository', async () => {
      const userReadModel: UserReadModel = {
        id: userId.getValue(),
        email: userEmail.getValue(),
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

      const expectedResult: PaginatedResult<UserReadModel> = {
        data: [userReadModel],
        pagination: {
          count: 1,
          pageIndex: 0,
        },
      };

      const userGroupId = '550e8400-e29b-41d4-a716-446655440002';
      const query: FindUsersQuery = {
        pageIndex: 0,
        itemsPerPage: 10,
        userGroupId,
      };

      vi.mocked(mockUserRepository.find).mockResolvedValue(expectedResult);

      const result = await handler.execute(query, context);

      expect(mockUserRepository.find).toHaveBeenCalledWith({
        searchTerm: undefined,
        userGroupId,
        pageIndex: 0,
        itemsPerPage: 10,
      });
      expect(result).toBe(expectedResult);
    });
  });

  describe('execute - validation errors', () => {
    it('should throw ValidationException when userGroupId is invalid UUID', async () => {
      const context: AppContext = {
        user: {
          userId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const query: FindUsersQuery = {
        pageIndex: 0,
        itemsPerPage: 10,
        userGroupId: 'invalid-uuid',
      };

      await expect(handler.execute(query, context)).rejects.toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException when userGroupId is malformed UUID', async () => {
      const context: AppContext = {
        user: {
          userId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const query: FindUsersQuery = {
        pageIndex: 0,
        itemsPerPage: 10,
        userGroupId: '550e8400-e29b-41d4-a716',
      };

      await expect(handler.execute(query, context)).rejects.toThrow(
        ValidationException
      );
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

      const query: FindUsersQuery = {
        pageIndex: 0,
        itemsPerPage: 10,
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
});
