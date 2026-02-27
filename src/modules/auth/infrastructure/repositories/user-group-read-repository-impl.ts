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
  FindUserGroupsQueryParams,
  UserGroupReadModel,
  UserGroupReadRepository,
} from '@app/modules/auth/interfaces';

const { userGroups } = schema;
const userGroupSelectColumns = {
  id: userGroups.id,
  name: userGroups.name,
  description: userGroups.description,
  version: userGroups.version,
  createdAt: userGroups.createdAt,
  lastModifiedAt: userGroups.lastModifiedAt,
  createdBy: userGroups.createdBy,
  lastModifiedBy: userGroups.lastModifiedBy,
} as const;

/**
 * Drizzle implementation of UserGroupReadRepository
 * Uses PostgreSQL read database via Drizzle ORM
 */
export class UserGroupReadRepositoryImpl implements UserGroupReadRepository {
  private readonly readDatabase: DatabaseClient;

  constructor({ readDatabase }: { readDatabase: DatabaseClient }) {
    this.readDatabase = readDatabase;
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

    const conditions = [];

    const { searchCondition } = buildFullTextSearch(searchTerm, {
      searchVectorColumn: 'user_groups.search_vector',
    });

    if (searchCondition) {
      conditions.push(searchCondition);
    }

    const whereCondition =
      conditions.length > 0 ? and(...conditions) : undefined;

    const attributes = fields
      ? ['id', ...fields.filter((field) => field !== 'id')]
      : undefined;
    const selectedColumns = attributes
      ? attributes.reduce<
          Record<
            string,
            (typeof userGroupSelectColumns)[keyof typeof userGroupSelectColumns]
          >
        >((columns, attribute) => {
          columns[attribute] =
            userGroupSelectColumns[
              attribute as keyof typeof userGroupSelectColumns
            ];
          return columns;
        }, {})
      : userGroupSelectColumns;

    const sortColumn = (() => {
      switch (sortField) {
        case 'createdAt':
          return userGroups.createdAt;
        case 'lastModifiedAt':
          return userGroups.lastModifiedAt;
        default:
          return userGroups.name;
      }
    })();
    const orderBy = sortOrder === 'DESC' ? desc(sortColumn) : asc(sortColumn);

    const [countResult, rows] = await Promise.all([
      this.readDatabase
        .select({ count: sql<number>`count(*)`.as('count') })
        .from(userGroups)
        .where(whereCondition ?? sql`true`),
      this.readDatabase
        .select(selectedColumns)
        .from(userGroups)
        .where(whereCondition ?? sql`true`)
        .orderBy(orderBy)
        .limit(itemsPerPage)
        .offset(pageIndex * itemsPerPage),
    ]);
    const count = Number(countResult[0]?.count ?? 0);

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
    const [userGroup] = await this.readDatabase
      .select()
      .from(userGroups)
      .where(eq(userGroups.id, id))
      .limit(1);
    if (!userGroup) {
      return undefined;
    }
    return userGroup as UserGroupReadModel;
  }
}
