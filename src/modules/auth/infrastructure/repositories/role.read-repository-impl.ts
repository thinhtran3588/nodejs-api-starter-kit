import { literal, Op, type Sequelize } from 'sequelize';
import { PAGINATION_DEFAULT_ITEMS_PER_PAGE } from '@app/common/constants';
import type { PaginatedResult } from '@app/common/interfaces/query';
import { buildFullTextSearch } from '@app/common/utils/full-text-search';
import { pickFields } from '@app/common/utils/pick-fields';
import type { FindRolesQueryParams } from '@app/modules/auth/application/interfaces/queries/role-query-params';
import type { RoleReadModel } from '@app/modules/auth/application/interfaces/queries/role.read-model';
import type { RoleReadRepository } from '@app/modules/auth/application/interfaces/repositories/role.read-repository';
import { RoleModel } from '@app/modules/auth/infrastructure/models/role.model';

/**
 * Sequelize implementation of RoleReadRepository
 * Uses PostgreSQL read database via Sequelize ORM
 */
export class RoleReadRepositoryImpl implements RoleReadRepository {
  constructor(private readonly readDatabase: Sequelize) {}

  private getReadModel() {
    return this.readDatabase.models['Role'] as typeof RoleModel;
  }

  async find(
    query: FindRolesQueryParams
  ): Promise<PaginatedResult<RoleReadModel>> {
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
      [sortField ?? 'name', sortOrder ?? 'ASC'],
    ];

    const { searchCondition } = buildFullTextSearch(searchTerm);

    if (searchCondition) {
      conditions.push(searchCondition);
    }

    if (userGroupId) {
      conditions.push(
        literal(
          `EXISTS (SELECT 1 FROM user_group_roles WHERE user_group_roles.role_id = "Role".id AND user_group_roles.user_group_id = :userGroupId)`
        )
      );
    }

    if (conditions.length > 0) {
      where[Op.and] = conditions;
    }

    const attributes = fields
      ? [
          'id',
          'code',
          ...fields.filter((field) => field !== 'id' && field !== 'code'),
        ]
      : undefined;

    const ReadRoleModel = this.getReadModel();
    const { count, rows } = await ReadRoleModel.findAndCountAll({
      where,
      limit: itemsPerPage,
      offset: pageIndex * itemsPerPage,
      order,
      attributes,
      replacements: userGroupId ? { userGroupId } : undefined,
    });

    return {
      data: rows.map((row) => pickFields(row, attributes) as RoleReadModel),
      pagination: {
        count,
        pageIndex,
      },
    };
  }

  async findById(id: string): Promise<RoleReadModel | undefined> {
    const ReadRoleModel = this.getReadModel();
    const role = await ReadRoleModel.findByPk(id);
    if (!role) {
      return undefined;
    }
    return role.toJSON() as RoleReadModel;
  }
}
