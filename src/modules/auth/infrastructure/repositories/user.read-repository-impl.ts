import { literal, Op, type Sequelize } from 'sequelize';
import { PAGINATION_DEFAULT_ITEMS_PER_PAGE } from '@app/common/constants';
import type { PaginatedResult } from '@app/common/interfaces/query';
import { buildFullTextSearch } from '@app/common/utils/full-text-search';
import { pickFields } from '@app/common/utils/pick-fields';
import type { FindUsersQueryParams } from '@app/modules/auth/application/interfaces/queries/user-query-params';
import type { UserReadModel } from '@app/modules/auth/application/interfaces/queries/user.read-model';
import type { UserReadRepository } from '@app/modules/auth/application/interfaces/repositories/user.read-repository';
import { UserModel } from '@app/modules/auth/infrastructure/models/user.model';

/**
 * Sequelize implementation of UserReadRepository
 * Uses PostgreSQL read database via Sequelize ORM
 */
export class UserReadRepositoryImpl implements UserReadRepository {
  constructor(private readonly readDatabase: Sequelize) {}

  private getReadModel() {
    return this.readDatabase.models['User'] as typeof UserModel;
  }

  async find(
    query: FindUsersQueryParams
  ): Promise<PaginatedResult<UserReadModel>> {
    const {
      searchTerm,
      pageIndex = 0,
      itemsPerPage = PAGINATION_DEFAULT_ITEMS_PER_PAGE,
      fields,
      userGroupId,
      sortField,
      sortOrder = 'ASC',
    } = query;

    const conditions: Array<
      Record<string, unknown> | ReturnType<typeof literal>
    > = [];

    const where: {
      [Op.and]?: Array<Record<string, unknown> | ReturnType<typeof literal>>;
    } = {};

    const order: Array<[string | ReturnType<typeof literal>, string]> = [
      [sortField ?? 'email', sortOrder ?? 'ASC'],
    ];

    const { searchCondition } = buildFullTextSearch(searchTerm);

    if (searchCondition) {
      conditions.push(searchCondition);
    }

    if (userGroupId) {
      conditions.push(
        literal(
          `EXISTS (SELECT 1 FROM user_group_users WHERE user_group_users.user_id = "User".id AND user_group_users.user_group_id = :userGroupId)`
        )
      );
    }

    if (conditions.length > 0) {
      where[Op.and] = conditions;
    }

    const attributes = fields
      ? ['id', ...fields.filter((field) => field !== 'id')]
      : undefined;

    const ReadUserModel = this.getReadModel();
    const { count, rows } = await ReadUserModel.findAndCountAll({
      where,
      limit: itemsPerPage,
      offset: pageIndex * itemsPerPage,
      order,
      attributes,
      replacements: userGroupId ? { userGroupId } : undefined,
    });

    return {
      data: rows.map((row) => pickFields(row, attributes) as UserReadModel),
      pagination: {
        count,
        pageIndex,
      },
    };
  }

  async findById(id: string): Promise<UserReadModel | undefined> {
    const ReadUserModel = this.getReadModel();
    const user = await ReadUserModel.findByPk(id);
    if (!user) {
      return undefined;
    }
    return user.toJSON() as UserReadModel;
  }
}
