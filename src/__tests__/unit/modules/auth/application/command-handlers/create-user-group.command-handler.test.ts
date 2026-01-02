import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthorizationService } from '@app/common/application/services/authorization.service';
import type { EventDispatcher } from '@app/common/domain/interfaces/event-dispatcher';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { AuthorizationExceptionCode } from '@app/common/enums/authorization-exception-code';
import type { AppContext } from '@app/common/interfaces/context';
import {
  BusinessException,
  ValidationException,
} from '@app/common/utils/exceptions';
import { CreateUserGroupCommandHandler } from '@app/modules/auth/application/command-handlers/create-user-group.command-handler';
import type { CreateUserGroupCommand } from '@app/modules/auth/application/interfaces/commands/create-user-group.command';
import { AuthRole } from '@app/modules/auth/domain/enums/auth-role';
import type { UserGroupRepository } from '@app/modules/auth/domain/interfaces/repositories/user-group.repository';

describe('CreateUserGroupCommandHandler', () => {
  let handler: CreateUserGroupCommandHandler;
  let mockAuthorizationService: AuthorizationService;
  let mockUserGroupRepository: UserGroupRepository;
  let mockEventDispatcher: EventDispatcher;

  const userId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthorizationService = {
      requireRole: vi.fn(),
    } as unknown as AuthorizationService;

    mockUserGroupRepository = {
      save: vi.fn(),
      nameExists: vi.fn(),
    } as unknown as UserGroupRepository;

    mockEventDispatcher = {
      dispatch: vi.fn().mockResolvedValue(undefined),
      registerHandler: vi.fn(),
    } as unknown as EventDispatcher;

    handler = new CreateUserGroupCommandHandler(
      mockAuthorizationService,
      mockUserGroupRepository,
      mockEventDispatcher
    );
  });

  describe('execute - happy path', () => {
    it('should create a user group', async () => {
      const context: AppContext = {
        user: {
          userId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: CreateUserGroupCommand = {
        name: 'Test Group',

        description: 'Test Description',
      };

      vi.mocked(mockUserGroupRepository.nameExists).mockResolvedValue(false);
      vi.mocked(mockUserGroupRepository.save).mockResolvedValue(undefined);

      const result = await handler.execute(command, context);

      expect(mockAuthorizationService.requireRole).toHaveBeenCalledWith(
        AuthRole.AUTH_MANAGER,
        context
      );
      expect(mockUserGroupRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(typeof result.id).toBe('string');
      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should create a user group without description', async () => {
      const context: AppContext = {
        user: {
          userId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: CreateUserGroupCommand = {
        name: 'Test Group',
      };

      vi.mocked(mockUserGroupRepository.nameExists).mockResolvedValue(false);
      vi.mocked(mockUserGroupRepository.save).mockResolvedValue(undefined);

      const result = await handler.execute(command, context);

      expect(mockUserGroupRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(typeof result.id).toBe('string');
      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });
  });

  describe('execute - authorization errors', () => {
    it('should throw error when user does not have AUTH_MANAGER role', async () => {
      const context: AppContext = {
        user: {
          userId,
          roles: [],
        },
      };

      const command: CreateUserGroupCommand = {
        name: 'Test Group',
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
    it('should throw ValidationException when name already exists', async () => {
      const context: AppContext = {
        user: {
          userId,
          roles: [AuthRole.AUTH_MANAGER],
        },
      };

      const command: CreateUserGroupCommand = {
        name: 'Existing Group',
        description: 'Test Description',
      };

      vi.mocked(mockUserGroupRepository.nameExists).mockResolvedValue(true);

      await expect(handler.execute(command, context)).rejects.toThrow(
        ValidationException
      );
      expect(mockUserGroupRepository.nameExists).toHaveBeenCalledWith(
        'Existing Group'
      );
      expect(mockUserGroupRepository.save).not.toHaveBeenCalled();
    });
  });
});
