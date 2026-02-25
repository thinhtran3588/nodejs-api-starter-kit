import { Op, type literal, type Sequelize } from 'sequelize';
import {
  buildFullTextSearch,
  PAGINATION_DEFAULT_ITEMS_PER_PAGE,
  pickFields,
  type PaginatedResult,
} from '@app/common';
import type { FindUserGroupsQueryParams } from '@app/modules/auth/application/interfaces/queries/user-group-query-params';
import type { UserGroupReadModel } from '@app/modules/auth/application/interfaces/queries/user-group-read-model';
import type { UserGroupReadRepository } from '@app/modules/auth/application/interfaces/repositories/user-group-read-repository';
import { type UserGroupModel } from '@app/modules/auth/infrastructure/models/user-group-model';

/**
 * Sequelize implementation of UserGroupReadRepository
 * Uses PostgreSQL read database via Sequelize ORM
 */
export class UserGroupReadRepositoryImpl implements UserGroupReadRepository {
  private readonly readDatabase: Sequelize;

  constructor({ readDatabase }: { readDatabase: Sequelize }) {
    this.readDatabase = readDatabase;
  }

  private getReadModel() {
    return this.readDatabase.models['UserGroup'] as typeof UserGroupModel;
  }

  async find(
    query: FindUserGroupsQueryParams
  ): Promise<PaginatedResult<UserGroupReadModel>> {
    const {
      searchTerm,
      pageIndex = 0,
      itemsPerPage = PAGINATION_DEFAULT_ITEMS_PER_PAGE,
      fields,
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
      [sortField ?? 'name', sortOrder ?? 'ASC'],
    ];

    const { searchCondition } = buildFullTextSearch(searchTerm);

    if (searchCondition) {
      conditions.push(searchCondition);
    }

    if (conditions.length > 0) {
      where[Op.and] = conditions;
    }

    const attributes = fields
      ? ['id', ...fields.filter((field) => field !== 'id')]
      : undefined;

    const ReadUserGroupModel = this.getReadModel();
    const { count, rows } = await ReadUserGroupModel.findAndCountAll({
      where,
      limit: itemsPerPage,
      offset: pageIndex * itemsPerPage,
      order,
      attributes,
    });

    return {
      data: rows.map(
        (row) => pickFields(row, attributes) as UserGroupReadModel
      ),
      pagination: {
        count,
        pageIndex,
      },
    };
  }

  async findById(id: string): Promise<UserGroupReadModel | undefined> {
    const ReadUserGroupModel = this.getReadModel();
    const userGroup = await ReadUserGroupModel.findByPk(id);
    if (!userGroup) {
      return undefined;
    }
    return userGroup.toJSON() as UserGroupReadModel;
  }
}
