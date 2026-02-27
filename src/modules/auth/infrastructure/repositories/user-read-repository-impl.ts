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
  FindUsersQueryParams,
  UserReadModel,
  UserReadRepository,
} from '@app/modules/auth/interfaces';

const { users } = schema;
const userSelectColumns = {
  id: users.id,
  email: users.email,
  signInType: users.signInType,
  externalId: users.externalId,
  username: users.username,
  displayName: users.displayName,
  status: users.status,
  version: users.version,
  createdAt: users.createdAt,
  lastModifiedAt: users.lastModifiedAt,
  createdBy: users.createdBy,
  lastModifiedBy: users.lastModifiedBy,
} as const;

/**
 * Drizzle implementation of UserReadRepository
 * Uses PostgreSQL read database via Drizzle ORM
 */
export class UserReadRepositoryImpl implements UserReadRepository {
  private readonly readDatabase: DatabaseClient;

  constructor({ readDatabase }: { readDatabase: DatabaseClient }) {
    this.readDatabase = readDatabase;
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

    const conditions = [];

    const { searchCondition } = buildFullTextSearch(searchTerm, {
      searchVectorColumn: 'users.search_vector',
    });

    if (searchCondition) {
      conditions.push(searchCondition);
    }

    if (userGroupId) {
      conditions.push(
        sql`exists (select 1 from user_group_users where user_group_users.user_id = ${users.id} and user_group_users.user_group_id = ${userGroupId})`
      );
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
            (typeof userSelectColumns)[keyof typeof userSelectColumns]
          >
        >((columns, attribute) => {
          columns[attribute] =
            userSelectColumns[attribute as keyof typeof userSelectColumns];
          return columns;
        }, {})
      : userSelectColumns;

    const sortColumn = (() => {
      switch (sortField) {
        case 'username':
          return users.username;
        case 'createdAt':
          return users.createdAt;
        case 'lastModifiedAt':
          return users.lastModifiedAt;
        default:
          return users.email;
      }
    })();
    const orderBy = sortOrder === 'DESC' ? desc(sortColumn) : asc(sortColumn);

    const [countResult, rows] = await Promise.all([
      this.readDatabase
        .select({ count: sql<number>`count(*)`.as('count') })
        .from(users)
        .where(whereCondition ?? sql`true`),
      this.readDatabase
        .select(selectedColumns)
        .from(users)
        .where(whereCondition ?? sql`true`)
        .orderBy(orderBy)
        .limit(itemsPerPage)
        .offset(pageIndex * itemsPerPage),
    ]);
    const count = Number(countResult[0]?.count ?? 0);

    return {
      data: rows.map((row) => pickFields(row, attributes) as UserReadModel),
      pagination: {
        count,
        pageIndex,
      },
    };
  }

  async findById(id: string): Promise<UserReadModel | undefined> {
    const [user] = await this.readDatabase
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!user) {
      return undefined;
    }
    return user as UserReadModel;
  }
}
