import { Uuid } from '@app/common/domain/value-objects/uuid';
import { ValidationException } from '@app/common/utils/exceptions';
import { UserGroup } from '@app/modules/auth/domain/aggregates/user-group';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import type { UserGroupRepository } from '@app/modules/auth/domain/interfaces/repositories/user-group.repository';
import type { UserGroupValidatorService } from '@app/modules/auth/domain/interfaces/services/user-group-validator.service';

/**
 * Infrastructure implementation of UserGroupValidatorService
 * Handles validation logic that requires repository access
 */
export class UserGroupValidatorServiceImpl
  implements UserGroupValidatorService
{
  constructor(private readonly userGroupRepository: UserGroupRepository) {}

  async validateUserGroupExistsById(userGroupId: Uuid): Promise<UserGroup> {
    const userGroup = await this.userGroupRepository.findById(userGroupId);
    if (!userGroup) {
      throw new ValidationException(AuthExceptionCode.USER_GROUP_NOT_FOUND);
    }
    return userGroup;
  }
}
