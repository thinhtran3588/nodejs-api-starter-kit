import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthorizationService } from '@app/common/application/services/authorization.service';
import type { EventDispatcher } from '@app/common/domain/interfaces/event-dispatcher';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { AuthorizationExceptionCode } from '@app/common/enums/authorization-exception-code';
import type { AppContext } from '@app/common/interfaces/context';
import { BusinessException } from '@app/common/utils/exceptions';
import { DeleteAccountCommandHandler } from '@app/modules/auth/application/command-handlers/delete-account.command-handler';
import type { DeleteAccountCommand } from '@app/modules/auth/application/interfaces/commands/delete-account.command';
import { User } from '@app/modules/auth/domain/aggregates/user';
import { SignInType } from '@app/modules/auth/domain/enums/sign-in-type';
import { UserStatus } from '@app/modules/auth/domain/enums/user-status';
import type { UserRepository } from '@app/modules/auth/domain/interfaces/repositories/user.repository';
import type { UserValidatorService } from '@app/modules/auth/domain/interfaces/services/user-validator.service';
import { Email } from '@app/modules/auth/domain/value-objects/email';

describe('DeleteAccountCommandHandler', () => {
  let handler: DeleteAccountCommandHandler;
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
      validateUserActiveById: vi.fn(),
    } as unknown as UserValidatorService;

    mockAuthorizationService = {
      requireAuthenticated: vi.fn(),
    } as unknown as AuthorizationService;

    mockEventDispatcher = {
      dispatch: vi.fn().mockResolvedValue(undefined),
      registerHandler: vi.fn(),
    } as unknown as EventDispatcher;

    handler = new DeleteAccountCommandHandler(
      mockUserRepository,
      mockUserValidatorService,
      mockAuthorizationService,
      mockEventDispatcher
    );
  });

  describe('execute - happy path', () => {
    it('should delete user account', async () => {
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
          userId,
          roles: [],
        },
      };

      const command: DeleteAccountCommand = {};

      vi.mocked(
        mockUserValidatorService.validateUserActiveById
      ).mockResolvedValue(user);
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined);

      await handler.execute(command, context);

      expect(
        mockAuthorizationService.requireAuthenticated
      ).toHaveBeenCalledWith(context);
      expect(
        mockUserValidatorService.validateUserActiveById
      ).toHaveBeenCalledWith(userId);
      expect(user.isDeleted()).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
    });
  });

  describe('execute - authorization errors', () => {
    it('should throw error when user is not authenticated', async () => {
      const context: AppContext = {
        user: undefined,
      };

      const command: DeleteAccountCommand = {};

      vi.mocked(
        mockAuthorizationService.requireAuthenticated
      ).mockImplementation(() => {
        throw new BusinessException(AuthorizationExceptionCode.UNAUTHORIZED);
      });

      await expect(handler.execute(command, context)).rejects.toThrow(
        BusinessException
      );
    });
  });
});
