import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { ValidationException } from '@app/common/utils/exceptions';
import { UserGroup } from '@app/modules/auth/domain/aggregates/user-group';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import type { UserGroupRepository } from '@app/modules/auth/domain/interfaces/repositories/user-group.repository';
import { UserGroupValidatorServiceImpl } from '@app/modules/auth/infrastructure/services/user-group-validator.service-impl';

describe('UserGroupValidatorServiceImpl', () => {
  let service: UserGroupValidatorServiceImpl;
  let mockUserGroupRepository: UserGroupRepository;

  const userGroupId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');

  beforeEach(() => {
    vi.clearAllMocks();

    mockUserGroupRepository = {
      findById: vi.fn(),
    } as unknown as UserGroupRepository;

    service = new UserGroupValidatorServiceImpl(mockUserGroupRepository);
  });

  describe('validateUserGroupExistsById', () => {
    it('should return user group when user group exists', async () => {
      const userGroup = new UserGroup({
        id: userGroupId,
        name: 'Test Group',
        description: 'Test Description',
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      vi.mocked(mockUserGroupRepository.findById).mockResolvedValue(userGroup);

      const result = await service.validateUserGroupExistsById(userGroupId);

      expect(mockUserGroupRepository.findById).toHaveBeenCalledWith(
        userGroupId
      );
      expect(result).toBe(userGroup);
    });

    it('should throw ValidationException when user group does not exist', async () => {
      vi.mocked(mockUserGroupRepository.findById).mockResolvedValue(undefined);

      await expect(
        service.validateUserGroupExistsById(userGroupId)
      ).rejects.toThrow(ValidationException);
      await expect(
        service.validateUserGroupExistsById(userGroupId)
      ).rejects.toThrow(AuthExceptionCode.USER_GROUP_NOT_FOUND);

      expect(mockUserGroupRepository.findById).toHaveBeenCalledWith(
        userGroupId
      );
    });
  });
});
