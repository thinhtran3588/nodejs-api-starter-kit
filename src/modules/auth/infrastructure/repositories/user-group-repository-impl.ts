import { and, eq, ne, type InferSelectModel } from 'drizzle-orm';
import {
  BaseRepositoryImpl,
  extractBaseAggregateParams,
  type DatabaseClient,
  type DatabaseTransaction,
  type DomainEventRepository,
  type Uuid,
} from '@app/common';
import { UserGroup, type UserGroupRepository } from '@app/modules/auth/domain';
import { schema } from '@app/modules/auth/infrastructure/schema';

const { roles, userGroupRoles, userGroupUsers, userGroups } = schema;

/**
 * Drizzle implementation of UserGroupRepository
 * Uses PostgreSQL database via Drizzle ORM
 */
export class UserGroupRepositoryImpl
  extends BaseRepositoryImpl<UserGroup, typeof userGroups>
  implements UserGroupRepository
{
  constructor({
    writeDatabase,
    domainEventRepository,
  }: {
    writeDatabase: DatabaseClient;
    domainEventRepository: DomainEventRepository;
  }) {
    super({ writeDatabase, domainEventRepository });
  }

  protected getAggregateName(): string {
    return 'UserGroup';
  }

  protected getTable(): typeof userGroups {
    return userGroups;
  }
  /**
   * Convert database row to domain UserGroup aggregate
   */
  protected toDomain(
    userGroupModel: InferSelectModel<typeof userGroups>
  ): UserGroup {
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
    const [userGroupModel] = await this.writeDatabase
      .select({ id: userGroups.id })
      .from(userGroups)
      .where(eq(userGroups.id, id.getValue()))
      .limit(1);
    return Boolean(userGroupModel);
  }

  async nameExists(name: string, excludeUserGroupId?: Uuid): Promise<boolean> {
    const baseCondition = eq(userGroups.name, name);
    const whereCondition = excludeUserGroupId
      ? and(baseCondition, ne(userGroups.id, excludeUserGroupId.getValue()))
      : baseCondition;
    const [userGroupModel] = await this.writeDatabase
      .select({ id: userGroups.id })
      .from(userGroups)
      .where(whereCondition)
      .limit(1);
    return Boolean(userGroupModel);
  }

  // ============================================================================
  // Relationship Operations
  // ============================================================================

  async userInGroup(userGroupId: Uuid, userId: Uuid): Promise<boolean> {
    const [association] = await this.writeDatabase
      .select({ userId: userGroupUsers.userId })
      .from(userGroupUsers)
      .where(
        and(
          eq(userGroupUsers.userGroupId, userGroupId.getValue()),
          eq(userGroupUsers.userId, userId.getValue())
        )
      )
      .limit(1);
    return Boolean(association);
  }

  async addRole(
    userGroupId: Uuid,
    roleId: Uuid,
    transaction?: DatabaseTransaction
  ): Promise<void> {
    const executor = transaction ?? this.writeDatabase;
    await executor.insert(userGroupRoles).values({
      userGroupId: userGroupId.getValue(),
      roleId: roleId.getValue(),
      createdAt: new Date(),
    });
  }

  async removeRole(
    userGroupId: Uuid,
    roleId: Uuid,
    transaction?: DatabaseTransaction
  ): Promise<void> {
    const executor = transaction ?? this.writeDatabase;
    await executor
      .delete(userGroupRoles)
      .where(
        and(
          eq(userGroupRoles.userGroupId, userGroupId.getValue()),
          eq(userGroupRoles.roleId, roleId.getValue())
        )
      );
  }

  async roleInGroup(userGroupId: Uuid, roleId: Uuid): Promise<boolean> {
    const [association] = await this.writeDatabase
      .select({ roleId: userGroupRoles.roleId })
      .from(userGroupRoles)
      .where(
        and(
          eq(userGroupRoles.userGroupId, userGroupId.getValue()),
          eq(userGroupRoles.roleId, roleId.getValue())
        )
      )
      .limit(1);
    return Boolean(association);
  }

  async getUserRoleCodes(userId: Uuid): Promise<string[]> {
    const results = await this.writeDatabase
      .selectDistinct({ code: roles.code })
      .from(userGroupRoles)
      .innerJoin(
        userGroupUsers,
        eq(userGroupRoles.userGroupId, userGroupUsers.userGroupId)
      )
      .innerJoin(roles, eq(userGroupRoles.roleId, roles.id))
      .where(eq(userGroupUsers.userId, userId.getValue()));

    return results.map(({ code }) => code);
  }
}
