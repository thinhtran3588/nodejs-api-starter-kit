import { ValidationException, type Uuid } from '@app/common';
import {
  AuthExceptionCode,
  type UserGroup,
  type UserGroupRepository,
  type UserGroupValidatorService,
} from '@app/modules/auth/domain';

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
