import { ValidationException, type Uuid } from '@app/common';
import { type UserGroup } from '@app/modules/auth/domain/aggregates/user-group';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import type { UserGroupRepository } from '@app/modules/auth/domain/interfaces/repositories/user-group-repository';
import type { UserGroupValidatorService } from '@app/modules/auth/domain/interfaces/services/user-group-validator-service';

/**
 * Infrastructure implementation of UserGroupValidatorService
 * Handles validation logic that requires repository access
 */
export class UserGroupValidatorServiceImpl
  implements UserGroupValidatorService
{
  private readonly userGroupRepository: UserGroupRepository;

  constructor({
    userGroupRepository,
  }: {
    userGroupRepository: UserGroupRepository;
  }) {
    this.userGroupRepository = userGroupRepository;
  }

  async validateUserGroupExistsById(userGroupId: Uuid): Promise<UserGroup> {
    const userGroup = await this.userGroupRepository.findById(userGroupId);
    if (!userGroup) {
      throw new ValidationException(AuthExceptionCode.USER_GROUP_NOT_FOUND);
    }
    return userGroup;
  }
}
