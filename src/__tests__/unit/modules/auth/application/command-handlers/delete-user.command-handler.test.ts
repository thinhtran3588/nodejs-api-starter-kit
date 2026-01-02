import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthorizationService } from '@app/common/application/services/authorization.service';
import type { EventDispatcher } from '@app/common/domain/interfaces/event-dispatcher';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { AuthorizationExceptionCode } from '@app/common/enums/authorization-exception-code';
import type { AppContext } from '@app/common/interfaces/context';
import { BusinessException } from '@app/common/utils/exceptions';
import { DeleteUserCommandHandler } from '@app/modules/auth/application/command-handlers/delete-user.command-handler';
import type { DeleteUserCommand } from '@app/modules/auth/application/interfaces/commands/delete-user.command';
import { User } from '@app/modules/auth/domain/aggregates/user';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';
import { SignInType } from '@app/modules/auth/domain/enums/sign-in-type';
import { UserStatus } from '@app/modules/auth/domain/enums/user-status';
import type { UserRepository } from '@app/modules/auth/domain/interfaces/repositories/user.repository';
import type { UserValidatorService } from '@app/modules/auth/domain/interfaces/services/user-validator.service';
import { Email } from '@app/modules/auth/domain/value-objects/email';

describe('DeleteUserCommandHandler', () => {
  let handler: DeleteUserCommandHandler;
  let mockUserRepository: UserRepository;
  let mockUserValidatorService: UserValidatorService;
  let mockAuthorizationService: AuthorizationService;
  let mockEventDispatcher: EventDispatcher;

  const userId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
  const userEmail = Email.create('test@example.com');
  const externalId = 'firebase-user-123';

  beforeEach(() => {
    vi.clearAllMocks();

    mockUserRepository = {
      save: vi.fn(),
    } as unknown as UserRepository;

    mockUserValidatorService = {
      validateUserExistsById: vi.fn(),
    } as unknown as UserValidatorService;

    mockAuthorizationService = {
      requireRole: vi.fn(),
    } as unknown as AuthorizationService;

    mockEventDispatcher = {
      dispatch: vi.fn().mockResolvedValue(undefined),
      registerHandler: vi.fn(),
    } as unknown as EventDispatcher;

    handler = new DeleteUserCommandHandler(
      mockUserRepository,
      mockUserValidatorService,
      mockAuthorizationService,
      mockEventDispatcher
    );
  });

  describe('execute - happy path', () => {
    it('should delete user successfully', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const context: AppContext = {
        user: {
          userId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: DeleteUserCommand = {
        id: userId.getValue(),
      };

      vi.mocked(
        mockUserValidatorService.validateUserExistsById
      ).mockResolvedValue(user);
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined);

      await handler.execute(command, context);

      expect(mockAuthorizationService.requireRole).toHaveBeenCalledWith(
        AuthRole.AUTH_MANAGER,
        context
      );
      expect(
        mockUserValidatorService.validateUserExistsById
      ).toHaveBeenCalledWith(userId);
      expect(user.isDeleted()).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
    });
  });

  describe('execute - authorization errors', () => {
    it('should throw AuthorizationException when user does not have AUTH_MANAGER role', async () => {
      const context: AppContext = {
        user: {
          userId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
          roles: [],
        },
      };

      const command: DeleteUserCommand = {
        id: userId.getValue(),
      };

      vi.mocked(mockAuthorizationService.requireRole).mockImplementation(() => {
        throw new BusinessException(AuthorizationExceptionCode.FORBIDDEN);
      });

      await expect(handler.execute(command, context)).rejects.toThrow(
        BusinessException
      );
    });
  });

  describe('execute - validation errors', () => {
    it('should throw error when user is not found', async () => {
      const context: AppContext = {
        user: {
          userId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: DeleteUserCommand = {
        id: userId.getValue(),
      };

      vi.mocked(
        mockUserValidatorService.validateUserExistsById
      ).mockRejectedValue(new Error('User not found'));

      await expect(handler.execute(command, context)).rejects.toThrow();
    });
  });
});
