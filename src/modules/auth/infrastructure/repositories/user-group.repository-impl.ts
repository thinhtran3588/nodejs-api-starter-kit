import {
  Op,
  QueryTypes,
  type Model,
  type ModelStatic,
  type Transaction,
} from 'sequelize';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { BaseRepository } from '@app/common/infrastructure/repositories/base-repository';
import type { DomainEventRepository } from '@app/common/infrastructure/repositories/domain-event.repository';
import { extractBaseAggregateParams } from '@app/common/infrastructure/repositories/extract-base-aggregate-params';
import { UserGroup } from '@app/modules/auth/domain/aggregates/user-group';
import type { UserGroupRepository } from '@app/modules/auth/domain/interfaces/repositories/user-group.repository';
import { UserGroupRoleModel } from '@app/modules/auth/infrastructure/models/user-group-role.model';
import { UserGroupUserModel } from '@app/modules/auth/infrastructure/models/user-group-user.model';
import { UserGroupModel } from '@app/modules/auth/infrastructure/models/user-group.model';

/**
 * Sequelize implementation of UserGroupRepository
 * Uses PostgreSQL database via Sequelize ORM
 */
export class UserGroupRepositoryImpl
  extends BaseRepository<UserGroup>
  implements UserGroupRepository
{
  constructor(domainEventRepository: DomainEventRepository) {
    super(domainEventRepository);
  }

  protected getAggregateName(): string {
    return 'UserGroup';
  }

  protected getModel(): ModelStatic<Model> {
    return UserGroupModel;
  }
  /**
   * Convert Sequelize model to domain UserGroup aggregate
   */
  protected toDomain(userGroupModel: UserGroupModel): UserGroup {
    return new UserGroup({
      ...extractBaseAggregateParams(userGroupModel),
      name: userGroupModel.name,
      description: userGroupModel.description ?? undefined,
    });
  }

  // ============================================================================
  // Existence Checks
  // ============================================================================

  async userGroupExists(id: Uuid): Promise<boolean> {
    const userGroupModel = await UserGroupModel.findByPk(id.getValue(), {
      attributes: ['id'],
    });
    return Boolean(userGroupModel);
  }

  async nameExists(name: string, excludeUserGroupId?: Uuid): Promise<boolean> {
    const whereClause: {
      name: string;
      id?: { [Op.ne]: string };
    } = {
      name,
    };

    if (excludeUserGroupId) {
      whereClause.id = { [Op.ne]: excludeUserGroupId.getValue() };
    }

    const userGroupModel = await UserGroupModel.findOne({
      where: whereClause,
      attributes: ['id'],
    });
    return Boolean(userGroupModel);
  }

  // ============================================================================
  // Relationship Operations
  // ============================================================================

  async userInGroup(userGroupId: Uuid, userId: Uuid): Promise<boolean> {
    const association = await UserGroupUserModel.findOne({
      where: {
        userGroupId: userGroupId.getValue(),
        userId: userId.getValue(),
      },
    });
    return Boolean(association);
  }

  async addRole(
    userGroupId: Uuid,
    roleId: Uuid,
    transaction?: Transaction
  ): Promise<void> {
    await UserGroupRoleModel.create(
      {
        userGroupId: userGroupId.getValue(),
        roleId: roleId.getValue(),
        createdAt: new Date(),
      },
      { transaction }
    );
  }

  async removeRole(
    userGroupId: Uuid,
    roleId: Uuid,
    transaction?: Transaction
  ): Promise<void> {
    await UserGroupRoleModel.destroy({
      where: {
        userGroupId: userGroupId.getValue(),
        roleId: roleId.getValue(),
      },
      transaction,
    });
  }

  async roleInGroup(userGroupId: Uuid, roleId: Uuid): Promise<boolean> {
    const association = await UserGroupRoleModel.findOne({
      where: {
        userGroupId: userGroupId.getValue(),
        roleId: roleId.getValue(),
      },
    });
    return Boolean(association);
  }

  async getUserRoleCodes(userId: Uuid): Promise<string[]> {
    const { sequelize } = UserGroupRoleModel;
    if (!sequelize) {
      throw new Error('Sequelize instance not found');
    }

    const results = await sequelize.query<{ code: string }>(
      `
      SELECT DISTINCT r.code
      FROM user_group_roles ugr
      INNER JOIN user_group_users ugu ON ugr.user_group_id = ugu.user_group_id
      INNER JOIN roles r ON ugr.role_id = r.id
      WHERE ugu.user_id = :userId
      `,
      {
        replacements: { userId: userId.getValue() },
        type: QueryTypes.SELECT,
      }
    );

    return results.map(({ code }) => code);
  }
}
