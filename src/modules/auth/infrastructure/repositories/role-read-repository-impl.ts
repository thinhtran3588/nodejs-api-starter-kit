import { and, asc, desc, eq, sql } from 'drizzle-orm';
import {
  buildFullTextSearch,
  PAGINATION_DEFAULT_ITEMS_PER_PAGE,
  pickFields,
  type DatabaseClient,
  type PaginatedResult,
} from '@app/common';
import { schema } from '@app/modules/auth/infrastructure/schema';
import type {
  FindRolesQueryParams,
  RoleReadModel,
  RoleReadRepository,
} from '@app/modules/auth/interfaces';

const { roles } = schema;
const roleSelectColumns = {
  id: roles.id,
  code: roles.code,
  name: roles.name,
  description: roles.description,
  version: roles.version,
  createdAt: roles.createdAt,
  lastModifiedAt: roles.lastModifiedAt,
  createdBy: roles.createdBy,
  lastModifiedBy: roles.lastModifiedBy,
} as const;

/**
 * Drizzle implementation of RoleReadRepository
 * Uses PostgreSQL read database via Drizzle ORM
 */
export class RoleReadRepositoryImpl implements RoleReadRepository {
  private readonly readDatabase: DatabaseClient;

  constructor({ readDatabase }: { readDatabase: DatabaseClient }) {
    this.readDatabase = readDatabase;
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

    const conditions = [];

    const { searchCondition } = buildFullTextSearch(searchTerm, {
      searchVectorColumn: 'roles.search_vector',
    });

    if (searchCondition) {
      conditions.push(searchCondition);
    }

    if (userGroupId) {
      conditions.push(
        sql`exists (select 1 from user_group_roles where user_group_roles.role_id = ${roles.id} and user_group_roles.user_group_id = ${userGroupId})`
      );
    }

    const whereCondition =
      conditions.length > 0 ? and(...conditions) : undefined;

    const attributes = fields
      ? [
          'id',
          'code',
          ...fields.filter((field) => field !== 'id' && field !== 'code'),
        ]
      : undefined;
    const selectedColumns = attributes
      ? attributes.reduce<
          Record<
            string,
            (typeof roleSelectColumns)[keyof typeof roleSelectColumns]
          >
        >((columns, attribute) => {
          columns[attribute] =
            roleSelectColumns[attribute as keyof typeof roleSelectColumns];
          return columns;
        }, {})
      : roleSelectColumns;

    const sortColumn = (() => {
      switch (sortField) {
        case 'code':
          return roles.code;
        case 'createdAt':
          return roles.createdAt;
        case 'lastModifiedAt':
          return roles.lastModifiedAt;
        default:
          return roles.name;
      }
    })();
    const orderBy = sortOrder === 'DESC' ? desc(sortColumn) : asc(sortColumn);

    const [countResult, rows] = await Promise.all([
      this.readDatabase
        .select({ count: sql<number>`count(*)`.as('count') })
        .from(roles)
        .where(whereCondition ?? sql`true`),
      this.readDatabase
        .select(selectedColumns)
        .from(roles)
        .where(whereCondition ?? sql`true`)
        .orderBy(orderBy)
        .limit(itemsPerPage)
        .offset(pageIndex * itemsPerPage),
    ]);
    const count = Number(countResult[0]?.count ?? 0);

    return {
      data: rows.map((row) => pickFields(row, attributes) as RoleReadModel),
      pagination: {
        count,
        pageIndex,
      },
    };
  }

  async findById(id: string): Promise<RoleReadModel | undefined> {
    const [role] = await this.readDatabase
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);
    if (!role) {
      return undefined;
    }
    return role as RoleReadModel;
  }
}
